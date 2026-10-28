import { indexById, type Content } from '../core/content';
import { BLUEPRINTS } from './blueprints';
import { CITIES } from './cities';
import { CUSTOMER_NAMES, CUSTOMER_TYPES } from './customers';
import { ENCHANTMENTS, FINISHES, QUENCH_MEDIA } from './forgeOptions';
import { MATERIALS } from './materials';
import { DIALOGUES, NPCS } from './npcs';
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
  npcs: indexById(NPCS),
  dialogues: indexById(DIALOGUES),
  cities: indexById(CITIES),
};
