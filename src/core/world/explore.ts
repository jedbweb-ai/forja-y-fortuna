import { BALANCE } from '../../config/balance';
import { addToBag, bagLoad, bestTool, toolTier } from '../combat/result';
import { GameError, type Content, type Ctx } from '../content';
import { acquireGrimoire, hasGrimoire } from '../magic/grimoires';
import { maxHp } from '../party/progression';
import { bonus } from '../progress/progress';
import type { Rng } from '../rng';
import { addXp, skillLevel } from '../state';
import { advanceTime, slotName } from '../time';
import type { GameEvent, GameState } from '../types';
import { generateGroup, makeGroup } from './encounters';
import { engageGroup, expedition, JOBS, nodeInReach, spendEnergy } from './expedition';
import { zoneAt } from './region';
import { stopAt } from './routes';
import type { ExpEffect, ExpeditionState, NodeOption, ResourceNode, ZoneDef } from './types';

// Acciones de exploración comunes a los dos formatos (etapa 3): recolectar un lugar de una vez, descansar en un
// campamento, resolver eventos y (formato A) avanzar por las paradas del recorrido.

const EX = BALANCE.expedition;
const HV = EX.harvest;

function nodeOf(e: ExpeditionState, nodeId: string): ResourceNode {
  const node = e.nodes.find((n) => n.id === nodeId);
  if (!node) throw new GameError('Ahí ya no queda nada.');
  if (!nodeInReach(e, node)) throw new GameError('Acercate primero.');
  return node;
}

/** Zona (índice) de un lugar: en el recorrido, la de la parada; en el mapa, la de la casilla. */
function zoneIndexOf(c: Content, e: ExpeditionState, node: { id: string; x: number; y: number }): number {
  if (e.route) return e.route.stops.find((st) => st.ref === node.id)?.zone ?? 0;
  return zoneAt(c.regions[e.regionId], node.x, node.y);
}

function zoneOf(c: Content, e: ExpeditionState, node: { id: string; x: number; y: number }): ZoneDef {
  return c.regions[e.regionId].zoneDefs[zoneIndexOf(c, e, node)];
}

function busy(e: ExpeditionState) {
  if (e.combat || e.report) throw new GameError('Primero terminá el combate.');
  if (e.event) throw new GameError('Primero resolvé lo que está pasando.');
}

// ───────────────────────── Recolectar de una vez ─────────────────────────

export type HarvestMode = 'rapido' | 'cuidado';

export interface HarvestInfo {
  /** Por qué no se puede (falta herramienta, es de noche, bolsa llena...). */
  blocked?: string;
  uses: number;
  rapido: { energy: number; qty: [number, number] };
  cuidado: { energy: number; qty: [number, number]; rare: number };
}

function skillFor(node: ResourceNode) {
  return JOBS[node.kind as keyof typeof JOBS];
}

/** Lo que se ve antes de elegir: energía, cantidad esperada y chance de algo raro. */
export function harvestInfo(c: Content, s: GameState, node: ResourceNode): HarvestInfo {
  const e = s.expedition!;
  const job = skillFor(node);
  const level = job ? skillLevel(s.skills[job[0]]) : 1;
  const [lo, hi] = node.qty;
  const info: HarvestInfo = {
    uses: node.uses,
    rapido: { energy: HV.fastEnergy, qty: [Math.max(1, Math.round(lo * node.uses * HV.fastFactor)), Math.max(1, Math.round(hi * node.uses * HV.fastFactor))] },
    cuidado: { energy: HV.carefulEnergy + node.uses * HV.carefulEnergyPerUse, qty: [lo * node.uses, hi * node.uses], rare: Math.min(0.9, HV.rareChance + (level - 1) * HV.rarePerLevel) },
  };
  if (!job) return { ...info, blocked: 'Eso no se recolecta.' };
  const tool = bestTool(s, job[0]);
  const mat = c.materials[node.material];
  if (!tool) info.blocked = `Necesitás ${job[1] === 'hoz' ? 'una' : 'un'} ${job[1]}.`;
  else if (toolTier(tool.stats.atk) < node.tier) info.blocked = `${mat.name} necesita una herramienta más potente (potencia ${BALANCE.tools.tierPower[node.tier - 1]}).`;
  else if (node.night && slotName(s) !== 'noche') info.blocked = `${mat.name} solo se puede cortar de noche.`;
  else if (bagLoad(e.bag) >= e.capacity) info.blocked = 'La bolsa está llena.';
  return info;
}

