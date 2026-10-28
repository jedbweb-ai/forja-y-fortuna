import { BALANCE } from '../../config/balance';
import { aiTurn } from '../combat/ai';
import { beginTurn, buildCombat, currentUnit, endTurn, moveUnit, tryFlee, usePotion, useSkill } from '../combat/engine';
import { acquireGrimoire, hasGrimoire } from '../magic/grimoires';
import { addToBag, bagLoad, bestTool, loseFromBag, resolveCombat, toolTier } from '../combat/result';
import { GameError, type Content, type Ctx } from '../content';
import { attr, isInjured, maxHp, partyMembers } from '../party/progression';
import { characterProfile } from '../party/stats';
import type { Rng } from '../rng';
import { addMaterial, addXp, skillLevel } from '../state';
import { advanceTime, sleep, slotName } from '../time';
import type { GameEvent, GameState } from '../types';
import { generateGroup, groupThreat } from './encounters';
import { adjacent, findTiles, regionPath, zoneAt, type Pt } from './region';
import type { ExpeditionState, MonsterGroup, RegionDef } from './types';

const EX = BALANCE.expedition;

// ───────────────────────── Utilidades ─────────────────────────

export function expedition(s: GameState): ExpeditionState {
  if (!s.expedition) throw new GameError('No estás de expedición.');
  return s.expedition;
}

function region(c: Content, s: GameState): RegionDef {
  return c.regions[expedition(s).regionId];
}

/** Personajes del grupo que pueden salir (los heridos se quedan). */
export function readyMembers(s: GameState): string[] {
  return partyMembers(s).filter((ch) => !isInjured(s, ch)).map((ch) => ch.id);
}

export function expeditionEnergy(s: GameState, members: string[]): number {
  const explorer = members.some((id) => s.characters[id]?.specialty === 'explorador');
  return EX.baseEnergy + (explorer ? BALANCE.mercenaries.exploradorEnergy : 0);
}

export function expeditionCapacity(s: GameState, members: string[]): number {
  let cap = EX.baseCapacity;
  for (const id of members) {
    const ch = s.characters[id];
    if (!ch) continue;
    cap += attr(ch, 'fuerza') * EX.capacityPerFuerza;
    if (ch.specialty === 'porteador') cap += BALANCE.mercenaries.porteadorCapacity;
  }
  return cap;
}

/** Fuerza estimada del grupo, para comparar con la amenaza de los monstruos. */
export function partyPower(c: Content, s: GameState, members: string[]): number {
  return members.reduce((a, id) => {
    const ch = s.characters[id];
    if (!ch || isInjured(s, ch)) return a;
    const p = characterProfile(c, s, ch);
    return a + p.atk * 0.4 + p.def * 0.5 + p.maxHp * 0.1;
  }, 0);
}

export type DangerLevel = 'fácil' | 'parejo' | 'difícil' | 'mortal';

export function dangerFor(c: Content, s: GameState, threat: number, members: string[]): DangerLevel {
  const ratio = threat / Math.max(1, partyPower(c, s, members) * 0.45);
  if (ratio < 0.6) return 'fácil';
  if (ratio < 1) return 'parejo';
  if (ratio < 1.4) return 'difícil';
  return 'mortal';
}

/** Gasta energía. Cada tantos puntos pasa una franja; de noche aparecen grupos nuevos. */
function spendEnergy(c: Content, s: GameState, rng: Rng, amount: number): GameEvent[] {
  const e = expedition(s);
  const events: GameEvent[] = [];
  e.energy = Math.max(0, e.energy - amount);
  e.spent += amount;
  while (e.spent >= EX.energyPerSlot) {
    e.spent -= EX.energyPerSlot;
    events.push(...advanceTime(s, 1));
  }
  if (slotName(s) === 'noche' && !e.nightSpawned) {
    e.nightSpawned = true;
    const added = spawnGroups(c, s, rng, EX.nightExtraGroups, 'noche');
    if (added) events.push({ type: 'toast', text: 'Cae la noche: se oyen cosas nuevas entre los árboles.', tone: 'bad' });
  }
  if (e.energy <= 0) events.push({ type: 'toast', text: 'El grupo está agotado. Hora de volver.', tone: 'bad' });
  return events;
}

