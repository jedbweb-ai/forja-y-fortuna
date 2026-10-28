import type { Rng } from '../rng';
import type { DungeonDef, DungeonFloor, RoomPiece } from './types';

// Generación de pisos: una grilla de salas de 7×7 hechas a mano, unidas por pasillos cortos.
// Las salas se conectan con un árbol al azar (más algún atajo); los secretos van siempre en salas
// sin salida, así nunca bloquean el camino de la entrada a la escalera.

const PIECE = 7;
const CELL = PIECE + 1;
const MID = 3;

type Cell = { x: number; y: number };
type Side = 'n' | 's' | 'e' | 'w';

/** Lo que se encuentra en el piso además de la grilla: entrada, escalera y salas de tesoro. */
export interface FloorPlan {
  map: DungeonFloor;
  entry: { x: number; y: number };
  /** Salas de tesoro (secretas o cerradas): sus cofres usan el botín secreto. */
  treasureRooms: string[];
}

export interface FloorOptions {
  /** Último piso: la sala del fondo es la del jefe. */
  bossRoom: boolean;
  /** El jefe está (si no, en su lugar ya aparece la salida). */
  bossPresent: boolean;
  /** Biblioteca de salas que puede usar esta mazmorra. */
  pieces: RoomPiece[];
  riddles: string[];
}

