import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { unequipAll } from '../party/equipment';
import { createMercenary, partyMembers } from '../party/progression';
import type { Character, MercenaryDef } from '../party/types';
import type { Rng } from '../rng';
import { changeRelation, relationLevel } from '../state';
import type { GameEvent, GameState } from '../types';
import { refusesTrade, tradeMult } from './relations';
import { maxPartySize } from '../progress/progress';

// Mercado de esclavos y lealtad. La lealtad es la relación con el compañero:
// arranca baja, sube con buen trato y charlas, y cambia cómo pelea (y si te obedece).

const SV = BALANCE.servants;

export function servantDefs(c: Content): MercenaryDef[] {
  return Object.values(c.mercenaries).filter((m) => m.kind === 'esclavo');
}

export function isServantNpc(c: Content, id: string): boolean {
  return c.mercenaries[id]?.kind === 'esclavo';
}

/** Compañeros comprados (esclavos o liberados) que siguen con vos. */
export function ownedServants(s: GameState): Character[] {
  return Object.values(s.characters).filter((ch) => ch.bond && !ch.escaped && !ch.dead);
}

/** Dónde está un candidato o compañero: en venta, en tu herrería (si no va en el grupo) o en ningún lado. */
export function servantLocation(s: GameState, id: string): string | null {
  const ch = s.characters[id];
  if (ch?.bond) return ch.escaped || ch.dead || s.party.includes(id) ? null : 'herreria';
  return s.servantMarket.offer.includes(id) ? 'esclavos' : null;
}

export function refreshServantMarket(s: GameState, c: Content, rng: Rng) {
  const sm = s.servantMarket;
  sm.offer = sm.offer.filter((id) => !s.characters[id]?.bond);
  if (sm.lastRefresh && s.day < sm.lastRefresh + SV.refreshDays) return;
  sm.lastRefresh = s.day;
  const pool = servantDefs(c).filter((d) => !s.characters[d.id]?.bond).map((d) => d.id);
  sm.offer = [];
  for (let i = 0; i < SV.offerSize && pool.length; i++) {
    const id = rng.pick(pool);
    pool.splice(pool.indexOf(id), 1);
    sm.offer.push(id);
  }
}

/** Precio de un candidato con el descuento (o recargo) por tu relación con el tratante. */
export function servantPrice(c: Content, s: GameState, id: string): number {
  const def = c.mercenaries[id];
  return Math.round((def.price ?? def.hireCost) * tradeMult(c, s, 'esclavos'));
}

export function buyServant(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const def = c.mercenaries[id];
  if (!def || def.kind !== 'esclavo') throw new GameError('No está en venta.');
  if (s.location !== 'esclavos') throw new GameError('Eso se hace en el mercado de esclavos.');
  if (!s.servantMarket.offer.includes(id)) throw new GameError('Ya no está en venta.');
  const refuse = refusesTrade(c, s, s.location);
  if (refuse) throw new GameError(refuse);
  if (s.party.length >= maxPartySize(c, s)) throw new GameError(`Tu grupo ya está completo (máximo ${maxPartySize(c, s)}).`);
  const price = servantPrice(c, s, id);
  if (s.gold < price) throw new GameError(`Cuesta ${price} de oro.`);
  s.gold -= price;
  const ch = createMercenary(def);
  ch.wage = 0;
  ch.bond = 'esclavo';
  s.characters[id] = ch;
  s.party.push(id);
  s.servantMarket.offer = s.servantMarket.offer.filter((x) => x !== id);
  return [{ type: 'toast', text: `${def.name} se suma a tu grupo. No confía en vos: su lealtad es ${relationLevel(s.npcs[id]?.relation ?? 0)}.`, tone: 'info' }];
}

/** Liberarlo: lealtad al máximo, pero desde ahora cobra un sueldo. */
export function freeServant(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const ch = s.characters[id];
  if (!ch || ch.bond !== 'esclavo' || ch.escaped) throw new GameError('No hay nadie a quien liberar.');
  const def = c.mercenaries[id];
  ch.bond = 'liberado';
  ch.wage = def.freeWage ?? def.wage;
  ch.unpaidDays = 0;
  s.npcs[id].relation = SV.freedRelation;
  return [{ type: 'toast', text: `Liberaste a ${ch.name}. Se queda con vos por elección propia y cobra ${ch.wage} de oro por día.`, tone: 'good' }];
}

