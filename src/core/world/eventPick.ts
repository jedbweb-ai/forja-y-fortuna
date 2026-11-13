import type { Content } from '../content';
import type { Rng } from '../rng';
import type { ExpEventDef, ZoneDef } from './types';

/** Eventos que pueden salir en una zona (por bioma y peligro). */
export function eventsFor(c: Content, zone: ZoneDef): ExpEventDef[] {
  return Object.values(c.expeditionEvents).filter((ev) => (!ev.biomes || ev.biomes.includes(zone.biome)) && zone.danger >= (ev.minDanger ?? 0));
}

/** Elige un evento para la zona, evitando repetir los ya usados en esta salida (si se puede). */
export function pickEvent(c: Content, zone: ZoneDef, rng: Rng, used: string[] = []): string | null {
  const all = eventsFor(c, zone);
  const fresh = all.filter((ev) => !used.includes(ev.id));
  const pool = fresh.length ? fresh : all;
  if (!pool.length) return null;
  return rng.weighted(pool.map((ev) => [ev.id, ev.weight] as const));
}
