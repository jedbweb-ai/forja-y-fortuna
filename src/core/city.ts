import { BALANCE } from '../config/balance';
import { GameError, type Content, type Ctx } from './content';
import { currentCity } from './state';
import { advanceTime, sleep, slotName } from './time';
import type { CityLocation, GameEvent, GameState } from './types';

export function cityLocation(c: Content, id: string): CityLocation | undefined {
  return c.cities[currentCity()].locations.find((l) => l.id === id);
}

/** NPCs con nombre presentes en un lugar según su rutina y la franja actual. */
export function npcsAt(c: Content, s: GameState, locationId: string): string[] {
  const slot = slotName(s);
  // Los mercenarios contratados andan con vos, no en su lugar habitual.
  return Object.values(c.npcs).filter((n) => n.routine[slot] === locationId && !s.party.includes(n.id)).map((n) => n.id);
}

/**
 * Moverse por la ciudad. Salir del taller a recorrer la ciudad consume la franja:
 * se cobra al volver a la herrería, y mientras tanto la tienda está cerrada.
 */
export function goTo(s: GameState, { c }: Ctx, locationId: string): GameEvent[] {
  const loc = cityLocation(c, locationId);
  if (!loc) throw new GameError('Ese lugar no existe.');
  if (!loc.available) throw new GameError(`${loc.name}: todavía cerrado.`);
  if (s.expedition) throw new GameError('Estás de expedición.');
  if (s.location === locationId) return [];
  if (s.forge) throw new GameError('Tenés una pieza a medio hacer en el yunque.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  const events: GameEvent[] = [];
  if (locationId === 'herreria') {
    s.location = locationId;
    if (s.outing) {
      events.push({ type: 'toast', text: 'Volvés al taller. Se te fue la franja recorriendo la ciudad.', tone: 'info' });
      events.push(...advanceTime(s, BALANCE.time.cityOutingSlots));
    }
  } else {
    if (!s.outing) {
      s.outing = true;
      events.push({ type: 'toast', text: `Salís a recorrer la ciudad: se va a ir la franja de la ${slotName(s)}.`, tone: 'info' });
    }
    s.location = locationId;
  }
  events.push({ type: 'locationChanged', location: locationId });
  return events;
}

export function restSlot(s: GameState, _ctx: Ctx): GameEvent[] {
  if (s.location !== 'herreria') throw new GameError('Solo podés descansar en tu herrería.');
  if (s.forge || s.shop) throw new GameError('Ahora no podés descansar.');
  return advanceTime(s, 1);
}

export function sleepUntilMorning(s: GameState, _ctx: Ctx): GameEvent[] {
  if (s.location !== 'herreria') throw new GameError('Solo podés dormir en tu herrería.');
  if (s.forge || s.shop) throw new GameError('Ahora no podés dormir.');
  return sleep(s);
}