/** Algo más raro de la misma zona: la opción de mayor nivel que la herramienta alcanza (o una gema, en las vetas). */
function rareFind(c: Content, zone: ZoneDef, node: ResourceNode, tier: number, rng: Rng): NodeOption | undefined {
  const pool: NodeOption[] = ({ veta: [...zone.vetas, ...(zone.gemas ?? [])], gema: zone.gemas ?? [], arbol: zone.arboles, hierba: zone.hierbas ?? [] } as Record<string, NodeOption[]>)[node.kind] ?? [];
  const options = pool.filter((o) => o.material !== node.material && o.tier <= tier && c.materials[o.material]);
  if (!options.length) return undefined;
  const best = Math.max(...options.map((o) => o.tier));
  return rng.pick(options.filter((o) => o.tier === best));
}

/** Trabaja un lugar entero de una vez: rápido (poca energía, parte de lo que da) o con cuidado (todo, y quizás algo raro). */
export function harvest(s: GameState, { c, rng }: Ctx, nodeId: string, mode: HarvestMode): GameEvent[] {
  const e = expedition(s);
  busy(e);
  const node = nodeOf(e, nodeId);
  const info = harvestInfo(c, s, node);
  if (info.blocked) throw new GameError(info.blocked);
  const cost = info[mode].energy;
  if (e.energy < cost && !e.dungeon) throw new GameError('No te queda energía para eso.');
  const job = skillFor(node)!;
  const skill = job[0];
  const level = skillLevel(s.skills[skill]);
  const tool = bestTool(s, skill)!;
  const talentKey = ({ mineria: 'mineriaExtra', tala: 'talaExtra', siega: 'siegaExtra' } as const)[skill];
  let qty = 0;
  for (let i = 0; i < node.uses; i++) {
    qty += rng.int(node.qty[0], node.qty[1]);
    if (rng.chance((level - 1) * BALANCE.tools.gatherBonusPerLevel + bonus(c, s, talentKey))) qty += 1;
    if (tool.traits.includes('veta_certera') && rng.chance(0.25)) qty += 1;
  }
  if (mode === 'rapido') qty = Math.max(1, Math.round(qty * HV.fastFactor));
  const mat = c.materials[node.material];
  const got = addToBag(s, node.material, qty);
  const notes = [`+${got} ${mat.name}`];
  if (mode === 'cuidado' && rng.chance(info.cuidado.rare)) {
    const rare = rareFind(c, zoneOf(c, e, node), node, toolTier(tool.stats.atk), rng);
    const extra = rare ? addToBag(s, rare.material, 1) : addToBag(s, node.material, 1);
    if (extra) notes.push(rare ? `¡y ${c.materials[rare.material].name}!` : '+1 más');
  }
  tool.durability = Math.max(0, tool.durability - (mode === 'cuidado' ? node.uses : 1) * BALANCE.tools.wearPerUse);
  e.nodes = e.nodes.filter((n) => n.id !== node.id);
  addXp(s, skill, mode === 'cuidado' ? 4 * node.uses : 3);
  return [
    { type: 'gathered', nodeId, material: node.material, qty: got },
    { type: 'toast', text: `${notes.join(' ')}${got < qty ? ' (la bolsa se llenó)' : ''}`, tone: 'good' },
    ...spendEnergy(c, s, rng, cost),
  ];
}

// ───────────────────────── Campamento ─────────────────────────

/** Descansar en un campamento: recupera energía y algo de vida, pero pasa tiempo. Se usa una vez. */
export function restAtCamp(s: GameState, { c, rng }: Ctx, nodeId: string): GameEvent[] {
  const e = expedition(s);
  busy(e);
  const node = nodeOf(e, nodeId);
  if (node.kind !== 'campamento') throw new GameError('Ahí no se puede acampar.');
  e.nodes = e.nodes.filter((n) => n.id !== node.id);
  const before = e.energy;
  e.energy = Math.min(e.maxEnergy, e.energy + EX.camp.energy);
  for (const id of e.members) {
    const ch = s.characters[id];
    if (ch) ch.hp = Math.min(maxHp(ch), ch.hp + Math.round(maxHp(ch) * EX.camp.healPct));
  }
  const events = advanceTime(s, EX.camp.slots);
  // Al pasar el tiempo puede caer la noche: se usan las reglas de siempre (energía 0 no avanza nada más).
  events.push(...spendEnergy(c, s, rng, 0));
  return [{ type: 'toast', text: `Acampan junto al fuego: +${Math.round(e.energy - before)} de energía.`, tone: 'good' }, ...events];
}

// ───────────────────────── Eventos ─────────────────────────

