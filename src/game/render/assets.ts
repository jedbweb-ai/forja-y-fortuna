import type Phaser from 'phaser';
import { LEVEL_H, TILE_H, TILE_W } from './iso';

// Arte definitivo. Cada PNG de src/assets/arte/ (en cualquier subcarpeta) se carga con su nombre como clave:
// "monstruos/mon.lobo.png" reemplaza al placeholder "mon.lobo". Lo que no tiene imagen sigue con el placeholder.
// Ver docs/GUIA_DE_ARTE.md (medidas, escala 2x y nombres).

const FILES = import.meta.glob('/src/assets/arte/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Clave → URL de cada imagen de arte que existe. */
export const ART: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.split('/').pop()!.replace(/\.png$/, ''), url]),
);

/**
 * Los placeholders de escenario, terreno y mapa están dibujados en píxeles de pantalla; el arte se dibuja a la mitad
 * (escala 2x), así que al cargarlo se agranda al doble. Personajes y monstruos se agrandan en la escena.
 */
const UPSCALED = ['prop.', 'deco.', 'build.', 'world.', 'fx.', 'cart'];
const isUpscaled = (key: string) => UPSCALED.some((p) => key.startsWith(p));
const SRC = '@src';

const real = new Set<string>();

/** ¿Esta clave usa arte definitivo (y no un placeholder)? */
export function isRealArt(key: string): boolean {
  return real.has(key);
}

/** Personajes, monstruos y animales: con arte definitivo el tamaño ya viene en el dibujo y siempre se muestran a 2x. */
const FIGURES = ['char.', 'mon.', 'animal.'];

/**
 * Escala para mostrar un sprite. `scale` es la que usa la escena con el placeholder.
 * Con arte definitivo: las figuras van a 2x y el escenario se redondea a un múltiplo entero, para que los píxeles queden parejos.
 */
export function artScale(key: string, scale: number): number {
  if (!real.has(key)) return scale;
  if (FIGURES.some((p) => key.startsWith(p))) return 2;
  const k = isUpscaled(key) ? 2 : 1;
  return Math.max(1, Math.round(scale * k)) / k;
}

/**
 * Cómo se dibuja un monstruo. Si tiene arte propio (mon.<id>, por ejemplo un jefe), se usa tal cual, sin tinte.
 * Si comparte dibujo (mon.ogro para ogro, troll y Madre Ciénaga), se tiñe y se agranda según sus datos.
 */
export function monsterLook(sprite: { key: string; tint?: number; scale?: number }, monsterId: string | undefined, placeholderScale: number) {
  const own = monsterId ? `mon.${monsterId}` : '';
  if (own && real.has(own)) return { key: own, scale: 2, tint: undefined };
  const mult = sprite.scale ?? 1;
  if (real.has(sprite.key)) return { key: sprite.key, scale: Math.max(2, Math.round(2 * mult)), tint: sprite.tint };
  return { key: sprite.key, scale: placeholderScale * mult, tint: sprite.tint };
}

/** Animación de caminar para las figuras con arte propio que no tienen placeholder (por ejemplo mon.<jefe>). */
export function ensureWalkAnims(scene: Phaser.Scene) {
  for (const key of real) {
    if (!/^(mon|char|animal)\./.test(key) || key.endsWith('_b') || scene.anims.exists(`${key}.walk`)) continue;
    const second = real.has(`${key}_b`) ? `${key}_b` : key;
    scene.anims.create({ key: `${key}.walk`, frames: [{ key }, { key: second }], frameRate: 5, repeat: -1 });
  }
}

/** En el preload de BootScene: pide todas las imágenes. */
export function loadArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(ART)) scene.load.image(isUpscaled(key) || key.startsWith('tex.') ? key + SRC : key, url);
}

/** Agranda al doble sin suavizar (para que siga siendo pixel art). */
function upscale(scene: Phaser.Scene, key: string) {
  const src = scene.textures.get(key + SRC).getSourceImage() as HTMLImageElement;
  const canvas = scene.textures.createCanvas(key, src.width * 2, src.height * 2)!;
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, src.width * 2, src.height * 2);
  canvas.refresh();
}

/** Lee una textura cuadrada como lista de píxeles (para proyectarla sobre el rombo). */
function pixels(scene: Phaser.Scene, key: string) {
  const img = scene.textures.get(key + SRC).getSourceImage() as HTMLImageElement;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
}

type Px = ReturnType<typeof pixels>;
const sample = (t: Px, u: number, v: number, dark = 1): [number, number, number] => {
  const x = ((Math.floor(u) % t.w) + t.w) % t.w;
  const y = ((Math.floor(v) % t.h) + t.h) % t.h;
  const i = (y * t.w + x) * 4;
  return [t.data[i] * dark, t.data[i + 1] * dark, t.data[i + 2] * dark];
};

/**
 * Casilla isométrica a partir de una textura cuadrada: la tapa es el cuadrado girado y aplastado (rombo 2:1)
 * y abajo queda un borde oscuro de 2 píxeles, igual que los placeholders (64×34).
 */
