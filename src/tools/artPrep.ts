import { CONTENT } from '../data';
import { ART } from '../game/render/assets';
import { buildAssetList, promptFor, SHEET_GRID, sheetPromptFor, type AssetEntry, type AssetType } from './assetList';
import { processArt, splitGrid, type Fit, type Img } from './artProcess';

// Herramienta de arte (solo en desarrollo): http://localhost:5173/herramientas/arte.html
// Lista lo que falta, da el pedido para ChatGPT y convierte la imagen generada en pixel art del juego.
// Dos modos: una imagen por asset, u "hoja": varios assets en una sola imagen en grilla, que se corta sola.

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const LAST = 'fyf.arte.ultimo';
const MODE = 'fyf.arte.modo';

const entries = buildAssetList(CONTENT);
let current: AssetEntry | null = null;
let source: Img | null = null;
let dir: FileSystemDirectoryHandle | null = null;
let sheetMode = false;
/** Lo que se va a guardar: un resultado por asset (en modo hoja, cada celda; se puede desmarcar). */
let results: { entry: AssetEntry; img: Img; keep: boolean }[] = [];

const FIT: Record<AssetType, Fit> = {
  personaje: 'figura', monstruo: 'figura', jefe: 'figura', escenario: 'figura', edificio: 'figura',
  icono: 'centro', retrato: 'centro', textura: 'llenar', lado: 'llenar', mapa: 'llenar',
};

// ───────────────────────── Lista ─────────────────────────

function renderList() {
  const q = $<HTMLInputElement>('filter').value.toLowerCase();
  const onlyPending = $<HTMLInputElement>('pending').checked;
  const inSheet = new Set(sheetMode ? sheetEntries().map((e) => e.key) : []);
  const list = $('list');
  list.innerHTML = '';
  let group = '';
  for (const e of entries) {
    const done = !!ART[e.key];
    if (onlyPending && done) continue;
    if (q && !e.name.toLowerCase().includes(q) && !e.key.includes(q)) continue;
    if (e.group !== group) {
      group = e.group;
      const g = document.createElement('div');
      g.className = 'group';
      g.textContent = group;
      list.append(g);
    }
    const row = document.createElement('div');
    row.className = `entry${done ? ' done' : ''}${current?.key === e.key || inSheet.has(e.key) ? ' on' : ''}`;
    row.innerHTML = `<span class="st">${done ? '✓' : '·'}</span><span></span><small>${e.w}×${e.h}</small>`;
    row.children[1].textContent = e.name;
    row.onclick = () => select(e);
    list.append(row);
  }
  const done = entries.filter((e) => ART[e.key]).length;
  $('count').textContent = `Hechos ${done} de ${entries.length}`;
}

/** En modo hoja: el elegido y los que siguen del mismo tipo que todavía no tienen arte, hasta llenar la grilla. */
function sheetEntries(): AssetEntry[] {
  if (!current) return [];
  const size = Number($<HTMLInputElement>('cols').value) * Number($<HTMLInputElement>('rows').value);
  const from = entries.indexOf(current);
  const next = entries.slice(from + 1).filter((e) => e.type === current!.type && !ART[e.key]);
  return [current, ...next].slice(0, Math.max(1, size));
}

function select(e: AssetEntry) {
  const typeChanged = current?.type !== e.type;
  current = e;
  try { localStorage.setItem(LAST, e.key); } catch { /* sin almacenamiento */ }
  if (sheetMode && typeChanged) {
    const [c, r] = SHEET_GRID[e.type];
    $<HTMLInputElement>('cols').value = String(c);
    $<HTMLInputElement>('rows').value = String(r);
  }
  showPrompt();
  renderList();
  run();
}

function showPrompt() {
  if (!current) return;
  if (!sheetMode) {
    $('title').textContent = current.name;
    $('meta').innerHTML = `Archivo <code>${current.folder}/${current.key}.png</code> · dibujo de <b>${current.w}×${current.h}</b> píxeles${ART[current.key] ? ' · <b>ya tiene arte</b> (si guardás, se reemplaza)' : ''}`;
    $<HTMLTextAreaElement>('prompt').value = promptFor(current);
    return;
  }
  const list = sheetEntries();
  const cols = Number($<HTMLInputElement>('cols').value);
  const rows = Number($<HTMLInputElement>('rows').value);
  $('title').textContent = `Hoja de ${list.length}: ${current.group}`;
  $('meta').innerHTML = `Una sola imagen en grilla de <b>${cols}×${rows}</b>. ChatGPT tiene que respetar este orden:`;
  const ol = $('sheetlist');
  ol.innerHTML = '';
  for (const e of list) {
    const li = document.createElement('li');
    li.textContent = e.name + (ART[e.key] ? ' (ya tiene arte: se reemplaza)' : '');
    ol.append(li);
  }
  $<HTMLTextAreaElement>('prompt').value = sheetPromptFor(list, cols, rows);
}

