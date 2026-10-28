import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { buildAssetList, promptFor } from './assetList';
import { processArt, type Img } from './artProcess';
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
