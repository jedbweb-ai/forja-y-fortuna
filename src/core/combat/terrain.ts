import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import type { Affinity } from '../types';
import { arenaOf, DIR_VEC, dirTo, inBounds, isFloor, terrainAt, unitAt, type Pt } from './grid';
import type { CombatFx, CombatSkill, CombatState, TerrainKind } from './types';

const TR = BALANCE.terrain;
const key = (p: Pt) => `${p.x},${p.y}`;

export function terrainFxAt(cs: CombatState, p: Pt): TerrainKind | undefined {
  return cs.terrainFx[key(p)]?.kind;
}

/** ¿La casilla tiene agua líquida (agua del mapa sin congelar, o charco)? */
export function isWet(c: Content, cs: CombatState, p: Pt): boolean {
  const fx = terrainFxAt(cs, p);
  if (fx === 'hielo') return false;
  return fx === 'charco' || terrainAt(arenaOf(c, cs), p.x, p.y) === 'w';
}

/** Hierba alta que todavía no se quemó. */
export function isGrass(c: Content, cs: CombatState, p: Pt): boolean {
  return terrainAt(arenaOf(c, cs), p.x, p.y) === ',' && !cs.burnt.includes(key(p));
}

/** Casillas que cubre una acción según su forma (cono y línea salen del atacante hacia el objetivo). */
export function areaTiles(c: Content, cs: CombatState, from: Pt, skill: CombatSkill, target: Pt): Pt[] {
  const a = arenaOf(c, cs);
  const size = skill.size ?? 1;
  const out: Pt[] = [];
  const push = (p: Pt) => { if (inBounds(a, p.x, p.y) && isFloor(a, p.x, p.y) && !out.some((q) => q.x === p.x && q.y === p.y)) out.push(p); };
  const dir = DIR_VEC[dirTo(from, target)];
  switch (skill.area) {
    case 'line':
      for (let i = 1; i <= size; i++) push({ x: from.x + dir[0] * i, y: from.y + dir[1] * i });
      break;
    case 'cone':
      for (let i = 1; i <= size; i++) {
        for (let w = -(i - 1); w <= i - 1; w++) push({ x: from.x + dir[0] * i + dir[1] * w, y: from.y + dir[1] * i + dir[0] * w });
      }
      break;
    case 'radius': {
      const center = skill.target === 'self' ? from : target;
      for (let dx = -size; dx <= size; dx++) {
        for (let dy = -size; dy <= size; dy++) {
          if (Math.abs(dx) + Math.abs(dy) > size) continue;
          if (skill.target === 'self' && dx === 0 && dy === 0) continue;
          push({ x: center.x + dx, y: center.y + dy });
        }
      }
      break;
    }
    case 'adjacent':
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) push({ x: from.x + dx, y: from.y + dy });
      break;
    default:
      push(target);
  }
  return out;
}

/** Terreno que deja una bomba según el elemento de su carga. */
export function terrainForElement(el: Affinity | undefined): TerrainKind | undefined {
  if (el === 'fuego') return 'llamas';
  if (el === 'hielo') return 'hielo';
  if (el === 'agua') return 'charco';
  return undefined;
}

/**
 * Aplica un efecto de terreno:
 * - hielo: congela el agua y los charcos (y apaga llamas);
 * - llamas: prende la hierba alta (y se propaga a la hierba vecina); los charcos la apagan;
 * - charco: moja el suelo y apaga las llamas.
 * Devuelve las casillas afectadas.
 */
export function applyTerrain(c: Content, cs: CombatState, tiles: Pt[], kind: TerrainKind): Pt[] {
  const changed: Pt[] = [];
  const set = (p: Pt, k: TerrainKind, turns: number) => {
    cs.terrainFx[key(p)] = { kind: k, turns };
    changed.push(p);
  };
  for (const p of tiles) {
    const fx = terrainFxAt(cs, p);
    if (kind === 'hielo' && isWet(c, cs, p)) set(p, 'hielo', TR.hieloTurns);
    else if (kind === 'hielo' && fx === 'llamas') { delete cs.terrainFx[key(p)]; changed.push(p); }
    else if (kind === 'charco' && terrainAt(arenaOf(c, cs), p.x, p.y) !== 'w') set(p, 'charco', TR.charcoTurns);
    else if (kind === 'llamas' && isGrass(c, cs, p) && fx !== 'charco') set(p, 'llamas', TR.llamasTurns);
  }
  // El fuego se propaga una vez a la hierba vecina.
  if (kind === 'llamas') {
    for (const p of [...changed]) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: p.x + dx, y: p.y + dy };
        if (isGrass(c, cs, n) && !terrainFxAt(cs, n)) set(n, 'llamas', TR.llamasTurns);
      }
    }
  }
  return changed;
}

/** Casillas de agua conectadas a una casilla (por donde corre el rayo). */
export function waterNetwork(c: Content, cs: CombatState, start: Pt): Pt[] {
  if (!isWet(c, cs, start)) return [{ x: start.x, y: start.y }];
  const seen = new Set([key(start)]);
  const queue: Pt[] = [{ x: start.x, y: start.y }];
  const out: Pt[] = [];
  while (queue.length) {
    const p = queue.shift()!;
    out.push(p);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (seen.has(key(n)) || !isWet(c, cs, n)) continue;
      seen.add(key(n));
      queue.push(n);
    }
  }
  return out;
}

/** Al empezar una ronda, los efectos de terreno pierden un turno; la hierba que ardió queda quemada. */
export function decayTerrain(cs: CombatState, fx: CombatFx[]) {
  const cleared: Pt[] = [];
  for (const [k, v] of Object.entries(cs.terrainFx)) {
    v.turns -= 1;
    if (v.turns > 0) continue;
    if (v.kind === 'llamas') cs.burnt.push(k);
    delete cs.terrainFx[k];
    const [x, y] = k.split(',').map(Number);
    cleared.push({ x, y });
  }
  if (cleared.length) fx.push({ kind: 'terrain', tiles: cleared, terrain: null });
}

export function unitsOn(cs: CombatState, tiles: Pt[]) {
  return tiles.map((p) => unitAt(cs, p.x, p.y)).filter((u): u is NonNullable<typeof u> => !!u);
}
