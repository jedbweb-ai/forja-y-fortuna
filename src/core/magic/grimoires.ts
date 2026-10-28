import { GameError, type Content, type Ctx } from '../content';
import type { GameEvent, GameState } from '../types';

export function hasGrimoire(s: GameState, id: string): boolean {
  return s.grimoires.some((g) => g.id === id);
}

/** Suma un grimorio a la biblioteca personal (sin leer). */
export function acquireGrimoire(s: GameState, c: Content, id: string): GameEvent[] {
  const g = c.grimoires[id];
  if (!g || hasGrimoire(s, id)) return [];
  s.grimoires.push({ id, read: false });
  return [
    { type: 'grimoireFound', id },
    { type: 'toast', text: `¡Conseguiste un grimorio: ${g.name}! Leelo en el libro del herrero.`, tone: 'good' },
  ];
}

/** Leer un grimorio: el herrero aprende sus encantamientos para siempre y anota las combinaciones que revela. */
export function readGrimoire(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const entry = s.grimoires.find((g) => g.id === id);
  const g = c.grimoires[id];
  if (!entry || !g) throw new GameError('No tenés ese grimorio.');
  if (entry.read) throw new GameError('Ya lo leíste.');
  entry.read = true;
  const learned = g.teaches.filter((e) => !s.knownEnchantments.includes(e));
  s.knownEnchantments.push(...learned);
  const revealed = (g.reveals ?? []).filter((x) => !s.discoveredSynergies.includes(x));
  s.discoveredSynergies.push(...revealed);
  const names = learned.map((e) => c.enchantments[e]?.name).filter(Boolean).join(', ');
  const events: GameEvent[] = [{ type: 'toast', text: `Aprendiste: ${names || 'nada nuevo'}.`, tone: 'good' }];
  if (revealed.length) events.push({ type: 'toast', text: `El grimorio revela ${revealed.length} combinación(es) secreta(s).`, tone: 'good' });
  revealed.forEach((x) => events.push({ type: 'synergyDiscovered', id: x }));
  return events;
}

function shop(c: Content, s: GameState) {
  const loc = Object.values(c.cities).flatMap((city) => city.locations).find((l) => l.id === s.location);
  if (!loc || loc.kind !== 'libreria') throw new GameError('Eso se compra en la librería.');
  return loc;
}

export function buyGrimoire(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const loc = shop(c, s);
  const g = c.grimoires[id];
  if (!g || !loc.grimoires?.includes(id)) throw new GameError('Ese grimorio no está a la venta.');
  if (hasGrimoire(s, id)) throw new GameError('Ya lo tenés.');
  if (s.gold < g.price) throw new GameError(`Cuesta ${g.price} de oro.`);
  s.gold -= g.price;
  return acquireGrimoire(s, c, id);
}

export function buyBlueprint(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const loc = shop(c, s);
  const offer = loc.blueprintsForSale?.find((b) => b.id === id);
  if (!offer) throw new GameError('Ese plano no está a la venta.');
  if (s.knownBlueprints.includes(id)) throw new GameError('Ya conocés ese plano.');
  if (s.gold < offer.price) throw new GameError(`Cuesta ${offer.price} de oro.`);
  s.gold -= offer.price;
  s.knownBlueprints.push(id);
  return [{ type: 'toast', text: `Nuevo plano: ${c.blueprints[id].name}.`, tone: 'good' }];
}
