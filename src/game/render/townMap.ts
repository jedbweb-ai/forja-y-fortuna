import Phaser from 'phaser';

// Pueblo amurallado visto desde el aire: campos y bosques afuera, muralla redondeada con portones, un río que lo
// cruza, calles que salen de la plaza hacia cada edificio y cientos de casitas entre ellos. Se dibuja una vez,
// a media resolución, y se muestra al doble para que tenga el mismo pixel que el resto del arte.

type Pt = { x: number; y: number };

export interface TownSpec {
  /** Clave de la textura: se dibuja una sola vez y se reutiliza (por ejemplo al cambiar la franja del día). */
  key: string;
  /** Medida del mapa (los edificios están en estas coordenadas). */
  w: number;
  h: number;
  /** Centro de la plaza, donde nacen las calles. */
  plaza: Pt;
  /** Muralla: elipse con centro y radios. */
  wall: { cx: number; cy: number; rx: number; ry: number };
  /** Recorrido del río, de arriba hacia abajo (se suaviza). */
  river: Pt[];
  /** Edificios tocables: su caja (la imagen y el nombre debajo) queda libre de casas, y una calle llega a su puerta. */
  buildings: { door: Pt; box: { x0: number; y0: number; x1: number; y1: number } }[];
  seed: number;
}

/** Margen que se dibuja alrededor del mapa, por si la pantalla es más ancha o más alta. */
const PAD = { x: 200, y: 120 };
const RIVER_W = 40;
const ROAD_W = 11;
const MAIN_ROAD_W = 17;

const FIELDS = [0x9cbc5a, 0x8aac48, 0xb4c466, 0xc8bc6a, 0x7e9e42, 0xa6b85c, 0xd2c47a];
const ROOFS: [number, number][] = [
  [0xd0704a, 0xa8482e], [0xc0563b, 0x8a3a2a], [0xe08a5a, 0xb8603a], [0xb8603a, 0x7a3a22],
  [0xd0704a, 0xa8482e], [0xc0563b, 0x8a3a2a], [0x8a8278, 0x5e5650], [0xa85a3a, 0x6e3422],
];

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

export function drawWalledTown(scene: Phaser.Scene, spec: TownSpec) {
  const W = spec.w + PAD.x * 2;
  const H = spec.h + PAD.y * 2;
  if (!scene.textures.exists(spec.key)) paintTown(scene, spec, W, H);
  return scene.add.image(-PAD.x, -PAD.y, spec.key).setOrigin(0, 0).setScale(2).setDepth(-10);
}

