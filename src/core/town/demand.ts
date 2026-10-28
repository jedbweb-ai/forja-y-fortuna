import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import { clamp } from '../state';
import type { GameState, ItemCategory } from '../types';
import { activeEvents } from './cityEvents';

// Demanda por categoría: vender mucho de lo mismo baja el precio; se recupera día a día
// hacia lo que piden los eventos de la ciudad (un torneo sube armas, una plaga sube flechas...).

const D = BALANCE.demand;

export const ITEM_CATEGORIES: ItemCategory[] = [
  'arma', 'distancia', 'municion', 'arrojadizo', 'escudo', 'armadura', 'joyeria', 'herramienta', 'pocion', 'runa',
];

/** Categorías que se venden por lote: cada unidad baja menos la demanda. */
const BATCH: ItemCategory[] = ['municion', 'arrojadizo', 'pocion'];

export function demandOf(s: GameState, cat: ItemCategory): number {
  return s.demand?.[cat] ?? 1;
}

export function registerSale(s: GameState, cat: ItemCategory, qty: number) {
  const drop = BATCH.includes(cat) ? D.dropPerBatchUnit * qty : D.dropPerSale * qty;
  s.demand[cat] = round(clamp(demandOf(s, cat) - drop, D.min, D.max));
}

export function demandTarget(c: Content, s: GameState, cat: ItemCategory): number {
  return activeEvents(c, s).reduce((m, e) => m * (e.demand?.[cat] ?? 1), 1);
}

export function dailyDemand(s: GameState, c: Content) {
  for (const cat of ITEM_CATEGORIES) {
    const d = demandOf(s, cat);
    const next = round(clamp(d + (demandTarget(c, s, cat) - d) * D.recovery, D.min, D.max));
    if (Math.abs(next - 1) < 0.005) delete s.demand[cat];
    else s.demand[cat] = next;
  }
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
