import { BALANCE } from '../config/balance';
import type { Content } from './content';
import { createHerrero } from './party/progression';
import { RELATION_LEVELS, type GameState, type RelationLevel, type SkillId } from './types';

export const EMPTY_SKILLS: Record<SkillId, number> = {
  herreria: 0, armeria: 0, flecheria: 0, comercio: 0, runas: 0, combate: 0, mineria: 0, tala: 0, desuello: 0,
  joyeria: 0, alquimia: 0, siega: 0,
};

/**
 * Completa una partida cargada con lo que el contenido sumó después (NPC nuevos, recetas no secretas).
 * Así los datos se pueden ampliar sin romper partidas guardadas.
 */
export function syncWithContent(s: GameState, c: Content) {
  for (const id of Object.keys(c.npcs)) s.npcs[id] ??= newNpcState(c, id);
  for (const p of Object.values(c.potions)) if (!p.secret && !s.discoveredPotions.includes(p.id)) s.discoveredPotions.push(p.id);
}

/** Estado inicial de un NPC. Los compañeros del mercado de esclavos arrancan con su lealtad baja. */
export function newNpcState(c: Content, id: string): GameState['npcs'][string] {
  return { relation: c.mercenaries[id]?.startRelation ?? 0, lastTalkDay: 0, seenDialogues: [] };
}

/** Estado vacío de la vida de la ciudad (Fase 4). Lo usan la partida nueva y la migración. */
export function emptyTownState(): Pick<GameState, 'quests' | 'contracts' | 'demand' | 'cityEvents' | 'auction' | 'servantMarket'> {
  return {
    quests: { offers: [], active: [], done: [], failed: [], lastRefresh: 0 },
    contracts: { offers: [], active: [], done: [], lostToRival: [], lastRefresh: 0 },
    demand: {},
    cityEvents: { active: [], recent: [], rumors: [] },
    auction: { day: BALANCE.auction.firstDay, lots: [], consigned: [], session: null, seenUnique: [], attended: 0 },
    servantMarket: { offer: [], lastRefresh: 0 },
  };
}

export function createInitialState(c: Content, seed = Date.now() >>> 0): GameState {
  const npcs: GameState['npcs'] = {};
  for (const id of Object.keys(c.npcs)) npcs[id] = newNpcState(c, id);
  return {
    rngState: seed,
    day: 1,
    slot: 0,
    outing: false,
    location: BALANCE.start.location,
    gold: BALANCE.start.gold,
    reputation: { [BALANCE.start.city]: 0 },
    materials: { ...BALANCE.start.materials },
    items: [],
    discoveredSynergies: [],
    designs: [],
    knownBlueprints: [...BALANCE.start.blueprints],
    knownEnchantments: [...BALANCE.start.enchantments],
    skills: { ...EMPTY_SKILLS },
    npcs,
    flags: {},
    forge: null,
    shop: null,
    characters: { herrero: createHerrero() },
    party: ['herrero'],
    expedition: null,
    market: null,
    grimoires: [],
    belt: {},
    discoveredPotions: Object.values(c.potions).filter((p) => !p.secret).map((p) => p.id),
    stats: { itemsForged: 0, itemsRuined: 0, goldEarned: 0, itemsSold: 0 },
    ...emptyTownState(),
    settings: { skipItemCard: false, fullscreenOnStart: true },
    nextUid: 1,
  };
}

export function skillLevel(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / BALANCE.skills.xpFactor));
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * BALANCE.skills.xpFactor;
}

export function addXp(s: GameState, skill: SkillId, xp: number): boolean {
  const before = skillLevel(s.skills[skill]);
  s.skills[skill] += Math.round(xp);
  return skillLevel(s.skills[skill]) > before;
}

export function relationLevel(value: number): RelationLevel {
  const t = BALANCE.relations.levelThresholds;
  let idx = 0;
  for (let i = 0; i < t.length; i++) if (value >= t[i]) idx = i;
  return RELATION_LEVELS[idx];
}

export function changeRelation(s: GameState, npc: string, delta: number) {
  const st = s.npcs[npc] ?? (s.npcs[npc] = { relation: 0, lastTalkDay: 0, seenDialogues: [] });
  if (!delta) return;
  st.relation = clamp(st.relation + delta, BALANCE.relations.min, BALANCE.relations.max);
}

export function changeReputation(s: GameState, city: string, delta: number) {
  s.reputation[city] = clamp((s.reputation[city] ?? 0) + delta, BALANCE.reputation.min, BALANCE.reputation.max);
}

export function reputationLevel(value: number): string {
  let name: string = BALANCE.reputation.levels[0].name;
  for (const l of BALANCE.reputation.levels) if (value >= l.min) name = l.name;
  return name;
}

export function currentCity(): string {
  return BALANCE.start.city;
}

export function addMaterial(s: GameState, id: string, qty: number) {
  s.materials[id] = (s.materials[id] ?? 0) + qty;
  if (s.materials[id] <= 0) delete s.materials[id];
}

export function hasMaterial(s: GameState, id: string, qty: number) {
  return (s.materials[id] ?? 0) >= qty;
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function nextUid(s: GameState, prefix: string) {
  return `${prefix}${s.nextUid++}`;
}
