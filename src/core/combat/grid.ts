import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import type { ArenaDef, CombatSkill, CombatState, CombatUnit, Dir } from './types';

export interface Pt {
  x: number;
  y: number;
}

export interface Reach extends Pt {
  cost: number;
  path: Pt[];
}

export const DIR_VEC: Record<Dir, [number, number]> = { 0: [1, 0], 1: [0, 1], 2: [-1, 0], 3: [0, -1] };
const STEPS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function arenaOf(c: Content, cs: CombatState): ArenaDef {
  return c.arenas[cs.arenaId];
}

export function arenaSize(a: ArenaDef) {
  return { cols: a.terrain[0].length, rows: a.terrain.length };
}

export function inBounds(a: ArenaDef, x: number, y: number): boolean {
  const { cols, rows } = arenaSize(a);
  return x >= 0 && y >= 0 && x < cols && y < rows;
}

export function terrainAt(a: ArenaDef, x: number, y: number): string {
  return a.terrain[y]?.[x] ?? '#';
}

export function heightAt(a: ArenaDef, x: number, y: number): number {
  return Number(a.heights[y]?.[x] ?? 0);
}

export function isFloor(a: ArenaDef, x: number, y: number): boolean {
  return inBounds(a, x, y) && terrainAt(a, x, y) !== '#';
}

export function unitAt(cs: CombatState, x: number, y: number): CombatUnit | undefined {
  return cs.units.find((u) => u.alive && u.x === x && u.y === y);
}

export function dist(a: Pt, b: Pt): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function dirTo(from: Pt, to: Pt): Dir {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 0 : 2;
  return dy >= 0 ? 1 : 3;
}

/** De qué lado recibe el golpe el defensor según hacia dónde mira. */
export function attackSide(defender: CombatUnit, from: Pt): 'front' | 'side' | 'back' {
  const [fx, fy] = DIR_VEC[defender.facing];
  const dx = from.x - defender.x;
  const dy = from.y - defender.y;
  const front = dx * fx + dy * fy;
  const side = Math.abs(dx * fy - dy * fx);
  if (front > 0 && front >= side) return 'front';
  if (front < 0 && -front >= side) return 'back';
  return 'side';
}

export function hasStatus(u: CombatUnit, id: string): boolean {
  return u.statuses.some((s) => s.id === id && s.turns > 0);
}

export function effectiveMove(u: CombatUnit): number {
  if (hasStatus(u, 'inmovilizado')) return 0;
  return Math.max(0, u.move - (hasStatus(u, 'ralentizado') ? 1 : 0));
}

/** Casillas a las que puede moverse una unidad (Dijkstra con costo de terreno y salto). */
export function reachable(c: Content, cs: CombatState, u: CombatUnit): Map<string, Reach> {
  const a = arenaOf(c, cs);
  const budget = effectiveMove(u);
  const key = (p: Pt) => `${p.x},${p.y}`;
  const best = new Map<string, Reach>([[key(u), { x: u.x, y: u.y, cost: 0, path: [] }]]);
  const open: Reach[] = [{ x: u.x, y: u.y, cost: 0, path: [] }];
  while (open.length) {
    open.sort((p, q) => p.cost - q.cost);
    const cur = open.shift()!;
    for (const [dx, dy] of STEPS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!isFloor(a, nx, ny)) continue;
      if (Math.abs(heightAt(a, nx, ny) - heightAt(a, cur.x, cur.y)) > u.jump) continue;
      const other = unitAt(cs, nx, ny);
      if (other && other.side !== u.side) continue; // los enemigos bloquean el paso
      const cost = cur.cost + (terrainAt(a, nx, ny) === 'w' ? BALANCE.combat.waterMoveCost : 1);
      if (cost > budget) continue;
      const k = key({ x: nx, y: ny });
      if ((best.get(k)?.cost ?? Infinity) <= cost) continue;
      const step = { x: nx, y: ny, cost, path: [...cur.path, { x: nx, y: ny }] };
      best.set(k, step);
      open.push(step);
    }
  }
  // No se puede terminar en una casilla ocupada (salvo la propia).
  for (const [k, r] of best) if (r.cost > 0 && unitAt(cs, r.x, r.y)) best.delete(k);
  return best;
}

/** Alcance real de una acción: las de distancia ganan alcance desde la altura. */
export function skillRange(c: Content, cs: CombatState, u: CombatUnit, skill: CombatSkill, from: Pt = u, target?: Pt): [number, number] {
  let max = skill.range[1];
  if (skill.ammo || skill.range[1] > 1) {
    max += u.combat.range ?? 0;
    if (target) {
      const a = arenaOf(c, cs);
      const diff = heightAt(a, from.x, from.y) - heightAt(a, target.x, target.y);
      max += Math.max(0, Math.floor(diff * BALANCE.combat.rangePerHeight));
    }
  }
  return [skill.range[0], max];
}

/** ¿Puede embestir en línea recta hasta el objetivo? Devuelve la casilla donde termina la carga. */
export function chargeLanding(c: Content, cs: CombatState, u: CombatUnit, from: Pt, target: Pt, maxCharge: number): Pt | null {
  if (from.x !== target.x && from.y !== target.y) return null;
  const d = dist(from, target);
  if (d < 2 || d > maxCharge + 1) return null;
  const a = arenaOf(c, cs);
  const sx = Math.sign(target.x - from.x);
  const sy = Math.sign(target.y - from.y);
  let prev = from;
  for (let i = 1; i < d; i++) {
    const p = { x: from.x + sx * i, y: from.y + sy * i };
    if (!isFloor(a, p.x, p.y)) return null;
    const occ = unitAt(cs, p.x, p.y);
    if (occ && occ !== u) return null;
    if (Math.abs(heightAt(a, p.x, p.y) - heightAt(a, prev.x, prev.y)) > u.jump) return null;
    prev = p;
  }
  return prev;
}

/** Unidades que una acción puede alcanzar desde una posición. */
export function targetsFor(c: Content, cs: CombatState, u: CombatUnit, skill: CombatSkill, from: Pt = u): CombatUnit[] {
  const alive = cs.units.filter((t) => t.alive);
  if (skill.target === 'self') return [u];
  const pool = skill.target === 'ally' ? alive.filter((t) => t.side === u.side) : alive.filter((t) => t.side !== u.side);
  return pool.filter((t) => {
    if (skill.charge && dist(from, t) > 1) return !!chargeLanding(c, cs, u, from, t, skill.charge);
    const [min, max] = skillRange(c, cs, u, skill, from, t);
    const d = t === u ? 0 : dist(from, t);
    return d >= min && d <= max;
  });
}
