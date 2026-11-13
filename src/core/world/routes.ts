import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import type { Rng } from '../rng';
import { slotName } from '../time';
import type { GameState, TimeSlot } from '../types';
import { generateGroup, makeGroup } from './encounters';
import { pickEvent } from './eventPick';
import { findTiles, zoneAt } from './region';
import type { ExpeditionState, NodeOption, RegionDef, ResourceNode, RouteState, RouteStop, RouteStopKind, ZoneDef } from './types';

// Formato A: la región como un recorrido de paradas. Columna 0 = entrada; después, columnas por zona (de la más
// tranquila a la más profunda) y, si la región tiene jefe, su guarida al final. Las paradas usan las mismas piezas
// que el mapa: recursos (ResourceNode) y grupos de monstruos (MonsterGroup), con coordenadas (columna, fila).

const EX = BALANCE.expedition;
const RT = EX.route;
const ROWS = 3;

export function stopAt(route: RouteState, id = route.at): RouteStop {
  return route.stops.find((st) => st.id === id)!;
}

/** Recurso de la zona: veta, árbol, hierba o gema, con su material. */
function resourceNode(e: ExpeditionState, zone: ZoneDef, rng: Rng, p: { x: number; y: number }): ResourceNode | null {
  const kinds: [ResourceNode['kind'], NodeOption[], number][] = [
    ['veta', zone.vetas, 3], ['arbol', zone.arboles, 3], ['hierba', zone.hierbas ?? [], 2], ['gema', zone.gemas ?? [], 1],
  ];
  const usable = kinds.filter(([, opts]) => opts.length);
  if (!usable.length) return null;
  const [kind, options] = rng.weighted(usable.map((k) => [k, k[2]] as const));
  const opt = rng.weighted(options.map((o) => [o, o.weight] as const));
  return {
    id: `n${e.nextId++}`, x: p.x, y: p.y, kind, material: opt.material, tier: opt.tier, qty: opt.qty,
    uses: kind === 'gema' ? 1 : rng.int(EX.nodeUses[0], EX.nodeUses[1]), night: opt.night,
  };
}

/** Llena una parada con lo que le corresponde (recurso, grupo, evento...). Puede cambiarle el tipo si no hay de eso. */
function fill(c: Content, e: ExpeditionState, r: RegionDef, st: RouteStop, rng: Rng, slot: TimeSlot, usedEvents: string[]) {
  const zone = r.zoneDefs[st.zone];
  const p = { x: st.col, y: st.row };
  const node = (kind: ResourceNode['kind'], extra: Partial<ResourceNode> = {}) => {
    const n: ResourceNode = { id: `n${e.nextId++}`, x: p.x, y: p.y, kind, material: '', tier: 0, qty: [0, 0], uses: 1, ...extra };
    e.nodes.push(n);
    st.ref = n.id;
  };
  switch (st.kind) {
    case 'recurso': {
      const n = resourceNode(e, zone, rng, p);
      if (n) {
        e.nodes.push(n);
        st.ref = n.id;
        return;
      }
      // Zona sin recursos: la parada pasa a ser de monstruos.
      st.kind = 'monstruos';
      return fill(c, e, r, st, rng, slot, usedEvents);
    }
    case 'monstruos':
    case 'desafio': {
      const g = generateGroup(c, zone, slot, rng, st.kind === 'desafio' ? EX.challengeBudgetMult : 1);
      const group = makeGroup(c, e, p, st.zone, g.monsters, { aggressive: false, challenge: st.kind === 'desafio' });
      e.groups.push(group);
      st.ref = group.id;
      return;
    }
    case 'evento': {
      const ev = pickEvent(c, zone, rng, usedEvents);
      if (!ev) {
        st.kind = 'recurso';
        return fill(c, e, r, st, rng, slot, usedEvents);
      }
      usedEvents.push(ev);
      return node('evento', { event: ev });
    }
    case 'cofre':
      if (!zone.cofres) {
        st.kind = 'recurso';
        return fill(c, e, r, st, rng, slot, usedEvents);
      }
      return node('cofre');
    case 'campamento':
      return node('campamento');
    case 'jefe': {
      const group = makeGroup(c, e, p, st.zone, r.boss!.monsters, { boss: true, aggressive: false });
      e.groups.push(group);
      st.ref = group.id;
      return;
    }
    default:
  }
}

