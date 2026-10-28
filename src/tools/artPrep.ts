import { CONTENT } from '../data';
import { ART } from '../game/render/assets';
import { buildAssetList, promptFor, type AssetEntry, type AssetType } from './assetList';
import { processArt, type Fit, type Img } from './artProcess';

// Herramienta de arte (solo en desarrollo): http://localhost:5173/herramientas/arte.html
// Lista lo que falta, da el pedido para ChatGPT y convierte la imagen generada en pixel art del juego.

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const LAST = 'fyf.arte.ultimo';

const entries = buildAssetList(CONTENT);
let current: AssetEntry | null = null;
let source: Img | null = null;
let result: Img | null = null;
let dir: FileSystemDirectoryHandle | null = null;

const FIT: Record<AssetType, Fit> = {
  personaje: 'figura', monstruo: 'figura', jefe: 'figura', escenario: 'figura', edificio: 'figura',
  icono: 'centro', retrato: 'centro', textura: 'llenar', lado: 'llenar', mapa: 'llenar',
};

// ───────────────────────── Lista ─────────────────────────

function renderList() {
  const q = $<HTMLInputElement>('filter').value.toLowerCase();
  const onlyPending = $<HTMLInputElement>('pending').checked;
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
    row.className = `entry${done ? ' done' : ''}${current?.key === e.key ? ' on' : ''}`;
    row.innerHTML = `<span class="st">${done ? '✓' : '·'}</span><span></span><small>${e.w}×${e.h}</small>`;
    row.children[1].textContent = e.name;
    row.onclick = () => select(e);
    list.append(row);
  }
  const done = entries.filter((e) => ART[e.key]).length;
  $('count').textContent = `Hechos ${done} de ${entries.length}`;
}

function select(e: AssetEntry) {
  current = e;
  try { localStorage.setItem(LAST, e.key); } catch { /* sin almacenamiento */ }
  $('title').textContent = e.name;
  $('meta').innerHTML = `Archivo <code>${e.folder}/${e.key}.png</code> · dibujo de <b>${e.w}×${e.h}</b> píxeles${ART[e.key] ? ' · <b>ya tiene arte</b> (si guardás, se reemplaza)' : ''}`;
  $<HTMLTextAreaElement>('prompt').value = promptFor(e);
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
  const tmp = document.createElement('canvas');
  tmp.width = img.w;
  tmp.height = img.h;
  tmp.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, img.w * zoom, img.h * zoom);
}

function run() {
  if (!current || !source) return;
  const tol = Number($<HTMLInputElement>('tol').value);
  $('tolv').textContent = String(tol);
  result = processArt(source, { w: current.w, h: current.h, fit: FIT[current.type], tolerance: tol, palette: $<HTMLInputElement>('pal').checked });
  // Original achicado para que entre en pantalla.
  const scale = Math.min(1, 220 / Math.max(source.w, source.h));
  const orig = $<HTMLCanvasElement>('orig');
  orig.width = Math.round(source.w * scale);
  orig.height = Math.round(source.h * scale);
  const tmp = document.createElement('canvas');
  tmp.width = source.w;
  tmp.height = source.h;
  tmp.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(source.data), source.w, source.h), 0, 0);
  orig.getContext('2d')!.drawImage(tmp, 0, 0, orig.width, orig.height);
  toCanvas($('res1'), result, 1);
  toCanvas($('res4'), result, Math.max(1, Math.floor(256 / Math.max(result.w, result.h))));
  drawScene(result);
  $<HTMLButtonElement>('save').disabled = false;
}

/** Vista previa en el juego: la figura sobre una casilla de pasto, o la textura proyectada sobre casillas. */
function drawScene(img: Img) {
  const canvas = $<HTMLCanvasElement>('scene');
  const ctx = canvas.getContext('2d')!;
  const textured = current!.type === 'textura' || current!.type === 'lado';
  const W = 192;
  const H = Math.max(140, img.h * 2 + 60);
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  const diamond = (cx: number, cy: number, fill: (x: number, y: number) => string) => {
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
  if (textured && current!.type === 'textura') {
    const at = (u: number, v: number) => {
      const i = ((Math.floor(v * img.h) % img.h) * img.w + (Math.floor(u * img.w) % img.w)) * 4;
      return `rgb(${img.data[i]},${img.data[i + 1]},${img.data[i + 2]})`;
    };
    for (const [c, r] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) diamond(W / 2 + (c - r) * 32, 30 + (c + r) * 16, at);
    return;
  }
  diamond(W / 2, H - 30, () => '#5a8a38');
  if (current!.type === 'lado') return;
  const tmp = document.createElement('canvas');
  tmp.width = img.w;
  tmp.height = img.h;
  tmp.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
  ctx.drawImage(tmp, W / 2 - img.w, H - 30 - img.h * 2 + 6, img.w * 2, img.h * 2);
}

// ───────────────────────── Guardar ─────────────────────────

async function pngBlob(img: Img): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = img.w;
  c.height = img.h;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
  return new Promise((ok) => c.toBlob((b) => ok(b!), 'image/png'));
}

async function save() {
  if (!current || !result) return;
  const blob = await pngBlob(result);
  const name = `${current.key}.png`;
  if (dir) {
    const folder = await dir.getDirectoryHandle(current.folder, { create: true });
    const file = await folder.getFileHandle(name, { create: true });
    const w = await file.createWritable();
    await w.write(blob);
    await w.close();
    $('saved').textContent = `Guardado en ${current.folder}/${name}. El juego lo toma solo al recargar.`;
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    $('saved').textContent = `Descargado ${name}: copialo a src/assets/arte/${current.folder}/.`;
  }
}

// ───────────────────────── Eventos ─────────────────────────

$('filter').oninput = renderList;
$('pending').onchange = renderList;
$('tol').oninput = run;
$('pal').onchange = run;
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
$('save').onclick = save;

renderList();
let last: string | null = null;
try { last = localStorage.getItem(LAST); } catch { /* sin almacenamiento */ }
const start = entries.find((e) => e.key === last);
if (start) select(start);
