import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { buildItem } from '../forge/item';
import { acquireGrimoire, hasGrimoire } from '../magic/grimoires';
import type { Rng } from '../rng';
import { addMaterial, changeReputation, currentCity, nextUid } from '../state';
import { advanceTime } from '../time';
import type { GameEvent, GameState, ItemInstance } from '../types';
import type { AuctionBidder, AuctionLot, AuctionLotDef, AuctionSession, BidderDef, BidderStyle } from './types';

// La gran subasta: cada tantos días, anunciada en el tablón. Comprás pujando por rondas contra
// postores con personalidad; lo que consignaste se vende solo y ves cómo pujan por ello.

const A = BALANCE.auction;

export function auctionAnnounced(s: GameState): boolean {
  return s.day >= s.auction.day - A.announceDays;
}

export function isAuctionDay(s: GameState): boolean {
  return s.day === s.auction.day;
}

export function bidStep(price: number): number {
  return Math.max(A.minStep, Math.round(price * A.stepPct));
}

function lotKind(c: Content, def: AuctionLotDef): BidderDef['likes'][number] {
  const src = def.source;
  if (src.kind === 'item') return c.blueprints[src.blueprint]?.category ?? 'arma';
  return src.kind;
}

function lotAvailable(s: GameState, def: AuctionLotDef): boolean {
  if ((def.minDay ?? 0) > s.day) return false;
  if (def.unique && s.auction.seenUnique.includes(def.id)) return false;
  const src = def.source;
  if (src.kind === 'blueprint') return !s.knownBlueprints.includes(src.id);
  if (src.kind === 'grimoire') return !hasGrimoire(s, src.id);
  return true;
}

/** Arma los lotes de la casa cuando se anuncia la subasta. */
export function prepareLots(s: GameState, c: Content, rng: Rng) {
  if (s.auction.lots.length || !auctionAnnounced(s)) return;
  const pool = Object.values(c.auctionLots).filter((d) => lotAvailable(s, d));
  const n = rng.int(A.lots[0], A.lots[1]);
  for (let i = 0; i < n && pool.length; i++) {
    const def = rng.weighted(pool.map((d) => [d, d.weight] as const));
    pool.splice(pool.indexOf(def), 1);
    if (def.unique) s.auction.seenUnique.push(def.id);
    s.auction.lots.push({ lotId: def.id, base: def.base, name: def.name });
  }
}

// ───────────────────────── Consignación ─────────────────────────

export function consignItem(s: GameState, _ctx: Ctx, uid: string, reserve: number): GameEvent[] {
  if (s.location !== 'subastas') throw new GameError('Se consigna en la casa de subastas.');
  if (!auctionAnnounced(s) || s.auction.session) throw new GameError('Todavía no se anunció la próxima subasta.');
  if (s.auction.consigned.length >= A.maxConsign) throw new GameError(`Podés consignar hasta ${A.maxConsign} objetos.`);
  const item = s.items.find((i) => i.uid === uid);
  if (!item) throw new GameError('Ese objeto no existe.');
  if (item.equippedBy) throw new GameError('Primero sacáselo a quien lo tiene equipado.');
  s.items = s.items.filter((i) => i.uid !== uid);
  delete s.belt[uid];
  s.auction.consigned.push({ item: { ...item, exhibited: false }, reserve: Math.max(1, Math.round(reserve)) });
  return [{ type: 'toast', text: `${item.name} queda en consignación (reserva ${Math.round(reserve)}).`, tone: 'info' }];
}

export function withdrawItem(s: GameState, _ctx: Ctx, uid: string): GameEvent[] {
  if (s.auction.session) throw new GameError('La subasta está en curso.');
  const entry = s.auction.consigned.find((x) => x.item.uid === uid);
  if (!entry) throw new GameError('Ese objeto no está en consignación.');
  s.auction.consigned = s.auction.consigned.filter((x) => x !== entry);
  s.items.push(entry.item);
  return [{ type: 'toast', text: `Retiraste ${entry.item.name} de la subasta.` }];
}

// ───────────────────────── Postores ─────────────────────────

function rivalAngry(s: GameState, b: BidderDef): boolean {
  return b.style === 'rival' && !!b.npc && (s.npcs[b.npc]?.relation ?? 0) <= A.rivalMaxRelation;
}

function interested(b: BidderDef, kind: BidderDef['likes'][number]): boolean {
  return b.likes.includes(kind);
}

