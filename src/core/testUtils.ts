import { CONTENT } from '../data';
import type { Ctx } from './content';
import { createRng, type Rng } from './rng';
import { createInitialState } from './state';
import type { GameEvent, GameState } from './types';

/** Estado nuevo + contexto con semilla fija, para tests. */
export function setup(seed = 42): { s: GameState; ctx: Ctx } {
  return { s: createInitialState(CONTENT, seed), ctx: { c: CONTENT, rng: createRng(seed) } };
}

export function withRng(ctx: Ctx, rng: Rng): Ctx {
  return { ...ctx, rng };
}

export function toasts(events: GameEvent[]): string[] {
  return events.flatMap((e) => (e.type === 'toast' ? [e.text] : []));
}
