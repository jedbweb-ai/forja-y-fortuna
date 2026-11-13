import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { addMaterial, hasMaterial, homeCity, skillLevel } from '../state';
import { type GameEvent, type GameState, type SkillId } from '../types';
import type { BonusKey } from './types';

// Talentos y mejoras de la herrería: los dos suman bonos con nombre que leen los demás sistemas.

/** Suma de un bono entre los talentos aprendidos y los niveles construidos de la herrería. */
export function bonus(c: Content, s: GameState, key: BonusKey): number {
  let total = 0;
  for (const [id, rank] of Object.entries(s.talents ?? {})) total += (c.talents[id]?.effect[key] ?? 0) * rank;
  for (const [id, level] of Object.entries(s.workshop ?? {})) {
    const def = c.upgrades[id];
    for (let i = 0; i < level && def; i++) total += def.levels[i]?.effect[key] ?? 0;
  }
  return total;
}

/** Solo lo que dan las mejoras del taller (lo que aprovecha el personal; los talentos son del herrero). */
export function workshopBonus(c: Content, s: GameState, key: BonusKey): number {
  let total = 0;
  for (const [id, level] of Object.entries(s.workshop ?? {})) {
    const def = c.upgrades[id];
    for (let i = 0; i < level && def; i++) total += def.levels[i]?.effect[key] ?? 0;
  }
  return total;
}

// ───────────────────────── Talentos ─────────────────────────

/** Puntos de una habilidad: uno por cada nivel después del primero, menos los gastados. */
export function talentPoints(c: Content, s: GameState, skill: SkillId): { total: number; spent: number; free: number } {
  const total = skillLevel(s.skills[skill]) - 1;
  const spent = Object.entries(s.talents).reduce((a, [id, r]) => a + (c.talents[id]?.skill === skill ? r : 0), 0);
  return { total, spent, free: Math.max(0, total - spent) };
}

/** Por qué no se puede aprender (o null si se puede). */
export function talentBlock(c: Content, s: GameState, id: string): string | null {
  const t = c.talents[id];
  if (!t) return 'Ese talento no existe.';
  const rank = s.talents[id] ?? 0;
  if (rank >= t.maxRank) return 'Ya está al máximo.';
  if (skillLevel(s.skills[t.skill]) < t.minLevel) return `Pide nivel ${t.minLevel} de la habilidad.`;
  if (t.requires && !s.talents[t.requires]) return `Primero aprendé «${c.talents[t.requires].name}».`;
  if (talentPoints(c, s, t.skill).free <= 0) return 'No te quedan puntos en esta habilidad.';
  return null;
}

export function learnTalent(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const block = talentBlock(c, s, id);
  if (block) throw new GameError(block);
  s.talents[id] = (s.talents[id] ?? 0) + 1;
  return [{ type: 'toast', text: `Talento: ${c.talents[id].name} (rango ${s.talents[id]}).`, tone: 'good' }];
}

// ───────────────────────── Mejoras de la herrería ─────────────────────────

export function upgradeLevel(s: GameState, id: string): number {
  return s.workshop[id] ?? 0;
}

export function upgradeBlock(c: Content, s: GameState, id: string): string | null {
  const def = c.upgrades[id];
  if (!def) return 'Esa mejora no existe.';
  const next = def.levels[upgradeLevel(s, id)];
  if (!next) return 'Ya está al máximo.';
  if (next.reputationMin !== undefined && (s.reputation[homeCity()] ?? 0) < next.reputationMin) return `Pide reputación ${next.reputationMin} en la ciudad.`;
  if (s.gold < next.cost.gold) return `Cuesta ${next.cost.gold} de oro.`;
  const missing = next.cost.materials.find((m) => !hasMaterial(s, m.id, m.qty));
  if (missing) return `Te falta ${missing.qty}× ${c.materials[missing.id].name}.`;
  return null;
}

export function buyUpgrade(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  if (s.location !== 'herreria' || s.expedition) throw new GameError('Las mejoras se hacen en tu herrería.');
  const block = upgradeBlock(c, s, id);
  if (block) throw new GameError(block);
  const def = c.upgrades[id];
  const next = def.levels[upgradeLevel(s, id)];
  s.gold -= next.cost.gold;
  next.cost.materials.forEach((m) => addMaterial(s, m.id, -m.qty));
  s.workshop[id] = upgradeLevel(s, id) + 1;
  return [{ type: 'toast', text: `${def.icon} ${def.name}, nivel ${s.workshop[id]}: ${next.description}`, tone: 'good' }];
}

/** Tamaño máximo del grupo (crece con el cuarto para compañeros). */
export function maxPartySize(c: Content, s: GameState): number {
  return BALANCE.MAX_PARTY_SIZE + bonus(c, s, 'grupo');
}

/** Lugares de exhibición de la tienda (crecen con las vitrinas). */
export function displaySlots(c: Content, s: GameState): number {
  return BALANCE.shop.displaySlots + bonus(c, s, 'exhibicion');
}
