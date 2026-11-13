import { CONTENT } from '../data';
import { ART, isHd } from '../game/render/assets';
import { buildAssetList, frontKey, isBack, pendingSheets, promptFor, SHEET_GRID, sheetPromptFor, type AssetEntry, type AssetType } from './assetList';
import { processArt, splitByFigures, splitGrid, type Fit, type Img } from './artProcess';

// Herramienta de arte (solo en desarrollo): http://localhost:5173/herramientas/arte.html
// Lista lo que falta, da el pedido para ChatGPT y convierte la imagen generada en pixel art del juego.
// Tres modos: "pedidos en orden" (te lleva hoja por hoja por todo lo que falta), una imagen por asset, u "hoja":
// varios assets en una sola imagen en grilla, que se corta sola.

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const LAST = 'fyf.arte.ultimo';
const MODE = 'fyf.arte.modo.v2';
const SKIPPED = 'fyf.arte.salteadas';

type Mode = 'pedidos' | 'una' | 'hoja';

const entries = buildAssetList(CONTENT);
let current: AssetEntry | null = null;
let source: Img | null = null;
/** La imagen tal cual la dio ChatGPT: se guarda junto con lo procesado. */
let sourceBlob: Blob | null = null;
let dir: FileSystemDirectoryHandle | null = null;
let sheetMode = false;
let mode: Mode = 'pedidos';
/** Lo que se va a guardar: un resultado por asset (en modo hoja, cada celda; se puede desmarcar). */
let results: { entry: AssetEntry; img: Img; keep: boolean }[] = [];

const FIT: Record<AssetType, Fit> = {
  personaje: 'figura', monstruo: 'figura', jefe: 'figura', espalda: 'figura', espalda_monstruo: 'figura', espalda_jefe: 'figura', escenario: 'figura', edificio: 'figura',
  icono: 'centro', retrato: 'centro', textura: 'llenar', lado: 'llenar', mapa: 'llenar', marcador: 'figura', animal: 'figura', muro: 'llenar', decoracion: 'figura',
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
    const isDone = done(e.key);
    if (onlyPending && isDone) continue;
    if (q && !e.name.toLowerCase().includes(q) && !e.key.includes(q)) continue;
    if (e.group !== group) {
      group = e.group;
      const g = document.createElement('div');
      g.className = 'group';
      g.textContent = group;
      list.append(g);
    }
    const row = document.createElement('div');
    row.className = `entry${isDone ? ' done' : ''}${current?.key === e.key || inSheet.has(e.key) ? ' on' : ''}`;
    row.innerHTML = `<span class="st">${isDone ? '✓' : '·'}</span><span></span><small>${e.w}×${e.h}</small>`;
    row.children[1].textContent = e.name;
    row.onclick = () => select(e);
    list.append(row);
  }
  $('count').textContent = `Hechos ${entries.filter((e) => done(e.key)).length} de ${entries.length}${hdOn() ? ' en alta calidad' : ''}`;
}

/** En modo hoja: el elegido y los que siguen del mismo tipo que todavía no tienen arte, hasta llenar la grilla. */
function sheetEntries(): AssetEntry[] {
  if (!current) return [];
  const size = Number($<HTMLInputElement>('cols').value) * Number($<HTMLInputElement>('rows').value);
  const from = entries.indexOf(current);
  const next = entries.slice(from + 1).filter((e) => e.type === current!.type && !done(e.key));
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
  const refList = sheetMode ? sheetEntries() : [current];
  $('ref').hidden = !refList.some((e) => ART[frontKey(e.key)]);
  $('ref').textContent = isBack(current.type) ? '🖼️ Bajar la referencia de frente (adjuntala con el pedido)' : '🖼️ Bajar la referencia: cómo se ve hoy (adjuntala con el pedido)';
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
  $<HTMLTextAreaElement>('prompt').value = sheetPromptFor(list, cols, rows, !isBack(current.type) && list.some((e) => ART[e.key]));
}