function occupied(e: ExpeditionState, p: Pt) {
  return e.groups.some((g) => g.x === p.x && g.y === p.y) || (e.pos.x === p.x && e.pos.y === p.y);
}

/** Ubica `count` grupos nuevos en lugares de monstruos libres. */
function spawnGroups(c: Content, s: GameState, rng: Rng, count: number, slot = slotName(s)): number {
  const e = expedition(s);
  const r = region(c, s);
  const spots = findTiles(r, 'm').filter((p) => !occupied(e, p) && Math.abs(p.x - e.pos.x) + Math.abs(p.y - e.pos.y) > 3);
  let added = 0;
  for (let i = 0; i < count && spots.length; i++) {
    const p = spots.splice(rng.int(0, spots.length - 1), 1)[0];
    const zone = zoneAt(r, p.x, p.y);
    const g = generateGroup(c, r.zoneDefs[zone], slot, rng);
    e.groups.push(makeGroup(c, e, p, zone, g.monsters));
    added++;
  }
  return added;
}

function makeGroup(c: Content, e: ExpeditionState, p: Pt, zone: number, monsters: string[], extra: Partial<MonsterGroup> = {}): MonsterGroup {
  return {
    id: `g${e.nextId++}`, x: p.x, y: p.y, zone, monsters, threat: groupThreat(c, monsters),
    aggressive: monsters.some((m) => c.monsters[m]?.aggressive), ...extra,
  };
}

// ───────────────────────── Comandos ─────────────────────────

