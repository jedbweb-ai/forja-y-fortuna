import { CONTENT } from '../data';
import type { Ctx } from './content';
import { buildItem } from './forge/item';
import { createRng, type Rng } from './rng';
import { createInitialState, nextUid } from './state';
import type { GameEvent, GameState, ItemInstance } from './types';

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

/** Crea un objeto terminado directamente en el inventario (sin pasar por la forja). */
export function makeItem(s: GameState, blueprintId: string, materials: Record<string, string>, quality = 60, traits: string[] = []): ItemInstance {
  const build = buildItem(CONTENT, {
    blueprintId, materials, stage: 'enchant', hits: 5, quality, defects: 0, traits, finish: [], instability: 0,
  });
  const { rarityScore: _r, design: _d, ...rest } = build;
  const item: ItemInstance = { ...rest, uid: nextUid(s, 'it'), exhibited: false, createdDay: s.day };
  s.items.push(item);
  return item;
}
