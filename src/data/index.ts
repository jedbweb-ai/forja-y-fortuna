import { indexById, type Content } from '../core/content';
import type { Material } from '../core/types';
import { ABILITY_SKILLS } from './abilities';
import { ARENAS } from './arenas';
import { BLUEPRINTS } from './blueprints';
import { BLUEPRINTS_3 } from './blueprints3';
import { CITIES } from './cities';
import { COMBAT_SKILLS, WEAPON_SKILLS } from './combatSkills';
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
import { POTIONS } from './potions';
import { REGIONS } from './regions';
import { SYNERGIES } from './synergies';
import { TRAITS } from './traits';
import { TRAITS_3 } from './traits3';

/** Suma las propiedades alquímicas a los materiales que ya existían. */
function withAlchemy(list: Material[]): Material[] {
  return list.map((m) => (ALCHEMY_OF_EXISTING[m.id] ? { ...m, alchemy: { ...ALCHEMY_OF_EXISTING[m.id], ...m.alchemy } } : m));
}

export const CONTENT: Content = {
  materials: indexById(withAlchemy([...MATERIALS, ...MATERIALS_3])),
  blueprints: indexById([...BLUEPRINTS, ...BLUEPRINTS_3]),
  synergies: indexById(SYNERGIES),
  traits: indexById([...TRAITS, ...TRAITS_3]),
  quench: indexById([...QUENCH_MEDIA, ...QUENCH_MEDIA_3]),
  finishes: indexById([...FINISHES, ...FINISHES_3]),
  enchantments: indexById([...ENCHANTMENTS, ...ENCHANTMENTS_3]),
  customers: indexById(CUSTOMER_TYPES),
  customerNames: CUSTOMER_NAMES,
  npcs: indexById([...NPCS, ...MERCENARY_NPCS, ...NPCS_3]),
  dialogues: indexById([...DIALOGUES, ...MERCENARY_DIALOGUES, ...DIALOGUES_3]),
  cities: indexById(CITIES),
  mercenaries: indexById(MERCENARIES),
  skills: indexById([...COMBAT_SKILLS, ...ABILITY_SKILLS]),
  weaponSkills: WEAPON_SKILLS,
  monsters: indexById(MONSTERS),
  arenas: indexById(ARENAS),
  regions: indexById(REGIONS),
  marketEvents: indexById(MARKET_EVENTS),
  grimoires: indexById(GRIMOIRES),
  potions: indexById(POTIONS),
};
