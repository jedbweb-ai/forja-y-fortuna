import type { ArenaDef, CombatSkill, MonsterDef } from './combat/types';
import type { GrimoireDef, PotionDef } from './magic/types';
import type { MercenaryDef, WeaponKind } from './party/types';
import type { Rng } from './rng';
import type {
  Blueprint, City, CustomerType, Dialogue, Enchantment, FinishOption, Material, Npc, QuenchMedium, Synergy, Trait,
} from './types';
import type { MarketEventDef, RegionDef } from './world/types';
import type { AuctionLotDef, BidderDef, CityEventDef, ContractDef, QuestDef } from './town/types';

/** Todo el contenido del juego, indexado por id. El core lo recibe por parámetro. */
export interface Content {
  materials: Record<string, Material>;
  blueprints: Record<string, Blueprint>;
  synergies: Record<string, Synergy>;
  traits: Record<string, Trait>;
  quench: Record<string, QuenchMedium>;
  finishes: Record<string, FinishOption>;
  enchantments: Record<string, Enchantment>;
  customers: Record<string, CustomerType>;
  customerNames: string[];
  npcs: Record<string, Npc>;
  dialogues: Record<string, Dialogue>;
  cities: Record<string, City>;
  mercenaries: Record<string, MercenaryDef>;
  skills: Record<string, CombatSkill>;
  /** Acciones que da cada tipo de arma, y el escudo. */
  weaponSkills: Record<WeaponKind | 'escudo', string[]>;
  monsters: Record<string, MonsterDef>;
  arenas: Record<string, ArenaDef>;
  regions: Record<string, RegionDef>;
  marketEvents: Record<string, MarketEventDef>;
  grimoires: Record<string, GrimoireDef>;
  potions: Record<string, PotionDef>;
  // ── Fase 4 ──
  quests: Record<string, QuestDef>;
  contracts: Record<string, ContractDef>;
  cityEvents: Record<string, CityEventDef>;
  auctionLots: Record<string, AuctionLotDef>;
  bidders: Record<string, BidderDef>;
}

export function indexById<T extends { id: string }>(list: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const entry of list) {
    if (out[entry.id]) throw new Error(`Id duplicado en contenido: ${entry.id}`);
    out[entry.id] = entry;
  }
  return out;
}

export class GameError extends Error {}

/** Contexto que reciben todos los comandos: contenido y RNG de la partida. */
export interface Ctx {
  c: Content;
  rng: Rng;
}