function paintTown(scene: Phaser.Scene, spec: TownSpec, W: number, H: number) {
  const R = rng(spec.seed);
  const g = scene.make.graphics({}, false);
  // Todo se dibuja en coordenadas del mapa; acá se pasa a la textura (desplazada y a la mitad).
  const X = (x: number) => (x + PAD.x) / 2;
  const Y = (y: number) => (y + PAD.y) / 2;
  const poly = (pts: Pt[], color: number, alpha = 1) => {
    g.fillStyle(color, alpha).fillPoints(pts.map((p) => new Phaser.Math.Vector2(X(p.x), Y(p.y))), true);
  };
  const circle = (p: Pt, r: number, color: number, alpha = 1) => g.fillStyle(color, alpha).fillCircle(X(p.x), Y(p.y), r / 2);
  const line = (path: Pt[], width: number, color: number) => {
    g.lineStyle(width / 2, color, 1).strokePoints(path.map((p) => new Phaser.Math.Vector2(X(p.x), Y(p.y))), false);
    for (const p of path) circle(p, width / 2, color); // uniones redondeadas
  };

  const { wall } = spec;
  const inWall = (p: Pt, k = 1) => ((p.x - wall.cx) / (wall.rx * k)) ** 2 + ((p.y - wall.cy) / (wall.ry * k)) ** 2 <= 1;
  const onWall = (deg: number, k = 1): Pt => ({ x: wall.cx + Math.cos((deg * Math.PI) / 180) * wall.rx * k, y: wall.cy + Math.sin((deg * Math.PI) / 180) * wall.ry * k });

  // ── Campos en parcelas (en la grilla isométrica) y bosques ──
  const S = 64;
  const iso = (u: number, v: number): Pt => ({ x: spec.w / 2 + (u - v) * S, y: spec.h / 2 + ((u + v) * S) / 2 });
  for (let u = -16; u <= 16; u++) {
    for (let v = -16; v <= 16; v++) {
      const c = iso(u, v);
      if (c.x < -PAD.x - S * 2 || c.x > spec.w + PAD.x + S * 2 || c.y < -PAD.y - S || c.y > spec.h + PAD.y + S) continue;
      poly([iso(u, v), iso(u + 1, v), iso(u + 1, v + 1), iso(u, v + 1)], FIELDS[Math.floor(R() * FIELDS.length)]);
      // Surcos o cercos entre parcelas
      g.lineStyle(1, 0x5e7a34, 0.5).strokePoints([iso(u, v), iso(u + 1, v), iso(u + 1, v + 1)].map((p) => new Phaser.Math.Vector2(X(p.x), Y(p.y))), false);
    }
  }
  const forest = (center: Pt, size: number) => {
    const trees: Pt[] = [];
    for (let i = 0; i < size; i++) trees.push({ x: center.x + (R() - 0.5) * size * 9, y: center.y + (R() - 0.5) * size * 5 });
    trees.sort((a, b) => a.y - b.y);
    for (const t of trees) {
      const r = 12 + R() * 8;
      circle({ x: t.x + 3, y: t.y + 5 }, r, 0x2e4a24, 0.6);
      circle(t, r, 0x3e6a2e);
      circle({ x: t.x - r * 0.25, y: t.y - r * 0.3 }, r * 0.6, 0x5a8a38);
      circle({ x: t.x - r * 0.35, y: t.y - r * 0.45 }, r * 0.25, 0x8aaa48);
    }
  };
  for (let i = 0; i < 26; i++) {
    const p = { x: -PAD.x + R() * W, y: -PAD.y + R() * H };
    if (!inWall(p, 1.12)) forest(p, 8 + Math.floor(R() * 14));
  }

  // ── Adentro de la muralla: suelo del pueblo ──
  const ring = (k: number, n = 96) => Array.from({ length: n }, (_, i) => onWall((i / n) * 360, k));
  poly(ring(1), 0x7a8a4a);
  poly(ring(0.97), 0x8a9656);

  // ── Río (cruza todo el mapa) ──
  const river = smooth(spec.river);
  line(river, RIVER_W + 12, 0x6e604e);
  line(river, RIVER_W + 4, 0x2a5a98);
  line(river, RIVER_W - 6, 0x3a6ab0);
  for (let i = 0; i < river.length; i += 7) {
    const p = river[i];
    g.fillStyle(0xa8e0f0, 0.7).fillRect(X(p.x - 6 + R() * 12), Y(p.y), 3 + R() * 3, 1);
  }

  // ── Calles: de la plaza a cada edificio y a los portones; puentes donde cruzan el río ──
  const gates = [180, 0, 90, 270].map((deg) => ({ deg, at: onWall(deg), out: onWall(deg, 1.6) }));
  const roads: { a: Pt; b: Pt; w: number }[] = [];
  for (const gt of gates) roads.push({ a: spec.plaza, b: gt.at, w: MAIN_ROAD_W }, { a: gt.at, b: gt.out, w: MAIN_ROAD_W });
  for (const b of spec.buildings) roads.push({ a: spec.plaza, b: b.door, w: ROAD_W });
  // Calle en anillo, por adentro de la muralla.
  const inner = ring(0.62, 64);
  for (let i = 0; i < inner.length; i++) roads.push({ a: inner[i], b: inner[(i + 1) % inner.length], w: ROAD_W - 3 });
  const riverHere = (p: Pt) => distToPath(p, river) < RIVER_W / 2 + 2;
  for (const pass of [0, 1]) {
    for (const r of roads) {
      const n = Math.ceil(Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y) / 4);
      for (let k = 0; k <= n; k++) {
        const p = { x: r.a.x + ((r.b.x - r.a.x) * k) / n, y: r.a.y + ((r.b.y - r.a.y) * k) / n };
        const bridge = riverHere(p);
        // Primera pasada: borde oscuro. Segunda: la calle (o el puente de madera).
        if (pass === 0) circle(p, r.w / 2 + 2, bridge ? 0x4a3a30 : 0x9a8468);
        else circle(p, r.w / 2, bridge ? 0x8a5a32 : 0xd8c49a);
      }
    }
  }
  // Plaza de adoquines
  const plaza = Array.from({ length: 40 }, (_, i) => ({ x: spec.plaza.x + Math.cos((i / 40) * Math.PI * 2) * 160, y: spec.plaza.y + Math.sin((i / 40) * Math.PI * 2) * 78 }));
  poly(plaza, 0x9a8468);
  poly(plaza.map((p) => ({ x: spec.plaza.x + (p.x - spec.plaza.x) * 0.97, y: spec.plaza.y + (p.y - spec.plaza.y) * 0.95 })), 0xc8b088);
  for (let i = 0; i < 160; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R());
    g.fillStyle(0xf0e2c0, 0.5).fillRect(X(spec.plaza.x + Math.cos(a) * d * 150), Y(spec.plaza.y + Math.sin(a) * d * 70), 1, 1);
  }
  // Fuente en la plaza, al costado del mercado
  const fountain = { x: spec.plaza.x - 110, y: spec.plaza.y + 30 };
  circle(fountain, 22, 0x6e604e);
  circle(fountain, 18, 0x9a8468);
  circle(fountain, 13, 0x5a9ad0);
  circle({ x: fountain.x, y: fountain.y - 2 }, 4, 0xa8e0f0);

  // ── Casas comunes: llenan lo que queda libre adentro de la muralla ──
  const free = (p: Pt) => {
    if (!inWall(p, 0.95)) return false;
    if (((p.x - spec.plaza.x) / 175) ** 2 + ((p.y - spec.plaza.y) / 92) ** 2 <= 1) return false;
    if (distToPath(p, river) < RIVER_W / 2 + 10) return false;
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
    if (R() < 0.08) {
      // Patio o huerta con un árbol
      circle({ x: p.x + 2, y: p.y + 4 }, 13, 0x2e4a24, 0.5);
      circle(p, 12, 0x4a7a32);
      circle({ x: p.x - 3, y: p.y - 3 }, 6, 0x6a9a40);
      continue;
    }
    const a = 12 + R() * 5; // media diagonal del techo
    const b = a / 2;
    const hgt = 7 + R() * 4; // alto de las paredes
    const rise = 6 + R() * 4; // alto de la cumbrera
    const [light, dark] = ROOFS[Math.floor(R() * ROOFS.length)];
    const flip = R() < 0.5 ? 1 : -1;
    const top = { x: p.x, y: p.y - b }, right = { x: p.x + a, y: p.y }, bottom = { x: p.x, y: p.y + b }, left = { x: p.x - a, y: p.y };
    // Sombra, paredes (la izquierda iluminada) y techo a dos aguas.
    poly([{ x: left.x + 4, y: left.y + hgt + 2 }, { x: bottom.x + 4, y: bottom.y + hgt + 2 }, { x: right.x + 6, y: right.y + hgt + 2 }, { x: right.x + 6, y: right.y + 2 }], 0x2e3a20, 0.35);
    poly([left, bottom, { x: bottom.x, y: bottom.y + hgt }, { x: left.x, y: left.y + hgt }], 0xf0e2c0);
    poly([bottom, right, { x: right.x, y: right.y + hgt }, { x: bottom.x, y: bottom.y + hgt }], 0xc8b088);
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

  // ── Muralla con torres y portones ──
  const wallPts = ring(1, 120);
  const atGate = (deg: number) => gates.some((gt) => Math.abs(((deg - gt.deg + 540) % 360) - 180) < 4);
  for (let i = 0; i < wallPts.length; i++) {
    const deg = (i / wallPts.length) * 360;
    if (atGate(deg)) continue;
    const a = wallPts[i], b = wallPts[(i + 1) % wallPts.length];
    const seg = [a, b];
    line(seg, 18, 0x6e604e);
    line(seg, 13, 0xc8bfa8);
    line([{ x: a.x, y: a.y - 3 }, { x: b.x, y: b.y - 3 }], 5, 0xe8e0c8);
  }
  for (let deg = 15; deg < 360; deg += 30) {
    if (atGate(deg) || [...gates].some((gt) => Math.abs(((deg - gt.deg + 540) % 360) - 180) < 12)) continue;
    const t = onWall(deg);
    circle({ x: t.x + 2, y: t.y + 4 }, 15, 0x2e3a20, 0.4);
    circle(t, 14, 0x6e604e);
    circle({ x: t.x, y: t.y - 2 }, 11, 0xd8d0b8);
    circle({ x: t.x, y: t.y - 3 }, 6, 0xa8482e);
  }
  for (const gt of gates) {
    for (const side of [-6, 6]) {
      const t = onWall(gt.deg + side);
      circle(t, 16, 0x6e604e);
      circle({ x: t.x, y: t.y - 2 }, 13, 0xd8d0b8);
      circle({ x: t.x, y: t.y - 3 }, 7, 0x8a3a2a);
    }
  }

  const tex = scene.textures.addDynamicTexture(spec.key, W / 2, H / 2)!;
  tex.draw(g, 0, 0);
  tex.render();
  g.destroy();
}