/** Elige los postores de un lote y cuánto está dispuesto a pagar cada uno (no se muestra). */
function pickBidders(c: Content, s: GameState, rng: Rng, lot: AuctionLot): AuctionBidder[] {
  const kind = lot.consigned ? lot.consigned.item.category : lotKind(c, c.auctionLots[lot.lotId]);
  const ref = lot.consigned ? Math.max(lot.base, lot.consigned.item.value * lot.consigned.item.quantity) : lot.base;
  const pool = Object.values(c.bidders).filter((b) => interested(b, kind)
    // Ruperto enojado no le compra nada a vos.
    && !(lot.consigned && rivalAngry(s, b)));
  const n = Math.min(pool.length, rng.int(A.bidders[0], A.bidders[1]));
  const out: AuctionBidder[] = [];
  for (let i = 0; i < n; i++) {
    const b = rng.pick(pool);
    pool.splice(pool.indexOf(b), 1);
    let max = ref * rng.range(b.valuation[0], b.valuation[1]);
    if (!lot.consigned && rivalAngry(s, b)) max *= A.rivalAggression;
    max = Math.min(max, rng.int(b.budget[0], b.budget[1]));
    out.push({ id: b.id, max: Math.round(max), out: false });
  }
  return out;
}

const STYLE_WEIGHT: Record<BidderStyle, number> = { caprichoso: 3, rival: 3, impulsivo: 2, paciente: 1, cauto: 1 };

function say(c: Content, rng: Rng, id: string, kind: 'bid' | 'quit' | 'win', price?: number): string {
  const b = c.bidders[id];
  const line = rng.pick(b.lines[kind]);
  return price !== undefined ? `${b.name}: «${line}» (${price})` : `${b.name}: «${line}»`;
}

/**
 * Un postor responde a la puja actual. Devuelve true si alguien subió.
 * Los impulsivos y cautos a veces se retiran antes de llegar a su máximo.
 */
function counterBid(c: Content, sess: AuctionSession, rng: Rng): boolean {
  for (let guard = 0; guard < 10; guard++) {
    const next = sess.price + bidStep(sess.price);
    const candidates = sess.bidders.filter((b) => !b.out && b.id !== sess.leader && b.max >= next);
    for (const b of sess.bidders.filter((x) => !x.out && x.id !== sess.leader && x.max < next)) {
      b.out = true;
      sess.log.push(say(c, rng, b.id, 'quit'));
    }
    if (!candidates.length) return false;
    const pick = rng.weighted(candidates.map((b) => [b, STYLE_WEIGHT[c.bidders[b.id].style]] as const));
    const style = c.bidders[pick.id].style;
    const quits = (style === 'impulsivo' && sess.price > pick.max * 0.75 && rng.chance(0.5)) || (style === 'cauto' && rng.chance(0.3));
    if (quits) {
      pick.out = true;
      sess.log.push(say(c, rng, pick.id, 'quit'));
      continue;
    }
    // El caprichoso a veces salta varios escalones de golpe.
    const jumps = style === 'caprichoso' && rng.chance(0.4) ? rng.int(2, 3) : 1;
    let price = sess.price;
    for (let j = 0; j < jumps; j++) price += bidStep(price);
    sess.price = Math.min(price, pick.max);
    sess.leader = pick.id;
    sess.log.push(say(c, rng, pick.id, 'bid', sess.price));
    return true;
  }
  return false;
}

/** Los postores pujan entre ellos hasta que queda uno (vos ya no participás). */
function settleAmongBidders(c: Content, sess: AuctionSession, rng: Rng) {
  if (sess.leader === 'player') sess.leader = null;
  // Si nadie abrió, el primero que puede abre al precio de salida.
  if (!sess.leader) {
    const opener = sess.bidders.filter((b) => !b.out && b.max >= sess.price).sort((a, b) => b.max - a.max)[0];
    if (!opener) return;
    sess.leader = opener.id;
    sess.log.push(say(c, rng, opener.id, 'bid', sess.price));
  }
  while (counterBid(c, sess, rng)) { /* siguen pujando */ }
}

// ───────────────────────── Sesión ─────────────────────────

function sessionLots(s: GameState): AuctionLot[] {
  return [
    ...s.auction.lots,
    ...s.auction.consigned.map((x) => ({ lotId: 'consignado', consigned: x, base: x.reserve, name: x.item.name })),
  ];
}