function setMode(sheet: boolean) {
  sheetMode = sheet;
  try { localStorage.setItem(MODE, sheet ? 'hoja' : 'una'); } catch { /* sin almacenamiento */ }
  $('mode-one').classList.toggle('on', !sheet);
  $('mode-sheet').classList.toggle('on', sheet);
  for (const id of ['sheetopts', 'sheetlist', 'cells', 'saveall']) $(id).hidden = !sheet;
  for (const id of ['single', 'save']) $(id).hidden = sheet;
  if (sheet && current) {
    const [c, r] = SHEET_GRID[current.type];
    $<HTMLInputElement>('cols').value = String(c);
    $<HTMLInputElement>('rows').value = String(r);
  }
  showPrompt();
  renderList();
  run();
}

// ───────────────────────── Imagen ─────────────────────────

async function loadImage(blob: Blob) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);
  source = { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data };
  run();
}

function toCanvas(canvas: HTMLCanvasElement, img: Img, zoom: number) {
  canvas.width = img.w * zoom;
  canvas.height = img.h * zoom;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap(img), 0, 0, img.w * zoom, img.h * zoom);
}

function bitmap(img: Img): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = img.w;
  tmp.height = img.h;
  tmp.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
  return tmp;
}

function options(e: AssetEntry, trim: boolean) {
  return {
    w: e.w, h: e.h, fit: FIT[e.type], tolerance: Number($<HTMLInputElement>('tol').value),
    palette: $<HTMLInputElement>('pal').checked, trim,
  };
}

function run() {
  $('tolv').textContent = $<HTMLInputElement>('tol').value;
  if (!current || !source) return;
  if (sheetMode) return runSheet();
  const img = processArt(source, options(current, false));
  results = [{ entry: current, img, keep: true }];
  // Original achicado para que entre en pantalla.
  const scale = Math.min(1, 220 / Math.max(source.w, source.h));
  const orig = $<HTMLCanvasElement>('orig');
  orig.width = Math.round(source.w * scale);
  orig.height = Math.round(source.h * scale);
  orig.getContext('2d')!.drawImage(bitmap(source), 0, 0, orig.width, orig.height);
  toCanvas($('res1'), img, 1);
  toCanvas($('res4'), img, Math.max(1, Math.floor(256 / Math.max(img.w, img.h))));
  drawScene($('scene'), current, img);
  $<HTMLButtonElement>('save').disabled = false;
}

/** Corta la hoja en la grilla y procesa cada celda con la medida de su asset. */
function runSheet() {
  const list = sheetEntries();
  const cells = splitGrid(source!, Number($<HTMLInputElement>('cols').value), Number($<HTMLInputElement>('rows').value));
  const previous = new Map(results.map((r) => [r.entry.key, r.keep]));
  results = list.map((entry, i) => ({ entry, img: processArt(cells[i], options(entry, true)), keep: previous.get(entry.key) ?? true }));
  const box = $('cells');
  box.innerHTML = '';
  results.forEach((r) => {
    const cell = document.createElement('div');
    cell.className = `cell${r.keep ? '' : ' off'}`;
    const canvas = document.createElement('canvas');
    canvas.className = 'scene';
    drawScene(canvas, r.entry, r.img);
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = r.keep;
    check.onchange = () => {
      r.keep = check.checked;
      cell.classList.toggle('off', !r.keep);
      updateSaveAll();
    };
    label.append(check, ` ${r.entry.name}`);
    cell.append(canvas, label);
    box.append(cell);
  });
  updateSaveAll();
}

function updateSaveAll() {
  const n = results.filter((r) => r.keep).length;
  const b = $<HTMLButtonElement>('saveall');
  b.textContent = `💾 Guardar todos (${n})`;
  b.disabled = n === 0;
}

