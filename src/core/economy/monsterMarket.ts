import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import type { Rng } from '../rng';
import { currentCity } from '../state';
import { materialEventMult } from '../town/cityEvents';
import { tradeMult } from '../town/relations';
import type { GameState } from '../types';
import type { MarketEventDef } from '../world/types';

const MK = BALANCE.market;

const MONSTER_FAMILY_TAGS = ['bestia', 'goblin', 'slime'];

/** Parte de monstruo: por su tipo o porque viene de una familia de monstruos (cueros, seda, chatarra goblin...). */
export function isMonsterPart(c: Content, id: string): boolean {
  const m = c.materials[id];
  return !!m && (m.type === 'monstruo' || !!m.tags?.some((t) => MONSTER_FAMILY_TAGS.includes(t)));
}

/** Partes de monstruo que se venden en el mercado de la ciudad. */
export function marketMonsterParts(c: Content): string[] {
  const loc = c.cities[currentCity()].locations.find((l) => l.kind === 'mercado');
  return (loc?.stock ?? []).filter((id) => isMonsterPart(c, id));
}

function affects(c: Content, ev: MarketEventDef, id: string): boolean {
  if (!ev.materials && !ev.tags) return true;
  if (ev.materials?.includes(id)) return true;
  const tags = c.materials[id]?.tags ?? [];
  return !!ev.tags?.some((t) => tags.includes(t));
}

/**
 * Cada día cambia lo que llega al mercado: stock limitado de partes de monstruo,
 * precios caros y noticias que mueven la oferta (cazadores que vuelven, plagas, asaltos...).
 */
export function refreshMarket(s: GameState, c: Content, rng: Rng) {
  const pool = Object.values(c.marketEvents);
  const events: MarketEventDef[] = [];
  const count = rng.int(MK.eventsPerDay[0], MK.eventsPerDay[1]);
  for (let i = 0; i < count && pool.length; i++) {
    const ev = rng.weighted(pool.filter((e) => !events.includes(e)).map((e) => [e, e.weight] as const));
    events.push(ev);
  }
  const stock: Record<string, number> = {};
  const priceMult: Record<string, number> = {};
  for (const id of marketMonsterParts(c)) {
    let st = rng.int(MK.monsterStock[0], MK.monsterStock[1]) / (c.materials[id].tier > 1 ? 2 : 1);
    let price = MK.monsterPriceMult * rng.range(MK.priceJitter[0], MK.priceJitter[1]);
    for (const ev of events.filter((e) => affects(c, e, id))) {
      st *= ev.stockMult;
      price *= ev.priceMult;
    }
    stock[id] = Math.max(0, Math.round(st));
    priceMult[id] = Math.round(price * 100) / 100;
  }
  s.market = { day: s.day, stock, priceMult, news: events.map((e) => e.text) };
}

/**
 * Precio de compra de un material hoy, en el lugar donde estás: noticias del mercado,
 * eventos de la ciudad y tu relación con el dueño del puesto.
 */
export function materialPrice(c: Content, s: GameState, id: string): number {
  const base = c.materials[id].price;
  const mult = (s.market?.priceMult[id] ?? 1) * materialEventMult(c, s, id) * tradeMult(c, s, s.location);
  return Math.max(1, Math.round(base * mult));
}

/** Stock disponible hoy (Infinity si no es parte de monstruo). */
export function materialStock(c: Content, s: GameState, id: string): number {
  if (!isMonsterPart(c, id)) return Infinity;
  return s.market?.stock[id] ?? 0;
}
