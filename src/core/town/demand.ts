import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import { clamp, currentCity } from '../state';
import type { GameState, ItemCategory } from '../types';
import { activeEvents } from './cityEvents';

// Demanda por categoría y por ciudad: vender mucho de lo mismo baja el precio; se recupera día a día
// hacia lo que pide cada ciudad (la frontera pide armaduras, el puerto arrojadizos) y sus eventos.

const D = BALANCE.demand;

export const ITEM_CATEGORIES: ItemCategory[] = [
  'arma', 'distancia', 'municion', 'arrojadizo', 'escudo', 'armadura', 'joyeria', 'herramienta', 'pocion', 'runa',
];

/** Categorías que se venden por lote: cada unidad baja menos la demanda. */
const BATCH: ItemCategory[] = ['municion', 'arrojadizo', 'pocion'];

export function demandOf(s: GameState, cat: ItemCategory, city = currentCity(s)): number {
  return s.demand?.[city]?.[cat] ?? 1;
}

export function registerSale(s: GameState, cat: ItemCategory, qty: number, city = currentCity(s)) {
  const drop = BATCH.includes(cat) ? D.dropPerBatchUnit * qty : D.dropPerSale * qty;
  const d = (s.demand[city] ??= {});
  d[cat] = round(clamp(demandOf(s, cat, city) - drop, D.min, D.max));
}

/** Hacia dónde tiende la demanda: lo propio de la ciudad por lo que piden sus eventos. */
export function demandTarget(c: Content, s: GameState, cat: ItemCategory, city = currentCity(s)): number {
  const base = c.cities[city]?.demand?.[cat] ?? 1;
  return activeEvents(c, s, city).reduce((m, e) => m * (e.demand?.[cat] ?? 1), base);
}

export function dailyDemand(s: GameState, c: Content) {
  for (const city of Object.keys(c.cities)) {
    const d = (s.demand[city] ??= {});
    for (const cat of ITEM_CATEGORIES) {
      const cur = demandOf(s, cat, city);
      const next = round(clamp(cur + (demandTarget(c, s, cat, city) - cur) * D.recovery, D.min, D.max));
      if (Math.abs(next - 1) < 0.005) delete d[cat];
      else d[cat] = next;
    }
  }
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
