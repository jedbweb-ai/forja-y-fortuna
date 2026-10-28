import { indexById, type Content } from '../core/content';
import type { Material } from '../core/types';
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
import { SERVANT_DIALOGUES, SERVANT_NPCS, SERVANTS } from './servants';
import { SYNERGIES } from './synergies';
import { TRAITS } from './traits';
import { TRAITS_3 } from './traits3';

/** Suma las propiedades alquímicas a los materiales que ya existían. */
function withAlchemy(list: Material[]): Material[] {
  return list.map((m) => (ALCHEMY_OF_EXISTING[m.id] ? { ...m, alchemy: { ...ALCHEMY_OF_EXISTING[m.id], ...m.alchemy } } : m));
}

export const CONTENT: Content = {
  materials: indexById(withAlchemy([...MATERIALS, ...MATERIALS_3, ...MATERIALS_5])),
  blueprints: indexById([...BLUEPRINTS, ...BLUEPRINTS_3, ...BLUEPRINTS_4, ...BLUEPRINTS_5]),
  synergies: indexById([...SYNERGIES, ...SYNERGIES_5]),
  traits: indexById([...TRAITS, ...TRAITS_3]),
  quench: indexById([...QUENCH_MEDIA, ...QUENCH_MEDIA_3, ...QUENCH_5]),
  finishes: indexById([...FINISHES, ...FINISHES_3]),
  enchantments: indexById([...ENCHANTMENTS, ...ENCHANTMENTS_3, ...ENCHANTMENTS_5]),
  customers: indexById(CUSTOMER_TYPES),
  customerNames: CUSTOMER_NAMES,
  npcs: indexById([...NPCS, ...MERCENARY_NPCS, ...NPCS_3, ...NPCS_4, ...SERVANT_NPCS]),
  dialogues: indexById([...DIALOGUES, ...MERCENARY_DIALOGUES, ...DIALOGUES_3, ...DIALOGUES_4, ...SERVANT_DIALOGUES]),
  cities: indexById(CITIES),
  mercenaries: indexById([...MERCENARIES, ...SERVANTS]),
  skills: indexById([...COMBAT_SKILLS, ...ABILITY_SKILLS, ...SKILLS_5]),
  weaponSkills: WEAPON_SKILLS,
  monsters: indexById([...MONSTERS, ...MONSTERS_5]),
  arenas: indexById([...ARENAS, ...ARENAS_5]),
  regions: indexById(REGIONS),
  marketEvents: indexById(MARKET_EVENTS),
  grimoires: indexById([...GRIMOIRES, ...GRIMOIRES_5]),
  potions: indexById([...POTIONS, ...POTIONS_5]),
  quests: indexById(QUESTS),
  contracts: indexById(CONTRACTS),
  cityEvents: indexById(CITY_EVENTS),
  auctionLots: indexById(AUCTION_LOTS),
  bidders: indexById(BIDDERS),
  dungeons: indexById(DUNGEONS),
  roomPieces: indexById(ROOM_PIECES),
  riddles: indexById(RIDDLES),
  traps: TRAPS,
  talents: indexById(TALENTS),
  upgrades: indexById(UPGRADES),
};
