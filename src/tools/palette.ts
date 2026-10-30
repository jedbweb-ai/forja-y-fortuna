// Paleta maestra del arte (la misma que docs/GUIA_DE_ARTE.md). Todo el arte se reduce a estos colores.
export const MASTER_PALETTE = [
  // Oscuros y contornos
  '#1e1820', '#3a2a2e', '#4a3a30',
  // Piel
  '#f2d0a8', '#d9a878', '#a8704a',
  // Pelo y madera
  '#6b4220', '#8a5a32', '#b88a50',
  // Piedra y tierra
  '#f0e2c0', '#c8b088', '#9a8468', '#6e604e',
  // Piedra gris y metal
  '#c8c8d0', '#8a8a92', '#5e5e6a',
  // Verdes
  '#c8d878', '#8aaa48', '#5a8a38', '#2e5028',
  // Verdes oliva (piel de orcos y trolls, musgo)
  '#a8ac68', '#7a8044', '#52582e',
  // Azules y agua
  '#a8e0f0', '#5a9ad0', '#2a5a98', '#1e3060',
  // Rojos
  '#f08a5a', '#c8482e', '#7a2422',
  // Violetas
  '#a88ad0', '#6a4a8a', '#3a2a5a',
  // Dorados
  '#f8e48a', '#e0a838', '#a8701e',
  // Blancos
  '#f8f4e8', '#d8d0c0',
];

export type Rgb = [number, number, number];

export const PALETTE_RGB: Rgb[] = MASTER_PALETTE.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

/** Color de la paleta más parecido (distancia "redmean", más cercana a como lo ve el ojo que la euclídea). */
export function nearest(c: Rgb, palette: Rgb[] = PALETTE_RGB): Rgb {
  let best = palette[0];
  let bestD = Infinity;
  for (const p of palette) {
    const rm = (c[0] + p[0]) / 2;
    const dr = c[0] - p[0];
    const dg = c[1] - p[1];
    const db = c[2] - p[2];
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}
