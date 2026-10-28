import Phaser from 'phaser';
import type { Content } from '../../core/content';
import { generateWorldPlaceholders } from './worldPlaceholders';

// Gráficos placeholder generados por código. Cada textura se registra con una clave
// estable ("char.herrero", "prop.anvil"...). Para pasar a sprites reales alcanza con
// cargar imágenes con las mismas claves en BootScene: la lógica y las escenas no cambian.

export type G = Phaser.GameObjects.Graphics;

export interface CharLook {
  skin: number;
  hair: number;
  body: number;
  accent: number;
  helmet?: boolean;
  apron?: boolean;
}

export const AMBIENT_VARIANTS = 10;
export const GUARD_VARIANTS = 3;

const SKINS = [0xf6d2b0, 0xe8b48a, 0xc98f5e, 0x9a6440, 0xf3c6a5];
const HAIRS = [0x2b1d14, 0x6b3a1e, 0xd8a03a, 0xb03a2e, 0x3d4a8a, 0xe8e2d0, 0x1e1e1e, 0x8a4fb0];
const CLOTHES = [0x3d6e8f, 0x8f3d4e, 0x4f8a3d, 0xc28a2e, 0x6d4f9a, 0x2e7a72, 0xa6573a, 0x5a5f6b];

export function poly(g: G, pts: number[], color: number, alpha = 1) {
  const v: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < pts.length; i += 2) v.push(new Phaser.Math.Vector2(pts[i], pts[i + 1]));
  g.fillStyle(color, alpha);
  g.fillPoints(v, true);
}

export function shade(color: number, f: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 255) * f));
  const gr = Math.min(255, Math.round(((color >> 8) & 255) * f));
  const b = Math.min(255, Math.round((color & 255) * f));
  return (r << 16) | (gr << 8) | b;
}

export function px(g: G, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x, y, w, h);
}

/** Personaje chibi de 16×24 (cabeza grande, ojos grandes). `step` alterna las piernas. */
function drawChar(g: G, look: CharLook, step: boolean) {
  const outline = 0x1a1220;
  // Piernas
  const leg = shade(look.body, 0.55);
  if (step) { px(g, 4, 19, 3, 5, leg); px(g, 9, 18, 3, 5, leg); }
  else { px(g, 5, 19, 3, 5, leg); px(g, 8, 19, 3, 5, leg); }
  // Cuerpo
  px(g, 3, 12, 10, 8, outline);
  px(g, 4, 12, 8, 7, look.body);
  if (look.apron) px(g, 5, 14, 6, 6, 0x6b4a2f);
  px(g, 4, 16, 8, 1, look.accent);
  // Brazos
  px(g, 2, 13, 2, 5, look.skin);
  px(g, 12, 13, 2, 5, look.skin);
  // Cabeza
  px(g, 2, 1, 12, 12, outline);
  px(g, 3, 2, 10, 10, look.skin);
  // Pelo / casco
  if (look.helmet) {
    px(g, 2, 0, 12, 5, 0x9aa3ad);
    px(g, 2, 4, 12, 1, 0x6d757e);
    px(g, 7, 0, 2, 2, look.accent);
  } else {
    px(g, 2, 1, 12, 4, look.hair);
    px(g, 2, 4, 2, 5, look.hair);
    px(g, 12, 4, 2, 4, look.hair);
    px(g, 5, 0, 2, 2, look.hair);
    px(g, 9, 0, 3, 2, look.hair);
  }
  // Ojos grandes estilo anime
  px(g, 5, 7, 2, 3, 0x22223a);
  px(g, 9, 7, 2, 3, 0x22223a);
  px(g, 5, 7, 1, 1, 0xffffff);
  px(g, 9, 7, 1, 1, 0xffffff);
  // Mejillas
  px(g, 4, 10, 1, 1, 0xf28b8b);
  px(g, 11, 10, 1, 1, 0xf28b8b);
}

function charTextures(scene: Phaser.Scene, key: string, look: CharLook) {
  for (const step of [false, true]) {
    const g = scene.make.graphics({}, false);
    drawChar(g, look, step);
    g.generateTexture(step ? `${key}_b` : key, 16, 24);
    g.destroy();
  }
  scene.anims.create({ key: `${key}.walk`, frames: [{ key }, { key: `${key}_b` }], frameRate: 6, repeat: -1 });
}