/** Arma el recorrido de la región: paradas, caminos entre ellas y lo que hay en cada una. */
export function generateRoute(c: Content, s: GameState, rng: Rng, r: RegionDef): RouteState {
  const e = s.expedition!;
  const zoneCols = r.zoneDefs.length * RT.colsPerZone;
  const cols = 1 + zoneCols + (r.boss ? 1 : 0);
  const stops: RouteStop[] = [];
  const add = (col: number, row: number, kind: RouteStopKind, zone: number) => {
    const st: RouteStop = { id: `s${col}_${row}`, col, row, kind, zone, links: [] };
    stops.push(st);
    return st;
  };
  add(0, 1, 'entrada', 0).visited = true;

  // La entrada escondida a una mazmorra (si todavía no se encontró) es una parada de hallazgo en su zona.
  const hidden = findTiles(r, 'P')[0];
  const dungeon = Object.values(c.dungeons).find((d) => d.entrance === r.id && d.unlock.flag && !s.flags[d.unlock.flag]);
  const hiddenZone = hidden && dungeon ? zoneAt(r, hidden.x, hidden.y) : -1;
  let camp = false;

  for (let col = 1; col <= zoneCols; col++) {
    const zone = Math.floor((col - 1) / RT.colsPerZone);
    const n = rng.int(RT.stopsPerCol[0], RT.stopsPerCol[1]);
    const rows = n >= ROWS ? [0, 1, 2] : rng.chance(0.5) ? [0, 2] : rng.pick([[0, 1], [1, 2]]);
    for (const row of rows) {
      const weights = Object.entries(RT.weights)
        .filter(([k]) => !(k === 'desafio' && zone === 0) && !(k === 'campamento' && (camp || col < 2)))
        .map(([k, w]) => [k as RouteStopKind, w] as const);
      const kind = rng.weighted(weights);
      if (kind === 'campamento') camp = true;
      add(col, row, kind, zone);
    }
    // El hallazgo va en la última columna de su zona.
    if (zone === hiddenZone && col === (zone + 1) * RT.colsPerZone) {
      const st = stops.filter((x) => x.col === col)[0];
      st.kind = 'hallazgo';
    }
  }
  if (r.boss) add(cols - 1, 1, 'jefe', r.boss.zone - 1);

  // Caminos: cada parada sigue a las de la columna siguiente que están a una fila o menos; ninguna queda sin entrada.
  for (let col = 0; col < cols - 1; col++) {
    const here = stops.filter((st) => st.col === col);
    const next = stops.filter((st) => st.col === col + 1);
    for (const st of here) {
      const near = next.filter((t) => Math.abs(t.row - st.row) <= 1);
      const targets = near.length ? near : [next.reduce((a, b) => (Math.abs(b.row - st.row) < Math.abs(a.row - st.row) ? b : a))];
      st.links = targets.map((t) => t.id);
    }
    for (const t of next) {
      if (here.some((st) => st.links.includes(t.id))) continue;
      const from = here.reduce((a, b) => (Math.abs(b.row - t.row) < Math.abs(a.row - t.row) ? b : a));
      from.links.push(t.id);
    }
  }

  const usedEvents: string[] = [];
  const slot = slotName(s);
  for (const st of stops) fill(c, e, r, st, rng, slot, usedEvents);
  const start = stops[0];
  e.pos = { x: start.col, y: start.row };
  return { stops, at: start.id, cols };
}

/** De noche aparecen monstruos en paradas que todavía no se visitaron (más adelante en el recorrido). */
export function routeNightSpawn(c: Content, s: GameState, rng: Rng, r: RegionDef, count: number, slot: TimeSlot): number {
  const e = s.expedition!;
  const route = e.route!;
  const here = stopAt(route);
  const candidates = route.stops.filter((st) => !st.visited && st.col > here.col && ['recurso', 'evento', 'cofre'].includes(st.kind));
  let added = 0;
  for (let i = 0; i < count && candidates.length; i++) {
    const st = candidates.splice(rng.int(0, candidates.length - 1), 1)[0];
    e.nodes = e.nodes.filter((n) => n.id !== st.ref);
    const g = generateGroup(c, r.zoneDefs[st.zone], slot, rng);
    const group = makeGroup(c, e, { x: st.col, y: st.row }, st.zone, g.monsters, { aggressive: false });
    e.groups.push(group);
    st.kind = 'monstruos';
    st.ref = group.id;
    added++;
  }
  return added;
}
