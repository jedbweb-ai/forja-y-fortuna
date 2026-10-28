import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { addMaterial, currentCity } from '../state';
import type { GameEvent, GameState } from '../types';
import { materialPrice, materialStock } from './monsterMarket';

export function marketStock(c: Content, locationId: string): string[] {
  return c.cities[currentCity()].locations.find((l) => l.id === locationId)?.stock ?? [];
}

export function quickSellPrice(value: number, qty: number): number {
  return Math.max(1, Math.floor(value * qty * BALANCE.market.sellRatio));
}

export function buyMaterial(s: GameState, { c }: Ctx, id: string, qty: number): GameEvent[] {
  if (!marketStock(c, s.location).includes(id)) throw new GameError('Acá no venden eso.');
  const available = materialStock(c, s, id);
  if (available < qty) throw new GameError(available ? `Hoy solo quedan ${available}.` : 'Hoy no llegó nada de eso.');
  const total = materialPrice(c, s, id) * qty;
  if (s.gold < total) throw new GameError(`No te alcanza: cuesta ${total} de oro.`);
  s.gold -= total;
  addMaterial(s, id, qty);
  if (Number.isFinite(available) && s.market) s.market.stock[id] -= qty;
  return [{ type: 'toast', text: `Compraste ${qty}× ${c.materials[id].name} (−${total} oro).`, tone: 'info' }];
}

/** Venta rápida al por mayor en el mercado: barata pero inmediata. */
export function quickSell(s: GameState, _ctx: Ctx, uid: string, qty: number): GameEvent[] {
  if (s.location !== 'mercado') throw new GameError('La venta rápida se hace en el mercado.');
  const item = s.items.find((i) => i.uid === uid);
  if (!item) throw new GameError('Ese objeto no existe.');
  if (item.equippedBy) throw new GameError('Primero sacáselo a quien lo tiene equipado.');
  qty = Math.min(qty, item.quantity);
  const price = quickSellPrice(item.value, qty);
  item.quantity -= qty;
  if (item.quantity <= 0) s.items = s.items.filter((i) => i.uid !== uid);
  s.gold += price;
  s.stats.goldEarned += price;
  s.stats.itemsSold += qty;
  return [{ type: 'toast', text: `Vendiste ${qty}× ${item.name} por ${price} de oro.`, tone: 'good' }];
}
