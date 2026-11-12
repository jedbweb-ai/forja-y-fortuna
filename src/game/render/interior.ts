import Phaser from 'phaser';
import type { LiveSceneDef, LocationKind } from '../../core/types';
import { artPixels } from './assets';
import { isoToScreen, TILE_H } from './iso';

// Paredes de los interiores: las dos del fondo, con textura, viga arriba, zócalo abajo y cosas colgadas
// (ventanas, herramientas, estantes, antorchas...) según el lugar. Se arman como imágenes inclinadas para seguir
// la perspectiva isométrica; lo colgado se dibuja de frente y acá se inclina con la pared.

/** Alto de las paredes, en píxeles de pantalla. */
export const WALL_H = 100;

/** Lugares al aire libre: no llevan paredes. */
const OUTDOOR: LocationKind[] = ['mercado', 'tablon', 'esclavos', 'muelle'];

/** Qué se cuelga en cada tipo de interior, en orden (se reparte entre las dos paredes). */
const DECOR: Partial<Record<LocationKind, string[]>> = {
  herreria: ['ventana', 'herramientas', 'escudos', 'antorcha', 'herramientas', 'ventana'],
  taberna: ['ventana', 'cornamenta', 'antorcha', 'estante', 'tapiz', 'ventana'],
  alquimista: ['hierbas', 'estante', 'ventana', 'hierbas', 'antorcha'],
  libreria: ['cuadro', 'ventana', 'mapa', 'antorcha'],
  curtidor: ['ventana', 'herramientas', 'antorcha', 'tapiz'],
  maderero: ['ventana', 'herramientas', 'antorcha', 'ventana'],
  joyero: ['ventana', 'cuadro', 'antorcha', 'estante'],
  gremio: ['mapa', 'escudos', 'tapiz', 'ventana', 'antorcha'],
  subastas: ['tapiz', 'cuadro', 'antorcha', 'cuadro', 'tapiz'],
  posada: ['ventana', 'cuadro', 'antorcha', 'ventana'],
};
const DEFAULT_DECOR = ['ventana', 'antorcha', 'cuadro'];

export const isIndoor = (kind: LocationKind) => !OUTDOOR.includes(kind);

/** Textura de la pared según el piso: madera clara, madera oscura o piedra. */
function wallStyle(floor: string): { tex: string; color: number } {
  if (floor === 'tile.wood_dark') return { tex: 'tex.muro.oscuro', color: 0x5a3f33 };
  if (floor === 'tile.wood') return { tex: 'tex.muro.claro', color: 0x8a6a52 };
  return { tex: 'tex.stone.lado', color: 0x8a8a92 };
}

type Rgb = [number, number, number];
const rgb = (n: number): Rgb => [(n >> 16) & 255, (n >> 8) & 255, n & 255];

export interface InteriorLights {
  windows: { x: number; y: number; side: 'right' | 'left' }[];
  torches: { x: number; y: number }[];
}

