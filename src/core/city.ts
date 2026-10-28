import { BALANCE } from '../config/balance';
import { GameError, type Content, type Ctx } from './content';
import { currentCity, homeCity } from './state';
import { roadEncounter } from './world/expedition';
import { isServantNpc, servantLocation } from './town/servants';
import { advanceTime, sleep, slotName } from './time';
import type { CityLocation, GameEvent, GameState } from './types';

/** Un lugar de cualquier ciudad (los ids son únicos en todo el mundo). */
export function cityLocation(c: Content, id: string): CityLocation | undefined {
  for (const city of Object.values(c.cities)) {
    const loc = city.locations.find((l) => l.id === id);
    if (loc) return loc;
  }
  return undefined;
}

/** Ciudad a la que pertenece un lugar. */
export function cityOfLocation(c: Content, id: string): string | undefined {
  return Object.values(c.cities).find((city) => city.locations.some((l) => l.id === id))?.id;
}

/** Se descansa en la herrería o en la posada de otra ciudad. */
function canRest(c: Content, s: GameState): boolean {
  return s.location === 'herreria' || cityLocation(c, s.location)?.kind === 'posada';
}

/** NPCs con nombre presentes en un lugar según su rutina y la franja actual. */
export function npcsAt(c: Content, s: GameState, locationId: string): string[] {
  const slot = slotName(s);
  // Los mercenarios contratados andan con vos, no en su lugar habitual.
  return Object.values(c.npcs)
    .filter((n) => {
      if (s.party.includes(n.id) || s.characters[n.id]?.dead) return false;
      if (s.assistant === n.id) return locationId === 'herreria';
      return isServantNpc(c, n.id) ? servantLocation(s, n.id) === locationId : n.routine[slot] === locationId;
    })
    .map((n) => n.id);
}

/**
 * Moverse por la ciudad. Salir del taller a recorrer la ciudad consume la franja:
 * se cobra al volver a la herrería, y mientras tanto la tienda está cerrada.
 */
export function goTo(s: GameState, { c }: Ctx, locationId: string): GameEvent[] {
  const loc = cityLocation(c, locationId);
  if (!loc || cityOfLocation(c, locationId) !== currentCity(s)) throw new GameError('Ese lugar no existe.');
  if (!loc.available) throw new GameError(`${loc.name}: todavía cerrado.`);
  if (s.expedition) throw new GameError('Estás de expedición.');
  if (s.location === locationId) return [];
  if (s.forge) throw new GameError('Tenés una pieza a medio hacer en el yunque.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  if (s.auction.session) throw new GameError('Estás en plena subasta.');
  const events: GameEvent[] = [];
  // Fuera de la ciudad de la herrería no hay "salida": se va y viene libremente; el tiempo pasa en la posada y viajando.
  if (currentCity(s) !== homeCity()) {
    s.location = locationId;
    events.push({ type: 'locationChanged', location: locationId });
    return events;
  }
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

export function restSlot(s: GameState, { c }: Ctx): GameEvent[] {
  if (!canRest(c, s)) throw new GameError('Solo podés descansar en tu herrería o en una posada.');
  if (s.forge || s.shop) throw new GameError('Ahora no podés descansar.');
  return advanceTime(s, 1);
}

export function sleepUntilMorning(s: GameState, { c }: Ctx): GameEvent[] {
  if (!canRest(c, s)) throw new GameError('Solo podés dormir en tu herrería o en una posada.');
  if (s.forge || s.shop) throw new GameError('Ahora no podés dormir.');
  if (s.location !== 'herreria') {
    if (s.gold < BALANCE.travel.innPrice) throw new GameError(`Una noche en la posada cuesta ${BALANCE.travel.innPrice} de oro.`);
    s.gold -= BALANCE.travel.innPrice;
  }
  return sleep(s);
}

/**
 * Viajar a otra ciudad. Tarda unas franjas y a veces sale algo al cruce:
 * se pelea en el camino y después se sigue viaje.
 */
export function travelTo(s: GameState, { c, rng }: Ctx, cityId: string): GameEvent[] {
  const from = c.cities[currentCity(s)];
  const to = c.cities[cityId];
  const route = from.routes.find((r) => r.to === cityId);
  if (!to || !route) throw new GameError('No hay camino hasta ahí.');
  if (s.expedition) throw new GameError('Estás de expedición.');
  if (s.forge) throw new GameError('Tenés una pieza a medio hacer en el yunque.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  if (s.auction.session) throw new GameError('Estás en plena subasta.');
  const half = Math.floor(route.slots / 2);
  const events: GameEvent[] = [{ type: 'toast', text: `Salís de ${from.name} hacia ${to.name}.`, tone: 'info' }];
  s.outing = false;
  if (rng.chance(route.chance)) {
    events.push(...advanceTime(s, half));
    events.push(...roadEncounter(s, { c, rng }, cityId, route.slots - half, route.families, route.budget));
    return events;
  }
  events.push(...advanceTime(s, route.slots));
  return [...events, ...arrive(s, c, cityId)];
}

/** Llegar a una ciudad. */
export function arrive(s: GameState, c: Content, cityId: string): GameEvent[] {
  const to = c.cities[cityId];
  s.city = cityId;
  s.location = to.arrival;
  s.outing = false;
  s.demand[cityId] ??= {};
  return [{ type: 'toast', text: `Llegás a ${to.name}.`, tone: 'good' }, { type: 'locationChanged', location: to.arrival }];
}