const key = (c: Cell) => `${c.x},${c.y}`;
const ROOM_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function generateFloor(def: DungeonDef, rng: Rng, opts: FloorOptions): FloorPlan {
  const [gw, gh] = def.grid;
  const W = gw * CELL - 1;
  const H = gh * CELL - 1;
  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill('#'));
  const rooms: string[][] = Array.from({ length: H }, () => Array(W).fill('-'));

  // ── Árbol de salas (DFS al azar) más un atajo ──
  const cells: Cell[] = [];
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) cells.push({ x, y });
  const start = rng.pick(cells);
  const edges = new Set<string>();
  const edgeKey = (a: Cell, b: Cell) => [key(a), key(b)].sort().join('|');
  const neighbors = (c: Cell) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: c.x + dx, y: c.y + dy }))
    .filter((n) => n.x >= 0 && n.y >= 0 && n.x < gw && n.y < gh);
  const visited = new Set([key(start)]);
  const stack = [start];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const next = neighbors(cur).filter((n) => !visited.has(key(n)));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const n = rng.pick(next);
    edges.add(edgeKey(cur, n));
    visited.add(key(n));
    stack.push(n);
  }
  const degree = (c: Cell) => neighbors(c).filter((n) => edges.has(edgeKey(c, n))).length;
  // Un atajo entre salas que no sean callejones, para que el piso no sea un pasillo único.
  const extras = cells.flatMap((a) => neighbors(a).map((b) => [a, b] as const))
    .filter(([a, b]) => !edges.has(edgeKey(a, b)) && degree(a) > 1 && degree(b) > 1);
  if (extras.length && cells.length >= 6) {
    const [a, b] = rng.pick(extras);
    edges.add(edgeKey(a, b));
  }
  const linked = (c: Cell) => neighbors(c).filter((n) => edges.has(edgeKey(c, n)));

  // ── Distancias desde la entrada: la sala más lejana tiene la escalera (o el jefe) ──
  const dist = new Map([[key(start), 0]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of linked(cur)) {
      if (dist.has(key(n))) continue;
      dist.set(key(n), dist.get(key(cur))! + 1);
      queue.push(n);
    }
  }
  const end = [...cells].sort((a, b) => dist.get(key(b))! - dist.get(key(a))!)[0];

  // ── Salas especiales: callejones que no son ni la entrada ni el final ──
  const leaves = cells.filter((c) => degree(c) === 1 && key(c) !== key(start) && key(c) !== key(end));
  const specials = new Map<string, 'F' | 'G' | 'D'>();
  for (const kind of ['F', 'G', 'D'] as const) {
    const free = leaves.filter((l) => !specials.has(key(l)));
    if (free.length && rng.chance(kind === 'F' ? 0.75 : 0.55)) specials.set(key(rng.pick(free)), kind);
  }

  // ── Volcar las piezas ──
  const byKind = (k: RoomPiece['kind']) => opts.pieces.filter((p) => p.kind === k);
  const letterOf = new Map<string, string>();
  cells.forEach((c, i) => letterOf.set(key(c), ROOM_LETTERS[i]));
  for (const c of cells) {
    const isBoss = opts.bossRoom && key(c) === key(end);
    const pool = isBoss ? byKind('jefe') : specials.has(key(c)) ? byKind('tesoro') : byKind('sala');
    const piece = rng.pick(pool.length ? pool : byKind('sala'));
    const ox = c.x * CELL;
    const oy = c.y * CELL;
    for (let y = 0; y < PIECE; y++) {
      for (let x = 0; x < PIECE; x++) {
        let ch = piece.rows[y][x];
        // Sin monstruos en la sala de entrada; sin guarida si el jefe no está.
        if (key(c) === key(start) && (ch === 'm' || ch === 'B')) ch = '.';
        if (ch === 'B' && !isBoss) ch = '.';
        grid[oy + y][ox + x] = ch;
        if (ch !== '#') rooms[oy + y][ox + x] = letterOf.get(key(c))!;
      }
    }
    if (key(c) === key(start)) grid[oy + MID][ox + MID] = 'E';
    if (key(c) === key(end) && !isBoss) grid[oy + MID][ox + MID] = 'S';
    if (isBoss && !opts.bossPresent) {
      for (let y = 0; y < PIECE; y++) for (let x = 0; x < PIECE; x++) if (grid[oy + y][ox + x] === 'B') grid[oy + y][ox + x] = '.';
      grid[oy + MID][ox + MID] = 'S';
    }
  }

  // ── Pasillos: abre la puerta de cada lado conectado ──
  const door = (c: Cell, side: Side) => {
    const ox = c.x * CELL;
    const oy = c.y * CELL;
    switch (side) {
      case 'e': return { wall: { x: ox + PIECE - 1, y: oy + MID }, inner: { x: ox + PIECE - 2, y: oy + MID }, gap: { x: ox + PIECE, y: oy + MID } };
      case 'w': return { wall: { x: ox, y: oy + MID }, inner: { x: ox + 1, y: oy + MID }, gap: { x: ox - 1, y: oy + MID } };
      case 's': return { wall: { x: ox + MID, y: oy + PIECE - 1 }, inner: { x: ox + MID, y: oy + PIECE - 2 }, gap: { x: ox + MID, y: oy + PIECE } };
      case 'n': return { wall: { x: ox + MID, y: oy }, inner: { x: ox + MID, y: oy + 1 }, gap: { x: ox + MID, y: oy - 1 } };
    }
  };
  const levers: DungeonFloor['levers'] = [];
  const corridor: { x: number; y: number }[] = [];
  let keyNeeded = false;
  for (const e of edges) {
    const [a, b] = e.split('|').map((s) => { const [x, y] = s.split(',').map(Number); return { x, y }; });
    const side: Side = a.x !== b.x ? (a.x < b.x ? 'e' : 'w') : (a.y < b.y ? 's' : 'n');
    const back: Side = side === 'e' ? 'w' : side === 'w' ? 'e' : side === 's' ? 'n' : 's';
    const da = door(a, side);
    const db = door(b, back);
    for (const d of [da, db]) {
      grid[d.wall.y][d.wall.x] = '.';
      if ('RwmcvgIL'.includes(grid[d.inner.y][d.inner.x])) grid[d.inner.y][d.inner.x] = '.';
    }
    // El secreto va en el pasillo que lleva a la sala especial.
    const special = specials.get(key(a)) ?? specials.get(key(b));
    grid[da.gap.y][da.gap.x] = special ?? '.';
    if (!special) corridor.push(da.gap);
    if (special === 'G') levers.push({ x: -1, y: -1, gate: { ...da.gap }, pulled: false });
    if (special === 'D') keyNeeded = true;
  }

  // ── Palancas, llave e inscripciones: en esquinas de salas comunes (nunca tapan una puerta) ──
  const common = cells.filter((c) => !specials.has(key(c)) && !(opts.bossRoom && key(c) === key(end)));
  const corners = (c: Cell) => [[1, 1], [PIECE - 2, 1], [1, PIECE - 2], [PIECE - 2, PIECE - 2]]
    .map(([x, y]) => ({ x: c.x * CELL + x, y: c.y * CELL + y }))
    .filter((p) => grid[p.y][p.x] === '.');
  const spot = (exclude: Cell[] = []) => {
    const options = common.filter((c) => !exclude.some((e) => key(e) === key(c))).flatMap(corners);
    return options.length ? rng.pick(options) : null;
  };
  for (const lv of levers) {
    const p = spot();
    // Sin lugar para la palanca, la reja queda abierta.
    if (!p) {
      grid[lv.gate.y][lv.gate.x] = '.';
      continue;
    }
    grid[p.y][p.x] = 'L';
    lv.x = p.x;
    lv.y = p.y;
  }
  if (keyNeeded) {
    const p = spot();
    if (p) grid[p.y][p.x] = 'k';
  }
  const riddles: DungeonFloor['riddles'] = [];
  if (opts.riddles.length && rng.chance(0.6)) {
    const p = spot([start]);
    if (p) {
      grid[p.y][p.x] = 'I';
      riddles.push({ x: p.x, y: p.y, id: rng.pick(opts.riddles), solved: false });
    }
  }

  // ── Trampas: pocas, en pasillos o en salas que no son la entrada ──
  const traps: DungeonFloor['traps'] = [];
  const trapSpots = [...corridor];
  const count = rng.int(def.traps[0], def.traps[1]);
  for (let i = 0; i < count && trapSpots.length; i++) {
    const p = trapSpots.splice(rng.int(0, trapSpots.length - 1), 1)[0];
    traps.push({ x: p.x, y: p.y, kind: rng.chance(0.5) ? 'dardos' : 'alarma' });
  }

  const startCell = { x: start.x * CELL + MID, y: start.y * CELL + MID };
  return {
    map: {
      terrain: grid.map((r) => r.join('')),
      heights: grid.map((r) => '0'.repeat(r.length)),
      rooms: rooms.map((r) => r.join('')),
      seen: grid.map((r) => '0'.repeat(r.length)),
      levers: levers.filter((l) => l.x >= 0),
      riddles,
      traps,
    },
    entry: startCell,
    treasureRooms: [...specials.keys()].map((k) => letterOf.get(k)!),
  };
}