/** Dibuja las dos paredes del fondo y lo que tienen colgado. Devuelve dónde quedaron ventanas y antorchas. */
export function drawInteriorWalls(scene: Phaser.Scene, def: LiveSceneDef, kind: LocationKind): InteriorLights {
  const lights: InteriorLights = { windows: [], torches: [] };
  const lastRow = def.roadRow !== undefined ? def.roadRow - 1 : def.rows - 1;
  const a = isoToScreen(0, 0);
  const corner = { x: a.x, y: a.y - TILE_H / 2 };
  const style = wallStyle(def.floor);
  const tex = artPixels(scene, style.tex);
  const decor = (DECOR[kind] ?? DEFAULT_DECOR).map((name) => ({ name, px: artPixels(scene, `deco.${name}`) }));

  // Todo en píxeles de arte (la mitad) y la imagen se muestra al doble.
  const H = WALL_H / 2;
  for (const side of ['right', 'left'] as const) {
    const W = (side === 'right' ? def.cols : lastRow + 1) * 16;
    const key = `wall.${kind}.${def.floor}.${side}.${W}`;
    const top = (x: number) => (side === 'right' ? Math.floor(x / 2) : Math.floor((W - 1 - x) / 2));
    const items = decor.filter((_, i) => (side === 'right' ? i % 2 === 0 : i % 2 === 1));
    const slots = items.map((it, i) => {
      const w = it.px?.w ?? 0, h = it.px?.h ?? 0;
      const cx = Math.round(((i + 1) * W) / (items.length + 1) - w / 2);
      const ry = it.name === 'ventana' ? 7 : Math.max(4, Math.round(H * 0.42 - h / 2));
      return { ...it, cx, ry, w, h };
    });
    if (!scene.textures.exists(key)) {
      const canvas = scene.textures.createCanvas(key, W, H + Math.ceil(W / 2) + 1)!;
      const ctx = canvas.getContext();
      const img = ctx.createImageData(canvas.width, canvas.height);
      const shade = side === 'right' ? 1 : 0.8;
      const put = (x: number, y: number, c: Rgb, k = shade) => {
        const i = (y * canvas.width + x) * 4;
        img.data[i] = c[0] * k; img.data[i + 1] = c[1] * k; img.data[i + 2] = c[2] * k; img.data[i + 3] = 255;
      };
      const base = rgb(style.color);
      for (let x = 0; x < W; x++) {
        const t = top(x);
        for (let y = 0; y < H; y++) {
          let c: Rgb = base;
          if (tex) {
            const i = (((y % tex.h) * tex.w + ((x + (side === 'left' ? 11 : 0)) % tex.w)) * 4);
            c = [tex.data[i], tex.data[i + 1], tex.data[i + 2]];
          } else if ((x + y) % 7 === 0) c = rgb(style.color - 0x0a0a0a);
          // Viga arriba y zócalo abajo, de madera oscura.
          if (y < 3) c = y === 2 ? rgb(0x3a2a2e) : rgb(0x6b4220);
          if (y >= H - 3) c = y === H - 3 ? rgb(0x8a5a32) : rgb(0x3a2a2e);
          put(x, t + y, c);
        }
      }
      // Poste en la esquina
      for (let y = 0; y < H; y++) for (const x of side === 'right' ? [0, 1] : [W - 2, W - 1]) put(x, top(x) + y, rgb(y % 6 ? 0x6b4220 : 0x4a3a30));
      // Lo colgado, de frente, inclinado con la pared (en la izquierda, espejado).
      for (const s of slots) {
        if (!s.px) continue;
        for (let i = 0; i < s.w; i++) {
          const x = s.cx + i;
          if (x < 0 || x >= W) continue;
          const sx = side === 'right' ? i : s.w - 1 - i;
          for (let j = 0; j < s.h; j++) {
            const k = (j * s.px.w + sx) * 4;
            if (s.px.data[k + 3] < 128) continue;
            put(x, top(x) + s.ry + j, [s.px.data[k], s.px.data[k + 1], s.px.data[k + 2]]);
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      canvas.refresh();
    }
    const left = side === 'right' ? corner.x : corner.x - W * 2;
    scene.add.image(left, corner.y - WALL_H, key).setOrigin(0, 0).setScale(2).setDepth(-20000);
    // Dónde quedó cada ventana y antorcha, en coordenadas de la escena.
    for (const s of slots) {
      if (!s.px || (s.name !== 'ventana' && s.name !== 'antorcha')) continue;
      const mid = s.cx + s.w / 2;
      const p = { x: left + mid * 2, y: corner.y - WALL_H + (top(mid) + s.ry + s.h / 2) * 2 };
      if (s.name === 'ventana') lights.windows.push({ ...p, side });
      else lights.torches.push(p);
    }
  }
  return lights;
}

/** Haz de luz que entra por una ventana y cae sobre el piso (de día). */
export function drawWindowLight(scene: Phaser.Scene, w: { x: number; y: number; side: 'right' | 'left' }, alpha: number) {
  const d = w.side === 'right' ? -1 : 1; // la luz entra hacia adentro de la habitación
  const g = scene.add.graphics().setDepth(-9500).setBlendMode(Phaser.BlendModes.ADD);
  g.fillStyle(0xfff0c0, alpha);
  g.fillPoints([
    new Phaser.Math.Vector2(w.x - 12, w.y - 10), new Phaser.Math.Vector2(w.x + 12, w.y + 2),
    new Phaser.Math.Vector2(w.x + 12 + d * 60, w.y + 120), new Phaser.Math.Vector2(w.x - 12 + d * 70, w.y + 104),
  ], true);
  scene.tweens.add({ targets: g, alpha: 0.75, yoyo: true, repeat: -1, duration: 2600, ease: 'Sine.inOut' });
}