function setMode(m: Mode) {
  mode = m;
  const sheet = m !== 'una';
  sheetMode = sheet;
  try { localStorage.setItem(MODE, m); } catch { /* sin almacenamiento */ }
  $('mode-queue').classList.toggle('on', m === 'pedidos');
  $('mode-one').classList.toggle('on', m === 'una');
  $('mode-sheet').classList.toggle('on', m === 'hoja');
  $('queue').hidden = m !== 'pedidos';
  $('sheetopts').hidden = m !== 'hoja';
  for (const id of ['sheetlist', 'cells', 'saveall']) $(id).hidden = !sheet;
  for (const id of ['single', 'save']) $(id).hidden = sheet;
  if (m === 'pedidos') return nextSheet();
  if (sheet && current) {
    const [c, r] = SHEET_GRID[current.type];
    $<HTMLInputElement>('cols').value = String(c);
    $<HTMLInputElement>('rows').value = String(r);
  }
  showPrompt();
  renderList();
  run();
}

// ───────────────────────── Pedidos en orden ─────────────────────────

const skipped = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SKIPPED) ?? '[]'); } catch { return []; }
};

/** Muestra la primera hoja que falta (sin las salteadas), con su grilla y su pedido. */
function nextSheet() {
  const sheets = pendingSheets(entries, done);
  const skip = skipped();
  const sheet = sheets.find((x) => !skip.includes(x.entries[0].key));
  const ready = entries.filter((e) => done(e.key)).length;
  $('unskip').hidden = !skip.length;
  $('qbar').style.width = `${Math.round((ready / entries.length) * 100)}%`;
  if (!sheet) {
    $('qtitle').textContent = sheets.length ? 'Solo quedan las hojas salteadas.' : '¡No falta nada! Todo el arte está en el juego.';
    $('qcount').textContent = '';
    $('title').textContent = '';
    $<HTMLTextAreaElement>('prompt').value = '';
    $('sheetlist').innerHTML = '';
    return;
  }
  current = sheet.entries[0];
  $<HTMLInputElement>('cols').value = String(sheet.cols);
  $<HTMLInputElement>('rows').value = String(sheet.rows);
  $('qtitle').textContent = `Hoja ${sheet.n} de ${sheets.length} · ${sheet.group}`;
  $('qcount').textContent = `· faltan ${sheets.reduce((n, x) => n + x.entries.length, 0)} imágenes en total`;
  source = null;
  results = [];
  $('cells').innerHTML = '';
  $('saved').textContent = '';
  updateSaveAll();
  showPrompt();
  renderList();
}

// ───────────────────────── Imagen ─────────────────────────