function diamondFromTexture(scene: Phaser.Scene, key: string, tex: Px) {
  const w = TILE_W / 2;
  const h = TILE_H / 2;
  const canvas = scene.textures.createCanvas(key, TILE_W, TILE_H + 2)!;
  const ctx = canvas.getContext();
  const img = ctx.createImageData(TILE_W, TILE_H + 2);
  const put = (x: number, y: number, rgb: [number, number, number]) => {
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const i = ((y * 2 + dy) * TILE_W + x * 2 + dx) * 4;
      img.data.set([rgb[0], rgb[1], rgb[2], 255], i);
    }
  };
  // Se recorre el rombo en píxeles de arte (32×16) y se busca qué punto del cuadrado le corresponde.
  for (let y = 0; y < h + 1; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const inside = Math.abs(dx) + Math.abs(dy) <= 1;
      const rim = !inside && Math.abs(dx) + Math.abs(dy - 2 / h) <= 1 && y >= h / 2;
      if (!inside && !rim) continue;
      const u = ((dx + dy + 1) / 2) * tex.w;
      const v = ((dy - dx + 1) / 2) * tex.h;
      put(x, y, sample(tex, u, v, rim ? 0.62 : 1));
    }
  }
  ctx.putImageData(img, 0, 0);
  canvas.refresh();
}

/** Franjas de la textura de pared: el escalón de arriba usa la primera, los de abajo bajan por la textura. */
export const SIDE_BANDS = 4;

/**
 * Cara lateral de un escalón (las dos caras visibles, 64×16) a partir de una franja de una textura cuadrada:
 * la franja 0 es la de arriba (pasto que asoma), las siguientes bajan hacia la tierra y la roca.
 * Si se pasa la textura de la tapa, la primera fila de la franja 0 es de ese color: el borde que sobresale.
 */
function sideFromTexture(scene: Phaser.Scene, key: string, tex: Px, lip: Px | undefined, band: number) {
  const w = TILE_W / 2;
  const lh = LEVEL_H / 2;
  const canvas = scene.textures.createCanvas(key, TILE_W, LEVEL_H + TILE_H / 2)!;
  const ctx = canvas.getContext();
  const img = ctx.createImageData(TILE_W, LEVEL_H + TILE_H / 2);
  const put = (x: number, y: number, rgb: [number, number, number]) => {
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const i = ((y * 2 + dy) * TILE_W + x * 2 + dx) * 4;
      img.data.set([rgb[0], rgb[1], rgb[2], 255], i);
    }
  };
  for (let x = 0; x < w; x++) {
    const left = x < w / 2;
    // Las caras siguen el borde inferior del rombo: bajan hasta el centro y vuelven a subir.
    const top = Math.floor((left ? x : w - 1 - x) / 2);
    for (let y = 0; y < lh; y++) {
      const fromLip = lip && band === 0 && y === 0;
      // La cara derecha toma otra parte de la textura (a lo ancho) para que no se vean iguales.
      const row = Math.floor(((band * lh + y) * tex.h) / (SIDE_BANDS * lh));
      const rgb = fromLip ? sample(lip, x, 0, 0.85) : sample(tex, x + (left ? 0 : tex.w / 2), row, left ? 0.8 : 0.62);
      put(x, top + y, rgb);
    }
  }
  ctx.putImageData(img, 0, 0);
  canvas.refresh();
}

/**
 * En el create de BootScene, antes de los placeholders: arma las texturas que necesitan proceso
 * (agrandar al doble, casillas desde texturas cuadradas) y anota qué claves tienen arte real.
 */
export function prepareArt(scene: Phaser.Scene) {
  for (const key of Object.keys(ART)) {
    if (key.startsWith('tex.')) continue;
    if (isUpscaled(key)) upscale(scene, key);
    real.add(key);
  }
  // tex.<suelo>.png → tile.<suelo> (tapa); tex.<suelo>.lado.png → tile.<suelo>.side, .side.1… (franjas de la pared).
  for (const key of Object.keys(ART).filter((k) => k.startsWith('tex.') && !k.endsWith('.lado'))) {
    const name = key.slice(4);
    const top = pixels(scene, key);
    diamondFromTexture(scene, `tile.${name}`, top);
    real.add(`tile.${name}`);
    const sideKey = ART[`${key}.lado`] ? `${key}.lado` : SIDE_OF[name] && ART[`tex.${SIDE_OF[name]}.lado`] ? `tex.${SIDE_OF[name]}.lado` : null;
    if (!sideKey) continue;
    const side = pixels(scene, sideKey);
    for (let band = 0; band < SIDE_BANDS; band++) {
      const k = band ? `tile.${name}.side.${band}` : `tile.${name}.side`;
      sideFromTexture(scene, k, side, top, band);
      real.add(k);
    }
  }
}

/** Suelos sin pared propia usan la de uno parecido. */
const SIDE_OF: Record<string, string> = { darkgrass: 'grass', road: 'dirt', lava: 'ash', wood: 'dirt', wood_dark: 'dirt' };
