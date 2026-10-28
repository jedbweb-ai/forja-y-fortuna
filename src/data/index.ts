import { indexById, type Content } from '../core/content';
import type { Blueprint, Material } from '../core/types';
import { ABILITY_SKILLS } from './abilities';
import { ARENAS } from './arenas';
import { TALENTS, UPGRADES } from './progress';
import { DUNGEONS, RIDDLES, ROOM_PIECES, TRAPS } from './dungeons';
import { BLUEPRINTS_5, ENCHANTMENTS_5, GRIMOIRES_5, MATERIALS_5, POTIONS_5, QUENCH_5, SYNERGIES_5 } from './forge5';
import { ARENAS_5, MONSTERS_5, SKILLS_5 } from './monsters5';
import { AUCTION_LOTS, BIDDERS } from './auction';
import { BLUEPRINTS } from './blueprints';
import { BLUEPRINTS_3 } from './blueprints3';
import { BLUEPRINTS_4 } from './blueprints4';
import { CITIES } from './cities';
import { CITIES_6 } from './cities6';
import {
  ARENAS_6C, DIALOGUES_6C, MATERIALS_6C, MONSTERS_6C, NPCS_6C, POTIONS_6C, QUENCH_6C, QUESTS_6C, REGIONS_6C, SKILLS_6C, SYNERGIES_6C,
} from './content6c';
import { CITY_EVENTS_6B, CONTRACTS_6B, CUSTOMERS_6B, DIALOGUES_6B, MATERIALS_6B, NPCS_6B, QUESTS_6B, SYNERGIES_6B } from './content6b';
import { CITY_EVENTS } from './cityEvents';
import { COMBAT_SKILLS, WEAPON_SKILLS } from './combatSkills';
import { CONTRACTS } from './contracts';
import { CUSTOMER_NAMES, CUSTOMER_TYPES } from './customers';
import { ENCHANTMENTS, FINISHES, QUENCH_MEDIA } from './forgeOptions';
import { ENCHANTMENTS_3, FINISHES_3, QUENCH_MEDIA_3 } from './forgeOptions3';
import { GRIMOIRES } from './grimoires';
import { MARKET_EVENTS } from './marketEvents';
import { MATERIALS } from './materials';
import { ALCHEMY_OF_EXISTING, MATERIALS_3 } from './materials3';
import { MERCENARIES, MERCENARY_DIALOGUES, MERCENARY_NPCS } from './mercenaries';
import { MONSTERS } from './monsters';
import { DIALOGUES, NPCS } from './npcs';
import { DIALOGUES_3, NPCS_3 } from './npcs3';
import { DIALOGUES_4, NPCS_4 } from './npcs4';
import { POTIONS } from './potions';
import { QUESTS } from './quests';
import { REGIONS } from './regions';
import { ARENAS_7, MATERIALS_7, MONSTERS_7, QUENCH_7, QUESTS_7, REGIONS_7, SKILLS_7, SLOT_EXTRAS_7, SYNERGIES_7 } from './content7';
import { SERVANT_DIALOGUES, SERVANT_NPCS, SERVANTS } from './servants';
import { SYNERGIES } from './synergies';
import { TRAITS } from './traits';
import { TRAITS_3 } from './traits3';

/** Suma materiales nuevos a las partes de planos existentes ("plano.parte" → materiales). */
function withSlotExtras(list: Blueprint[], extras: Record<string, string[]>): Blueprint[] {
  for (const key of Object.keys(extras)) {
    const [bp, slot] = key.split('.');
    if (!list.some((b) => b.id === bp && b.parts.some((p) => p.slot === slot))) throw new Error(`Parte inexistente: ${key}`);
  }
  return list.map((b) => ({
    ...b,
    parts: b.parts.map((p) => {
      const add = extras[`${b.id}.${p.slot}`];
      return add ? { ...p, extra: [...(p.extra ?? []), ...add] } : p;
    }),
  }));
}

/** Suma las propiedades alquímicas a los materiales que ya existían. */
function withAlchemy(list: Material[]): Material[] {
  return list.map((m) => (ALCHEMY_OF_EXISTING[m.id] ? { ...m, alchemy: { ...ALCHEMY_OF_EXISTING[m.id], ...m.alchemy } } : m));
}

export const CONTENT: Content = {
  materials: indexById(withAlchemy([...MATERIALS, ...MATERIALS_3, ...MATERIALS_5, ...MATERIALS_6B, ...MATERIALS_6C, ...MATERIALS_7])),
  blueprints: indexById(withSlotExtras([...BLUEPRINTS, ...BLUEPRINTS_3, ...BLUEPRINTS_4, ...BLUEPRINTS_5], SLOT_EXTRAS_7)),
  synergies: indexById([...SYNERGIES, ...SYNERGIES_5, ...SYNERGIES_6B, ...SYNERGIES_6C, ...SYNERGIES_7]),
  traits: indexById([...TRAITS, ...TRAITS_3]),
  quench: indexById([...QUENCH_MEDIA, ...QUENCH_MEDIA_3, ...QUENCH_5, ...QUENCH_6C, ...QUENCH_7]),
  finishes: indexById([...FINISHES, ...FINISHES_3]),
  enchantments: indexById([...ENCHANTMENTS, ...ENCHANTMENTS_3, ...ENCHANTMENTS_5]),
  customers: indexById([...CUSTOMER_TYPES, ...CUSTOMERS_6B]),
  customerNames: CUSTOMER_NAMES,
  npcs: indexById([...NPCS, ...MERCENARY_NPCS, ...NPCS_3, ...NPCS_4, ...SERVANT_NPCS, ...NPCS_6B, ...NPCS_6C]),
  dialogues: indexById([...DIALOGUES, ...MERCENARY_DIALOGUES, ...DIALOGUES_3, ...DIALOGUES_4, ...SERVANT_DIALOGUES, ...DIALOGUES_6B, ...DIALOGUES_6C]),
  cities: indexById([...CITIES, ...CITIES_6]),
  mercenaries: indexById([...MERCENARIES, ...SERVANTS]),
  skills: indexById([...COMBAT_SKILLS, ...ABILITY_SKILLS, ...SKILLS_5, ...SKILLS_6C, ...SKILLS_7]),
  weaponSkills: WEAPON_SKILLS,
  monsters: indexById([...MONSTERS, ...MONSTERS_5, ...MONSTERS_6C, ...MONSTERS_7]),
  arenas: indexById([...ARENAS, ...ARENAS_5, ...ARENAS_6C, ...ARENAS_7]),
  regions: indexById([...REGIONS, ...REGIONS_6C, ...REGIONS_7]),
  marketEvents: indexById(MARKET_EVENTS),
  grimoires: indexById([...GRIMOIRES, ...GRIMOIRES_5]),
  potions: indexById([...POTIONS, ...POTIONS_5, ...POTIONS_6C]),
  quests: indexById([...QUESTS, ...QUESTS_6B, ...QUESTS_6C, ...QUESTS_7]),
  contracts: indexById([...CONTRACTS, ...CONTRACTS_6B]),
  cityEvents: indexById([...CITY_EVENTS, ...CITY_EVENTS_6B]),
  auctionLots: indexById(AUCTION_LOTS),
  bidders: indexById(BIDDERS),
  dungeons: indexById(DUNGEONS),
  roomPieces: indexById(ROOM_PIECES),
  riddles: indexById(RIDDLES),
  traps: TRAPS,
  talents: indexById(TALENTS),
  upgrades: indexById(UPGRADES),
};
