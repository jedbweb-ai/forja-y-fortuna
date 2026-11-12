import Phaser from 'phaser';

// Ciudad amurallada vista desde el aire: el campo afuera, la muralla con portones, calles que salen de la plaza
// hacia cada edificio y cientos de casitas entre ellos. Hay tres tipos: pueblo de valle (muralla redonda y río),
// puerto (muralla abierta al mar, muelles, barcos y faro) y fortaleza (muralla en estrella con foso).
// Se dibuja una vez, a media resolución, y se muestra al doble para que tenga el mismo pixel que el resto del arte.

type Pt = { x: number; y: number };
export type TownKind = 'valle' | 'puerto' | 'fortaleza';

export interface TownSpec {
  /** Clave de la textura: se dibuja una sola vez y se reutiliza (por ejemplo al cambiar la franja del día). */
  key: string;
  kind: TownKind;
  /** Medida del mapa (los edificios están en estas coordenadas). */
  w: number;
  h: number;
  /** Centro de la plaza, donde nacen las calles. */
  plaza: Pt;
  /** Muralla: centro y radios (elipse; en la fortaleza, las puntas de la estrella). */
  wall: { cx: number; cy: number; rx: number; ry: number };
  /** Portones, en grados (0 = derecha, 90 = abajo). */
  gates: number[];
  /** Recorrido del río, de arriba hacia abajo (se suaviza). */
  river?: Pt[];
  /** Puerto: altura de la costa en el centro de la bahía y en los bordes. */
  shore?: { center: number; edge: number };
  /** Edificios tocables: su caja (la imagen y el nombre debajo) queda libre de casas, y una calle llega a su puerta. */
  buildings: { door: Pt; box: { x0: number; y0: number; x1: number; y1: number } }[];
  seed: number;
}

interface Theme {
  fields: number[];
  furrow: number;
  ground: [number, number];
  roofs: [number, number][];
  walls: [number, number];
  stone: [number, number, number];
  towerRoof: number;
  road: [number, number];
  plaza: [number, number];
  forests: number;
  trees: [number, number, number];
}

const THEMES: Record<TownKind, Theme> = {
  valle: {
    fields: [0x9cbc5a, 0x8aac48, 0xb4c466, 0xc8bc6a, 0x7e9e42, 0xa6b85c, 0xd2c47a], furrow: 0x5e7a34,
    ground: [0x7a8a4a, 0x8a9656],
    roofs: [[0xd0704a, 0xa8482e], [0xc0563b, 0x8a3a2a], [0xe08a5a, 0xb8603a], [0xb8603a, 0x7a3a22], [0xd0704a, 0xa8482e], [0xc0563b, 0x8a3a2a], [0x8a8278, 0x5e5650], [0xa85a3a, 0x6e3422]],
    walls: [0xf0e2c0, 0xc8b088], stone: [0x6e604e, 0xc8bfa8, 0xe8e0c8], towerRoof: 0xa8482e,
    road: [0x9a8468, 0xd8c49a], plaza: [0x9a8468, 0xc8b088], forests: 26, trees: [0x3e6a2e, 0x5a8a38, 0x8aaa48],
  },
  puerto: {
    fields: [0xc8b878, 0xb8a868, 0xa8a060, 0xd2c48a, 0x9aa058, 0xbcb070], furrow: 0x8a7a50,
    ground: [0xc8b088, 0xd8c49a],
    roofs: [[0xe08a5a, 0xb8603a], [0xf08a5a, 0xc8482e], [0xd0704a, 0xa8482e], [0x5a9ad0, 0x2a5a98], [0xe08a5a, 0xb8603a], [0xc0563b, 0x8a3a2a], [0x5a9ad0, 0x2a5a98]],
    walls: [0xf8f4e8, 0xd8d0c0], stone: [0x6e604e, 0xd8d0c0, 0xf0e2c0], towerRoof: 0x2a5a98,
    road: [0x9a8468, 0xe8d8b0], plaza: [0x9a8468, 0xe0d0a8], forests: 10, trees: [0x52582e, 0x7a8044, 0xa8ac68],
  },
  fortaleza: {
    fields: [0xa89868, 0x9a8a5a, 0xb8a878, 0x8a7a5a, 0xa8a070, 0x9a9070], furrow: 0x6e604e,
    ground: [0x8a7a5a, 0x9a8a6a],
    roofs: [[0x5e5e6a, 0x3a3a4a], [0x6e6e7a, 0x4a4a5a], [0x8a5a32, 0x6b4220], [0x5e5e6a, 0x3a3a4a], [0x7a2422, 0x4a1a1a], [0x6e604e, 0x4a3a30]],
    walls: [0xc8c8d0, 0x8a8a92], stone: [0x3a3a4a, 0x8a8a92, 0xc8c8d0], towerRoof: 0x3a3a4a,
    road: [0x6e604e, 0xb8a888], plaza: [0x5e5e6a, 0x9a9aa2], forests: 7, trees: [0x2e5028, 0x52582e, 0x7a8044],
  },
};

