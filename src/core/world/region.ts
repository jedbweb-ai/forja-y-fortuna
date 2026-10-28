import type { RegionDef } from './types';

export interface Pt {
  x: number;
  y: number;
}

const WALKABLE = new Set(['.', ',', '=', 'm', 'B', 'E', 'S', 'P']);
export const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function regionSize(r: RegionDef) {
  return { cols: r.terrain[0]?.length ?? 0, rows: r.terrain.length };
}

export function tileAt(r: RegionDef, x: number, y: number): string {
  return r.terrain[y]?.[x] ?? 'T';
}

export function heightAt(r: RegionDef, x: number, y: number): number {
  return Number(r.heights[y]?.[x] ?? 0);
}

/** Zona (índice desde 0) de una casilla. */
export function zoneAt(r: RegionDef, x: number, y: number): number {
  return Math.max(0, Number(r.zones[y]?.[x] ?? 1) - 1);
}

export function isWalkable(r: RegionDef, x: number, y: number): boolean {
  return WALKABLE.has(tileAt(r, x, y));
}

export function findTiles(r: RegionDef, ch: string): Pt[] {
  const out: Pt[] = [];
  r.terrain.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push({ x, y }); }));
  return out;
}

export function adjacent(a: Pt, b: Pt): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

/** Camino más corto por casillas caminables (sin subir más de 1 nivel por paso). */
export function regionPath(r: RegionDef, from: Pt, to: Pt, blocked: (p: Pt) => boolean = () => false): Pt[] | null {
  const key = (p: Pt) => `${p.x},${p.y}`;
  if (!isWalkable(r, to.x, to.y)) return null;
  const prev = new Map<string, Pt | null>([[key(from), null]]);
  const queue: Pt[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.x === to.x && cur.y === to.y) {
      const path: Pt[] = [];
      for (let p: Pt | null = cur; p; p = prev.get(key(p)) ?? null) path.unshift(p);
      return path.slice(1);
    }
    for (const [dx, dy] of DIRS) {
      const n = { x: cur.x + dx, y: cur.y + dy };
      if (prev.has(key(n)) || !isWalkable(r, n.x, n.y)) continue;
      if (Math.abs(heightAt(r, n.x, n.y) - heightAt(r, cur.x, cur.y)) > 1) continue;
      if (blocked(n) && !(n.x === to.x && n.y === to.y)) continue;
      prev.set(key(n), cur);
      queue.push(n);
    }
  }
  return null;
}
