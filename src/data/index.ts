import { indexById, type Content } from '../core/content';
import { ARENAS } from './arenas';
import { BLUEPRINTS } from './blueprints';
import { CITIES } from './cities';
import { COMBAT_SKILLS, WEAPON_SKILLS } from './combatSkills';
import { CUSTOMER_NAMES, CUSTOMER_TYPES } from './customers';
import { ENCHANTMENTS, FINISHES, QUENCH_MEDIA } from './forgeOptions';
import { MARKET_EVENTS } from './marketEvents';
import { MATERIALS } from './materials';
import { MERCENARIES, MERCENARY_DIALOGUES, MERCENARY_NPCS } from './mercenaries';
import { MONSTERS } from './monsters';
import { DIALOGUES, NPCS } from './npcs';
import { REGIONS } from './regions';
import { SYNERGIES } from './synergies';
import { TRAITS } from './traits';

export const CONTENT: Content = {
  materials: indexById(MATERIALS),
  blueprints: indexById(BLUEPRINTS),
  synergies: indexById(SYNERGIES),
  traits: indexById(TRAITS),
  quench: indexById(QUENCH_MEDIA),
  finishes: indexById(FINISHES),
  enchantments: indexById(ENCHANTMENTS),
  customers: indexById(CUSTOMER_TYPES),
  customerNames: CUSTOMER_NAMES,
  npcs: indexById([...NPCS, ...MERCENARY_NPCS]),
  dialogues: indexById([...DIALOGUES, ...MERCENARY_DIALOGUES]),
  cities: indexById(CITIES),
  mercenaries: indexById(MERCENARIES),
  skills: indexById(COMBAT_SKILLS),
  weaponSkills: WEAPON_SKILLS,
  monsters: indexById(MONSTERS),
  arenas: indexById(ARENAS),
  regions: indexById(REGIONS),
  marketEvents: indexById(MARKET_EVENTS),
};
