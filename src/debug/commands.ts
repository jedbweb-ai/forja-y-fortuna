import type { Ctx } from '../core/content';
import { addMaterial, changeRelation, changeReputation, currentCity, skillLevel, xpForLevel } from '../core/state';
import { advanceTime } from '../core/time';
import type { GameEvent, GameState, SkillId } from '../core/types';

// Comandos del modo debug. Mismo formato que los comandos del juego.

export function dbgGold(s: GameState, _ctx: Ctx, amount: number): GameEvent[] {
  s.gold += amount;
  return [{ type: 'toast', text: `[debug] +${amount} oro` }];
}

export function dbgMaterials(s: GameState, { c }: Ctx, qty: number, id?: string): GameEvent[] {
  const ids = id ? [id] : Object.keys(c.materials);
  ids.forEach((m) => addMaterial(s, m, qty));
  return [{ type: 'toast', text: `[debug] +${qty} de ${id ? c.materials[id].name : 'cada material'}` }];
}

export function dbgAdvance(s: GameState, _ctx: Ctx, slots: number): GameEvent[] {
  s.outing = false;
  return advanceTime(s, slots);
}

export function dbgLevelUp(s: GameState, _ctx: Ctx, skill: SkillId): GameEvent[] {
  s.skills[skill] = xpForLevel(skillLevel(s.skills[skill]) + 1);
  return [{ type: 'toast', text: `[debug] ${skill} nivel ${skillLevel(s.skills[skill])}` }];
}

export function dbgRelation(s: GameState, _ctx: Ctx, npc: string, delta: number): GameEvent[] {
  changeRelation(s, npc, delta);
  s.npcs[npc].lastTalkDay = 0;
  return [];
}

export function dbgReputation(s: GameState, _ctx: Ctx, delta: number): GameEvent[] {
  changeReputation(s, currentCity(), delta);
  return [];
}

export function dbgRevealSynergies(s: GameState, { c }: Ctx): GameEvent[] {
  s.discoveredSynergies = Object.keys(c.synergies);
  return [{ type: 'toast', text: '[debug] Todas las sinergias reveladas' }];
}

export function dbgResetTalks(s: GameState): GameEvent[] {
  Object.values(s.npcs).forEach((n) => { n.lastTalkDay = 0; });
  return [{ type: 'toast', text: '[debug] Límite diario de charlas reiniciado' }];
}
