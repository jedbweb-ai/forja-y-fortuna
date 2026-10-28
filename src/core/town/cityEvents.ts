import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { applyEffect, checkAll } from '../dialogue';
import type { Rng } from '../rng';
import { currentCity, homeCity } from '../state';
import { cityLocation } from '../city';
import type { GameEvent, GameState } from '../types';
import type { CityEventDef } from './types';

// Eventos de ciudad: duran varios días, mueven la demanda, los precios y los clientes.
// Algunos piden tomar partido (la decisión se toma en el tablón).

const E = BALANCE.cityEvents;

/** Eventos activos en una ciudad (por defecto, donde está el herrero). */
export function activeEvents(c: Content, s: GameState, city = currentCity(s)): CityEventDef[] {
  return (s.cityEvents?.active ?? []).filter((a) => (a.city ?? homeCity()) === city).map((a) => c.cityEvents[a.id]).filter(Boolean);
}

/** Cuánto aparece un tipo de cliente con los eventos de hoy. */
export function customerMult(c: Content, s: GameState, typeId: string, city = currentCity(s)): number {
  return activeEvents(c, s, city).reduce((m, e) => m * (e.customers?.[typeId] ?? 1), 1);
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
  const city = def.city ?? homeCity();
  s.cityEvents.active.push({ id, city, start: s.day, until: s.day + days - 1 });
  s.cityEvents.recent = [id, ...s.cityEvents.recent].slice(0, E.recentMemory * Object.keys(c.cities).length);
  // Solo se anuncia si estás en esa ciudad; si no, te enterás al llegar (en el tablón).
  const events: GameEvent[] = city === currentCity(s) ? [{ type: 'toast', text: `📢 ${def.name}: ${def.text}`, tone: 'info' }] : [];
  for (const eff of def.onStart ?? []) events.push(...applyEffect(s, c, eff));
  return events;
}

/** Cada mañana, en cada ciudad: terminan los eventos vencidos y, con suerte, empieza uno nuevo. */
export function dailyCityEvents(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const ev = s.cityEvents;
  const events: GameEvent[] = [];
  for (const a of ev.active.filter((x) => x.until < s.day && (x.city ?? homeCity()) === currentCity(s))) {
    events.push({ type: 'toast', text: `Terminó: ${c.cityEvents[a.id]?.name ?? a.id}.`, tone: 'info' });
  }
  ev.active = ev.active.filter((x) => x.until >= s.day);
  for (const city of Object.keys(c.cities)) {
    const here = ev.active.filter((a) => (a.city ?? homeCity()) === city);
    if (here.length >= E.maxActive || !rng.chance(E.dailyChance)) continue;
    const rep = s.reputation[city] ?? 0;
    const pool = Object.values(c.cityEvents).filter((d) => (d.city ?? homeCity()) === city && !ev.active.some((a) => a.id === d.id)
      && !ev.recent.includes(d.id) && (d.minDay ?? 0) <= s.day && (d.minReputation ?? -Infinity) <= rep);
    if (!pool.length) continue;
    const def = rng.weighted(pool.map((d) => [d, d.weight] as const));
    events.push(...startCityEvent(s, c, rng, def.id));
  }
  return events;
}

/** Tomar partido en un evento (desde el tablón). */
export function chooseEventOption(s: GameState, { c }: Ctx, eventId: string, index: number): GameEvent[] {
  const a = s.cityEvents.active.find((x) => x.id === eventId);
  const def = c.cityEvents[eventId];
  const option = def?.choice?.options[index];
  if (!a || !option) throw new GameError('Esa decisión ya no está.');
  if (a.chosen !== undefined) throw new GameError('Ya tomaste partido.');
  const kind = cityLocation(c, s.location)?.kind;
  if ((kind !== 'tablon' && kind !== 'gremio') || (a.city ?? homeCity()) !== currentCity(s)) throw new GameError('Las decisiones de la ciudad se toman en su tablón o su gremio.');
  if (!checkAll(s, option.conditions)) throw new GameError('No podés elegir eso ahora.');
  a.chosen = index;
  const events = option.effects.flatMap((e) => applyEffect(s, c, e));
  events.unshift({ type: 'toast', text: option.result, tone: 'info' });
  return events;
}
