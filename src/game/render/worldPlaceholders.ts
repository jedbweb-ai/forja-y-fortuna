import type Phaser from 'phaser';
import { block, poly, prop, px, shade, walkAnim, type G } from './placeholders';

// Placeholders de la Fase 2: monstruos, terreno de exploración y arenas.
// Los monstruos se dibujan en grises claros para que el `tint` de cada especie les dé color.

export function diamondTile(scene: Phaser.Scene, key: string, base: number, detail?: (g: G) => void) {
  prop(scene, key, 64, 34, (g) => {
    poly(g, [0, 16, 32, 0, 64, 16, 32, 32], base);
    poly(g, [0, 16, 32, 32, 64, 16, 64, 17, 32, 33, 0, 17], shade(base, 0.7));
    detail?.(g);
  });
}

export function twoFrames(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G, step: boolean) => void, rate = 5) {
  prop(scene, key, w, h, (g) => draw(g, false));
  prop(scene, `${key}_b`, w, h, (g) => draw(g, true));
  walkAnim(scene, key, rate);
}

export function generateWorldPlaceholders(scene: Phaser.Scene) {
  const W = 0xf2f2f2;
  const L = 0xd4d4d4;
  const D = 0x1a1220;

  // ── Monstruos ──
  twoFrames(scene, 'mon.gelin', 22, 18, (g, s) => {
    const h = s ? 12 : 14;
    g.fillStyle(L, 1).fillEllipse(11, 18 - h / 2, 20, h);
    g.fillStyle(W, 1).fillEllipse(11, 18 - h / 2 - 1, 16, h - 4);
    px(g, 7, 18 - h + 4, 2, 3, D); px(g, 13, 18 - h + 4, 2, 3, D);
    px(g, 5, 18 - h + 2, 3, 2, 0xffffff);
  });
  twoFrames(scene, 'mon.goblin', 18, 22, (g, s) => {
    px(g, s ? 5 : 6, 18, 3, 4, 0x3a2a1a); px(g, s ? 10 : 9, 18, 3, 4, 0x3a2a1a);
    px(g, 5, 11, 8, 8, 0x6b4a2f);
    px(g, 4, 2, 10, 9, L); px(g, 1, 4, 3, 3, L); px(g, 14, 4, 3, 3, L);
    px(g, 6, 5, 2, 2, 0xffe14a); px(g, 10, 5, 2, 2, 0xffe14a);
    px(g, 7, 8, 4, 1, D); px(g, 8, 9, 1, 1, W);
    px(g, 14, 9, 2, 8, 0x8a8f98); px(g, 13, 15, 4, 1, 0x6b4220);
  });
  twoFrames(scene, 'mon.jefe', 24, 28, (g, s) => {
    px(g, s ? 7 : 8, 23, 4, 5, 0x3a2a1a); px(g, s ? 14 : 13, 23, 4, 5, 0x3a2a1a);
    px(g, 6, 13, 13, 11, 0x5a3a24); px(g, 6, 17, 13, 2, 0xc0392b);
    px(g, 6, 4, 13, 10, L); px(g, 2, 6, 4, 4, L); px(g, 19, 6, 4, 4, L);
    px(g, 6, 1, 13, 4, 0x6d757e); px(g, 4, 0, 2, 4, W); px(g, 19, 0, 2, 4, W);
    px(g, 9, 8, 2, 2, 0xff4e1f); px(g, 14, 8, 2, 2, 0xff4e1f); px(g, 9, 11, 7, 1, D); px(g, 13, 12, 1, 2, W);
    px(g, 20, 10, 2, 14, 0x6b4220); poly(g, [18, 8, 24, 8, 24, 16, 18, 14], 0xa0a6ad);
  });
  twoFrames(scene, 'mon.lobo', 26, 16, (g, s) => {
    px(g, 3, 5, 16, 7, L); px(g, 17, 2, 7, 7, L); px(g, 18, 0, 2, 3, L); px(g, 22, 0, 2, 3, L);
    px(g, 23, 5, 3, 2, W); px(g, 20, 4, 1, 1, D); px(g, 24, 6, 1, 1, D);
    px(g, 0, 4, 4, 2, L);
    px(g, s ? 4 : 5, 12, 2, 4, shade(L, 0.8)); px(g, s ? 8 : 7, 12, 2, 4, shade(L, 0.8));
    px(g, s ? 14 : 15, 12, 2, 4, shade(L, 0.8)); px(g, s ? 18 : 17, 12, 2, 4, shade(L, 0.8));
  });
  twoFrames(scene, 'mon.jabali', 28, 18, (g, s) => {
    g.fillStyle(L, 1).fillEllipse(13, 9, 22, 12);
    px(g, 21, 5, 7, 7, L); px(g, 26, 8, 2, 2, shade(L, 0.7)); px(g, 23, 6, 1, 1, D);
    poly(g, [22, 11, 26, 13, 21, 13], W); px(g, 6, 2, 12, 2, shade(L, 0.6));
    px(g, s ? 5 : 6, 14, 3, 4, shade(L, 0.7)); px(g, s ? 10 : 9, 14, 3, 4, shade(L, 0.7));
    px(g, s ? 16 : 17, 14, 3, 4, shade(L, 0.7)); px(g, s ? 20 : 19, 14, 3, 4, shade(L, 0.7));
  });
  twoFrames(scene, 'mon.arana', 26, 16, (g, s) => {
    g.lineStyle(2, shade(L, 0.6), 1);
    for (let i = 0; i < 4; i++) {
      const y = 6 + i * 2;
      g.lineBetween(9, y, 2 - (s && i % 2 ? 1 : 0), y + 6);
      g.lineBetween(17, y, 24 + (s && i % 2 ? 1 : 0), y + 6);
    }
    g.fillStyle(L, 1).fillEllipse(13, 8, 14, 10);
    g.fillStyle(W, 1).fillEllipse(13, 6, 8, 5);
    px(g, 10, 9, 2, 2, 0xff3a3a); px(g, 14, 9, 2, 2, 0xff3a3a);
  });
  twoFrames(scene, 'mon.oso', 30, 24, (g, s) => {
    g.fillStyle(L, 1).fillEllipse(14, 12, 26, 16);
    px(g, 20, 3, 9, 9, L); px(g, 20, 1, 3, 3, L); px(g, 26, 1, 3, 3, L); px(g, 27, 8, 3, 2, D); px(g, 23, 5, 1, 1, D);
    px(g, 6, 3, 10, 4, 0x6aa84f);
    px(g, s ? 4 : 5, 18, 4, 6, shade(L, 0.7)); px(g, s ? 10 : 9, 18, 4, 6, shade(L, 0.7));
    px(g, s ? 17 : 18, 18, 4, 6, shade(L, 0.7)); px(g, s ? 23 : 22, 18, 4, 6, shade(L, 0.7));
  });

  // ── Terreno ──
  diamondTile(scene, 'tile.water', 0x4a90c8, (g) => {
    g.lineStyle(1, 0xbfe3ff, 0.7);
    g.lineBetween(18, 14, 28, 14); g.lineBetween(36, 20, 46, 20);
  });
  diamondTile(scene, 'tile.darkgrass', 0x4f8a3a, (g) => {
    g.fillStyle(0x3e7a2e, 0.6);
    for (let i = 0; i < 8; i++) g.fillRect(16 + ((i * 13) % 32), 8 + ((i * 7) % 16), 2, 2);
  });
  diamondTile(scene, 'tile.dirt', 0xa88a5e, (g) => {
    g.fillStyle(0x8a6e48, 0.6);
    for (let i = 0; i < 8; i++) g.fillRect(16 + ((i * 11) % 32), 8 + ((i * 5) % 16), 2, 1);
  });
  // Caras laterales para casillas elevadas (se tiñen según el terreno).
  prop(scene, 'tile.side', 64, 32, (g) => {
    poly(g, [0, 0, 32, 16, 32, 32, 0, 16], 0xc8c8c8);
    poly(g, [64, 0, 32, 16, 32, 32, 64, 16], 0x9a9a9a);
  });
  prop(scene, 'deco.tallgrass', 40, 20, (g) => {
    g.fillStyle(0x3e7a2e, 1);
    for (let i = 0; i < 7; i++) poly(g, [4 + i * 5, 20, 6 + i * 5, 4 + (i % 3) * 3, 8 + i * 5, 20], i % 2 ? 0x5a9a3a : 0x3e7a2e);
  });
  prop(scene, 'prop.rock', 48, 36, (g) => {
    g.fillStyle(0x7d7468, 1).fillEllipse(24, 24, 40, 22);
    g.fillStyle(0x9a948a, 1).fillEllipse(20, 18, 26, 14);
    g.fillStyle(0xb8b2a6, 1).fillEllipse(16, 14, 10, 6);
  });
  prop(scene, 'prop.vein', 48, 36, (g) => {
    g.fillStyle(0x6e6a62, 1).fillEllipse(24, 24, 40, 22);
    g.fillStyle(0x8a857c, 1).fillEllipse(22, 18, 28, 14);
  });
  prop(scene, 'fx.ore', 24, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    [[3, 8], [9, 4], [15, 9], [19, 3], [11, 12]].forEach(([x, y]) => poly(g, [x, y - 3, x + 2, y, x, y + 3, x - 2, y], 0xffffff));
  });
  prop(scene, 'prop.tent', 64, 56, (g) => {
    poly(g, [4, 50, 32, 6, 60, 50], 0x8a6a3a);
    poly(g, [32, 6, 60, 50, 40, 50], 0x6a4a2a);
    poly(g, [26, 50, 32, 30, 38, 50], 0x2a1a14);
    px(g, 31, 0, 2, 8, 0x3a2418); poly(g, [33, 0, 44, 3, 33, 6], 0xc0392b);
  });
  prop(scene, 'prop.palisade', 48, 48, (g) => {
    for (let i = 0; i < 5; i++) {
      px(g, 4 + i * 8, 10, 6, 36, i % 2 ? 0x7a4e26 : 0x8b5a2b);
      poly(g, [4 + i * 8, 10, 7 + i * 8, 2, 10 + i * 8, 10], 0x6b4220);
    }
  });
  prop(scene, 'prop.sign', 32, 44, (g) => {
    px(g, 14, 14, 4, 30, 0x6b4220); px(g, 2, 8, 28, 12, 0x8b5a2b); px(g, 4, 12, 20, 2, 0x3a2418);
  });
  prop(scene, 'prop.stump', 40, 28, (g) => block(g, 20, 22, 22, 8, 0x8b5a2b));
  prop(scene, 'prop.herbs', 40, 28, (g) => {
    g.fillStyle(0x3e7a3a, 1); g.fillEllipse(20, 20, 34, 14);
    g.fillStyle(0x5aa04a, 1); g.fillEllipse(14, 16, 14, 10); g.fillEllipse(27, 15, 14, 10);
    px(g, 10, 10, 3, 3, 0xe8e070); px(g, 22, 8, 3, 3, 0xd77ab0); px(g, 29, 12, 3, 3, 0xffffff);
  });
  prop(scene, 'prop.gemrock', 48, 40, (g) => {
    g.fillStyle(0x7d7a74, 1); g.fillEllipse(24, 30, 42, 18);
    poly(g, [14, 30, 18, 10, 23, 30], 0x9ad8ff); poly(g, [22, 30, 28, 4, 33, 30], 0xd77ab0); poly(g, [31, 30, 35, 16, 39, 30], 0x7ce0a0);
  });

  // ── Marcadores ──
  prop(scene, 'fx.arrow', 16, 14, (g) => poly(g, [0, 0, 16, 0, 8, 12], 0xffd04d));
  prop(scene, 'fx.ring', 64, 34, (g) => {
    g.lineStyle(3, 0xffffff, 1);
    g.strokePoints([
      { x: 2, y: 17 }, { x: 32, y: 2 }, { x: 62, y: 17 }, { x: 32, y: 32 },
    ] as Phaser.Math.Vector2[], true);
  });
  prop(scene, 'fx.crown', 18, 12, (g) => poly(g, [0, 12, 0, 2, 5, 7, 9, 0, 13, 7, 18, 2, 18, 12], 0xffd04d));
}
