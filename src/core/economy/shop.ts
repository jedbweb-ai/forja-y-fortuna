import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import type { Rng } from '../rng';
import { addXp, changeReputation, clamp, currentCity, skillLevel } from '../state';
import { advanceTime, slotName } from '../time';
import { STAT_KEYS, type CustomerType, type GameEvent, type GameState, type ItemInstance, type ShopCustomer, type ShopSession } from '../types';

const S = BALANCE.shop;

/** Qué tanto le gusta un objeto a un tipo de cliente (0 = nada). */
export function interestScore(type: CustomerType, item: ItemInstance): number {
  const want = type.wants[item.category] ?? 0;
  if (!want || item.quality < type.minQuality || item.quantity <= 0) return 0;
  return want * (1 + preferenceMatch(type, item));
}

/** Bonus de valoración por stats, tags, afinidades y belleza que el cliente aprecia. */
export function preferenceMatch(type: CustomerType, item: ItemInstance): number {
  const prefTotal = STAT_KEYS.reduce((a, k) => a + (type.prefStats[k] ?? 0), 0);
  const statScore = prefTotal
    ? STAT_KEYS.reduce((a, k) => a + (type.prefStats[k] ?? 0) * item.stats[k], 0) / (prefTotal * 20) - 1
    : 0;
  const tagHits = (type.likesTags ?? []).filter((t) => item.tags.includes(t)).length;
  const affHits = (type.likesAffinities ?? []).filter((a) => (item.affinities[a] ?? 0) > 0).length;
  return clamp(statScore, -0.3, 0.6) * 0.3 + tagHits * 0.25 + affHits * 0.15 + type.beautyLove * item.beauty * 0.04;
}

export function customerCount(s: GameState): number {
  const base = S.customersPerSlot[slotName(s)] ?? 3;
  const rep = s.reputation[currentCity()] ?? 0;
  return Math.max(1, base + Math.floor(Math.max(0, rep) / S.reputationPerExtraCustomer));
}

export function generateCustomers(c: Content, s: GameState, rng: Rng): ShopCustomer[] {
  const rep = s.reputation[currentCity()] ?? 0;
  const slot = slotName(s);
  const types = Object.values(c.customers).filter((t) => t.minReputation <= rep && t.appearance[slot] > 0);
  const out: ShopCustomer[] = [];
  for (let i = 0, n = customerCount(s); i < n && types.length; i++) {
    const type = rng.weighted(types.map((t) => [t, t.appearance[slot]] as const));
    out.push({
      id: `c${i}`, typeId: type.id, name: rng.pick(c.customerNames),
      budget: rng.int(type.budget[0], type.budget[1]),
      look: { body: rng.int(0, 0xffffff), hair: rng.int(0, 0xffffff), accent: rng.int(0, 0xffffff) },
    });
  }
  return out;
}

function shop(s: GameState): ShopSession {
  if (!s.shop) throw new GameError('La tienda está cerrada.');
  return s.shop;
}

export function exhibitedItems(s: GameState): ItemInstance[] {
  return s.items.filter((i) => i.exhibited && i.quantity > 0 && !i.equippedBy);
}

export function toggleExhibit(s: GameState, _ctx: Ctx, uid: string): GameEvent[] {
  const item = s.items.find((i) => i.uid === uid);
  if (!item) throw new GameError('Ese objeto no existe.');
  if (item.equippedBy) throw new GameError('Ese objeto está equipado.');
  if (!item.exhibited && exhibitedItems(s).length >= S.displaySlots) throw new GameError(`Solo tenés ${S.displaySlots} lugares de exhibición.`);
  item.exhibited = !item.exhibited;
  return [];
}

export function openShop(s: GameState, { c, rng }: Ctx): GameEvent[] {
  if (s.shop) throw new GameError('La tienda ya está abierta.');
  if (s.forge) throw new GameError('Terminá primero la pieza del yunque.');
  if (s.location !== 'herreria') throw new GameError('La tienda se atiende desde tu herrería.');
  s.shop = { customers: generateCustomers(c, s, rng), index: -1, negotiation: null, line: '', status: 'resolved', sold: [], earned: 0 };
  return nextCustomer(s, { c, rng });
}

/** Hace pasar al próximo cliente: elige qué objeto le interesa y arma la negociación. */
export function nextCustomer(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const sh = shop(s);
  if (sh.status === 'negotiating') throw new GameError('Terminá de atender a este cliente.');
  sh.index += 1;
  sh.negotiation = null;
  const customer = sh.customers[sh.index];
  if (!customer) {
    sh.status = 'resolved';
    sh.line = '';
    return [];
  }
  const type = c.customers[customer.typeId];
  const candidates = exhibitedItems(s)
    .map((item) => ({ item, score: interestScore(type, item) }))
    .filter(({ item, score }) => score > 0 && item.value * minQty(type, item) <= customer.budget * 1.1);
  if (!candidates.length) {
    sh.status = 'resolved';
    sh.line = rng.pick(type.lines.noItem);
    return [];
  }
  const { item } = rng.weighted(candidates.map((x) => [x, x.score] as const));
  const qty = item.category === 'municion' && type.bulk ? Math.min(item.quantity, rng.int(type.bulk[0], type.bulk[1])) : 1;
  const commerce = 1 + S.commerceBonusPerLevel * (skillLevel(s.skills.comercio) - 1);
  const rep = s.reputation[currentCity()] ?? 0;
  const valuation = item.value * qty * type.generosity * (1 + preferenceMatch(type, item)) * (0.9 + rep / 200) * commerce
    * rng.range(S.maxPriceJitter[0], S.maxPriceJitter[1]);
  const maxPrice = Math.max(1, Math.round(Math.min(valuation, customer.budget)));
  const opening = Math.max(1, Math.round(maxPrice * rng.range(S.openingRatio[0], S.openingRatio[1])));
  sh.negotiation = { itemUid: item.uid, qty, maxPrice, opening, patience: type.patience, rounds: 0, lastOffer: opening };
  sh.status = 'negotiating';
  const what = qty > 1 ? `${qty} ${item.name.toLowerCase()}` : item.name;
  sh.line = `${rng.pick(type.lines.greet)} Me interesa: ${what}. Te ofrezco ${opening} de oro.`;
  return [];
}

