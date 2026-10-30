import { nearest, type Rgb } from './palette';

// Convierte lo que genera ChatGPT en pixel art del juego: saca el fondo magenta, recorta, achica a la medida
// del dibujo y reduce a la paleta maestra. Trabaja con píxeles RGBA sueltos (sin canvas), así se puede probar.

export interface Img {
  w: number;
  h: number;
  /** RGBA, 4 bytes por píxel. */
  data: Uint8ClampedArray;
}

export type Fit = 'figura' | 'centro' | 'llenar';

export interface ProcessOptions {
  w: number;
  h: number;
  /** figura: apoyada abajo al centro (personajes, monstruos, escenario). centro: centrada (íconos, retratos). llenar: ocupa todo (texturas, mapa). */
  fit: Fit;
  /** Distancia máxima al magenta para considerarlo fondo (0-255). */
  tolerance: number;
  /** Reducir a la paleta maestra. */
  palette: boolean;
  /** Con "llenar": recortar antes el fondo magenta (texturas que vienen en una hoja con separaciones). */
  trim?: boolean;
}

/**
 * Corta una hoja en una grilla pareja de celdas (de izquierda a derecha y de arriba a abajo).
 * Cada celda después se procesa sola: el recorte del fondo acomoda lo que no quedó perfectamente centrado.
 */
export function splitGrid(src: Img, cols: number, rows: number): Img[] {
  const cells: Img[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor((c * src.w) / cols);
      const x1 = Math.floor(((c + 1) * src.w) / cols);
      const y0 = Math.floor((r * src.h) / rows);
      const y1 = Math.floor(((r + 1) * src.h) / rows);
      const w = x1 - x0;
      const h = y1 - y0;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) data.set(src.data.subarray(((y0 + y) * src.w + x0) * 4, ((y0 + y) * src.w + x1) * 4), y * w * 4);
      cells.push({ w, h, data });
    }
  }
  return cells;
}

const MAGENTA: Rgb = [255, 0, 255];

function isBackground(d: Uint8ClampedArray, i: number, tolerance: number): boolean {
  if (d[i + 3] < 128) return true;
  const dr = d[i] - MAGENTA[0];
  const dg = d[i + 1] - MAGENTA[1];
  const db = d[i + 2] - MAGENTA[2];
  if (Math.sqrt(dr * dr + dg * dg + db * db) < tolerance) return true;
  // Borde suavizado contra el magenta: mucho rojo y azul, poco verde.
  return d[i] > 150 && d[i + 2] > 150 && d[i + 1] < 90 && Math.abs(d[i] - d[i + 2]) < 70;
}

/**
 * Qué píxeles son la figura: lo que no es fondo, sin las manchitas sueltas
 * (pedazos de la celda vecina en una hoja, restos del borde). Se quedan las partes conectadas grandes.
 */
export function foreground(src: Img, tolerance: number): { keep: Uint8Array; box: { x: number; y: number; w: number; h: number } } {
  const n = src.w * src.h;
  const solid = new Uint8Array(n);
  for (let p = 0; p < n; p++) solid[p] = isBackground(src.data, p * 4, tolerance) ? 0 : 1;
  // Partes conectadas (vecinos de los 4 lados).
  const label = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let p = 0; p < n; p++) {
    if (!solid[p] || label[p] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    label[p] = id;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop()!;
      size++;
      const x = q % src.w;
      for (const r of [q - src.w, q + src.w, x > 0 ? q - 1 : -1, x < src.w - 1 ? q + 1 : -1]) {
        if (r < 0 || r >= n || !solid[r] || label[r] >= 0) continue;
        label[r] = id;
        stack.push(r);
      }
    }
    sizes.push(size);
  }
  // Se descartan las partes chicas comparadas con la más grande (ojos, botones y detalles sueltos quedan: superan el 2%).
  const biggest = Math.max(0, ...sizes);
  const min = Math.max(4, biggest * 0.02);
  const keep = new Uint8Array(n);
  let x0 = src.w;
  let y0 = src.h;
  let x1 = -1;
  let y1 = -1;
  for (let p = 0; p < n; p++) {
    if (label[p] < 0 || sizes[label[p]] < min) continue;
    keep[p] = 1;
    const x = p % src.w;
    const y = Math.floor(p / src.w);
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const box = x1 < 0 ? { x: 0, y: 0, w: src.w, h: src.h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  return { keep, box };
}

/** Caja que encierra la figura (sin el fondo ni las manchitas sueltas). */
export function contentBox(src: Img, tolerance: number) {
  return foreground(src, tolerance).box;
}

export function processArt(src: Img, o: ProcessOptions): Img {
  const out: Img = { w: o.w, h: o.h, data: new Uint8ClampedArray(o.w * o.h * 4) };
  const fill = o.fit === 'llenar';
  // Qué parte de la imagen original se usa: todo (texturas, mapa) o lo que no es fondo.
  const fg = fill && !o.trim ? null : foreground(src, o.tolerance);
  let box = fg ? fg.box : { x: 0, y: 0, w: src.w, h: src.h };
  if (fill && o.w === o.h && box.w !== box.h) {
    // Textura cuadrada: se toma el cuadrado del centro.
    const side = Math.min(box.w, box.h);
    box = { x: box.x + Math.floor((box.w - side) / 2), y: box.y + Math.floor((box.h - side) / 2), w: side, h: side };
  }
  // Tamaño del dibujo dentro del cuadro, sin deformar (salvo "llenar").
  const s = fill ? 0 : Math.min(o.w / box.w, o.h / box.h);
  const dw = fill ? o.w : Math.max(1, Math.round(box.w * s));
  const dh = fill ? o.h : Math.max(1, Math.round(box.h * s));
  const ox = Math.floor((o.w - dw) / 2);
  const oy = o.fit === 'figura' ? o.h - dh : Math.floor((o.h - dh) / 2);

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      // Bloque de la imagen original que corresponde a este píxel: promedio de lo que no es fondo.
      const sx0 = box.x + Math.floor((x * box.w) / dw);
      const sx1 = Math.max(sx0 + 1, box.x + Math.floor(((x + 1) * box.w) / dw));
      const sy0 = box.y + Math.floor((y * box.h) / dh);
      const sy1 = Math.max(sy0 + 1, box.y + Math.floor(((y + 1) * box.h) / dh));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      let total = 0;
      for (let yy = sy0; yy < sy1; yy++) {
        for (let xx = sx0; xx < sx1; xx++) {
          total++;
          const i = (yy * src.w + xx) * 4;
          if (!fill && !fg!.keep[yy * src.w + xx]) continue;
          r += src.data[i];
          g += src.data[i + 1];
          b += src.data[i + 2];
          n++;
        }
      }
      // Si más de la mitad del bloque es fondo, el píxel queda transparente.
      if (!n || n / total < 0.5) continue;
      let rgb: Rgb = [r / n, g / n, b / n];
      if (o.palette) rgb = nearest(rgb);
      const j = ((oy + y) * o.w + ox + x) * 4;
      out.data[j] = rgb[0];
      out.data[j + 1] = rgb[1];
      out.data[j + 2] = rgb[2];
      out.data[j + 3] = 255;
    }
  }
  return out;
}
