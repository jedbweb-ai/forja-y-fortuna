import type Phaser from 'phaser';
import { isoDepth, isoToScreen, LEVEL_H, TILE_H } from './iso';

export interface GroundSpec {
  cols: number;
  rows: number;
  height: (c: number, r: number) => number;
  tile: (c: number, r: number) => string;
  sideTint: (c: number, r: number) => number;
  /** Casillas que no se dibujan (vacío en las arenas de silueta irregular). */
  skip?: (c: number, r: number) => boolean;
}

/** Posición en pantalla del centro de la casilla, contando su altura. */
export function tilePos(c: number, r: number, h: number) {
  const p = isoToScreen(c, r);
  return { x: p.x, y: p.y - h * LEVEL_H };
}

/** Una imagen del suelo: la tapa de una casilla o un escalón de su pared (`lvl`). */
export interface GroundPiece {
  img: Phaser.GameObjects.Image;
  c: number;
  r: number;
  /** Escalón de la pared (0 = el de abajo); undefined en la tapa. */
  lvl?: number;
  h: number;
}

/** Dibuja el suelo isométrico con alturas (tapas de casillas + caras laterales). Devuelve las piezas por si hay que moverlas. */
export function drawGround(scene: Phaser.Scene, g: GroundSpec): GroundPiece[] {
  const pieces: GroundPiece[] = [];
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      if (g.skip?.(c, r)) continue;
      const h = g.height(c, r);
      const base = isoToScreen(c, r);
      // Con arte definitivo, cada suelo puede tener su cara lateral (tile.<suelo>.side); si no, la genérica teñida.
      const side = `${g.tile(c, r)}.side`;
      const ownSide = scene.textures.exists(side);
      for (let lvl = 0; lvl < h; lvl++) {
        // El escalón de más arriba usa la franja superior de la pared; los de abajo, las siguientes.
        const band = Math.min(h - 1 - lvl, 3);
        const key = !ownSide ? 'tile.side' : band && scene.textures.exists(`${side}.${band}`) ? `${side}.${band}` : side;
        const img = scene.add.image(base.x - 32, base.y - (lvl + 1) * LEVEL_H, key)
          .setOrigin(0, 0).setDepth(-10000 + isoDepth(c, r) - 1);
        if (!ownSide) img.setTint(g.sideTint(c, r));
        pieces.push({ img, c, r, lvl, h });
      }
      const top = tilePos(c, r, h);
      const variant = (c * 7 + r * 3) % 5 === 0 && scene.textures.exists(`${g.tile(c, r)}.1`) ? `${g.tile(c, r)}.1` : g.tile(c, r);
      pieces.push({ img: scene.add.image(top.x, top.y, variant).setOrigin(0.5, 16 / 34).setDepth(-10000 + isoDepth(c, r)), c, r, h });
    }
  }
  return pieces;
}

/** Depth para algo parado sobre una casilla (personajes, props). */
export function standDepth(c: number, r: number, bias = 7) {
  return isoDepth(c, r, bias);
}

export { TILE_H };
