import type { Ctx } from '../content';
import type { GameEvent, GameState } from '../types';
import { dailyAuction, prepareLots } from './auction';
import { dailyCityEvents } from './cityEvents';
import { dailyContracts, refreshContractOffers } from './contracts';
import { dailyDemand } from './demand';
import { dailyQuests, refreshQuestOffers } from './quests';
import { claimPerks, dailyRelations } from './relations';
import { dailyServants, refreshServantMarket } from './servants';

/** Lo que pasa en la ciudad cada mañana (una vez por día que pasó). */
export function townMorning(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const events = [
    ...dailyQuests(s, c),
    ...dailyContracts(s, c),
    ...dailyCityEvents(s, c, rng),
    ...dailyAuction(s, c, rng),
    ...dailyRelations(s, c, rng),
    ...dailyServants(s),
  ];
  dailyDemand(s, c);
  return events;
}

/** Después de cada comando: avisos al día, lotes anunciados, candidatos y desbloqueos por relación. */
export function townUpkeep(s: GameState, { c, rng }: Ctx): GameEvent[] {
  refreshQuestOffers(s, c, rng);
  const events = refreshContractOffers(s, c, rng);
  prepareLots(s, c, rng);
  refreshServantMarket(s, c, rng);
  return [...events, ...claimPerks(s, c)];
}