/** Margen que se dibuja alrededor del mapa, por si la pantalla es más ancha o más alta. */
const PAD = { x: 200, y: 120 };
const RIVER_W = 40;
const ROAD_W = 11;
const MAIN_ROAD_W = 17;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Curva suave que pasa por los puntos (Catmull-Rom), muestreada cada pocos píxeles. */
function smooth(pts: Pt[], step = 6): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function distToSeg(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

const distToPath = (p: Pt, path: Pt[]) => {
  let d = Infinity;
  for (let i = 0; i < path.length - 1; i++) d = Math.min(d, distToSeg(p, path[i], path[i + 1]));
  return d;
};

/** Diferencia entre dos ángulos en grados (0-180). */
const angleGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

export function drawWalledTown(scene: Phaser.Scene, spec: TownSpec) {
  const W = spec.w + PAD.x * 2;
  const H = spec.h + PAD.y * 2;
  if (!scene.textures.exists(spec.key)) paintTown(scene, spec, W, H);
  return scene.add.image(-PAD.x, -PAD.y, spec.key).setOrigin(0, 0).setScale(2).setDepth(-10);
}

function paintTown(scene: Phaser.Scene, spec: TownSpec, W: number, H: number) {
  const R = rng(spec.seed);
  const T = THEMES[spec.kind];
  const g = scene.make.graphics({}, false);
  // Todo se dibuja en coordenadas del mapa; acá se pasa a la textura (desplazada y a la mitad).
  const X = (x: number) => (x + PAD.x) / 2;
  const Y = (y: number) => (y + PAD.y) / 2;
  const v2 = (pts: Pt[]) => pts.map((p) => new Phaser.Math.Vector2(X(p.x), Y(p.y)));
  const poly = (pts: Pt[], color: number, alpha = 1) => g.fillStyle(color, alpha).fillPoints(v2(pts), true);
  const circle = (p: Pt, r: number, color: number, alpha = 1) => g.fillStyle(color, alpha).fillCircle(X(p.x), Y(p.y), r / 2);
  const line = (path: Pt[], width: number, color: number) => {
    g.lineStyle(width / 2, color, 1).strokePoints(v2(path), false);
    for (const p of path) circle(p, width / 2, color); // uniones redondeadas
  };

  // ── Forma de la muralla ──
  const { wall } = spec;
  /** Cuánto se aleja la muralla del centro en cada dirección: la fortaleza es una estrella de 6 puntas. */
  const reach = (deg: number) => {
    if (spec.kind !== 'fortaleza') return 1;
    const t = ((((deg + 60) % 60) + 60) % 60) / 60;
    return 1 - 0.16 * (1 - Math.abs(2 * t - 1));
  };
  const onWall = (deg: number, k = 1): Pt => {
    const r = reach(deg) * k;
    return { x: wall.cx + Math.cos((deg * Math.PI) / 180) * wall.rx * r, y: wall.cy + Math.sin((deg * Math.PI) / 180) * wall.ry * r };
  };
  const shoreY = (x: number) => (spec.shore ? spec.shore.edge - (spec.shore.edge - spec.shore.center) * Math.exp(-(((x - spec.w / 2) / 300) ** 2)) : Infinity);
  const inWall = (p: Pt, k = 1) => {
    const dx = (p.x - wall.cx) / wall.rx, dy = (p.y - wall.cy) / wall.ry;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return Math.hypot(dx, dy) <= reach(deg) * k && p.y < shoreY(p.x) - 10;
  };
  const ring = (k: number, n = 96) => Array.from({ length: n }, (_, i) => onWall((i / n) * 360, k));

  // ── Campos en parcelas (en la grilla isométrica) ──
  const S = spec.kind === 'fortaleza' ? 88 : 64;
  const iso = (u: number, v: number): Pt => ({ x: spec.w / 2 + (u - v) * S, y: spec.h / 2 + ((u + v) * S) / 2 });
  for (let u = -16; u <= 16; u++) {
    for (let v = -16; v <= 16; v++) {
      const c = iso(u, v);
      if (c.x < -PAD.x - S * 2 || c.x > spec.w + PAD.x + S * 2 || c.y < -PAD.y - S || c.y > spec.h + PAD.y + S) continue;
      poly([iso(u, v), iso(u + 1, v), iso(u + 1, v + 1), iso(u, v + 1)], T.fields[Math.floor(R() * T.fields.length)]);
      g.lineStyle(1, T.furrow, 0.5).strokePoints(v2([iso(u, v), iso(u + 1, v), iso(u + 1, v + 1)]), false);
    }
  }
  // Fortaleza: rocas sueltas en la meseta.
  if (spec.kind === 'fortaleza') {
    for (let i = 0; i < 70; i++) {
      const p = { x: -PAD.x + R() * W, y: -PAD.y + R() * H };
      if (inWall(p, 1.2)) continue;
      const r = 6 + R() * 10;
      circle({ x: p.x + 2, y: p.y + 3 }, r, 0x3a3a4a, 0.5);
      circle(p, r, 0x8a8a92);
      circle({ x: p.x - r * 0.25, y: p.y - r * 0.3 }, r * 0.5, 0xc8c8d0);
    }
  }
  // Bosques (en el puerto, olivares; en la fortaleza, pocos árboles)
  const forest = (center: Pt, size: number) => {
    const trees: Pt[] = [];
    for (let i = 0; i < size; i++) trees.push({ x: center.x + (R() - 0.5) * size * 9, y: center.y + (R() - 0.5) * size * 5 });
    trees.sort((a, b) => a.y - b.y);
    for (const t of trees) {
      if (t.y > shoreY(t.x) - 20) continue;
      const r = (spec.kind === 'valle' ? 12 : 8) + R() * 8;
      circle({ x: t.x + 3, y: t.y + 5 }, r, 0x2e4a24, 0.5);
      circle(t, r, T.trees[0]);
      circle({ x: t.x - r * 0.25, y: t.y - r * 0.3 }, r * 0.6, T.trees[1]);
      circle({ x: t.x - r * 0.35, y: t.y - r * 0.45 }, r * 0.25, T.trees[2]);
    }
  };
  for (let i = 0; i < T.forests; i++) {
    const p = { x: -PAD.x + R() * W, y: -PAD.y + R() * H };
    if (!inWall(p, 1.15)) forest(p, 6 + Math.floor(R() * 12));
  }

  // ── Puerto: el mar, con playa y olas ──
  if (spec.shore) {
    const coast: Pt[] = [];
    for (let x = -PAD.x; x <= spec.w + PAD.x; x += 8) coast.push({ x, y: shoreY(x) });
    const sea = (dy: number) => [...coast.map((p) => ({ x: p.x, y: p.y + dy })), { x: spec.w + PAD.x, y: spec.h + PAD.y }, { x: -PAD.x, y: spec.h + PAD.y }];
    poly(sea(-14), 0xe8d8a8); // arena
    poly(sea(0), 0x5a9ad0);
    poly(sea(10), 0x2a7ab0);
    poly(sea(60), 0x2a5a98);
    for (let i = 0; i < 160; i++) {
      const x = -PAD.x + R() * W;
      const y = shoreY(x) + 16 + R() * (spec.h + PAD.y - shoreY(x));
      g.fillStyle(0xa8e0f0, 0.6).fillRect(X(x), Y(y), 2 + R() * 4, 1);
    }
    for (let x = -PAD.x; x < spec.w + PAD.x; x += 10) g.fillStyle(0xf8f4e8, 0.8).fillRect(X(x), Y(shoreY(x) + 2), 3, 1); // espuma
  }

  // ── Fortaleza: foso seco alrededor de la muralla ──
  if (spec.kind === 'fortaleza') {
    poly(ring(1.1, 120), 0x4a3a30);
    poly(ring(1.06, 120), 0x6e604e);
  }

  // ── Adentro de la muralla: suelo de la ciudad ──
  const inside = (k: number) => ring(k, 120).map((p) => ({ x: p.x, y: Math.min(p.y, shoreY(p.x) - 4) }));
  poly(inside(1), T.ground[0]);
  poly(inside(0.97), T.ground[1]);

  // ── Río ──
  const river = spec.river ? smooth(spec.river) : [];
  if (river.length) {
    line(river, RIVER_W + 12, 0x6e604e);
    line(river, RIVER_W + 4, 0x2a5a98);
    line(river, RIVER_W - 6, 0x3a6ab0);
    for (let i = 0; i < river.length; i += 7) {
      const p = river[i];
      g.fillStyle(0xa8e0f0, 0.7).fillRect(X(p.x - 6 + R() * 12), Y(p.y), 3 + R() * 3, 1);
    }
  }

  // ── Calles: de la plaza a cada edificio y a los portones. Sobre el agua o el foso son puentes o muelles ──
  const gates = spec.gates.map((deg) => ({ deg, at: onWall(deg), out: onWall(deg, 1.8) }));
  const roads: { a: Pt; b: Pt; w: number }[] = [];
  for (const gt of gates) roads.push({ a: spec.plaza, b: gt.at, w: MAIN_ROAD_W }, { a: gt.at, b: gt.out, w: MAIN_ROAD_W });
  for (const b of spec.buildings) roads.push({ a: spec.plaza, b: b.door, w: ROAD_W });
  if (spec.kind === 'valle') {
    // Calle en anillo, por adentro de la muralla.
    const inner = ring(0.62, 64);
    for (let i = 0; i < inner.length; i++) roads.push({ a: inner[i], b: inner[(i + 1) % inner.length], w: ROAD_W - 3 });
  }
  const overWater = (p: Pt) =>
    (river.length > 0 && distToPath(p, river) < RIVER_W / 2 + 2) || p.y > shoreY(p.x) - 2
    || (spec.kind === 'fortaleza' && !inWall(p, 1) && inWall(p, 1.1));
  for (const pass of [0, 1]) {
    for (const r of roads) {
      const n = Math.ceil(Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y) / 4);
      for (let k = 0; k <= n; k++) {
        const p = { x: r.a.x + ((r.b.x - r.a.x) * k) / n, y: r.a.y + ((r.b.y - r.a.y) * k) / n };
        const bridge = overWater(p);
        // Primera pasada: borde oscuro. Segunda: la calle (o el puente de madera).
        if (pass === 0) circle(p, r.w / 2 + 2, bridge ? 0x4a3a30 : T.road[0]);
        else circle(p, r.w / 2, bridge ? 0x8a5a32 : T.road[1]);
      }
    }
  }

  // ── Plaza: redonda en el pueblo, chica en el puerto, un patio de armas grande en la fortaleza ──
  const [prx, pry] = spec.kind === 'puerto' ? [110, 54] : spec.kind === 'fortaleza' ? [210, 104] : [160, 78];
  const plazaPts = spec.kind === 'fortaleza'
    ? [{ x: spec.plaza.x, y: spec.plaza.y - pry }, { x: spec.plaza.x + prx, y: spec.plaza.y }, { x: spec.plaza.x, y: spec.plaza.y + pry }, { x: spec.plaza.x - prx, y: spec.plaza.y }]
    : Array.from({ length: 40 }, (_, i) => ({ x: spec.plaza.x + Math.cos((i / 40) * Math.PI * 2) * prx, y: spec.plaza.y + Math.sin((i / 40) * Math.PI * 2) * pry }));
  poly(plazaPts, T.plaza[0]);
  poly(plazaPts.map((p) => ({ x: spec.plaza.x + (p.x - spec.plaza.x) * 0.96, y: spec.plaza.y + (p.y - spec.plaza.y) * 0.94 })), T.plaza[1]);
  for (let i = 0; i < 160; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * (spec.kind === 'fortaleza' ? 0.65 : 0.92);
    g.fillStyle(0xf0e2c0, 0.4).fillRect(X(spec.plaza.x + Math.cos(a) * d * prx), Y(spec.plaza.y + Math.sin(a) * d * pry), 1, 1);
  }
  if (spec.kind !== 'fortaleza') {
    // Fuente, al costado del centro de la plaza
    const fountain = { x: spec.plaza.x - prx * 0.68, y: spec.plaza.y + pry * 0.38 };
    circle(fountain, 22, 0x6e604e);
    circle(fountain, 18, 0x9a8468);
    circle(fountain, 13, 0x5a9ad0);
    circle({ x: fountain.x, y: fountain.y - 2 }, 4, 0xa8e0f0);
  }

  // ── Casas comunes: llenan lo que queda libre adentro de la muralla ──
  const free = (p: Pt) => {
    if (!inWall(p, 0.95)) return false;
    if (((p.x - spec.plaza.x) / (prx + 15)) ** 2 + ((p.y - spec.plaza.y) / (pry + 14)) ** 2 <= 1) return false;
    if (river.length && distToPath(p, river) < RIVER_W / 2 + 10) return false;
    for (const b of spec.buildings) if (p.x > b.box.x0 && p.x < b.box.x1 && p.y > b.box.y0 && p.y < b.box.y1) return false;
    for (const r of roads) if (distToSeg(p, r.a, r.b) < r.w / 2 + 7) return false;
    return true;
  };
  const houses: Pt[] = [];
  for (let y = wall.cy - wall.ry; y < wall.cy + wall.ry; y += 13) {
    for (let x = wall.cx - wall.rx; x < wall.cx + wall.rx; x += 21) {
      const p = { x: x + (R() - 0.5) * 6 + (Math.round(y / 13) % 2) * 10, y: y + (R() - 0.5) * 4 };
      if (free(p)) houses.push(p);
    }
  }
  houses.sort((a, b) => a.y - b.y);
  for (const p of houses) {
    if (R() < (spec.kind === 'fortaleza' ? 0.03 : 0.08)) {
      // Patio o huerta con un árbol
      circle({ x: p.x + 2, y: p.y + 4 }, 13, 0x2e4a24, 0.5);
      circle(p, 12, T.trees[0]);
      circle({ x: p.x - 3, y: p.y - 3 }, 6, T.trees[1]);
      continue;
    }
    // En la fortaleza, cuarteles largos; en el resto, casas.
    const a = (spec.kind === 'fortaleza' ? 14 : 12) + R() * 5; // media diagonal del techo
    const b = a / 2;
    const hgt = 7 + R() * 4; // alto de las paredes
    const rise = 6 + R() * 4; // alto de la cumbrera
    const [light, dark] = T.roofs[Math.floor(R() * T.roofs.length)];
    const flip = R() < 0.5 ? 1 : -1;
    const top = { x: p.x, y: p.y - b }, right = { x: p.x + a, y: p.y }, bottom = { x: p.x, y: p.y + b }, left = { x: p.x - a, y: p.y };
    // Sombra, paredes (la izquierda iluminada) y techo a dos aguas.
    poly([{ x: left.x + 4, y: left.y + hgt + 2 }, { x: bottom.x + 4, y: bottom.y + hgt + 2 }, { x: right.x + 6, y: right.y + hgt + 2 }, { x: right.x + 6, y: right.y + 2 }], 0x2e3a20, 0.35);
    poly([left, bottom, { x: bottom.x, y: bottom.y + hgt }, { x: left.x, y: left.y + hgt }], T.walls[0]);
    poly([bottom, right, { x: right.x, y: right.y + hgt }, { x: bottom.x, y: bottom.y + hgt }], T.walls[1]);
    g.fillStyle(0x6e604e, 1).fillRect(X(p.x - a * 0.5), Y(p.y + b * 0.5 + hgt * 0.35), 1, 2); // ventana
    const r1 = flip > 0 ? { x: p.x - a / 2, y: p.y - b / 2 - rise } : { x: p.x + a / 2, y: p.y - b / 2 - rise };
    const r2 = flip > 0 ? { x: p.x + a / 2, y: p.y + b / 2 - rise } : { x: p.x - a / 2, y: p.y + b / 2 - rise };
    if (flip > 0) {
      poly([top, right, r2, r1], dark);
      poly([left, bottom, r2, r1], light);
    } else {
      poly([top, left, r2, r1], dark);
      poly([right, bottom, r2, r1], light);
    }
    if (R() < 0.3) g.fillStyle(0x6e604e, 1).fillRect(X(r1.x + (r2.x - r1.x) * 0.3), Y(r1.y + (r2.y - r1.y) * 0.3) - 2, 1.5, 2.5); // chimenea
  }

  // ── Puerto: muelles, barcos y faro ──
  if (spec.shore) {
    for (const x of [200, 380, 900, 1080]) {
      const y0 = shoreY(x) - 6;
      poly([{ x: x - 7, y: y0 }, { x: x + 7, y: y0 }, { x: x + 7, y: y0 + 70 }, { x: x - 7, y: y0 + 70 }], 0x6b4220);
      poly([{ x: x - 5, y: y0 }, { x: x + 5, y: y0 }, { x: x + 5, y: y0 + 68 }, { x: x - 5, y: y0 + 68 }], 0x8a5a32);
      for (let k = 0; k < 70; k += 14) circle({ x: x + 8, y: y0 + k }, 3, 0x4a3a30);
    }
    const boat = (p: Pt, big: boolean) => {
      const L = big ? 34 : 18;
      circle({ x: p.x + 3, y: p.y + 4 }, L * 0.7, 0x1e3060, 0.4);
      poly([{ x: p.x - L, y: p.y }, { x: p.x + L, y: p.y - L * 0.25 }, { x: p.x + L * 0.7, y: p.y + L * 0.3 }, { x: p.x - L * 0.8, y: p.y + L * 0.45 }], 0x6b4220);
      poly([{ x: p.x - L * 0.7, y: p.y + 2 }, { x: p.x + L * 0.8, y: p.y - L * 0.18 }, { x: p.x + L * 0.6, y: p.y + L * 0.15 }, { x: p.x - L * 0.6, y: p.y + L * 0.3 }], 0x8a5a32);
      poly([{ x: p.x, y: p.y - L * 1.3 }, { x: p.x + L * 0.6, y: p.y - L * 0.2 }, { x: p.x, y: p.y - L * 0.1 }], 0xf8f4e8);
      if (big) poly([{ x: p.x - L * 0.5, y: p.y - L * 1.0 }, { x: p.x - 2, y: p.y - L * 0.1 }, { x: p.x - L * 0.5, y: p.y }], 0xd8d0c0);
    };
    boat({ x: 230, y: shoreY(230) + 50 }, false);
    boat({ x: 420, y: shoreY(420) + 62 }, false);
    boat({ x: 860, y: shoreY(860) + 90 }, true);
    boat({ x: 1120, y: shoreY(1120) + 56 }, false);
    boat({ x: 1000, y: spec.h + 30 }, true);
    // Faro en la punta izquierda de la bahía
    const lh = { x: 40, y: shoreY(40) + 34 };
    circle({ x: lh.x, y: lh.y + 14 }, 46, 0x8a8a92);
    circle({ x: lh.x, y: lh.y + 12 }, 38, 0xc8c8d0);
    poly([{ x: lh.x - 10, y: lh.y + 8 }, { x: lh.x + 10, y: lh.y + 8 }, { x: lh.x + 7, y: lh.y - 40 }, { x: lh.x - 7, y: lh.y - 40 }], 0xf8f4e8);
    poly([{ x: lh.x + 2, y: lh.y + 8 }, { x: lh.x + 10, y: lh.y + 8 }, { x: lh.x + 7, y: lh.y - 40 }, { x: lh.x + 1, y: lh.y - 40 }], 0xd8d0c0);
    for (const yy of [-6, -22]) poly([{ x: lh.x - 9, y: lh.y + yy }, { x: lh.x + 9, y: lh.y + yy }, { x: lh.x + 9, y: lh.y + yy - 6 }, { x: lh.x - 9, y: lh.y + yy - 6 }], 0xc8482e);
    circle({ x: lh.x, y: lh.y - 46 }, 14, 0xf8e48a);
    poly([{ x: lh.x - 9, y: lh.y - 52 }, { x: lh.x + 9, y: lh.y - 52 }, { x: lh.x, y: lh.y - 64 }], 0x7a2422);
  }

  // ── Fortaleza: campamento de carpas afuera ──
  if (spec.kind === 'fortaleza') {
    for (let i = 0; i < 9; i++) {
      const p = { x: 60 + (i % 3) * 46 + (R() - 0.5) * 10, y: 600 + Math.floor(i / 3) * 30 + (R() - 0.5) * 6 };
      poly([{ x: p.x - 16, y: p.y + 6 }, { x: p.x, y: p.y - 14 }, { x: p.x + 4, y: p.y + 12 }], 0xd8d0c0);
      poly([{ x: p.x, y: p.y - 14 }, { x: p.x + 18, y: p.y + 4 }, { x: p.x + 4, y: p.y + 12 }], 0xa89868);
    }
    circle({ x: 120, y: 640 }, 8, 0xe0a838);
    circle({ x: 120, y: 640 }, 4, 0xf8e48a);
  }

  // ── Muralla con torres y portones ──
  const wallPts = ring(1, 144);
  const atGate = (deg: number) => gates.some((gt) => angleGap(deg, gt.deg) < 4);
  const thick = spec.kind === 'fortaleza' ? 1.4 : 1;
  for (let i = 0; i < wallPts.length; i++) {
    const deg = (i / wallPts.length) * 360;
    const a = wallPts[i], b = wallPts[(i + 1) % wallPts.length];
    if (atGate(deg) || a.y > shoreY(a.x) + 30 || b.y > shoreY(b.x) + 30) continue;
    const seg = [a, b];
    line(seg, 18 * thick, T.stone[0]);
    line(seg, 13 * thick, T.stone[1]);
    line([{ x: a.x, y: a.y - 3 }, { x: b.x, y: b.y - 3 }], 5 * thick, T.stone[2]);
  }
  const tower = (t: Pt, r: number, roof: number) => {
    circle({ x: t.x + 2, y: t.y + 4 }, r + 1, 0x2e3a20, 0.4);
    circle(t, r, T.stone[0]);
    circle({ x: t.x, y: t.y - 2 }, r * 0.8, T.stone[2]);
    circle({ x: t.x, y: t.y - 3 }, r * 0.45, roof);
  };
  if (spec.kind === 'fortaleza') {
    // Bastiones en las puntas de la estrella
    for (let deg = 0; deg < 360; deg += 60) tower(onWall(deg), 26, T.towerRoof);
  } else {
    for (let deg = 15; deg < 360; deg += 30) {
      const t = onWall(deg);
      if (gates.some((gt) => angleGap(deg, gt.deg) < 12) || t.y > shoreY(t.x) + 30) continue;
      tower(t, 14, T.towerRoof);
    }
  }
  for (const gt of gates) for (const side of [-6, 6]) tower(onWall(gt.deg + side), 16, T.towerRoof);

  const tex = scene.textures.addDynamicTexture(spec.key, W / 2, H / 2)!;
  tex.draw(g, 0, 0);
  tex.render();
  g.destroy();
}
