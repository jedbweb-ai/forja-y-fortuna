import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import { freeTileNear, heightAt, inBounds, isFloor, type Pt } from './grid';
import type { ArenaDef, CombatState } from './types';

const CHARS = new Set([...'.:=,wl #TRCKX']);
const STEPS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

/** Casillas a las que se llega caminando desde `from` subiendo y bajando de a un nivel. */
export function walkableFrom(a: ArenaDef, from: Pt): Set<string> {
  const seen = new Set<string>([`${from.x},${from.y}`]);
  const queue: Pt[] = [from];
  while (queue.length) {
    const p = queue.shift()!;
    for (const [dx, dy] of STEPS) {
      const n = { x: p.x + dx, y: p.y + dy };
      const k = `${n.x},${n.y}`;
      if (seen.has(k) || !isFloor(a, n.x, n.y)) continue;
      if (Math.abs(heightAt(a, n.x, n.y) - heightAt(a, p.x, p.y)) > 1) continue;
      seen.add(k);
      queue.push(n);
    }
  }
  return seen;
}

/** Problemas de una arena (vacío = OK). Las nuevas (gen 2) se revisan más a fondo. */
export function arenaProblems(a: ArenaDef): string[] {
  const out: string[] = [];
  const where = `arena ${a.id}`;
  const cols = a.terrain[0]?.length ?? 0;
  if (a.terrain.some((r) => r.length !== cols) || a.heights.length !== a.terrain.length || a.heights.some((r) => r.length !== cols)) {
    out.push(`${where}: filas de distinto largo`);
    return out;
  }
  a.terrain.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!CHARS.has(ch)) out.push(`${where}: carácter desconocido "${ch}" en (${x},${y})`);
    if (!/[0-9]/.test(a.heights[y][x])) out.push(`${where}: altura inválida en (${x},${y})`);
  }));
  const spots = [...a.partySpawns, ...a.enemySpawns, ...(a.ambushSpawns ?? [])];
  for (const p of spots) {
    if (!inBounds(a, p.x, p.y) || !isFloor(a, p.x, p.y)) out.push(`${where}: aparición en (${p.x},${p.y}) bloqueada`);
  }
  const keys = spots.map((p) => `${p.x},${p.y}`);
  if (new Set(keys).size !== keys.length) out.push(`${where}: hay apariciones repetidas`);
  if (a.enemySpawns.length < 7) out.push(`${where}: necesita 7 lugares de enemigos`);
  // Las viejas tienen 4 lugares para el grupo; si viene uno más, se ubica al lado.
  const party = a.gen === 2 ? BALANCE.MAX_PARTY_SIZE + 1 : 4;
  if (a.partySpawns.length < party) out.push(`${where}: necesita ${party} lugares para el grupo`);
  if (a.gen === 2 && !out.length) {
    // Con salto 1 se tiene que poder llegar de cualquier aparición a cualquier otra.
    const reach = walkableFrom(a, a.partySpawns[0]);
    for (const p of spots) if (!reach.has(`${p.x},${p.y}`)) out.push(`${where}: (${p.x},${p.y}) queda aislada (con salto 1 no se llega)`);
  }
  return out;
}

/** Arenas que se sacaron del juego y la que toma su lugar (para partidas guardadas en medio de un combate). */
export const RETIRED_ARENAS: Record<string, string> = {
  pradera_loma: 'pradera_terrazas',
  bosque_claro: 'bosque_hondonada',
  colinas_escalones: 'colinas_mesetas',
  cripta_sarcofagos: 'cripta_columnas',
};

/**
 * Pone al día un combate guardado con las arenas actuales: si su arena ya no existe, usa la que la reemplaza;
 * si alguna figura quedó fuera del suelo (la arena cambió de forma) o encima de otra, la corre a la casilla
 * libre más cercana; descarta efectos de terreno en casillas que ya no son suelo y prende la lava de la arena.
 * Devuelve si cambió algo.
 */
export function repairCombat(c: Content, cs: CombatState): boolean {
  let changed = false;
  if (!c.arenas[cs.arenaId]) {
    cs.arenaId = RETIRED_ARENAS[cs.arenaId] ?? Object.keys(c.arenas)[0];
    changed = true;
  }
  const a = c.arenas[cs.arenaId];
  const { cols, rows } = { cols: a.terrain[0].length, rows: a.terrain.length };
  const taken: Pt[] = [];
  for (const u of cs.units.filter((x) => x.alive)) {
    const clash = taken.some((t) => t.x === u.x && t.y === u.y);
    if (!isFloor(a, u.x, u.y) || clash) {
      const start = { x: Math.min(cols - 1, Math.max(0, u.x)), y: Math.min(rows - 1, Math.max(0, u.y)) };
      Object.assign(u, freeTileNear(a, start, taken));
      changed = true;
    }
    taken.push({ x: u.x, y: u.y });
  }
  for (const k of Object.keys(cs.terrainFx)) {
    const [x, y] = k.split(',').map(Number);
    if (!isFloor(a, x, y)) {
      delete cs.terrainFx[k];
      changed = true;
    }
  }
  a.terrain.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'l' && !cs.terrainFx[`${x},${y}`]) {
      cs.terrainFx[`${x},${y}`] = { kind: 'llamas', turns: 999 };
      changed = true;
    }
  }));
  if (cs.pending) cs.pending = cs.pending.filter((p) => p.tiles.every((t) => isFloor(a, t.x, t.y)));
  return changed;
}
