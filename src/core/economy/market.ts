import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { addMaterial } from '../state';
import { cityLocation } from '../city';
import { demandOf, registerSale } from '../town/demand';
import { exclusiveStock, refusesTrade } from '../town/relations';
import type { GameEvent, GameState, ItemInstance } from '../types';
import { materialPrice, materialStock } from './monsterMarket';

/** Lo que se vende en un lugar, más lo que el dueño solo te vende a vos por la relación. */
export function marketStock(c: Content, s: GameState, locationId: string): string[] {
  const base = cityLocation(c, locationId)?.stock ?? [];
  return [...new Set([...base, ...exclusiveStock(c, s, locationId)])];
}

/** Venta rápida: menos de la mitad del valor, y menos si esa categoría ya está saturada. */
export function quickSellPrice(s: GameState, item: ItemInstance, qty: number): number {
  return Math.max(1, Math.floor(item.value * qty * BALANCE.market.sellRatio * demandOf(s, item.category)));
}

export function buyMaterial(s: GameState, { c }: Ctx, id: string, qty: number): GameEvent[] {
  if (!marketStock(c, s, s.location).includes(id)) throw new GameError('Acá no venden eso.');
  const refuse = refusesTrade(c, s, s.location);
  if (refuse) throw new GameError(refuse);
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
  const here = cityLocation(_ctx.c, s.location)?.kind;
  if (here !== 'mercado' && here !== 'muelle') throw new GameError('La venta rápida se hace en el mercado.');
  const item = s.items.find((i) => i.uid === uid);
  if (!item) throw new GameError('Ese objeto no existe.');
  if (item.equippedBy) throw new GameError('Primero sacáselo a quien lo tiene equipado.');
  qty = Math.min(qty, item.quantity);
  const price = quickSellPrice(s, item, qty);
  item.quantity -= qty;
  if (item.quantity <= 0) {
    s.items = s.items.filter((i) => i.uid !== uid);
    delete s.belt[uid];
  }
  s.gold += price;
  s.stats.goldEarned += price;
  s.stats.itemsSold += qty;
  registerSale(s, item.category, qty);
  return [{ type: 'toast', text: `Vendiste ${qty}× ${item.name} por ${price} de oro.`, tone: 'good' }];
}