export function startExpedition(s: GameState, { c, rng }: Ctx, regionId: string): GameEvent[] {
  const r = c.regions[regionId];
  if (!r || !r.available) throw new GameError('Todavía no se puede llegar ahí.');
  if (s.expedition) throw new GameError('Ya estás de expedición.');
  if (s.forge) throw new GameError('Tenés una pieza a medio hacer en el yunque.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  const members = readyMembers(s);
  for (const id of members) s.characters[id].hp = maxHp(s.characters[id]);
  const entry = findTiles(r, 'E')[0] ?? { x: 1, y: 1 };
  const e: ExpeditionState = {
    regionId, pos: { ...entry }, energy: expeditionEnergy(s, members), maxEnergy: expeditionEnergy(s, members), spent: 0,
    bag: {}, capacity: expeditionCapacity(s, members), nodes: [], groups: [], members, combat: null, report: null,
    nightSpawned: false, nextId: 1,
  };
  s.expedition = e;

  // Recursos: cada lugar de veta, árbol, hierba o gema tiene recurso con cierta probabilidad.
  for (const [ch, kind] of [['v', 'veta'], ['t', 'arbol'], ['h', 'hierba'], ['g', 'gema']] as const) {
    for (const p of findTiles(r, ch)) {
      if (!rng.chance(EX.nodeFill)) continue;
      const zone = r.zoneDefs[zoneAt(r, p.x, p.y)];
      const options = { veta: zone.vetas, arbol: zone.arboles, hierba: zone.hierbas ?? [], gema: zone.gemas ?? [] }[kind];
      if (!options.length) continue;
      const opt = rng.weighted(options.map((o) => [o, o.weight] as const));
      e.nodes.push({
        id: `n${e.nextId++}`, x: p.x, y: p.y, kind, material: opt.material, tier: opt.tier, qty: opt.qty,
        uses: kind === 'gema' ? 1 : rng.int(EX.nodeUses[0], EX.nodeUses[1]), night: opt.night,
      });
    }
  }
  // Cofres: se abren sin herramienta y pueden tener grimorios.
  for (const p of findTiles(r, 'c')) {
    if (!rng.chance(BALANCE.chests.fill) || !r.zoneDefs[zoneAt(r, p.x, p.y)].cofres) continue;
    e.nodes.push({ id: `n${e.nextId++}`, x: p.x, y: p.y, kind: 'cofre', material: '', tier: 0, qty: [0, 0], uses: 1 });
  }

  // Grupos de monstruos por zona, con desafíos opcionales y el jefe en su guarida.
  const spots = findTiles(r, 'm');
  r.zoneDefs.forEach((zone, zi) => {
    const zoneSpots = spots.filter((p) => zoneAt(r, p.x, p.y) === zi);
    const count = Math.min(zoneSpots.length, rng.int(zone.groups[0], zone.groups[1]));
    for (let i = 0; i < count; i++) {
      const p = zoneSpots.splice(rng.int(0, zoneSpots.length - 1), 1)[0];
      const challenge = i === 0 && zone.danger >= 2 && rng.chance(EX.challengeChance);
      const g = generateGroup(c, zone, slotName(s), rng, challenge ? EX.challengeBudgetMult : 1);
      e.groups.push(makeGroup(c, e, p, zi, g.monsters, { challenge }));
    }
  });
  const lair = findTiles(r, 'B')[0];
  if (r.boss && lair) e.groups.push(makeGroup(c, e, lair, r.boss.zone - 1, r.boss.monsters, { boss: true, aggressive: false }));

  s.outing = false;
  return [
    { type: 'toast', text: `Salís hacia ${r.name}.`, tone: 'info' },
    ...advanceTime(s, r.travelSlots),
    { type: 'expeditionStarted' },
  ];
}

/** Arranca el combate contra un grupo. */
function engage(c: Content, s: GameState, rng: Rng, group: MonsterGroup): GameEvent[] {
  const e = expedition(s);
  const r = region(c, s);
  const biome = group.boss ? 'campamento' : r.zoneDefs[group.zone]?.biome ?? 'pradera';
  const arenas = Object.values(c.arenas).filter((a) => a.biome === biome);
  const arena = rng.pick(arenas.length ? arenas : Object.values(c.arenas));
  const events = spendEnergy(c, s, rng, EX.combatEnergy);
  e.combat = buildCombat(c, s, group, arena.id, e.members);
  beginTurn(c, s, rng);
  const names = [...new Set(group.monsters.map((m) => c.monsters[m].name))].join(', ');
  return [...events, { type: 'toast', text: group.boss ? `¡${c.monsters[group.monsters[0]].name} te sale al cruce!` : `¡Combate! ${names}`, tone: 'bad' }, { type: 'combatStarted' }];
}

/** Modo debug: pelea ya contra estos monstruos (si no hay expedición, arma una sin gastar tiempo). */
export function debugEngage(s: GameState, { c, rng }: Ctx, monsters: string[], boss = false): GameEvent[] {
  if (s.expedition?.combat) throw new GameError('Ya hay un combate.');
  if (!s.expedition) {
    const { day, slot } = s;
    startExpedition(s, { c, rng }, 'linde_brezal');
    s.day = day;
    s.slot = slot;
  }
  const e = expedition(s);
  const g = makeGroup(c, e, { x: e.pos.x + 1, y: e.pos.y }, boss ? 2 : 0, monsters, { boss });
  e.groups.push(g);
  e.energy = Math.max(e.energy, EX.combatEnergy);
  return engage(c, s, rng, g);
}

/** Grupo que entra en contacto con el jugador en esta posición (adyacente), si hay. */
function contact(e: ExpeditionState, p: Pt): MonsterGroup | undefined {
  return e.groups.find((g) => !(g.calm && g.calm > 0) && (adjacent(g, p) || (g.x === p.x && g.y === p.y)));
}

export function expMove(s: GameState, { c, rng }: Ctx, x: number, y: number): GameEvent[] {
  const e = expedition(s);
  if (e.combat || e.report) throw new GameError('Primero terminá el combate.');
  if (e.energy <= 0) throw new GameError('Sin energía: tenés que volver a la ciudad.');
  const r = region(c, s);
  const path = regionPath(r, e.pos, { x, y }, (p) => e.groups.some((g) => g.x === p.x && g.y === p.y));
  if (!path || !path.length) throw new GameError('No se puede llegar ahí.');
  const maxSteps = Math.floor(e.energy * BALANCE.expedition.tilesPerEnergy);
  const walked: Pt[] = [];
  let met: MonsterGroup | undefined;
  for (const p of path.slice(0, Math.max(1, maxSteps))) {
    if (e.groups.some((g) => g.x === p.x && g.y === p.y)) break;
    walked.push(p);
    e.pos = { ...p };
    for (const g of e.groups) if (g.calm) g.calm -= 1;
    met = contact(e, p);
    if (met) break;
  }
  const events: GameEvent[] = [{ type: 'expMoved', path: walked }];
  events.push(...spendEnergy(c, s, rng, walked.length / EX.tilesPerEnergy));

  // Los grupos agresivos cercanos se acercan.
  if (!met) {
    for (const g of e.groups) {
      if (!g.aggressive || g.calm || Math.abs(g.x - e.pos.x) + Math.abs(g.y - e.pos.y) > EX.aggroRange) continue;
      const step = regionPath(r, g, e.pos, (p) => e.groups.some((o) => o !== g && o.x === p.x && o.y === p.y))?.[0];
      if (step && !(step.x === e.pos.x && step.y === e.pos.y)) {
        g.x = step.x;
        g.y = step.y;
      }
      if (adjacent(g, e.pos)) {
        met = g;
        events.push({ type: 'toast', text: '¡Te vieron y vienen hacia vos!', tone: 'bad' });
        break;
      }
    }
  }
  if (met && s.expedition) events.push(...engage(c, s, rng, met));
  return events;
}

export function gather(s: GameState, { c, rng }: Ctx, nodeId: string): GameEvent[] {
  const e = expedition(s);
  if (e.combat || e.report) throw new GameError('Primero terminá el combate.');
  const node = e.nodes.find((n) => n.id === nodeId);
  if (!node) throw new GameError('Ahí ya no queda nada.');
  if (!adjacent(node, e.pos)) throw new GameError('Acercate primero.');
  if (e.energy < EX.gatherEnergy) throw new GameError('No te queda energía para eso.');
  if (node.kind === 'cofre') return openChest(s, { c, rng }, node.id);
  const job = { veta: ['mineria', 'pico de minero'], gema: ['mineria', 'pico de minero'], arbol: ['tala', 'hacha de tala'], hierba: ['siega', 'hoz'] }[node.kind] as ['mineria' | 'tala' | 'siega', string];
  const tool = bestTool(s, job[0]);
  const mat = c.materials[node.material];
  if (!tool) throw new GameError(`Necesitás ${job[1] === 'hoz' ? 'una' : 'un'} ${job[1]}.`);
  if (toolTier(tool.stats.atk) < node.tier) {
    throw new GameError(`${mat.name} necesita una herramienta más potente (potencia ${BALANCE.tools.tierPower[node.tier - 1]}).`);
  }
  if (node.night && slotName(s) !== 'noche') throw new GameError(`${mat.name} solo se puede cortar de noche.`);
  if (bagLoad(e.bag) >= e.capacity) throw new GameError('La bolsa está llena.');
  const skill = job[0];
  let qty = rng.int(node.qty[0], node.qty[1]);
  if (rng.chance((skillLevel(s.skills[skill]) - 1) * BALANCE.tools.gatherBonusPerLevel)) qty += 1;
  if (tool.traits.includes('veta_certera') && rng.chance(0.25)) qty += 1;
  const got = addToBag(s, node.material, qty);
  tool.durability = Math.max(0, tool.durability - BALANCE.tools.wearPerUse);
  node.uses -= 1;
  if (node.uses <= 0) e.nodes = e.nodes.filter((n) => n.id !== node.id);
  addXp(s, skill, 4);
  const events: GameEvent[] = [
    { type: 'gathered', nodeId, material: node.material, qty: got },
    { type: 'toast', text: `+${got} ${mat.name}${got < qty ? ' (la bolsa se llenó)' : ''}`, tone: 'good' },
  ];
  events.push(...spendEnergy(c, s, rng, EX.gatherEnergy));
  return events;
}

/** Abrir un cofre: oro, materiales y, con suerte, un grimorio. */
function openChest(s: GameState, { c, rng }: Ctx, nodeId: string): GameEvent[] {
  const e = expedition(s);
  const node = e.nodes.find((n) => n.id === nodeId)!;
  const loot = c.regions[e.regionId].zoneDefs[zoneAt(c.regions[e.regionId], node.x, node.y)].cofres;
  e.nodes = e.nodes.filter((n) => n.id !== nodeId);
  const events: GameEvent[] = [];
  const found: string[] = [];
  if (loot) {
    const gold = rng.int(loot.gold[0], loot.gold[1]);
    s.gold += gold;
    found.push(`${gold} de oro`);
    for (const m of loot.materials) {
      if (!rng.chance(m.chance)) continue;
      const got = addToBag(s, m.material, rng.int(m.qty[0], m.qty[1]));
      if (got) found.push(`${got}× ${c.materials[m.material].name}`);
    }
    for (const g of loot.grimoires) {
      if (rng.chance(g.chance) && !hasGrimoire(s, g.id)) {
        events.push(...acquireGrimoire(s, c, g.id));
        break;
      }
    }
  }
  events.unshift({ type: 'gathered', nodeId, material: '', qty: 0 }, { type: 'toast', text: `Cofre: ${found.join(', ') || 'vacío'}.`, tone: 'good' });
  events.push(...spendEnergy(c, s, rng, 1));
  return events;
}

/** Fin de la expedición: los materiales pasan al taller y el grupo se recupera. */
function finishExpedition(s: GameState) {
  const e = expedition(s);
  for (const [id, q] of Object.entries(e.bag)) addMaterial(s, id, q);
  for (const ch of partyMembers(s)) ch.hp = maxHp(ch);
  s.expedition = null;
  s.location = 'herreria';
  s.outing = false;
}

export function returnHome(s: GameState, { c }: Ctx): GameEvent[] {
  const e = expedition(s);
  if (e.combat || e.report) throw new GameError('Primero terminá el combate.');
  const r = region(c, s);
  const total = bagLoad(e.bag);
  finishExpedition(s);
  return [
    ...advanceTime(s, r.travelSlots),
    { type: 'toast', text: `Volvés a Valdebrasa con ${total} materiales.`, tone: 'good' },
    { type: 'expeditionEnded', outcome: 'return' },
    { type: 'locationChanged', location: 'herreria' },
  ];
}

/** Derrota: se pierde la mitad de lo juntado, se despierta en la ciudad y los compañeros quedan heridos. */
function defeatHome(s: GameState): GameEvent[] {
  const e = expedition(s);
  const lost = loseFromBag(s, EX.defeatLoss);
  const members = e.members;
  finishExpedition(s);
  const events = sleep(s);
  for (const id of members) {
    if (id !== 'herrero' && s.characters[id]) s.characters[id].injuredUntilDay = s.day + BALANCE.injury.days;
  }
  const lostCount = Object.values(lost).reduce((a, q) => a + q, 0);
  return [
    ...events,
    { type: 'toast', text: `Despertás en Valdebrasa. Perdiste ${lostCount} materiales en la huida.`, tone: 'bad' },
    { type: 'expeditionEnded', outcome: 'defeat' },
    { type: 'locationChanged', location: 'herreria' },
  ];
}

// ───────────────────────── Combate ─────────────────────────

function combatOf(s: GameState) {
  const cs = expedition(s).combat;
  if (!cs || cs.outcome) throw new GameError('No hay combate en curso.');
  return cs;
}

/** Si el combate terminó, arma el reporte. */
function settle(c: Content, s: GameState, rng: Rng): GameEvent[] {
  const e = expedition(s);
  const cs = e.combat;
  if (!cs?.outcome || e.report) return [];
  e.report = resolveCombat(c, s, rng);
  if (cs.outcome === 'fled') {
    const g = e.groups.find((x) => x.id === cs.groupId);
    if (g) g.calm = 3;
  }
  return [{ type: 'combatEnded', outcome: cs.outcome }];
}

function partyTurn(s: GameState, unitId: string) {
  const cs = combatOf(s);
  const u = currentUnit(cs);
  if (!u || u.id !== unitId || u.side !== 'party') throw new GameError('No es el turno de esa unidad.');
  return u;
}

export function combatMove(s: GameState, { c, rng }: Ctx, unitId: string, x: number, y: number): GameEvent[] {
  partyTurn(s, unitId);
  const fx = moveUnit(c, s, unitId, { x, y }, rng);
  return [{ type: 'combatFx', fx }, ...settle(c, s, rng)];
}

export function combatSkill(s: GameState, { c, rng }: Ctx, unitId: string, skillId: string, x: number, y: number): GameEvent[] {
  partyTurn(s, unitId);
  const fx = useSkill(c, s, rng, unitId, skillId, { x, y });
  const cs = s.expedition!.combat!;
  const u = currentUnit(cs);
  // Si ya no puede hacer nada más, termina el turno solo.
  if (!cs.outcome && u && u.acted && u.moved) fx.push(...endTurn(c, s, rng));
  return [{ type: 'combatFx', fx }, ...settle(c, s, rng)];
}

export function combatEndTurn(s: GameState, { c, rng }: Ctx, unitId: string): GameEvent[] {
  partyTurn(s, unitId);
  const fx = endTurn(c, s, rng);
  return [{ type: 'combatFx', fx }, ...settle(c, s, rng)];
}

export function combatPotion(s: GameState, { c, rng }: Ctx, unitId: string, potionUid: string, x: number, y: number): GameEvent[] {
  partyTurn(s, unitId);
  const fx = usePotion(c, s, rng, unitId, potionUid, { x, y });
  const cs = s.expedition!.combat!;
  const u = currentUnit(cs);
  if (!cs.outcome && u && u.acted && u.moved) fx.push(...endTurn(c, s, rng));
  return [{ type: 'combatFx', fx }, ...settle(c, s, rng)];
}

export function combatFlee(s: GameState, { c, rng }: Ctx, unitId: string): GameEvent[] {
  partyTurn(s, unitId);
  const fx = tryFlee(s, rng, unitId);
  if (!s.expedition!.combat!.outcome) fx.push(...endTurn(c, s, rng));
  return [{ type: 'combatFx', fx }, ...settle(c, s, rng)];
}

/** Un turno de la IA (el store los va encadenando con pausas para animar). */
export function combatAiStep(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const cs = combatOf(s);
  const u = currentUnit(cs);
  if (!u || u.side !== 'enemy') return [];
  const fx = aiTurn(c, s, rng);
  return [{ type: 'combatFx', fx }, ...settle(c, s, rng)];
}

/** Cerrar el reporte del combate y seguir (o volver a la ciudad si fue derrota). */
export function closeReport(s: GameState, _ctx: Ctx): GameEvent[] {
  const e = expedition(s);
  if (!e.report) return [];
  const outcome = e.report.outcome;
  e.report = null;
  e.combat = null;
  if (outcome === 'defeat') return defeatHome(s);
  // Nadie en pie para seguir: vuelta forzada.
  if (!e.members.some((id) => s.characters[id] && !isInjured(s, s.characters[id]))) return defeatHome(s);
  return [];
}

export function canAct(s: GameState): boolean {
  const cs = s.expedition?.combat;
  const u = cs && !cs.outcome ? currentUnit(cs) : undefined;
  return !!u && u.side === 'party';
}
