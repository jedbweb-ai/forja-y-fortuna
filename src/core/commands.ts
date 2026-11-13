import type { Ctx } from './content';
import { refreshMarket } from './economy/monsterMarket';
import { closeShop } from './economy/shop';
import { shopHere } from './economy/shops';
import { payWages } from './party/mercenaries';
import { tutorialUpdate } from './tutorial/tutorial';
import { payWorkers, staffReportEvents, staffShift } from './staff/staff';
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
  // En las franjas que pasaron trabaja el personal de cada herrería (si atendiste vos, los vendedores no venden).
  const slotAfter = s.day * 3 + s.slot;
  if (slotAfter > slotBefore) staffShift(s, ctx.c, ctx.rng, slotBefore, slotAfter, (cmd as unknown) === closeShop ? shopHere(ctx.c, s) : null);
  for (let d = dayBefore; d < s.day; d++) events.push(...payWages(s), ...payWorkers(s, ctx.c), ...townMorning(s, ctx));
  if (!s.market || s.market.day !== s.day) refreshMarket(s, ctx.c, ctx.rng);
  events.push(...townUpkeep(s, ctx));
  events.push(...staffReportEvents(s, ctx.c));
  events.push(...tutorialUpdate(s, ctx.c, events));
  return events;
}
