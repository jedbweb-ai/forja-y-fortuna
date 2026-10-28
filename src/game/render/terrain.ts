import type Phaser from 'phaser';
import { isoDepth, isoToScreen, LEVEL_H, TILE_H } from './iso';

export interface GroundSpec {
  cols: number;
  rows: number;
  height: (c: number, r: number) => number;
  tile: (c: number, r: number) => string;
  sideTint: (c: number, r: number) => number;
}

/** Posición en pantalla del centro de la casilla, contando su altura. */
export function tilePos(c: number, r: number, h: number) {
  const p = isoToScreen(c, r);
  return { x: p.x, y: p.y - h * LEVEL_H };
}

/** Dibuja el suelo isométrico con alturas (tapas de casillas + caras laterales). */
export function drawGround(scene: Phaser.Scene, g: GroundSpec) {
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const h = g.height(c, r);
      const base = isoToScreen(c, r);
      for (let lvl = 0; lvl < h; lvl++) {
        scene.add.image(base.x - 32, base.y - (lvl + 1) * LEVEL_H, 'tile.side')
          .setOrigin(0, 0).setTint(g.sideTint(c, r)).setDepth(-10000 + isoDepth(c, r) - 1);
      }
      const top = tilePos(c, r, h);
      const variant = (c * 7 + r * 3) % 5 === 0 && scene.textures.exists(`${g.tile(c, r)}.1`) ? `${g.tile(c, r)}.1` : g.tile(c, r);
      scene.add.image(top.x, top.y, variant).setOrigin(0.5, 16 / 34).setDepth(-10000 + isoDepth(c, r));
    }
  }
}

/** Depth para algo parado sobre una casilla (personajes, props). */
export function standDepth(c: number, r: number, bias = 7) {
  return isoDepth(c, r, bias);
}

export { TILE_H };
