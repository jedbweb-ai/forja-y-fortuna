import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import type { Rng } from '../rng';
import { changeRelation, changeReputation, currentCity, homeCity, nextUid } from '../state';
import { cityLocation } from '../city';
import type { GameEvent, GameState } from '../types';
import { applyPenalty, takeUnits, unitsAvailable } from './craft';
import type { ActiveContract, ContractDef } from './types';

// Contratos de mercaderes: un volumen fijo, entregas periódicas y precio garantizado por unidad.
// Se cobra al entregar; si una entrega vence sin cumplir, el contrato se rompe.

const K = BALANCE.contracts;

export function contractTotal(def: ContractDef): number {
  return def.item.qty * def.deliveries;
}

/** Entregas que ya vencieron a esta altura (la primera vence a los `everyDays` días). */
export function contractDue(def: ContractDef, ac: ActiveContract, day: number): number {
  return Math.min(def.deliveries, Math.floor((day - ac.start) / def.everyDays));
}

/** Próxima fecha que todavía no está cubierta y unidades que hay que tener entregadas para entonces. */
export function nextDeadline(def: ContractDef, ac: ActiveContract): { day: number; required: number } {
  const n = Math.min(def.deliveries, Math.max(ac.met + 1, Math.floor(ac.delivered / def.item.qty) + 1));
  return { day: ac.start + n * def.everyDays, required: n * def.item.qty };
}

export function refreshContractOffers(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const ks = s.contracts;
  ks.offers = ks.offers.filter((o) => o.until >= s.day);
  if (ks.lastRefresh && s.day < ks.lastRefresh + K.refreshDays) return [];
  ks.lastRefresh = s.day;
  for (const city of Object.keys(c.cities)) {
    const rep = s.reputation[city] ?? 0;
    const pool = Object.values(c.contracts).filter((d) => (d.city ?? homeCity()) === city && (d.minReputation ?? -Infinity) <= rep
      && !ks.active.some((a) => a.id === d.id) && !ks.offers.some((o) => o.id === d.id));
    for (let i = ks.offers.filter((o) => o.city === city).length; i < K.offers && pool.length; i++) {
      const d = rng.weighted(pool.map((x) => [x, x.weight ?? 1] as const));
      pool.splice(pool.indexOf(d), 1);
      ks.offers.push({ id: d.id, city, until: s.day + K.offerDays - 1 });
    }
  }
  // El herrero rival, si te tiene bronca, se adelanta y se queda con uno.
  const rival = s.npcs[K.rivalNpc]?.relation ?? 0;
  const homeOffers = ks.offers.filter((o) => o.city === homeCity());
  if (homeOffers.length && rival <= K.rivalMaxRelation && rng.chance(K.rivalStealChance)) {
    const lost = rng.pick(homeOffers);
    ks.offers = ks.offers.filter((o) => o !== lost);
    ks.lostToRival = [lost.id, ...ks.lostToRival].slice(0, 5);
    return [{ type: 'toast', text: `Ruperto se quedó con el contrato «${c.contracts[lost.id].title}» antes que vos.`, tone: 'bad' }];
  }
  return [];
}

export function acceptContract(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const def = c.contracts[id];
  const offer = s.contracts.offers.find((o) => o.id === id);
  if (!def || !offer) throw new GameError('Ese contrato ya no está.');
  if (cityLocation(c, s.location)?.kind !== 'gremio' || currentCity(s) !== offer.city) throw new GameError(`Este contrato se firma en ${c.cities[offer.city].name}.`);
  if (s.contracts.active.length >= K.maxActive) throw new GameError(`Ya tenés ${K.maxActive} contratos en curso.`);
  s.contracts.active.push({ uid: nextUid(s, 'k'), id, start: s.day, delivered: 0, met: 0 });
  s.contracts.offers = s.contracts.offers.filter((o) => o.id !== id);
  changeRelation(s, def.merchant, 2);
  return [{ type: 'toast', text: `Firmaste: ${def.title}. Primera entrega en ${def.everyDays} días.`, tone: 'info' }];
}

/** Entrega todo lo que sirva (hasta completar el total). Se cobra por unidad entregada. */
export function deliverContract(s: GameState, { c }: Ctx, uid: string): GameEvent[] {
  const ac = s.contracts.active.find((a) => a.uid === uid);
  if (!ac) throw new GameError('Ese contrato no está activo.');
  if (s.expedition) throw new GameError('Las entregas se hacen en la ciudad.');
  const def = c.contracts[ac.id];
  const left = contractTotal(def) - ac.delivered;
  const qty = Math.min(left, unitsAvailable(s, def.item));
  if (qty <= 0) throw new GameError('No tenés nada que sirva para este contrato.');
  takeUnits(s, def.item, qty);
  ac.delivered += qty;
  const pay = qty * def.pricePerUnit;
  s.gold += pay;
  s.stats.goldEarned += pay;
  const events: GameEvent[] = [{ type: 'toast', text: `Entregaste ${qty} para «${def.title}»: +${pay} de oro.`, tone: 'good' }];
  if (ac.delivered >= contractTotal(def)) {
    s.contracts.active = s.contracts.active.filter((a) => a.uid !== uid);
    s.contracts.done.push(def.id);
    if (def.bonus.gold) {
      s.gold += def.bonus.gold;
      s.stats.goldEarned += def.bonus.gold;
    }
    if (def.bonus.reputation) changeReputation(s, def.city ?? homeCity(), def.bonus.reputation);
    if (def.bonus.relation) changeRelation(s, def.merchant, def.bonus.relation);
    events.push({ type: 'toast', text: `Contrato cumplido: ${def.title}. Premio ${def.bonus.gold ?? 0} de oro.`, tone: 'good' });
  }
  return events;
}

/** Cada mañana: si venció una entrega y no llegaste al volumen, el contrato se rompe. */
export function dailyContracts(s: GameState, c: Content): GameEvent[] {
  const events: GameEvent[] = [];
  for (const ac of [...s.contracts.active]) {
    const def = c.contracts[ac.id];
    const due = contractDue(def, ac, s.day);
    if (due <= ac.met) continue;
    if (ac.delivered >= due * def.item.qty) {
      ac.met = due;
      continue;
    }
    s.contracts.active = s.contracts.active.filter((a) => a.uid !== ac.uid);
    applyPenalty(s, def.penalty, def.merchant, def.city ?? homeCity());
    events.push({ type: 'toast', text: `Rompiste el contrato «${def.title}»: no llegaste con la entrega.`, tone: 'bad' });
  }
  return events;
}
