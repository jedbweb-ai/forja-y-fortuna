import { BALANCE } from '../../config/balance';
import type { MonsterDef } from '../combat/types';
import type { Content } from '../content';
import type { Rng } from '../rng';
import type { TimeSlot } from '../types';
import type { ZoneDef } from './types';

const MAX_ENEMIES = 7;
const MIN_ENEMIES = 2;

export function familyMonsters(c: Content, family: string, slot: TimeSlot): MonsterDef[] {
  // Sin jefes ni piezas que no pelean (amenaza 0): esas solo salen con su jefe.
  return Object.values(c.monsters).filter((m) => m.family === family && !m.boss && m.threat > 0 && m.slots.includes(slot));
}

/**
 * Arma un grupo con el presupuesto de amenaza de la zona: cada monstruo cuesta su `threat`.
 * Con monstruos baratos salen grupos grandes; con los caros, grupos chicos.
 */
export function generateGroup(c: Content, zone: ZoneDef, slot: TimeSlot, rng: Rng, budgetMult = 1): { monsters: string[]; threat: number } {
  const family = rng.weighted(Object.entries(zone.families));
  const all = familyMonsters(c, family, slot);
  const strong = all.filter((m) => m.tier >= (zone.minTier ?? 0));
  const pool = strong.length ? strong : all;
  const night = slot === 'noche' ? BALANCE.expedition.nightBudgetMult : 1;
  const budget = Math.round(rng.int(zone.budget[0], zone.budget[1]) * night * budgetMult);
  const monsters: MonsterDef[] = [];
  let spent = 0;
  while (monsters.length < MAX_ENEMIES) {
    const affordable = pool.filter((m) => m.threat <= budget - spent);
    if (!affordable.length) break;
    // Los raros salen poco; repetir especie es más probable (manadas, bandas).
    const pick = rng.weighted(affordable.map((m) => [m, (m.rare ? 0.15 : 1) * (monsters.includes(m) ? 1.5 : 1)] as const));
    monsters.push(pick);
    spent += pick.threat;
  }
  const cheapest = [...pool].sort((a, b) => a.threat - b.threat)[0];
  while (cheapest && monsters.length < MIN_ENEMIES) {
    monsters.push(cheapest);
    spent += cheapest.threat;
  }
  return { monsters: monsters.map((m) => m.id), threat: spent };
}

export function groupThreat(c: Content, monsters: string[]): number {
  return monsters.reduce((a, id) => a + (c.monsters[id]?.threat ?? 0), 0);
}
