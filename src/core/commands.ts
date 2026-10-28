import type { Ctx } from './content';
import { refreshMarket } from './economy/monsterMarket';
import { assistantShift, closeShop } from './economy/shop';
import { payWages } from './party/mercenaries';
import { townMorning, townUpkeep } from './town/daily';
import type { GameEvent, GameState } from './types';

export type Command<A extends unknown[]> = (s: GameState, ctx: Ctx, ...args: A) => GameEvent[];

/**
 * Corre un comando y, si con él pasaron días, aplica lo que ocurre cada mañana:
 * sueldos, encargos y contratos que vencen, eventos de ciudad, subasta, rumores y mercado nuevo.
 * Lo usan el store y los tests.
 */
export function runCommand<A extends unknown[]>(s: GameState, ctx: Ctx, cmd: Command<A>, ...args: A): GameEvent[] {
  const dayBefore = s.day;
  const slotBefore = s.day * 3 + s.slot;
  const events = cmd(s, ctx, ...args);
  // Las franjas en las que no atendiste vos, atiende el ayudante (si tenés).
  const passed = s.day * 3 + s.slot - slotBefore;
  if (passed > 0 && s.assistant && (cmd as unknown) !== closeShop) events.push(...assistantShift(s, ctx.c, ctx.rng, passed));
  for (let d = dayBefore; d < s.day; d++) events.push(...payWages(s), ...townMorning(s, ctx));
  if (!s.market || s.market.day !== s.day) refreshMarket(s, ctx.c, ctx.rng);
  events.push(...townUpkeep(s, ctx));
  return events;
}