function minQty(type: CustomerType, item: ItemInstance) {
  return item.category === 'municion' && type.bulk ? Math.min(item.quantity, type.bulk[0]) : 1;
}

/** Precio sugerido para la negociación en curso (valor base). */
export function suggestedPrice(s: GameState): number {
  const n = s.shop?.negotiation;
  const item = n && s.items.find((i) => i.uid === n.itemUid);
  return item && n ? Math.max(1, Math.round(item.value * n.qty)) : 0;
}

function sell(s: GameState, c: Content, price: number, happy: boolean, rng: Rng): GameEvent[] {
  const sh = shop(s);
  const n = sh.negotiation!;
  const customer = sh.customers[sh.index];
  const type = c.customers[customer.typeId];
  const item = s.items.find((i) => i.uid === n.itemUid);
  if (!item || item.quantity < n.qty) throw new GameError('Ese objeto ya no está.');
  item.quantity -= n.qty;
  if (item.quantity <= 0) s.items = s.items.filter((i) => i.uid !== item.uid);
  s.gold += price;
  s.stats.goldEarned += price;
  s.stats.itemsSold += n.qty;
  sh.earned += price;
  sh.sold.push({ itemName: item.name, qty: n.qty, price, customer: `${customer.name} (${type.name})` });
  changeReputation(s, currentCity(), happy ? S.repOnHappy : S.repOnSale);
  addXp(s, 'comercio', S.xpPerSale);
  sh.negotiation = null;
  sh.status = 'resolved';
  sh.line = rng.pick(type.lines.happy);
  return [{ type: 'toast', text: `+${price} de oro`, tone: 'good' }];
}

function leaveAngry(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const sh = shop(s);
  const type = c.customers[sh.customers[sh.index].typeId];
  changeReputation(s, currentCity(), S.repOnAngry);
  sh.negotiation = null;
  sh.status = 'resolved';
  sh.line = rng.pick(type.lines.angry);
  return [{ type: 'toast', text: 'El cliente se fue ofendido.', tone: 'bad' }];
}

/** El herrero pide un precio. El cliente acepta, contraoferta o se va. */
export function askPrice(s: GameState, { c, rng }: Ctx, price: number): GameEvent[] {
  const sh = shop(s);
  const n = sh.negotiation;
  if (!n || sh.status !== 'negotiating') throw new GameError('No hay nadie negociando.');
  price = Math.max(1, Math.round(price));
  n.asked = price;
  if (price <= n.maxPrice) return sell(s, c, price, price <= n.maxPrice * S.happyPriceRatio, rng);
  if (price > n.maxPrice * S.absurdPriceRatio) return leaveAngry(s, c, rng);
  n.rounds += 1;
  n.patience -= 1;
  if (n.patience <= 0) return leaveAngry(s, c, rng);
  const type = c.customers[sh.customers[sh.index].typeId];
  const step = n.rounds / (type.patience + 1);
  n.lastOffer = Math.min(price - 1, Math.max(n.lastOffer, Math.round(n.opening + (n.maxPrice - n.opening) * step)));
  sh.line = n.patience === 1
    ? `Mirá, es mi última oferta: ${n.lastOffer}. Si pedís más, me voy.`
    : rng.pick(['Mmm... ', 'Es mucho. ', 'Ni loco. ', 'Pensalo bien. ']) + `Te doy ${n.lastOffer}.`;
  return [];
}

export function acceptOffer(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const n = shop(s).negotiation;
  if (!n) throw new GameError('No hay oferta.');
  return sell(s, c, n.lastOffer, false, rng);
}

export function declineCustomer(s: GameState, _ctx: Ctx): GameEvent[] {
  const sh = shop(s);
  sh.negotiation = null;
  sh.status = 'resolved';
  sh.line = 'Bueno, otra vez será.';
  return [];
}

export function closeShop(s: GameState, _ctx: Ctx): GameEvent[] {
  const sh = shop(s);
  if (sh.status === 'negotiating') throw new GameError('Terminá de atender a este cliente.');
  s.shop = null;
  return [
    { type: 'shopClosed', earned: sh.earned, sold: sh.sold.length },
    ...advanceTime(s, BALANCE.time.shopShiftSlots),
  ];
}