function currentLot(s: GameState): AuctionLot | undefined {
  const sess = s.auction.session;
  return sess ? sessionLots(s)[sess.index] : undefined;
}

export function sessionLot(s: GameState): AuctionLot | undefined {
  return currentLot(s);
}

function setupLot(s: GameState, c: Content, rng: Rng) {
  const sess = s.auction.session!;
  const lot = currentLot(s);
  if (!lot) {
    sess.status = 'finished';
    return;
  }
  sess.price = lot.base;
  sess.leader = null;
  sess.bidders = pickBidders(c, s, rng, lot);
  sess.log = [`Lote ${sess.index + 1}: ${lot.name}. Sale a ${lot.base}.`];
  sess.status = 'bidding';
  // Tus lotes se resuelven solos: ves cómo pujan.
  if (lot.consigned) {
    settleAmongBidders(c, sess, rng);
    resolveLot(s, c, rng);
  }
}

/** Cierra el lote actual con el ganador que haya. */
function resolveLot(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const sess = s.auction.session!;
  const lot = currentLot(s)!;
  const events: GameEvent[] = [];
  if (!sess.leader) {
    sess.status = 'unsold';
    sess.log.push('Nadie puja. El lote queda sin vender.');
    if (lot.consigned) s.items.push(lot.consigned.item);
    sess.results.push({ name: lot.name, winner: '—', price: 0, mine: lot.consigned ? 'venta' : null });
    return events;
  }
  sess.status = 'sold';
  if (sess.leader === 'player') {
    s.gold -= sess.price;
    events.push(...receiveLot(s, c, lot));
    sess.log.push(`¡Vendido! Te llevás ${lot.name} por ${sess.price}.`);
    sess.results.push({ name: lot.name, winner: 'Vos', price: sess.price, mine: 'compra' });
    return events;
  }
  sess.log.push(say(c, rng, sess.leader, 'win', sess.price));
  if (lot.consigned) {
    const net = Math.round(sess.price * (1 - A.commission));
    s.gold += net;
    s.stats.goldEarned += net;
    s.stats.itemsSold += lot.consigned.item.quantity;
    changeReputation(s, currentCity(), A.reputationPerSale);
    sess.log.push(`Vendiste ${lot.name}: cobrás ${net} (la casa se queda con el ${Math.round(A.commission * 100)}%).`);
    sess.results.push({ name: lot.name, winner: c.bidders[sess.leader].name, price: sess.price, mine: 'venta' });
  } else {
    sess.results.push({ name: lot.name, winner: c.bidders[sess.leader].name, price: sess.price, mine: null });
  }
  return events;
}

function receiveLot(s: GameState, c: Content, lot: AuctionLot): GameEvent[] {
  const src = c.auctionLots[lot.lotId].source;
  switch (src.kind) {
    case 'material':
      addMaterial(s, src.id, src.qty);
      return [];
    case 'grimoire':
      return acquireGrimoire(s, c, src.id);
    case 'blueprint':
      if (!s.knownBlueprints.includes(src.id)) s.knownBlueprints.push(src.id);
      return [{ type: 'toast', text: `Plano nuevo: ${c.blueprints[src.id].name}.`, tone: 'good' }];
    case 'item': {
      s.items.push(auctionItem(s, c, lot.lotId));
      return [];
    }
  }
}

/** Arma la pieza única de un lote (lleva el tag "subasta": no cuenta como forjada por vos). */
export function auctionItem(s: GameState, c: Content, lotId: string): ItemInstance {
  const src = c.auctionLots[lotId].source;
  if (src.kind !== 'item') throw new Error(`El lote ${lotId} no es un objeto.`);
  const build = buildItem(c, {
    blueprintId: src.blueprint, materials: src.materials, stage: 'enchant', hits: 9, quality: src.quality, defects: 0,
    traits: src.traits ?? [], finish: src.finish ?? [], instability: 0,
  }, src.enchantments ?? [], Object.fromEntries((src.enchantments ?? []).map((e) => [e, 90])));
  const { rarityScore: _r, design: _d, ...rest } = build;
  return { ...rest, name: src.name, tags: [...rest.tags, 'subasta'], uid: nextUid(s, 'it'), exhibited: false, createdDay: s.day };
}