function tile(scene: Phaser.Scene, key: string, base: number, detail: (g: G, v: number) => void) {
  for (let v = 0; v < 2; v++) {
    const g = scene.make.graphics({}, false);
    poly(g, [0, 16, 32, 0, 64, 16, 32, 32], base);
    poly(g, [0, 16, 32, 32, 64, 16, 64, 17, 32, 33, 0, 17], shade(base, 0.7));
    detail(g, v);
    g.generateTexture(v ? `${key}.1` : key, 64, 34);
    g.destroy();
  }
}

/** Bloque isométrico: base centrada en (cx, by), ancho w, alto de cara `hgt`. */
export function block(g: G, cx: number, by: number, w: number, hgt: number, color: number) {
  const h = w / 2;
  poly(g, [cx - w / 2, by - hgt, cx, by - hgt + h / 2, cx, by + h / 2, cx - w / 2, by], shade(color, 0.8));
  poly(g, [cx + w / 2, by - hgt, cx, by - hgt + h / 2, cx, by + h / 2, cx + w / 2, by], shade(color, 0.62));
  poly(g, [cx - w / 2, by - hgt, cx, by - hgt - h / 2, cx + w / 2, by - hgt, cx, by - hgt + h / 2], color);
}

export function prop(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void) {
  const g = scene.make.graphics({}, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function generatePlaceholders(scene: Phaser.Scene, content: Content) {
  // ── Personajes ──
  charTextures(scene, 'char.herrero', { skin: 0xf2c9a0, hair: 0x3a2418, body: 0x8a5a3a, accent: 0xc0392b, apron: true });
  for (const npc of Object.values(content.npcs)) {
    charTextures(scene, `char.npc.${npc.id}`, { skin: SKINS[npc.id.length % SKINS.length], hair: npc.look.hair, body: npc.look.body, accent: npc.look.accent });
  }
  for (let i = 0; i < AMBIENT_VARIANTS; i++) {
    charTextures(scene, `char.amb.${i}`, {
      skin: SKINS[(i * 3) % SKINS.length], hair: HAIRS[(i * 5) % HAIRS.length],
      body: CLOTHES[i % CLOTHES.length], accent: CLOTHES[(i + 3) % CLOTHES.length],
    });
  }
  for (let i = 0; i < GUARD_VARIANTS; i++) {
    charTextures(scene, `char.guard.${i}`, { skin: SKINS[i], hair: 0x2b1d14, body: 0x6d7a8a, accent: 0xb03a2e, helmet: true });
  }

  // ── Animales (2 cuadros) ──
  const animal = (key: string, w: number, h: number, draw: (g: G, step: boolean) => void) => {
    for (const step of [false, true]) prop(scene, step ? `${key}_b` : key, w, h, (g) => draw(g, step));
    scene.anims.create({ key: `${key}.walk`, frames: [{ key }, { key: `${key}_b` }], frameRate: 8, repeat: -1 });
  };
  animal('animal.gallina', 12, 12, (g, s) => {
    px(g, 2, 3, 8, 6, 0xf4f1ea); px(g, 7, 1, 4, 4, 0xf4f1ea); px(g, 8, 0, 2, 1, 0xd33a2c);
    px(g, 11, 3, 1, 1, 0xf2b33d); px(g, 9, 2, 1, 1, 0x1a1220);
    px(g, s ? 3 : 4, 9, 1, 3, 0xf2b33d); px(g, s ? 7 : 6, 9, 1, 3, 0xf2b33d);
  });
  animal('animal.gato', 16, 10, (g, s) => {
    px(g, 2, 3, 10, 4, 0x6b6b6b); px(g, 11, 1, 4, 4, 0x6b6b6b); px(g, 11, 0, 1, 1, 0x6b6b6b); px(g, 14, 0, 1, 1, 0x6b6b6b);
    px(g, 0, 1, 2, 3, 0x6b6b6b); px(g, 12, 2, 1, 1, 0xd9e85a);
    px(g, s ? 3 : 4, 7, 1, 3, 0x555555); px(g, s ? 10 : 9, 7, 1, 3, 0x555555);
  });
  animal('animal.perro', 18, 12, (g, s) => {
    px(g, 2, 3, 11, 5, 0xa6733f); px(g, 12, 1, 5, 5, 0xa6733f); px(g, 12, 0, 2, 3, 0x6b4a2f);
    px(g, 16, 3, 2, 2, 0x1a1220); px(g, 0, 2, 2, 2, 0xa6733f); px(g, 14, 2, 1, 1, 0x1a1220);
    px(g, s ? 3 : 4, 8, 2, 4, 0x8a5a2f); px(g, s ? 10 : 9, 8, 2, 4, 0x8a5a2f);
  });

  // ── Carreta con caballo ──
  prop(scene, 'cart', 64, 40, (g) => {
    px(g, 2, 10, 30, 14, 0x8b5a2b); px(g, 2, 8, 30, 3, 0x6b4220); px(g, 4, 4, 26, 5, 0xe8dfc8);
    g.fillStyle(0x3a2a1a, 1); g.fillCircle(8, 28, 6); g.fillCircle(26, 28, 6);
    g.fillStyle(0x8b7a5a, 1); g.fillCircle(8, 28, 2); g.fillCircle(26, 28, 2);
    px(g, 32, 18, 6, 2, 0x6b4220);
    px(g, 38, 12, 18, 10, 0x8a5a3a); px(g, 52, 4, 8, 10, 0x8a5a3a); px(g, 56, 2, 3, 3, 0x4a2a1a);
    px(g, 58, 7, 1, 1, 0x1a1220); px(g, 40, 22, 3, 12, 0x6b4220); px(g, 52, 22, 3, 12, 0x6b4220);
    px(g, 36, 12, 3, 8, 0x3a2418);
  });

  // ── Tiles ──
  const noise = (color: number) => (g: G, v: number) => {
    g.fillStyle(color, 0.35);
    for (let i = 0; i < 10; i++) g.fillRect(14 + ((i * 17 + v * 23) % 36), 8 + ((i * 7 + v * 11) % 16), 2, 1);
  };
  tile(scene, 'tile.wood', 0xa8784a, (g, v) => {
    g.lineStyle(1, 0x7a5432, 0.6);
    for (let i = 1; i < 4; i++) g.lineBetween(i * 16, 8 + i * 0 - (i - 2) * 0, i * 16 + 16 - (v ? 2 : 0), 16 + i * 4);
  });
  tile(scene, 'tile.wood_dark', 0x6e4a30, noise(0x4a2e1a));
  tile(scene, 'tile.stone', 0x9a948a, (g, v) => {
    g.lineStyle(1, 0x6e6a62, 0.7);
    g.lineBetween(16, 8, 48, 24); g.lineBetween(16 + v * 8, 24, 48, 8);
  });
  tile(scene, 'tile.road', 0x8a7458, noise(0x5e4e3a));
  tile(scene, 'tile.grass', 0x6aa84f, noise(0x4e8a3a));

  // ── Props ──
  prop(scene, 'prop.forge', 64, 72, (g) => {
    block(g, 32, 56, 60, 34, 0x6e6a62);
    px(g, 20, 34, 16, 12, 0x2a1a14); px(g, 22, 38, 12, 8, 0xff7a2d); px(g, 25, 40, 6, 5, 0xffd04d);
    px(g, 40, 4, 10, 22, 0x5a564f); px(g, 40, 2, 10, 3, 0x3e3b36);
  });
  prop(scene, 'prop.anvil', 48, 40, (g) => {
    px(g, 18, 22, 12, 14, 0x5a3a24);
    px(g, 8, 12, 30, 8, 0x3d4148); px(g, 36, 13, 8, 4, 0x3d4148); px(g, 14, 20, 18, 4, 0x2b2e33);
    px(g, 8, 12, 30, 2, 0x6d737d);
  });
  prop(scene, 'prop.barrel', 32, 40, (g) => {
    px(g, 6, 8, 20, 28, 0x8b5a2b); px(g, 6, 12, 20, 2, 0x4a3a2a); px(g, 6, 28, 20, 2, 0x4a3a2a);
    g.fillStyle(0xa8784a, 1); g.fillEllipse(16, 8, 20, 8);
  });
  prop(scene, 'prop.crate', 48, 44, (g) => block(g, 24, 34, 40, 20, 0xb08a52));
  prop(scene, 'prop.table', 64, 44, (g) => block(g, 32, 34, 52, 12, 0x8b5a2b));
  prop(scene, 'prop.bench', 64, 36, (g) => block(g, 32, 28, 48, 6, 0x7a4e26));
  prop(scene, 'prop.counter', 64, 52, (g) => { block(g, 32, 40, 60, 22, 0x7a4e26); px(g, 22, 10, 6, 6, 0xc3ccd6); });
  prop(scene, 'prop.bar', 64, 56, (g) => { block(g, 32, 44, 62, 26, 0x5e3a1e); px(g, 20, 8, 4, 8, 0xd9a441); px(g, 34, 6, 4, 10, 0x7ccf6a); });
  prop(scene, 'prop.chest', 48, 40, (g) => { block(g, 24, 30, 36, 16, 0x8b5a2b); px(g, 21, 16, 6, 5, 0xd9a441); });
  prop(scene, 'prop.rack', 48, 64, (g) => {
    px(g, 6, 10, 4, 50, 0x6b4220); px(g, 38, 10, 4, 50, 0x6b4220); px(g, 6, 14, 36, 3, 0x6b4220);
    for (let i = 0; i < 4; i++) { px(g, 13 + i * 7, 16, 3, 34, 0xc3ccd6); px(g, 12 + i * 7, 40, 5, 2, 0x8b5a2b); }
  });
  prop(scene, 'prop.lamp', 24, 72, (g) => {
    px(g, 10, 20, 4, 50, 0x2b2e33); px(g, 6, 10, 12, 12, 0x2b2e33); px(g, 8, 12, 8, 8, 0xffd27a);
  });
  prop(scene, 'prop.fireplace', 64, 72, (g) => {
    block(g, 32, 58, 60, 40, 0x7d6e62); px(g, 20, 34, 24, 18, 0x2a1a14); px(g, 24, 40, 16, 12, 0xff7a2d); px(g, 28, 44, 8, 7, 0xffd04d);
  });
  prop(scene, 'prop.well', 64, 64, (g) => {
    g.fillStyle(0x6e6a62, 1); g.fillEllipse(32, 48, 44, 22); g.fillStyle(0x2a3a4a, 1); g.fillEllipse(32, 46, 32, 14);
    px(g, 12, 14, 4, 32, 0x6b4220); px(g, 48, 14, 4, 32, 0x6b4220);
    poly(g, [6, 16, 32, 2, 58, 16, 32, 22], 0xa6573a);
  });
  prop(scene, 'prop.tree', 64, 96, (g) => {
    px(g, 28, 56, 8, 36, 0x6b4220);
    g.fillStyle(0x3e7a3a, 1); g.fillCircle(32, 40, 24); g.fillCircle(18, 50, 14); g.fillCircle(46, 50, 14);
    g.fillStyle(0x5a9a4a, 1); g.fillCircle(26, 32, 10); g.fillCircle(40, 38, 8);
  });
  const stall = (key: string, color: number) => prop(scene, key, 64, 72, (g) => {
    block(g, 32, 60, 56, 18, 0x8b5a2b);
    px(g, 8, 14, 3, 32, 0x6b4220); px(g, 53, 14, 3, 32, 0x6b4220);
    for (let i = 0; i < 6; i++) poly(g, [4 + i * 9.5, 18, 8 + i * 9.5, 4, 13 + i * 9.5, 4, 9 + i * 9.5, 18], i % 2 ? 0xf4f1ea : color);
    px(g, 16, 30, 6, 6, 0xc87533); px(g, 26, 31, 8, 5, 0x8a8f98); px(g, 38, 30, 6, 6, 0x7ccf6a);
  });
  stall('prop.stall_red', 0xc0392b);
  stall('prop.stall_blue', 0x2e6da4);
  stall('prop.stall_green', 0x3e8a3a);

  // ── Efectos ──
  prop(scene, 'fx.glow', 128, 128, (g) => {
    for (let r = 64; r > 0; r -= 4) { g.fillStyle(0xffc46b, 0.05); g.fillCircle(64, 64, r); }
  });
  prop(scene, 'fx.spark', 4, 4, (g) => px(g, 0, 0, 4, 4, 0xffffff));
  prop(scene, 'fx.shadow', 24, 8, (g) => { g.fillStyle(0x000000, 0.3); g.fillEllipse(12, 4, 22, 7); });
  prop(scene, 'fx.bubble', 20, 16, (g) => {
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 20, 12, 4); poly(g, [6, 11, 10, 11, 6, 16], 0xffffff);
    px(g, 5, 5, 2, 2, 0x444444); px(g, 9, 5, 2, 2, 0x444444); px(g, 13, 5, 2, 2, 0x444444);
  });
  generateWorldPlaceholders(scene);

  prop(scene, 'fx.alert', 12, 18, (g) => {
    g.fillStyle(0xffd04d, 1); g.fillRoundedRect(0, 0, 12, 14, 3); px(g, 5, 2, 2, 7, 0x1a1220); px(g, 5, 10, 2, 2, 0x1a1220);
  });
}

