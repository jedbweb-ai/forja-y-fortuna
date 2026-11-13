import { BALANCE } from '../../config/balance';
import { heightAt, inBounds, isFloor, type Pt } from './grid';
import type { ArenaDef } from './types';

const CHARS = new Set([...'.:=,wl #TRC']);
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