/** Vuelve al grupo un compañero que esperaba en la herrería. */
export function rejoinServant(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const ch = s.characters[id];
  if (!ch?.bond || ch.escaped || ch.dead) throw new GameError('No está con vos.');
  if (s.assistant === id) throw new GameError(`${ch.name} está atendiendo la tienda.`);
  if (s.expedition) throw new GameError('Estás de expedición.');
  if (s.party.includes(id)) throw new GameError('Ya está en el grupo.');
  if (s.location !== 'herreria') throw new GameError(`${ch.name} te espera en la herrería.`);
  if (s.party.length >= maxPartySize(c, s)) throw new GameError(`Tu grupo ya está completo (máximo ${maxPartySize(c, s)}).`);
  s.party.push(id);
  return [{ type: 'toast', text: `${ch.name} vuelve al grupo.` }];
}

/** Efecto de la lealtad en combate: multiplicador de ataque/defensa y chance de desobedecer. */
export function loyaltyCombat(s: GameState, ch: Character): { mult: number; disobey: number } {
  if (!ch.bond) return { mult: 1, disobey: 0 };
  const lvl = relationLevel(s.npcs[ch.id]?.relation ?? 0);
  return { mult: 1 + (SV.combatMult[lvl] ?? 0), disobey: ch.bond === 'esclavo' ? (SV.disobey[lvl] ?? 0) : 0 };
}

/** Aviso para la UI cuando la lealtad está baja. */
export function loyaltyWarning(s: GameState, ch: Character): string | null {
  if (ch.bond !== 'esclavo') return null;
  const lvl = relationLevel(s.npcs[ch.id]?.relation ?? 0);
  if (lvl === 'hostil') return `${ch.name} te mira con resentimiento: a veces no te obedece y, si una expedición sale mal, podría escaparse con lo que lleva puesto.`;
  if (lvl === 'desconfiado') return `${ch.name} todavía no confía en vos: rinde menos en combate.`;
  return null;
}

/** Cada mañana: el trato del día cambia la lealtad (equipo puesto, o salir sin nada). */
export function dailyServants(s: GameState): GameEvent[] {
  for (const ch of partyMembers(s)) {
    if (ch.bond !== 'esclavo') continue;
    const armed = !!ch.equipment.arma && !!ch.equipment.cuerpo;
    changeRelation(s, ch.id, armed ? SV.dailyEquipped : ch.equipment.arma || ch.equipment.cuerpo ? 0 : SV.dailyUnarmed);
  }
  return [];
}

/** Después de un combate: la victoria une; caer herido resiente. */
export function servantsAfterCombat(s: GameState, members: string[], victory: boolean) {
  for (const id of members) {
    const ch = s.characters[id];
    if (ch?.bond !== 'esclavo') continue;
    changeRelation(s, id, victory ? SV.victory : SV.injured);
  }
}

/** Al volver de una expedición con derrota o huida: los hostiles pueden escaparse con lo puesto. */
export function servantEscapes(s: GameState, rng: Rng, members: string[]): GameEvent[] {
  const events: GameEvent[] = [];
  for (const id of members) {
    const ch = s.characters[id];
    if (ch?.bond !== 'esclavo' || relationLevel(s.npcs[id]?.relation ?? 0) !== SV.escapeAt || !rng.chance(SV.escapeChance)) continue;
    const gear = Object.values(ch.equipment).filter(Boolean) as string[];
    unequipAll(s, id);
    s.items = s.items.filter((i) => !gear.includes(i.uid));
    gear.forEach((uid) => delete s.belt[uid]);
    s.party = s.party.filter((p) => p !== id);
    ch.escaped = true;
    events.push({ type: 'toast', text: `${ch.name} aprovechó el desorden y se escapó${gear.length ? ' con lo que llevaba puesto' : ''}.`, tone: 'bad' });
  }
  return events;
}

/** Sueldo del día con el descuento por buena relación (mercenarios y liberados). */
export function wageFor(s: GameState, ch: Character): number {
  if (!ch.wage) return 0;
  const cut = BALANCE.mercenaries.wageCutByLevel[relationLevel(s.npcs[ch.id]?.relation ?? 0)] ?? 0;
  return Math.max(1, Math.round(ch.wage * (1 - cut / 100)));
}
