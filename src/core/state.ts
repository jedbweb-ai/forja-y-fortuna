import { BALANCE } from '../config/balance';
import type { Content } from './content';
import { createHerrero } from './party/progression';
import { RELATION_LEVELS, type GameState, type RelationLevel, type SkillId } from './types';

export const EMPTY_SKILLS: Record<SkillId, number> = {
  herreria: 0, armeria: 0, flecheria: 0, comercio: 0, runas: 0, combate: 0, mineria: 0, tala: 0, desuello: 0,
};

export function createInitialState(c: Content, seed = Date.now() >>> 0): GameState {
  const npcs: GameState['npcs'] = {};
  for (const id of Object.keys(c.npcs)) npcs[id] = { relation: 0, lastTalkDay: 0, seenDialogues: [] };
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
    stats: { itemsForged: 0, itemsRuined: 0, goldEarned: 0, itemsSold: 0 },
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
  st.relation = clamp(st.relation + delta, BALANCE.relations.min, BALANCE.relations.max);
}

export function changeReputation(s: GameState, city: string, delta: number) {
  s.reputation[city] = clamp((s.reputation[city] ?? 0) + delta, BALANCE.reputation.min, BALANCE.reputation.max);
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