export function auctionStart(s: GameState, { c, rng }: Ctx): GameEvent[] {
  if (s.location !== 'subastas') throw new GameError('La subasta es en la casa de subastas.');
  if (!isAuctionDay(s)) throw new GameError(`La próxima subasta es el día ${s.auction.day}.`);
  if (s.auction.attended === s.day || s.auction.session) throw new GameError('Ya estuviste en la subasta de hoy.');
  if (!sessionLots(s).length) throw new GameError('No hay lotes para subastar.');
  s.auction.session = { index: 0, price: 0, leader: null, bidders: [], log: [], status: 'bidding', results: [] };
  setupLot(s, c, rng);
  return [];
}

function session(s: GameState): AuctionSession {
  if (!s.auction.session) throw new GameError('No hay subasta en curso.');
  return s.auction.session;
}

export function auctionBid(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const sess = session(s);
  const lot = currentLot(s);
  if (sess.status !== 'bidding' || !lot || lot.consigned) throw new GameError('Ahora no se puede pujar.');
  if (sess.leader === 'player') throw new GameError('Ya vas ganando este lote.');
  const price = sess.leader ? sess.price + bidStep(sess.price) : sess.price;
  if (s.gold < price) throw new GameError(`No te alcanza: la puja va a ${price}.`);
  sess.price = price;
  sess.leader = 'player';
  sess.log.push(`Vos: ${price}.`);
  if (!counterBid(c, sess, rng)) return resolveLot(s, c, rng);
  return [];
}

/** Te retirás del lote: los demás siguen entre ellos. */
export function auctionPass(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const sess = session(s);
  const lot = currentLot(s);
  if (sess.status !== 'bidding' || !lot || lot.consigned) throw new GameError('Ahora no se puede pasar.');
  if (sess.leader === 'player') throw new GameError('Vas ganando: si nadie sube, es tuyo.');
  sess.log.push('Te retirás de este lote.');
  settleAmongBidders(c, sess, rng);
  return resolveLot(s, c, rng);
}

export function auctionNext(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const sess = session(s);
  if (sess.status === 'bidding') throw new GameError('El lote todavía está en juego.');
  if (sess.status === 'finished') return [];
  sess.index += 1;
  setupLot(s, c, rng);
  return [];
}

/** Salís de la casa de subastas. Asistir lleva una franja. */
export function auctionLeave(s: GameState, _ctx: Ctx): GameEvent[] {
  const sess = session(s);
  if (sess.status === 'bidding') throw new GameError('Terminá primero con este lote.');
  // Lotes sin jugar (si te vas antes): los tuyos vuelven al inventario.
  const remaining = sessionLots(s).slice(sess.status === 'finished' ? sessionLots(s).length : sess.index + 1);
  for (const lot of remaining) if (lot.consigned) s.items.push(lot.consigned.item);
  const bought = sess.results.filter((r) => r.mine === 'compra').length;
  const sold = sess.results.filter((r) => r.mine === 'venta' && r.price > 0).length;
  s.auction.session = null;
  s.auction.attended = s.day;
  s.auction.lots = [];
  s.auction.consigned = [];
  return [
    { type: 'toast', text: `Fin de la subasta: compraste ${bought} y vendiste ${sold} lote(s).`, tone: 'info' },
    ...advanceTime(s, A.attendSlots),
  ];
}

/**
 * Cada mañana: si la subasta ya pasó y no fuiste, la casa vende lo que consignaste igual.
 * Después se agenda la próxima.
 */
export function dailyAuction(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const au = s.auction;
  if (s.day <= au.day) return [];
  const events: GameEvent[] = [];
  if (au.consigned.length && au.attended !== au.day) {
    let total = 0;
    for (const x of au.consigned) {
      const lot: AuctionLot = { lotId: 'consignado', consigned: x, base: x.reserve, name: x.item.name };
      const sess: AuctionSession = { index: 0, price: x.reserve, leader: null, bidders: pickBidders(c, s, rng, lot), log: [], status: 'bidding', results: [] };
      settleAmongBidders(c, sess, rng);
      if (sess.leader) {
        const net = Math.round(sess.price * (1 - A.commission));
        total += net;
        s.gold += net;
        s.stats.goldEarned += net;
        s.stats.itemsSold += x.item.quantity;
        changeReputation(s, currentCity(), A.reputationPerSale);
      } else {
        s.items.push(x.item);
      }
    }
    events.push({ type: 'toast', text: `La casa de subastas vendió lo que consignaste: +${total} de oro (lo que no se vendió volvió al arcón).`, tone: 'good' });
  }
  au.consigned = [];
  au.lots = [];
  au.session = null;
  while (au.day < s.day) au.day += A.everyDays;
  return events;
}