/** Vista previa en el juego: la figura sobre una casilla de pasto, o la textura proyectada sobre casillas. */
function drawScene(canvas: HTMLCanvasElement, entry: AssetEntry, img: Img) {
  const ctx = canvas.getContext('2d')!;
  const W = Math.max(144, img.w * 2 + 16);
  const H = Math.max(110, img.h * 2 + 56);
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  const diamond = (cx: number, cy: number, fill: (u: number, v: number) => string) => {
    // Rombo de 32×16 píxeles de arte, a ×2.
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x + 0.5 - 16) / 16;
        const dy = (y + 0.5 - 8) / 8;
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;
        ctx.fillStyle = fill((dx + dy + 1) / 2, (dy - dx + 1) / 2);
        ctx.fillRect(cx - 32 + x * 2, cy - 16 + y * 2, 2, 2);
      }
    }
  };
  if (entry.type === 'textura') {
    const at = (u: number, v: number) => {
      const i = ((Math.floor(v * img.h) % img.h) * img.w + (Math.floor(u * img.w) % img.w)) * 4;
      return `rgb(${img.data[i]},${img.data[i + 1]},${img.data[i + 2]})`;
    };
    for (const [c, r] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) diamond(W / 2 + (c - r) * 32, 24 + (c + r) * 16, at);
    return;
  }
  if (entry.type === 'lado' || entry.type === 'icono' || entry.type === 'retrato' || entry.type === 'mapa') {
    // Sin casilla: la imagen sola, ampliada.
    const z = Math.max(1, Math.floor(Math.min((W - 8) / img.w, (H - 8) / img.h)));
    ctx.drawImage(bitmap(img), (W - img.w * z) / 2, (H - img.h * z) / 2, img.w * z, img.h * z);
    return;
  }
  diamond(W / 2, H - 22, () => '#5a8a38');
  ctx.drawImage(bitmap(img), W / 2 - img.w, H - 22 - img.h * 2 + 6, img.w * 2, img.h * 2);
}

// ───────────────────────── Guardar ─────────────────────────

async function pngBlob(img: Img): Promise<Blob> {
  return new Promise((ok) => bitmap(img).toBlob((b) => ok(b!), 'image/png'));
}

async function write(entry: AssetEntry, img: Img) {
  const blob = await pngBlob(img);
  const name = `${entry.key}.png`;
  if (dir) {
    const folder = await dir.getDirectoryHandle(entry.folder, { create: true });
    const file = await folder.getFileHandle(name, { create: true });
    const w = await file.createWritable();
    await w.write(blob);
    await w.close();
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }
}

async function save(only: typeof results) {
  for (const r of only) await write(r.entry, r.img);
  const names = only.map((r) => `${r.entry.folder}/${r.entry.key}.png`);
  $('saved').textContent = dir
    ? `Guardados ${names.length}: ${names.join(', ')}. El juego los toma solo al recargar.`
    : `Descargados ${names.length}: copialos a src/assets/arte/ (cada uno en su carpeta: ${[...new Set(only.map((r) => r.entry.folder))].join(', ')}).`;
}

// ───────────────────────── Eventos ─────────────────────────

$('filter').oninput = renderList;
$('pending').onchange = renderList;
$('tol').oninput = run;
$('pal').onchange = run;
for (const id of ['cols', 'rows']) $(id).oninput = () => { showPrompt(); renderList(); run(); };
$('mode-one').onclick = () => setMode(false);
$('mode-sheet').onclick = () => setMode(true);
$('copy').onclick = () => {
  navigator.clipboard.writeText($<HTMLTextAreaElement>('prompt').value);
  $('copy').textContent = '✓ Copiado';
  setTimeout(() => ($('copy').textContent = '📋 Copiar pedido para ChatGPT'), 1500);
};
$<HTMLInputElement>('file').onchange = (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) loadImage(f);
};
const drop = $('drop');
drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = (e) => {
  e.preventDefault();
  drop.classList.remove('over');
  const f = e.dataTransfer?.files[0];
  if (f) loadImage(f);
};
window.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
  const f = item?.getAsFile();
  if (f) loadImage(f);
});
$('dir').onclick = async () => {
  const pick = (window as unknown as { showDirectoryPicker?: (o: object) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  if (!pick) {
    $('dirname').textContent = 'Este navegador no permite elegir carpetas: se descarga el archivo y lo copiás a mano.';
    return;
  }
  dir = await pick({ mode: 'readwrite' });
  $('dirname').textContent = `Carpeta: ${dir.name}${dir.name === 'arte' ? '' : ' (¿seguro que es src/assets/arte?)'}`;
};
$('save').onclick = () => save(results);
$('saveall').onclick = () => save(results.filter((r) => r.keep));

let last: string | null = null;
let mode: string | null = null;
try {
  last = localStorage.getItem(LAST);
  mode = localStorage.getItem(MODE);
} catch { /* sin almacenamiento */ }
current = entries.find((e) => e.key === last) ?? null;
setMode(mode === 'hoja');
