import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { buildAssetList, promptFor, sheetPromptFor } from './assetList';
import { processArt, splitGrid, type Img } from './artProcess';
import { MASTER_PALETTE } from './palette';

/** Imagen de prueba: fondo magenta con un rectángulo de color, como las que da ChatGPT pero en chico. */
function picture(w: number, h: number, rect: { x: number; y: number; w: number; h: number }, rgb: [number, number, number]): Img {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
      data.set(inside ? [...rgb, 255] : [255, 0, 255, 255], (y * w + x) * 4);
    }
  }
  return { w, h, data };
}

const alpha = (img: Img, x: number, y: number) => img.data[(y * img.w + x) * 4 + 3];
const hexAt = (img: Img, x: number, y: number) => {
  const i = (y * img.w + x) * 4;
  return `#${[0, 1, 2].map((k) => img.data[i + k].toString(16).padStart(2, '0')).join('')}`;
};

describe('preparación de arte', () => {
  it('saca el magenta, recorta y apoya la figura abajo al centro', () => {
    // Una figura de 100×200 en una imagen de 400×400.
    const src = picture(400, 400, { x: 150, y: 100, w: 100, h: 200 }, [140, 90, 50]);
    const out = processArt(src, { w: 24, h: 36, fit: 'figura', tolerance: 60, palette: true });
    expect(out.w).toBe(24);
    expect(out.h).toBe(36);
    // Ocupa todo el alto (la figura es más alta que ancha) y queda centrada a lo ancho.
    expect(alpha(out, 12, 35)).toBe(255);
    expect(alpha(out, 12, 0)).toBe(255);
    expect(alpha(out, 0, 20)).toBe(0);
    expect(alpha(out, 23, 20)).toBe(0);
  });

  it('reduce los colores a la paleta maestra', () => {
    const src = picture(64, 64, { x: 8, y: 8, w: 48, h: 48 }, [131, 92, 55]);
    const out = processArt(src, { w: 16, h: 16, fit: 'centro', tolerance: 60, palette: true });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (alpha(out, x, y)) expect(MASTER_PALETTE).toContain(hexAt(out, x, y));
  });

  it('las texturas ocupan todo el cuadro y no pierden nada por el fondo', () => {
    const src = picture(300, 200, { x: 0, y: 0, w: 300, h: 200 }, [90, 140, 60]);
    const out = processArt(src, { w: 32, h: 32, fit: 'llenar', tolerance: 60, palette: true });
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) expect(alpha(out, x, y)).toBe(255);
  });

  it('una hoja se corta en su grilla y cada celda se procesa con su medida', () => {
    // 3×2 figuras de colores distintos, cada una en su celda de 200×200 y no del todo centrada.
    const w = 600;
    const h = 400;
    const data = new Uint8ClampedArray(w * h * 4);
    const colors: [number, number, number][] = [[200, 70, 50], [90, 140, 70], [90, 150, 210], [220, 170, 60], [170, 140, 210], [120, 90, 60]];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = Math.floor(y / 200) * 3 + Math.floor(x / 200);
        const lx = x % 200;
        const ly = y % 200;
        const inside = lx > 40 + cell * 5 && lx < 150 && ly > 30 && ly < 180;
        data.set(inside ? [...colors[cell], 255] : [255, 0, 255, 255], (y * w + x) * 4);
      }
    }
    const cells = splitGrid({ w, h, data }, 3, 2);
    expect(cells).toHaveLength(6);
    const outs = cells.map((cell) => processArt(cell, { w: 24, h: 24, fit: 'centro', tolerance: 60, palette: false }));
    outs.forEach((o, i) => {
      expect(alpha(o, 12, 12), `celda ${i}`).toBe(255);
      expect(Math.abs(o.data[(12 * 24 + 12) * 4] - colors[i][0]), `color de la celda ${i}`).toBeLessThan(3);
    });
  });

  it('ignora las manchitas sueltas que se cuelan de la celda vecina', () => {
    // Una figura en el centro y un pedacito de 6×4 en el borde de abajo (pelo de la celda de abajo).
    const src = picture(200, 200, { x: 70, y: 40, w: 60, h: 120 }, [140, 90, 50]);
    for (let y = 194; y < 198; y++) for (let x = 20; x < 26; x++) src.data.set([200, 60, 40, 255], (y * 200 + x) * 4);
    const out = processArt(src, { w: 24, h: 36, fit: 'figura', tolerance: 60, palette: false });
    // Sin la manchita, la figura ocupa todo el alto y queda centrada; con ella, se habría corrido y achicado.
    expect(alpha(out, 12, 0)).toBe(255);
    expect(alpha(out, 12, 35)).toBe(255);
    expect(alpha(out, 0, 34)).toBe(0);
  });

  it('las texturas de una hoja recortan las franjas magenta antes de llenar el cuadro', () => {
    // Textura verde de 160×160 rodeada de una franja magenta de 20.
    const src = picture(200, 200, { x: 20, y: 20, w: 160, h: 160 }, [90, 140, 60]);
    const out = processArt(src, { w: 32, h: 32, fit: 'llenar', tolerance: 60, palette: false, trim: true });
    for (const [x, y] of [[0, 0], [31, 0], [0, 31], [31, 31], [16, 16]]) {
      const i = (y * 32 + x) * 4;
      expect([out.data[i], out.data[i + 1], out.data[i + 2]]).toEqual([90, 140, 60]);
    }
  });

  it('el pedido de una hoja numera los assets en orden y pide la grilla', () => {
    const list = buildAssetList(CONTENT).filter((e) => e.type === 'retrato').slice(0, 9);
    const p = sheetPromptFor(list, 3, 3);
    expect(p).toContain('3 columnas por 3 filas');
    expect(p).toContain('1. ');
    expect(p).toContain('9. ');
    expect(p.indexOf(list[0].detail)).toBeLessThan(p.indexOf(list[8].detail));
  });

  it('la lista de assets cubre el contenido del juego, sin claves repetidas y con pedido para cada una', () => {
    const list = buildAssetList(CONTENT);
    const keys = list.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('char.herrero');
    expect(keys).toContain('mon.dragon');
    expect(keys).toContain('mon.cendralia');
    expect(keys).toContain('icon.hierro');
    expect(keys).toContain('tex.grass');
    expect(keys).toContain('build.herreria');
    for (const npc of Object.keys(CONTENT.npcs)) expect(keys).toContain(`retrato.${npc}`);
    for (const e of list) expect(promptFor(e)).toContain('#FF00FF');
  });
});
