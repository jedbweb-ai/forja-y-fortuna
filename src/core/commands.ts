import type { Ctx } from './content';
import { refreshMarket } from './economy/monsterMarket';
import { payWages } from './party/mercenaries';
import type { GameEvent, GameState } from './types';

export type Command<A extends unknown[]> = (s: GameState, ctx: Ctx, ...args: A) => GameEvent[];

/**
 * Corre un comando y, si con él pasaron días, aplica lo que ocurre cada mañana:
 * sueldos de mercenarios y mercado nuevo. Lo usan el store y los tests.
 */
export function runCommand<A extends unknown[]>(s: GameState, ctx: Ctx, cmd: Command<A>, ...args: A): GameEvent[] {
  const dayBefore = s.day;
  const events = cmd(s, ctx, ...args);
  for (let d = dayBefore; d < s.day; d++) events.push(...payWages(s));
  if (!s.market || s.market.day !== s.day) refreshMarket(s, ctx.c, ctx.rng);
  return events;
}