/** Abre el evento de un lugar: queda esperando la elección. */
export function openEvent(s: GameState, { c }: Ctx, nodeId: string): GameEvent[] {
  const e = expedition(s);
  busy(e);
  const node = nodeOf(e, nodeId);
  if (node.kind !== 'evento' || !node.event || !c.expeditionEvents[node.event]) throw new GameError('Ahí no pasa nada.');
  e.event = { id: node.event, nodeId, zone: zoneIndexOf(c, e, node) };
  return [];
}

/** ¿Se puede elegir esa opción? Devuelve el motivo si no. */
export function optionBlocked(c: Content, s: GameState, eventId: string, index: number): string | undefined {
  const opt = c.expeditionEvents[eventId]?.options[index];
  if (!opt) return 'Opción inexistente.';
  const req = opt.requires;
  if (!req) return undefined;
  if (req.gold && s.gold < req.gold) return `Necesitás ${req.gold} de oro.`;
  if (req.material && (s.expedition?.bag[req.material.id] ?? 0) < req.material.qty) return `Necesitás ${req.material.qty} de ${c.materials[req.material.id]?.name ?? req.material.id} en la bolsa.`;
  if (req.skill && skillLevel(s.skills[req.skill.id]) < req.skill.level) return `Necesitás ${req.skill.id} a nivel ${req.skill.level}.`;
  return undefined;
}

/** Material al azar de una de las listas de la zona. */
function zonePick(c: Content, zone: ZoneDef, pool: 'vetas' | 'arboles' | 'hierbas' | 'gemas' | 'cofre', rng: Rng): string | undefined {
  if (pool === 'cofre') {
    const list = (zone.cofres?.materials ?? []).filter((m) => c.materials[m.material]);
    return list.length ? rng.weighted(list.map((m) => [m.material, m.chance] as const)) : undefined;
  }
  const list = (zone[pool] ?? []).filter((o) => c.materials[o.material]);
  return list.length ? rng.weighted(list.map((o) => [o.material, o.weight] as const)) : undefined;
}

/** Aplica los efectos de un resultado. Devuelve lo que pasó (para el texto) y si sale una pelea. */
function applyEffects(c: Content, s: GameState, rng: Rng, zone: ZoneDef, effects: ExpEffect[]): { notes: string[]; events: GameEvent[]; fight?: number } {
  const e = s.expedition!;
  const notes: string[] = [];
  const events: GameEvent[] = [];
  let fight: number | undefined;
  const give = (material: string, qty: number) => {
    const got = addToBag(s, material, qty);
    notes.push(got ? `+${got} ${c.materials[material].name}` : 'la bolsa está llena');
  };
  for (const fx of effects) {
    switch (fx.kind) {
      case 'gold': {
        const n = rng.int(fx.amount[0], fx.amount[1]);
        s.gold += n;
        notes.push(`+${n} de oro`);
        break;
      }
      case 'material':
        give(fx.material, rng.int(fx.qty[0], fx.qty[1]));
        break;
      case 'zoneMaterial': {
        const id = zonePick(c, zone, fx.pool, rng);
        if (id) give(id, rng.int(fx.qty[0], fx.qty[1]));
        else {
          const n = rng.int(5, 15);
          s.gold += n;
          notes.push(`+${n} de oro`);
        }
        break;
      }
      case 'energy':
        if (fx.amount >= 0) {
          e.energy = Math.min(e.maxEnergy, e.energy + fx.amount);
          notes.push(`+${fx.amount} de energía`);
        } else {
          events.push(...spendEnergy(c, s, rng, -fx.amount));
          notes.push(`${fx.amount} de energía`);
        }
        break;
      case 'health':
        for (const id of e.members) {
          const ch = s.characters[id];
          if (ch) ch.hp = Math.max(1, Math.min(maxHp(ch), ch.hp + Math.round(maxHp(ch) * fx.pct)));
        }
        notes.push(fx.pct >= 0 ? 'el grupo se recupera' : 'el grupo sale lastimado');
        break;
      case 'grimoire': {
        const left = (zone.cofres?.grimoires ?? []).filter((g) => !hasGrimoire(s, g.id) && c.grimoires[g.id]);
        if (left.length) events.push(...acquireGrimoire(s, c, rng.pick(left).id));
        else {
          const id = zonePick(c, zone, 'cofre', rng);
          if (id) give(id, 1);
        }
        break;
      }
      case 'xp':
        addXp(s, fx.skill, fx.amount);
        break;
      case 'time':
        events.push(...advanceTime(s, fx.slots));
        notes.push(`pasa ${fx.slots === 1 ? 'una franja' : `${fx.slots} franjas`}`);
        break;
      case 'fight':
        fight = fx.budgetMult;
        break;
    }
  }
  return { notes, events, fight };
}

