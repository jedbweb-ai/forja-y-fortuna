import { GameError, type Ctx } from '../content';
import { addXp } from '../state';
import { advanceTime } from '../time';
import type { GameEvent, GameState, ItemInstance } from '../types';

/** Oro que cuesta dejar un objeto como nuevo. */
export function repairCost(item: ItemInstance): number {
  if (item.maxDurability <= 0 || item.durability >= item.maxDurability) return 0;
  const missing = 1 - item.durability / item.maxDurability;
  return Math.max(1, Math.ceil(item.value * 0.2 * missing));
}

export function damagedItems(s: GameState): ItemInstance[] {
  return s.items.filter((i) => i.quantity === 1 && repairCost(i) > 0);
}

/** Repara varios objetos juntos en la forja. Consume una franja. */
export function repairItems(s: GameState, _ctx: Ctx, uids: string[]): GameEvent[] {
  if (s.location !== 'herreria' || s.expedition) throw new GameError('Se repara en tu herrería.');
  if (s.forge || s.shop) throw new GameError('Ahora no podés reparar.');
  const items = uids.map((u) => s.items.find((i) => i.uid === u)).filter((i): i is ItemInstance => !!i && repairCost(i) > 0);
  if (!items.length) throw new GameError('No hay nada para reparar.');
  const total = items.reduce((a, i) => a + repairCost(i), 0);
  if (s.gold < total) throw new GameError(`La reparación cuesta ${total} de oro.`);
  s.gold -= total;
  for (const i of items) i.durability = i.maxDurability;
  addXp(s, 'herreria', 3 * items.length);
  return [
    { type: 'toast', text: `Reparaste ${items.length} objeto(s) por ${total} de oro.`, tone: 'good' },
    ...advanceTime(s, 1),
  ];
}
