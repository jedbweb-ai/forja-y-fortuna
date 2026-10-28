import type {
  Blueprint, City, CustomerType, Dialogue, Enchantment, FinishOption, Material, Npc, QuenchMedium, Synergy, Trait,
} from './types';
import type { Rng } from './rng';

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
