import { BALANCE } from '../../config/balance';
import { cityLocation } from '../city';
import type { Content } from '../content';
import { displaySlots } from '../progress/progress';
import type { GameState, ItemInstance } from '../types';

// Tus tiendas: la herrería de Valdebrasa y las sucursales que compres en otras ciudades.
// El inventario es uno solo; lo exhibido es de cada tienda (item.shopId; sin dato, la herrería).

/** La herrería del protagonista. */
export const HOME_SHOP = 'herreria';

export const isBranch = (c: Content, id: string) => !!cityLocation(c, id)?.branch;
export const ownsBranch = (s: GameState, id: string) => s.staff.branches.includes(id);

/** La tienda tuya donde está el herrero (la herrería o una sucursal comprada), o null. */
export function shopHere(c: Content, s: GameState): string | null {
  if (s.expedition) return null;
  if (s.location === HOME_SHOP) return HOME_SHOP;
  return isBranch(c, s.location) && ownsBranch(s, s.location) ? s.location : null;
}

/** Todas tus tiendas. */
export function ownedShops(s: GameState): string[] {
  return [HOME_SHOP, ...s.staff.branches];
}

/** En la vidriera de qué tienda está una pieza (si está exhibida). */
export const shopOfItem = (i: ItemInstance) => i.shopId ?? HOME_SHOP;

/** Lugares de exhibición de una tienda: la herrería crece con las vitrinas; las sucursales tienen los suyos. */
export function displaySlotsOf(c: Content, s: GameState, shop: string): number {
  return shop === HOME_SHOP ? displaySlots(c, s) : BALANCE.branches.displaySlots;
}

/** Pone una pieza en la vidriera de una tienda (o la saca). */
export function setExhibited(item: ItemInstance, shop: string | null) {
  item.exhibited = !!shop;
  if (shop && shop !== HOME_SHOP) item.shopId = shop;
  else delete item.shopId;
}

/** Nombre corto de una tienda para la UI ("tu herrería", "tu taller de Puertoseco"). */
export function shopName(c: Content, shop: string): string {
  return shop === HOME_SHOP ? 'tu herrería' : (cityLocation(c, shop)?.name ?? shop).replace(/^Tu /, 'tu ');
}