async function loadImage(blob: Blob) {
  sourceBlob = blob;
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

/** Alta calidad (lo normal ahora): 4 píxeles por píxel de arte, colores de ChatGPT y bordes suaves. */
const hdOn = () => $<HTMLInputElement>('hdq').checked;
const hdFactor = (e: AssetEntry) => (e.type === 'mapa' ? 2 : 4);
/** ¿Ya está hecho? En alta calidad, solo cuenta lo que ya tiene su versión en alta. */
// Las texturas del terreno el juego las usa en su medida de arte: en alta no ganan nada, alcanza con que existan.
const done = (key: string) => (hdOn() && !key.startsWith('tex.') ? isHd(key) : !!ART[key]);

function options(e: AssetEntry, trim: boolean) {
  const k = hdOn() ? hdFactor(e) : 1;
  return {
    w: e.w * k, h: e.h * k, fit: FIT[e.type], tolerance: Number($<HTMLInputElement>('tol').value),
    // Las texturas y el mapa conservan sus colores: la paleta en superficies grandes las ensucia.
    palette: !hdOn() && $<HTMLInputElement>('pal').checked && FIT[e.type] !== 'llenar', trim, soft: hdOn(),
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
  const cols = Number($<HTMLInputElement>('cols').value);
  const rows = Number($<HTMLInputElement>('rows').value);
  // Las figuras se buscan una por una (aunque la grilla no sea pareja); las texturas, que llenan su cuadrado, van por grilla.
  const textures = list[0].type === 'textura' || list[0].type === 'lado' || list[0].type === 'muro';
  const cells = textures ? splitGrid(source!, cols, rows) : splitByFigures(source!, cols, rows, Number($<HTMLInputElement>('tol').value));
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
  b.textContent = mode === 'pedidos' ? `💾 Guardar y seguir (${n})` : `💾 Guardar todos (${n})`;
  b.disabled = n === 0;
}

/** Vista previa en el juego: la figura sobre una casilla de pasto, o la textura proyectada sobre casillas. */
function drawScene(canvas: HTMLCanvasElement, entry: AssetEntry, img: Img) {
  const ctx = canvas.getContext('2d')!;
  // Se muestra al tamaño del juego: 2 por píxel de arte (las de alta calidad traen 4).
  const ps = img.w > entry.w * 1.5 ? 2 / hdFactor(entry) : 2;
  const W = Math.max(144, img.w * ps + 16);
  const H = Math.max(110, img.h * ps + 56);
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = ps < 2;
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
  if (entry.type === 'lado' || entry.type === 'muro' || entry.type === 'decoracion' || entry.type === 'icono' || entry.type === 'retrato' || entry.type === 'mapa') {
    // Sin casilla: la imagen sola, ampliada.
    const fitZ = Math.min((W - 8) / img.w, (H - 8) / img.h);
    const z = ps < 2 ? Math.min(1, fitZ) : Math.max(1, Math.floor(fitZ));
    ctx.drawImage(bitmap(img), (W - img.w * z) / 2, (H - img.h * z) / 2, img.w * z, img.h * z);
    return;
  }
  diamond(W / 2, H - 22, () => '#5a8a38');
  ctx.drawImage(bitmap(img), W / 2 - (img.w * ps) / 2, H - 22 - img.h * ps + 6, img.w * ps, img.h * ps);
}

// ───────────────────────── Guardar ─────────────────────────

async function pngBlob(img: Img): Promise<Blob> {
  return new Promise((ok) => bitmap(img).toBlob((b) => ok(b!), 'image/png'));
}

async function write(entry: AssetEntry, img: Img) {
  const blob = await pngBlob(img);
  const name = `${entry.key}.png`;
  if (dir) {
    const folder = hdOn()
      ? await (await dir.getDirectoryHandle('hd', { create: true })).getDirectoryHandle(entry.folder, { create: true })
      : await dir.getDirectoryHandle(entry.folder, { create: true });
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

/** La carpeta elegida se recuerda entre visitas (el navegador pide confirmar el permiso al guardar). */
const DB = { name: 'fyf-arte', store: 'carpeta' };
function idb<T>(fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return new Promise((ok) => {
    const open = indexedDB.open(DB.name, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(DB.store);
    open.onerror = () => ok(undefined);
    open.onsuccess = () => {
      const req = fn(open.result.transaction(DB.store, 'readwrite').objectStore(DB.store));
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(undefined);
    };
  });
}

type Permissioned = FileSystemDirectoryHandle & {
  queryPermission?: (o: object) => Promise<string>;
  requestPermission?: (o: object) => Promise<string>;
};

/** Antes de escribir: confirma que se puede escribir en la carpeta recordada. */
async function folderReady(): Promise<boolean> {
  if (!dir) return false;
  const h = dir as Permissioned;
  if ((await h.queryPermission?.({ mode: 'readwrite' })) === 'granted') return true;
  return (await h.requestPermission?.({ mode: 'readwrite' })) === 'granted';
}

async function pickFolder(): Promise<boolean> {
  const pick = (window as unknown as { showDirectoryPicker?: (o: object) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  if (!pick) {
    $('dirname').textContent = 'Este navegador no permite elegir carpetas: se descarga el archivo y lo copiás a mano.';
    return false;
  }
  try {
    dir = await pick({ mode: 'readwrite' });
  } catch {
    return false;
  }
  $('dirname').textContent = `Carpeta: ${dir.name}${dir.name === 'arte' ? '' : ' (¿seguro que es src/assets/arte?)'}`;
  await idb((st) => st.put(dir, 'arte'));
  return true;
}

async function save(only: typeof results) {
  if (dir && !(await folderReady())) dir = null;
  // Varias descargas seguidas las bloquea el navegador: con más de una, primero se pide la carpeta.
  if (!dir && only.length > 1 && !(await pickFolder())) {
    $('saved').textContent = 'Para guardar varias juntas elegí la carpeta src/assets/arte (el navegador no deja descargar muchas de una).';
    return;
  }
  for (const r of only) await write(r.entry, r.img);
  // El original de ChatGPT se guarda aparte (no se carga en el juego), por si hay que volver a procesarlo.
  if (dir && sourceBlob) {
    const orig = await dir.getDirectoryHandle('originales', { create: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = await orig.getFileHandle(`${stamp} ${only[0].entry.group}.png`, { create: true });
    const w = await file.createWritable();
    await w.write(sourceBlob);
    await w.close();
  }
  const names = only.map((r) => `${r.entry.folder}/${r.entry.key}.png`);
  $('saved').textContent = dir
    ? `Guardados ${names.length}: ${names.join(', ')}. El juego los toma solo al recargar.`
    : `Descargados ${names.length}: copialos a src/assets/arte/ (cada uno en su carpeta: ${[...new Set(only.map((r) => r.entry.folder))].join(', ')}).`;
  // En pedidos en orden, se recarga para tomar lo guardado y mostrar la hoja siguiente.
  if (dir && mode === 'pedidos') setTimeout(() => location.reload(), 600);
}

// ───────────────────────── Eventos ─────────────────────────

$('filter').oninput = renderList;
$('pending').onchange = renderList;
$('tol').oninput = run;
$('pal').onchange = run;
$('hdq').onchange = () => (mode === 'pedidos' ? nextSheet() : (showPrompt(), renderList(), run()));
for (const id of ['cols', 'rows']) $(id).oninput = () => { showPrompt(); renderList(); run(); };
$('mode-queue').onclick = () => setMode('pedidos');
$('mode-one').onclick = () => setMode('una');
$('mode-sheet').onclick = () => setMode('hoja');
$('skip').onclick = () => {
  if (!current) return;
  try { localStorage.setItem(SKIPPED, JSON.stringify([...skipped(), current.key])); } catch { /* sin almacenamiento */ }
  nextSheet();
};
$('unskip').onclick = () => {
  try { localStorage.removeItem(SKIPPED); } catch { /* sin almacenamiento */ }
  nextSheet();
};
/**
 * Imagen de referencia para las espaldas: los dibujos de frente en la misma grilla y el mismo orden que el pedido,
 * agrandados y sobre magenta, para adjuntarla en ChatGPT junto con el pedido.
 */
$('ref').onclick = async () => {
  if (!current) return;
  const list = sheetMode ? sheetEntries() : [current];
  const cols = sheetMode ? Number($<HTMLInputElement>('cols').value) : 1;
  const rows = sheetMode ? Number($<HTMLInputElement>('rows').value) : 1;
  const cell = 400;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ff00ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const missing: string[] = [];
  for (const [i, e] of list.entries()) {
    const url = ART[frontKey(e.key)];
    if (!url) {
      missing.push(e.name);
      continue;
    }
    const img = new Image();
    img.src = url;
    await img.decode();
    const z = Math.floor((cell * 0.8) / Math.max(img.width, img.height));
    const x = (i % cols) * cell + (cell - img.width * z) / 2;
    const y = Math.floor(i / cols) * cell + cell * 0.9 - img.height * z;
    ctx.drawImage(img, x, y, img.width * z, img.height * z);
  }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `referencia-${frontKey(list[0].key)}.png`;
  a.click();
  if (missing.length) alert(`Estos todavía no tienen dibujo de frente y quedan vacíos en la referencia: ${missing.join(', ')}.`);
};

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
$('dir').onclick = () => pickFolder();
$('save').onclick = () => save(results);
$('saveall').onclick = () => save(results.filter((r) => r.keep));

let last: string | null = null;
let saved: string | null = null;
try {
  last = localStorage.getItem(LAST);
  saved = localStorage.getItem(MODE);
} catch { /* sin almacenamiento */ }
current = entries.find((e) => e.key === last) ?? null;
// Antes se guardaba "hoja" o "una"; sin nada guardado arranca en pedidos en orden.
setMode(saved === 'hoja' || saved === 'una' ? saved : 'pedidos');
idb<FileSystemDirectoryHandle>((st) => st.get('arte')).then((h) => {
  if (!h || dir) return;
  dir = h;
  $('dirname').textContent = `Carpeta: ${h.name} (recordada)`;
});
