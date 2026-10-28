import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { applyEffect, checkAll } from '../dialogue';
import type { Rng } from '../rng';
import { currentCity } from '../state';
import type { GameEvent, GameState } from '../types';
import type { CityEventDef } from './types';

// Eventos de ciudad: duran varios días, mueven la demanda, los precios y los clientes.
// Algunos piden tomar partido (la decisión se toma en el tablón).

const E = BALANCE.cityEvents;

export function activeEvents(c: Content, s: GameState): CityEventDef[] {
  return (s.cityEvents?.active ?? []).map((a) => c.cityEvents[a.id]).filter(Boolean);
}

/** Cuánto aparece un tipo de cliente con los eventos de hoy. */
export function customerMult(c: Content, s: GameState, typeId: string): number {
  return activeEvents(c, s).reduce((m, e) => m * (e.customers?.[typeId] ?? 1), 1);
}

/** Multiplicador de precio de un material por los eventos de hoy. */
export function materialEventMult(c: Content, s: GameState, materialId: string): number {
  const m = c.materials[materialId];
  if (!m) return 1;
  return activeEvents(c, s).reduce((mult, e) => {
    const p = e.prices;
    if (!p) return mult;
    const any = !p.materials && !p.tags && !p.types;
    const hit = any || p.materials?.includes(m.id) || p.types?.includes(m.type) || p.tags?.some((t) => m.tags?.includes(t));
    return hit ? mult * p.mult : mult;
  }, 1);
}

export function startCityEvent(s: GameState, c: Content, rng: Rng, id: string): GameEvent[] {
  const def = c.cityEvents[id];
  if (!def || s.cityEvents.active.some((a) => a.id === id)) return [];
  const days = rng.int(def.duration[0], def.duration[1]);
  s.cityEvents.active.push({ id, start: s.day, until: s.day + days - 1 });
  s.cityEvents.recent = [id, ...s.cityEvents.recent].slice(0, E.recentMemory);
  const events: GameEvent[] = [{ type: 'toast', text: `📢 ${def.name}: ${def.text}`, tone: 'info' }];
  for (const eff of def.onStart ?? []) events.push(...applyEffect(s, c, eff));
  return events;
}

/** Cada mañana: terminan los eventos vencidos y, con suerte, empieza uno nuevo. */
export function dailyCityEvents(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const ev = s.cityEvents;
  const events: GameEvent[] = [];
  for (const a of ev.active.filter((x) => x.until < s.day)) {
    events.push({ type: 'toast', text: `Terminó: ${c.cityEvents[a.id]?.name ?? a.id}.`, tone: 'info' });
  }
  ev.active = ev.active.filter((x) => x.until >= s.day);
  if (ev.active.length >= E.maxActive || !rng.chance(E.dailyChance)) return events;
  const rep = s.reputation[currentCity()] ?? 0;
  const pool = Object.values(c.cityEvents).filter((d) => !ev.active.some((a) => a.id === d.id) && !ev.recent.includes(d.id)
    && (d.minDay ?? 0) <= s.day && (d.minReputation ?? -Infinity) <= rep);
  if (!pool.length) return events;
  const def = rng.weighted(pool.map((d) => [d, d.weight] as const));
  return [...events, ...startCityEvent(s, c, rng, def.id)];
}

/** Tomar partido en un evento (desde el tablón). */
export function chooseEventOption(s: GameState, { c }: Ctx, eventId: string, index: number): GameEvent[] {
  const a = s.cityEvents.active.find((x) => x.id === eventId);
  const def = c.cityEvents[eventId];
  const option = def?.choice?.options[index];
  if (!a || !option) throw new GameError('Esa decisión ya no está.');
  if (a.chosen !== undefined) throw new GameError('Ya tomaste partido.');
  if (s.location !== 'tablon') throw new GameError('Las decisiones de la ciudad se toman en el tablón.');
  if (!checkAll(s, option.conditions)) throw new GameError('No podés elegir eso ahora.');
  a.chosen = index;
  const events = option.effects.flatMap((e) => applyEffect(s, c, e));
  events.unshift({ type: 'toast', text: option.result, tone: 'info' });
  return events;
}
