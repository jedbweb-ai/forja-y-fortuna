import type Phaser from 'phaser';
import { block, poly, prop, px, shade, type G } from './placeholders';
import { diamondTile, twoFrames } from './worldPlaceholders';

// Placeholders de la Fase 5: piedra de mazmorra, paredes, secretos y las familias nuevas.
// Los monstruos van en grises claros para que el `tint` de cada especie les dé color.

/** Bloque de pared isométrico (una casilla de alto). */
function wallCube(scene: Phaser.Scene, key: string, top: number, left: number, right: number, detail?: (g: G) => void) {
  prop(scene, key, 64, 58, (g) => {
    poly(g, [0, 16, 32, 0, 64, 16, 32, 32], top);
    poly(g, [0, 16, 32, 32, 32, 58, 0, 42], left);
    poly(g, [64, 16, 32, 32, 32, 58, 64, 42], right);
    detail?.(g);
  });
}

export function generateDungeonPlaceholders(scene: Phaser.Scene) {
  const W = 0xf2f2f2;
  const L = 0xd4d4d4;
  const D = 0x1a1220;

  // ── Suelos ──
  diamondTile(scene, 'tile.cryptstone', 0x5a5466, (g) => {
    g.lineStyle(1, 0x3e3a48, 0.8);
    g.lineBetween(16, 8, 48, 24); g.lineBetween(16, 24, 48, 8);
  });
  diamondTile(scene, 'tile.cave', 0x4a4038, (g) => {
    g.fillStyle(0x3a3028, 0.7);
    for (let i = 0; i < 9; i++) g.fillRect(14 + ((i * 13) % 34), 7 + ((i * 7) % 17), 3, 2);
  });
  diamondTile(scene, 'tile.lava', 0xd9542b, (g) => {
    g.fillStyle(0xffb347, 0.9);
    g.fillEllipse(24, 14, 14, 5); g.fillEllipse(40, 20, 10, 4);
  });

  // ── Paredes y pasajes ──
  wallCube(scene, 'prop.cryptwall', 0x6e6878, 0x4a4454, 0x3a3644, (g) => {
    g.lineStyle(1, 0x2a2632, 0.8);
    g.lineBetween(0, 29, 32, 45); g.lineBetween(32, 45, 64, 29);
  });
  wallCube(scene, 'prop.cavewall', 0x5e5246, 0x463c32, 0x382f27, (g) => {
    g.fillStyle(0x6e6256, 1); g.fillEllipse(20, 12, 14, 6); g.fillEllipse(42, 18, 10, 5);
  });
  prop(scene, 'prop.pillar', 32, 64, (g) => {
    px(g, 8, 10, 16, 50, 0x8a8494); px(g, 8, 10, 4, 50, 0xa8a2b2); px(g, 5, 4, 22, 7, 0x6e6878); px(g, 5, 56, 22, 6, 0x6e6878);
  });
  prop(scene, 'prop.stalagmite', 40, 56, (g) => {
    poly(g, [4, 54, 18, 6, 34, 54], 0x7a6e60); poly(g, [18, 6, 34, 54, 24, 54], 0x5e5448);
  });
  prop(scene, 'prop.stairs', 64, 40, (g) => {
    poly(g, [0, 20, 32, 4, 64, 20, 32, 36], 0x1a1418);
    for (let i = 0; i < 4; i++) poly(g, [10 + i * 5, 20 + i * 2, 32, 9 + i * 4, 54 - i * 5, 20 + i * 2, 32, 31 - i * 2], shade(0x8a8494, 1 - i * 0.18));
  });
  prop(scene, 'prop.stairsup', 64, 40, (g) => {
    poly(g, [0, 20, 32, 4, 64, 20, 32, 36], 0x3a3644);
    for (let i = 0; i < 4; i++) px(g, 20 + i * 3, 26 - i * 5, 24 - i * 6, 4, shade(0xb8b2c2, 1 - i * 0.12));
  });
  prop(scene, 'prop.gate', 48, 60, (g) => {
    for (let i = 0; i < 6; i++) px(g, 4 + i * 8, 6, 3, 52, 0x4a4e58);
    px(g, 2, 6, 44, 4, 0x2b2e33); px(g, 2, 30, 44, 3, 0x2b2e33);
  });
  prop(scene, 'prop.door', 48, 60, (g) => {
    px(g, 6, 6, 36, 52, 0x6b4220); px(g, 6, 6, 36, 4, 0x3a2418); px(g, 6, 30, 36, 3, 0x3a2418);
    px(g, 32, 28, 6, 8, 0xd9a441); px(g, 34, 32, 2, 3, D);
  });
  prop(scene, 'prop.lever', 32, 40, (g) => {
    block(g, 16, 36, 22, 8, 0x5a5466); px(g, 14, 10, 4, 22, 0x8a8f98); g.fillStyle(0xc0392b, 1).fillCircle(16, 10, 4);
  });
  prop(scene, 'prop.lever_on', 32, 40, (g) => {
    block(g, 16, 36, 22, 8, 0x5a5466); poly(g, [14, 30, 18, 30, 28, 14, 24, 12], 0x8a8f98); g.fillStyle(0x6fcf6a, 1).fillCircle(26, 12, 4);
  });
  prop(scene, 'prop.inscription', 40, 52, (g) => {
    block(g, 20, 50, 30, 10, 0x5a5466); px(g, 8, 8, 24, 34, 0x8a8494); px(g, 8, 8, 24, 3, 0xa8a2b2);
    for (let i = 0; i < 4; i++) px(g, 12, 15 + i * 6, 16 - (i % 2) * 6, 2, 0x3a3644);
  });
  prop(scene, 'prop.key', 28, 20, (g) => {
    g.lineStyle(3, 0xd9a441, 1).strokeCircle(7, 10, 5); px(g, 12, 9, 14, 3, 0xd9a441); px(g, 20, 12, 3, 4, 0xd9a441); px(g, 24, 12, 2, 3, 0xd9a441);
  });
  prop(scene, 'prop.cryptdoor', 64, 56, (g) => {
    g.fillStyle(0x7d7468, 1).fillEllipse(32, 44, 60, 22);
    poly(g, [16, 44, 18, 12, 32, 4, 46, 12, 48, 44], 0x6e6878);
    poly(g, [22, 44, 23, 18, 32, 12, 41, 18, 42, 44], 0x1a1418);
  });
  prop(scene, 'fx.fog', 64, 34, (g) => poly(g, [0, 16, 32, 0, 64, 16, 32, 32], 0x0c0a10));

  // ── No-muertos ──
  twoFrames(scene, 'mon.esqueleto', 18, 26, (g, s) => {
    px(g, s ? 5 : 6, 20, 2, 6, L); px(g, s ? 11 : 10, 20, 2, 6, L);
    px(g, 6, 11, 6, 9, D); for (let i = 0; i < 4; i++) px(g, 6, 12 + i * 2, 6, 1, L);
    px(g, 8, 10, 2, 11, W);
    px(g, 5, 2, 8, 8, W); px(g, 6, 5, 2, 2, D); px(g, 10, 5, 2, 2, D); px(g, 7, 8, 4, 1, D);
    px(g, 13, 10, 2, 12, 0x8a8f98); px(g, 2, 12, 3, 2, L);
  });
  twoFrames(scene, 'mon.espectro', 22, 26, (g, s) => {
    g.fillStyle(L, 0.85).fillEllipse(11, 10, 16, 16);
    poly(g, [3, 10, 19, 10, 19 + (s ? 1 : 0), 24, 15, 20, 11, 25, 7, 20, 3 - (s ? 1 : 0), 24], L, 0.85);
    px(g, 7, 8, 3, 3, D); px(g, 13, 8, 3, 3, D); px(g, 9, 13, 4, 2, D);
  });
  twoFrames(scene, 'mon.caballero', 22, 30, (g, s) => {
    px(g, s ? 6 : 7, 24, 4, 6, shade(L, 0.6)); px(g, s ? 13 : 12, 24, 4, 6, shade(L, 0.6));
    px(g, 5, 11, 12, 13, L); px(g, 5, 16, 12, 2, shade(L, 0.7));
    px(g, 6, 1, 10, 10, W); px(g, 7, 5, 8, 2, D); px(g, 10, 0, 2, 3, 0xc0392b);
    px(g, 17, 6, 3, 20, 0xa0a6ad); px(g, 15, 18, 7, 2, 0x6b4220); px(g, 1, 12, 4, 10, shade(L, 0.8));
  });
  // ── Constructos ──
  twoFrames(scene, 'mon.golem', 28, 30, (g, s) => {
    px(g, s ? 6 : 7, 23, 6, 7, shade(L, 0.6)); px(g, s ? 16 : 15, 23, 6, 7, shade(L, 0.6));
    block(g, 14, 24, 20, 14, L);
    px(g, 8, 4, 12, 9, W); px(g, 11, 7, 2, 2, 0x5ad1ff); px(g, 15, 7, 2, 2, 0x5ad1ff);
    px(g, 1, 10, 5, 12, L); px(g, 22, 10, 5, 12, L);
    px(g, 12, 14, 4, 4, 0x5ad1ff);
  }, 3);
  twoFrames(scene, 'mon.gargola', 26, 24, (g, s) => {
    poly(g, [2, s ? 6 : 10, 9, 12, 7, 18], shade(L, 0.75)); poly(g, [24, s ? 6 : 10, 17, 12, 19, 18], shade(L, 0.75));
    g.fillStyle(L, 1).fillEllipse(13, 15, 12, 12);
    px(g, 9, 4, 8, 7, W); px(g, 9, 2, 2, 3, W); px(g, 15, 2, 2, 3, W);
    px(g, 10, 6, 2, 2, 0xff4e1f); px(g, 14, 6, 2, 2, 0xff4e1f);
    px(g, 9, 20, 3, 4, shade(L, 0.6)); px(g, 14, 20, 3, 4, shade(L, 0.6));
  });
  twoFrames(scene, 'mon.cristal', 20, 30, (g, s) => {
    poly(g, [10, 0, 18, 12, 14, 28, 6, 28, 2, 12], L);
    poly(g, [10, 0, 18, 12, 14, 28, 10, 28], W);
    px(g, 8, s ? 10 : 12, 4, 4, 0xffffff);
  }, 2);
}
