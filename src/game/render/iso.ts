// Conversión grilla isométrica ↔ pantalla. Un tile ocupa TILE_W × TILE_H píxeles.
export const TILE_W = 64;
export const TILE_H = 32;

export function isoToScreen(col: number, row: number, z = 0): { x: number; y: number } {
  return { x: (col - row) * (TILE_W / 2), y: (col + row) * (TILE_H / 2) - z };
}

/** Profundidad para ordenar sprites: más abajo en pantalla = adelante. */
export function isoDepth(col: number, row: number, bias = 0): number {
  return (col + row) * 10 + bias;
}

/** Alto en píxeles de un nivel de altura. */
export const LEVEL_H = 16;

/**
 * Casilla bajo un punto de pantalla, considerando alturas: prueba de la más alta a la más baja
 * y se queda con la primera cuya altura coincide.
 */
export function screenToIso(wx: number, wy: number, heightOf: (c: number, r: number) => number | null, maxH = 4): { x: number; y: number } | null {
  for (let h = maxH; h >= 0; h--) {
    const y = wy + h * LEVEL_H;
    const c = Math.round((wx / (TILE_W / 2) + y / (TILE_H / 2)) / 2);
    const r = Math.round((y / (TILE_H / 2) - wx / (TILE_W / 2)) / 2);
    if (heightOf(c, r) === h) return { x: c, y: r };
  }
  return null;
}

/** Bounding box en pantalla de una grilla de cols × rows. */
export function isoBounds(cols: number, rows: number) {
  const left = isoToScreen(0, rows - 1).x - TILE_W / 2;
  const right = isoToScreen(cols - 1, 0).x + TILE_W / 2;
  const top = isoToScreen(0, 0).y - TILE_H / 2;
  const bottom = isoToScreen(cols - 1, rows - 1).y + TILE_H / 2;
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}
