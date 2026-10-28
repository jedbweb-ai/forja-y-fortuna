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

/** Bounding box en pantalla de una grilla de cols × rows. */
export function isoBounds(cols: number, rows: number) {
  const left = isoToScreen(0, rows - 1).x - TILE_W / 2;
  const right = isoToScreen(cols - 1, 0).x + TILE_W / 2;
  const top = isoToScreen(0, 0).y - TILE_H / 2;
  const bottom = isoToScreen(cols - 1, rows - 1).y + TILE_H / 2;
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}