/** Elige una opción del evento abierto: paga lo que pide, tira el resultado y lo aplica. Si sale una pelea, empieza. */
export function chooseEventOption(s: GameState, { c, rng }: Ctx, index: number): GameEvent[] {
  const e = expedition(s);
  const active = e.event;
  if (!active || active.result) throw new GameError('No hay nada para elegir.');
  const def = c.expeditionEvents[active.id];
  const reason = optionBlocked(c, s, active.id, index);
  if (reason) throw new GameError(reason);
  const opt = def.options[index];
  if (opt.requires?.gold) s.gold -= opt.requires.gold;
  if (opt.requires?.material) e.bag[opt.requires.material.id] -= opt.requires.material.qty;
  const outcome = rng.weighted(opt.outcomes.map((o) => [o, o.weight] as const));
  const zone = c.regions[e.regionId].zoneDefs[active.zone];
  const node = e.nodes.find((n) => n.id === active.nodeId);
  e.nodes = e.nodes.filter((n) => n.id !== active.nodeId);
  const { notes, events, fight } = applyEffects(c, s, rng, zone, outcome.effects);
  if (fight !== undefined && s.expedition) {
    e.event = null;
    const g = generateGroup(c, zone, slotName(s), rng, fight);
    const group = makeGroup(c, e, node ?? e.pos, active.zone, g.monsters, { aggressive: false });
    e.groups.push(group);
    return [{ type: 'toast', text: outcome.text, tone: 'bad' }, ...events, ...engageGroup(c, s, rng, group)];
  }
  if (s.expedition) e.event = { ...active, result: [outcome.text, notes.length ? `(${notes.join(', ')})` : ''].filter(Boolean).join(' ') };
  return events;
}

/** Cierra el cartel del evento (después de leer el resultado, o para no hacer nada). */
export function closeEvent(s: GameState): GameEvent[] {
  const e = expedition(s);
  if (e.event && !e.event.result) e.nodes = e.nodes.filter((n) => n.id !== e.event!.nodeId);
  e.event = null;
  return [];
}

// ───────────────────────── Formato A: avanzar por las paradas ─────────────────────────

/** Avanza a una parada de la columna siguiente. Al llegar: si hay monstruos, pelea; si hay un evento, se abre. */
export function routeTravel(s: GameState, ctx: Ctx, stopId: string): GameEvent[] {
  const { c, rng } = ctx;
  const e = expedition(s);
  busy(e);
  const route = e.route;
  if (!route) throw new GameError('Esta expedición no es por paradas.');
  const here = stopAt(route);
  if (!here.links.includes(stopId)) throw new GameError('No hay camino directo hasta ahí.');
  if (e.energy < EX.route.stepEnergy) throw new GameError('Sin energía: tenés que volver a la ciudad.');
  const next = stopAt(route, stopId);
  route.at = next.id;
  next.visited = true;
  e.pos = { x: next.col, y: next.row };
  const events: GameEvent[] = [...spendEnergy(c, s, rng, EX.route.stepEnergy)];
  if (!s.expedition) return events;
  if (next.kind === 'hallazgo') {
    const def = Object.values(c.dungeons).find((d) => d.entrance === e.regionId && d.unlock.flag);
    if (def?.unlock.flag && !s.flags[def.unlock.flag]) {
      s.flags[def.unlock.flag] = true;
      events.push({ type: 'toast', text: `Entre las rocas hay una escalera que baja: encontraste la entrada a ${def.name}. Ya aparece en el mapa del mundo.`, tone: 'good' });
    }
    return events;
  }
  // Los monstruos de una parada común atacan al llegar; los desafíos y el jefe esperan a que decidas.
  const group = e.groups.find((g) => g.id === next.ref);
  if (group && next.kind === 'monstruos' && !(group.calm && group.calm > 0)) return [...events, ...engageGroup(c, s, rng, group)];
  const node = e.nodes.find((n) => n.id === next.ref);
  if (node?.kind === 'evento') events.push(...openEvent(s, ctx, node.id));
  return events;
}

/** Pelear con el grupo de la parada (desafío, jefe, o monstruos que quedaron después de una huida). */
export function routeFight(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const e = expedition(s);
  busy(e);
  if (!e.route) throw new GameError('Esta expedición no es por paradas.');
  const group = e.groups.find((g) => g.id === stopAt(e.route!).ref);
  if (!group) throw new GameError('Acá no hay con quién pelear.');
  group.calm = 0;
  return engageGroup(c, s, rng, group);
}
