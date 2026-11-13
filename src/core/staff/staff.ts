import { BALANCE } from '../../config/balance';
import { cityLocation, cityOfLocation } from '../city';
import { GameError, type Content, type Ctx } from '../content';
import { computeDesign, isAllowed } from '../forge/design';
import { defectChanceFor, rollTraits, strike, type ForgeMods } from '../forge/forging';
import { buildItem } from '../forge/item';
import { bulkRange, exhibitedItems, generateCustomers, interestScore, preferenceMatch } from '../economy/shop';
import { bonus, displaySlots, maxPartySize, workshopBonus } from '../progress/progress';
import type { Rng } from '../rng';
import { addMaterial, changeRelation, changeReputation, currentCity, hasMaterial, homeCity, nextUid, relationLevel } from '../state';
import { demandOf, registerSale } from '../town/demand';
import { SLOTS, type ForgeSession, type GameEvent, type GameState, type ItemInstance, type RelationLevel, type TimeSlot } from '../types';
import {
  OFICIO_NAMES, OFICIOS, ROLE_NAMES, ROLE_OFICIO, type Oficio, type ShopStaff, type StaffMember, type StaffReport, type StaffRole,
  type WorkEffect, type WorkerProgress, type WorkOrder,
} from './types';

// Personal de la herrería: quién trabaja, en qué puesto, cómo aprende y qué hace en cada franja que pasa.
// Por ahora hay una sola herrería (la de Valdebrasa); todo está guardado por lugar para sumar sucursales.

const ST = BALANCE.staff;
const F = BALANCE.forge;

/** La herrería del protagonista. */
export const HOME_SHOP = 'herreria';

export function emptyReport(): StaffReport {
  return { sold: 0, earned: 0, made: {}, ruined: 0, exhibited: 0, notes: [] };
}

/** Personal de una herrería (si todavía no existe, uno vacío). Solo para comandos: puede crear el registro. */
export function shopStaff(s: GameState, shop = HOME_SHOP): ShopStaff {
  return (s.staff.shops[shop] ??= { staff: [], orders: [], report: emptyReport() });
}

/** Para mirar sin cambiar nada (la UI). */
export function peekShop(s: GameState, shop = HOME_SHOP): ShopStaff {
  return s.staff.shops[shop] ?? { staff: [], orders: [], report: emptyReport() };
}

export const isWorkerNpc = (c: Content, id: string) => !!c.workers[id];

/** En qué herrería trabaja alguien (o null). */
export function staffShopOf(s: GameState, id: string): string | null {
  for (const [shop, st] of Object.entries(s.staff.shops)) if (st.staff.some((m) => m.id === id)) return shop;
  return null;
}

export const isWorking = (s: GameState, id: string) => staffShopOf(s, id) !== null;

/** Puestos de trabajo de la herrería: uno, más los que suman las mejoras del taller. */
export function staffSlots(c: Content, s: GameState): number {
  return ST.baseSlots + bonus(c, s, 'personal');
}

export function workerName(c: Content, s: GameState, id: string): string {
  return c.workers[id]?.name ?? s.characters[id]?.name ?? c.npcs[id]?.name ?? id;
}

// ───────────────────────── Oficios y rasgos ─────────────────────────

export function oficioLevel(xp: number): number {
  return Math.min(ST.maxLevel, 1 + Math.floor(Math.sqrt(Math.max(0, xp) / ST.xpFactor)));
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * ST.xpFactor;
}

function defaultProgress(c: Content, id: string): WorkerProgress {
  const def = c.workers[id];
  const xp = { ventas: 0, criterio: 0, forja: 0 } as Record<Oficio, number>;
  if (def) for (const o of OFICIOS) xp[o] = xpForLevel(def.oficios[o]);
  return { xp, traits: [...(def?.traits ?? [])], picks: [] };
}

/** Progreso de alguien (lo crea si hace falta: solo dentro de comandos). */
export function workerProgress(c: Content, s: GameState, id: string): WorkerProgress {
  return (s.staff.workers[id] ??= defaultProgress(c, id));
}

/** Para mirar sin cambiar nada (la UI y los candidatos del tablón). */
export function peekProgress(c: Content, s: GameState, id: string): WorkerProgress {
  return s.staff.workers[id] ?? defaultProgress(c, id);
}

type NumericEffect = Exclude<keyof WorkEffect, 'calidadEn' | 'noche'>;

export function effectSum(c: Content, p: WorkerProgress, key: NumericEffect): number {
  return p.traits.reduce((a, t) => a + ((c.workTraits[t]?.effect[key] as number | undefined) ?? 0), 0);
}

function hasNight(c: Content, p: WorkerProgress): boolean {
  return p.traits.some((t) => c.workTraits[t]?.effect.noche);
}

/** Suma experiencia en un oficio; al llegar a ciertos niveles ofrece un rasgo para aprender. Devuelve el aviso si subió. */
export function addWorkXp(c: Content, s: GameState, rng: Rng, id: string, oficio: Oficio, amount: number): string | null {
  const p = workerProgress(c, s, id);
  const before = oficioLevel(p.xp[oficio]);
  p.xp[oficio] += amount * (1 + effectSum(c, p, 'aprende') / 100);
  const after = oficioLevel(p.xp[oficio]);
  if (after <= before) return null;
  for (let lvl = before + 1; lvl <= after; lvl++) {
    if (!ST.pickAtLevels.includes(lvl)) continue;
    const offered = new Set(p.picks.flat());
    const pool = Object.values(c.workTraits).filter((t) => t.oficio === oficio && !t.negative && !p.traits.includes(t.id) && !offered.has(t.id));
    const options: string[] = [];
    while (pool.length && options.length < ST.pickOptions) options.push(pool.splice(rng.int(0, pool.length - 1), 1)[0].id);
    if (options.length) p.picks.push(options);
  }
  return `${workerName(c, s, id)} sube a ${OFICIO_NAMES[oficio]} ${after}${p.picks.length ? ' y puede aprender algo nuevo' : ''}.`;
}

/** Elegir uno de los rasgos ofrecidos al subir de nivel. */
export function learnWorkTrait(s: GameState, { c }: Ctx, id: string, pick: number, traitId: string): GameEvent[] {
  const p = s.staff.workers[id];
  const options = p?.picks[pick];
  if (!options?.includes(traitId)) throw new GameError('Ese rasgo no está para elegir.');
  p.traits.push(traitId);
  p.picks.splice(pick, 1);
  return [{ type: 'toast', text: `${workerName(c, s, id)} aprende: ${c.workTraits[traitId].name}.`, tone: 'good' }];
}

/**
 * Cuánto rinde alguien en una franja: rasgos, la hora (de noche solo trabajan los trasnochadores, a la mitad)
 * y, si es esclavo, su lealtad.
 */
export function workRate(c: Content, s: GameState, id: string, slot: TimeSlot): number {
  const p = peekProgress(c, s, id);
  let r = 1 + effectSum(c, p, 'rinde') / 100;
  if (slot === 'mañana') r *= 1 + effectSum(c, p, 'manana') / 100;
  if (slot === 'tarde') r *= 1 + effectSum(c, p, 'tarde') / 100;
  if (slot === 'noche') r *= hasNight(c, p) ? 0.5 : 0;
  if (s.characters[id]?.bond === 'esclavo') r *= ST.loyaltyRate[relationLevel(s.npcs[id]?.relation ?? 0)] ?? 1;
  return Math.max(0, r);
}

/** Lo que cobra el vendedor respecto de lo que pagaría el cliente. */
export function priceRatio(c: Content, s: GameState, id: string): number {
  const p = peekProgress(c, s, id);
  const lvl = oficioLevel(p.xp.ventas);
  return Math.min(ST.priceMax, Math.max(0.3, ST.priceBase + ST.pricePerLevel * (lvl - 1) + effectSum(c, p, 'precio') / 100));
}

// ───────────────────────── Quién trabaja ─────────────────────────

/** Por qué alguien no puede sumarse al personal (o null si puede). */
export function joinBlock(c: Content, s: GameState, id: string): string | null {
  if (id === 'herrero') return 'El herrero es tu personaje.';
  const ch = s.characters[id];
  if (!isWorkerNpc(c, id)) {
    if (c.mercenaries[id]?.kind !== 'esclavo') return 'Los mercenarios solo pelean.';
    if (!ch?.bond || ch.escaped || ch.dead) return 'No está con vos.';
  } else if (!s.staff.hired.includes(id)) return 'No trabaja para vos.';
  if (isWorking(s, id)) return 'Ya trabaja en la herrería.';
  if (shopStaff_count(s) >= staffSlots(c, s)) return `No hay más puestos (tenés ${staffSlots(c, s)}). Ampliá el taller con «Puestos de trabajo».`;
  return null;
}

function shopStaff_count(s: GameState, shop = HOME_SHOP): number {
  return peekShop(s, shop).staff.length;
}

/** Compañeros comprados (o liberados) que pueden ponerse a trabajar: los que esperan en la herrería o van en el grupo. */
export function staffCandidates(s: GameState): string[] {
  return Object.values(s.characters)
    .filter((ch) => ch.bond && !ch.escaped && !ch.dead && !isWorking(s, ch.id))
    .map((ch) => ch.id);
}

function checkAtHome(s: GameState) {
  if (s.expedition) throw new GameError('Estás de expedición.');
  if (s.location !== HOME_SHOP) throw new GameError('El personal se organiza en tu herrería.');
}

/** Puesto con el que arranca alguien: el de su mejor oficio. */
function bestRole(c: Content, s: GameState, id: string): StaffRole {
  const p = peekProgress(c, s, id);
  const best = [...OFICIOS].sort((a, b) => p.xp[b] - p.xp[a])[0];
  return (Object.keys(ROLE_OFICIO) as StaffRole[]).find((r) => ROLE_OFICIO[r] === best) ?? 'vendedor';
}

/** Poner a trabajar a un compañero comprado o liberado (si iba en el grupo, deja el grupo). */
export function assignStaff(s: GameState, { c }: Ctx, id: string, role?: StaffRole): GameEvent[] {
  checkAtHome(s);
  const block = joinBlock(c, s, id);
  if (block) throw new GameError(block);
  s.party = s.party.filter((p) => p !== id);
  workerProgress(c, s, id);
  const r = role ?? bestRole(c, s, id);
  shopStaff(s).staff.push({ id, role: r });
  return [{ type: 'toast', text: `${workerName(c, s, id)} trabaja en la herrería: ${ROLE_NAMES[r].toLowerCase()}.`, tone: 'good' }];
}

export function setStaffRole(s: GameState, { c }: Ctx, id: string, role: StaffRole): GameEvent[] {
  checkAtHome(s);
  const m = shopStaff(s).staff.find((x) => x.id === id);
  if (!m) throw new GameError('No trabaja en la herrería.');
  if (m.role === role) return [];
  releasePiece(s, c, m);
  m.role = role;
  return [{ type: 'toast', text: `${workerName(c, s, id)} pasa a ${ROLE_NAMES[role].toLowerCase()}.` }];
}

/** Sacar a un compañero del puesto: vuelve al grupo si hay lugar, o espera en la herrería. */
export function removeStaff(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  checkAtHome(s);
  if (isWorkerNpc(c, id)) throw new GameError('A un empleado se lo despide.');
  const st = shopStaff(s);
  const m = st.staff.find((x) => x.id === id);
  if (!m) throw new GameError('No trabaja en la herrería.');
  releasePiece(s, c, m);
  st.staff = st.staff.filter((x) => x.id !== id);
  if (s.party.length < maxPartySize(c, s)) {
    s.party.push(id);
    return [{ type: 'toast', text: `${workerName(c, s, id)} deja el puesto y vuelve al grupo.` }];
  }
  return [{ type: 'toast', text: `${workerName(c, s, id)} deja el puesto y te espera en la herrería.` }];
}

/** Despedir a un empleado: deja de cobrar y vuelve a buscar trabajo. */
export function fireWorker(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  checkAtHome(s);
  if (!s.staff.hired.includes(id)) throw new GameError('No trabaja para vos.');
  leaveJob(s, c, id);
  changeRelation(s, id, ST.fireRelation);
  return [{ type: 'toast', text: `Despediste a ${workerName(c, s, id)}.` }];
}

function leaveJob(s: GameState, c: Content, id: string) {
  for (const st of Object.values(s.staff.shops)) {
    const m = st.staff.find((x) => x.id === id);
    if (m) releasePiece(s, c, m);
    st.staff = st.staff.filter((x) => x.id !== id);
  }
  s.staff.hired = s.staff.hired.filter((x) => x !== id);
}

// ───────────────────────── Contratación ─────────────────────────

/** Candidatos del tablón: cada ciudad tiene los suyos y cambian cada tanto. Nadie aparece en dos ciudades a la vez. */
export function refreshWorkerMarket(s: GameState, c: Content, rng: Rng) {
  for (const city of Object.keys(c.cities)) {
    const m = (s.staff.market[city] ??= { offer: [], lastRefresh: 0 });
    m.offer = m.offer.filter((id) => !s.staff.hired.includes(id));
    if (m.lastRefresh && s.day < m.lastRefresh + ST.refreshDays) continue;
    m.lastRefresh = s.day;
    const elsewhere = new Set(Object.entries(s.staff.market).filter(([k]) => k !== city).flatMap(([, x]) => x.offer));
    const pool = Object.keys(c.workers).filter((id) => !s.staff.hired.includes(id) && !elsewhere.has(id));
    m.offer = [];
    while (pool.length && m.offer.length < ST.offerSize) m.offer.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  }
}

export function workerOffer(s: GameState, city = currentCity(s)): string[] {
  return s.staff.market[city]?.offer ?? [];
}

/** Donde se contrata: el tablón de anuncios, o el gremio en las ciudades que no tienen tablón (como los avisos). */
export function isHiringBoard(c: Content, s: GameState): boolean {
  const kind = cityLocation(c, s.location)?.kind;
  const hasBoard = c.cities[currentCity(s)]?.locations.some((l) => l.kind === 'tablon');
  return kind === 'tablon' || (!hasBoard && kind === 'gremio');
}

export function hireBlock(c: Content, s: GameState, id: string): string | null {
  const def = c.workers[id];
  if (!def) return 'No existe.';
  if (s.staff.hired.includes(id)) return 'Ya trabaja para vos.';
  if (!workerOffer(s).includes(id)) return 'Ya no busca trabajo acá.';
  if (!isHiringBoard(c, s)) return 'Se contrata en el tablón de anuncios (en las ciudades sin tablón, en el gremio).';
  if (peekShop(s).staff.length >= staffSlots(c, s)) return `No hay puestos libres en tu herrería (tenés ${staffSlots(c, s)}).`;
  if ((s.npcs[id]?.relation ?? 0) <= ST.refuseRelation) return `${def.name} no quiere volver a trabajar con vos.`;
  if (s.gold < def.hireCost) return `Contratarlo cuesta ${def.hireCost} de oro.`;
  return null;
}

/** Contratar en el tablón: se paga el primer sueldo y va a trabajar a tu herrería (en Valdebrasa). */
export function hireWorker(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  if (s.expedition) throw new GameError('Estás de expedición.');
  const block = hireBlock(c, s, id);
  if (block) throw new GameError(block);
  const def = c.workers[id];
  s.gold -= def.hireCost;
  s.staff.hired.push(id);
  for (const m of Object.values(s.staff.market)) m.offer = m.offer.filter((x) => x !== id);
  workerProgress(c, s, id).unpaidDays = 0;
  const role = bestRole(c, s, id);
  shopStaff(s).staff.push({ id, role });
  const where = cityOfLocation(c, HOME_SHOP) === currentCity(s) ? 'tu herrería' : `tu herrería de ${c.cities[homeCity()].name}`;
  return [{ type: 'toast', text: `${def.name} empieza a trabajar en ${where}: ${ROLE_NAMES[role].toLowerCase()}. Cobra ${def.wage} de oro por día.`, tone: 'good' }];
}

/** Sueldo de cada día de los empleados. Si no alcanza, se enojan y al final se van. */
export function payWorkers(s: GameState, c: Content): GameEvent[] {
  const events: GameEvent[] = [];
  for (const id of [...s.staff.hired]) {
    const def = c.workers[id];
    if (!def) continue;
    const p = workerProgress(c, s, id);
    if (s.gold >= def.wage) {
      s.gold -= def.wage;
      p.unpaidDays = 0;
      continue;
    }
    p.unpaidDays = (p.unpaidDays ?? 0) + 1;
    changeRelation(s, id, BALANCE.mercenaries.unpaidRelation);
    if (p.unpaidDays >= BALANCE.mercenaries.unpaidDaysToLeave) {
      leaveJob(s, c, id);
      events.push({ type: 'toast', text: `${def.name} se cansó de no cobrar y renunció.`, tone: 'bad' });
    } else {
      events.push({ type: 'toast', text: `No te alcanzó para pagarle a ${def.name}.`, tone: 'bad' });
    }
  }
  return events;
}

/** Lo que cuesta por día el personal (empleados y liberados que trabajan). */
export function staffWages(c: Content, s: GameState): number {
  let total = s.staff.hired.reduce((a, id) => a + (c.workers[id]?.wage ?? 0), 0);
  for (const st of Object.values(s.staff.shops)) for (const m of st.staff) total += s.characters[m.id]?.wage ?? 0;
  return total;
}

/** Cada mañana: un esclavo que te odia y quedó trabajando solo puede escaparse con algo de la caja. */
export function dailyStaff(s: GameState, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  for (const st of Object.values(s.staff.shops)) {
    for (const m of [...st.staff]) {
      const ch = s.characters[m.id];
      if (ch?.bond !== 'esclavo' || relationLevel(s.npcs[m.id]?.relation ?? 0) !== 'hostil' || !rng.chance(ST.escapeChance)) continue;
      const took = Math.min(Math.floor(s.gold * ST.escapeGoldShare), ST.escapeGoldMax);
      s.gold -= took;
      st.staff = st.staff.filter((x) => x.id !== m.id);
      ch.escaped = true;
      events.push({ type: 'toast', text: `${ch.name} se escapó de la herrería${took ? ` con ${took} de oro de la caja` : ''}.`, tone: 'bad' });
    }
  }
  return events;
}

// ───────────────────────── Pedidos del aprendiz ─────────────────────────

/** Planos que el aprendiz puede repetir: los que forjaste vos alguna vez, del yunque o del banco de flechería. */
export function canOrder(c: Content, s: GameState, blueprintId: string): boolean {
  const bp = c.blueprints[blueprintId];
  return !!bp && s.staff.forged.includes(blueprintId) && (bp.station === 'yunque' || bp.station === 'flecheria');
}

/** Piezas para encargar: los diseños guardados en el libro y las que ya hiciste (plano y materiales). */
export function orderTemplates(c: Content, s: GameState): { name: string; blueprintId: string; materials: Record<string, string> }[] {
  const out: { name: string; blueprintId: string; materials: Record<string, string> }[] = [];
  const seen = new Set<string>();
  const add = (name: string, blueprintId: string, materials: Record<string, string>) => {
    const key = `${blueprintId}|${Object.entries(materials).sort().map(([k, v]) => `${k}=${v}`).join(',')}`;
    if (seen.has(key) || !canOrder(c, s, blueprintId)) return;
    seen.add(key);
    out.push({ name, blueprintId, materials: { ...materials } });
  };
  for (const d of s.designs) add(d.name, d.blueprintId, d.materials);
  for (const i of s.items) if (i.uid.startsWith('it') && !i.tags.includes('subasta')) add(baseName(c, i), i.blueprintId, i.materials);
  return out;
}

function baseName(c: Content, i: ItemInstance): string {
  const mats = Object.values(i.materials).map((m) => c.materials[m]?.name).filter(Boolean);
  return `${c.blueprints[i.blueprintId]?.name ?? i.name}${mats.length ? ` (${[...new Set(mats)].join(', ').toLowerCase()})` : ''}`;
}

export function addOrder(s: GameState, { c }: Ctx, blueprintId: string, materials: Record<string, string>, qty: number, name?: string): GameEvent[] {
  checkAtHome(s);
  if (!canOrder(c, s, blueprintId)) throw new GameError('El aprendiz solo repite piezas del yunque que ya forjaste vos.');
  const bp = c.blueprints[blueprintId];
  for (const part of bp.parts) if (!materials[part.slot] || !isAllowed(c, part, materials[part.slot])) throw new GameError(`Falta un material válido para: ${part.label}.`);
  const n = Math.round(qty);
  if (!(n >= 1 && n <= ST.maxOrderQty)) throw new GameError(`Se encargan entre 1 y ${ST.maxOrderQty}.`);
  shopStaff(s).orders.push({ id: nextUid(s, 'wo'), name: name ?? bp.name, blueprintId, materials: { ...materials }, qty: n, done: 0 });
  return [{ type: 'toast', text: `Pedido: ${n}× ${name ?? bp.name}.` }];
}

export function cancelOrder(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const st = shopStaff(s);
  for (const m of st.staff) if (m.piece?.order === id) releasePiece(s, c, m);
  st.orders = st.orders.filter((o) => o.id !== id);
  return [];
}

/** Si alguien deja una pieza a medio hacer, los materiales vuelven al inventario. */
function releasePiece(s: GameState, c: Content, m: StaffMember) {
  if (!m.piece) return;
  const order = Object.values(s.staff.shops).flatMap((st) => st.orders).find((o) => o.id === m.piece!.order);
  if (order && !m.piece.free) for (const [id, q] of Object.entries(computeDesign(c, order.blueprintId, order.materials).needs)) addMaterial(s, id, q);
  delete m.piece;
}

// ───────────────────────── El turno ─────────────────────────

/**
 * Corre las franjas que pasaron (de `from` a `to`, contadas como día × 3 + franja) en cada herrería con personal.
 * `ownerSold`: el herrero atendió él mismo la tienda en esas franjas (los vendedores no venden).
 */
export function staffShift(s: GameState, c: Content, rng: Rng, from: number, to: number, ownerSold = false): GameEvent[] {
  for (let abs = from; abs < to; abs++) {
    const slot = SLOTS[((abs % 3) + 3) % 3];
    for (const [shop, st] of Object.entries(s.staff.shops)) if (st.staff.length) workSlot(s, c, rng, shop, st, slot, ownerSold);
  }
  return [];
}

function workSlot(s: GameState, c: Content, rng: Rng, shop: string, st: ShopStaff, slot: TimeSlot, ownerSold: boolean) {
  const city = cityOfLocation(c, shop) ?? homeCity();
  const rate = (m: StaffMember) => workRate(c, s, m.id, slot);
  // Primero el encargado arma la vidriera, después venden, y el aprendiz forja.
  for (const m of st.staff.filter((x) => x.role === 'encargado')) if (rate(m) > 0) arrange(s, c, rng, st, m, rate(m), city, slot);
  const sellers = st.staff.filter((x) => x.role === 'vendedor' && rate(x) > 0);
  if (sellers.length && !ownerSold) sell(s, c, rng, st, sellers, rate, city);
  for (const m of st.staff.filter((x) => x.role === 'aprendiz')) if (rate(m) > 0) forgeWork(s, c, rng, st, m, rate(m));
}

function note(st: ShopStaff, text: string) {
  if (!st.report.notes.includes(text)) st.report.notes.push(text);
}

function levelNote(st: ShopStaff, text: string | null) {
  if (text) note(st, text);
}

/** Lo que el encargado puede poner en la vidriera: lo que no está reservado, puesto, en el cinturón ni comprado en la subasta. */
export function displayCandidates(s: GameState): ItemInstance[] {
  return s.items.filter((i) => !i.exhibited && !i.reserved && !i.equippedBy && !(i.uid in s.belt) && i.quantity > 0 && !i.tags.includes('subasta'));
}

/** Qué tan vendible es una pieza en esta ciudad y a esta hora (lo que ve un encargado perfecto). */
function saleScore(c: Content, s: GameState, item: ItemInstance, city: string, slot: TimeSlot): number {
  const types = Object.values(c.customers).filter((t) => t.minReputation <= (s.reputation[city] ?? 0) && (!t.cities || t.cities.includes(city)));
  const mix = c.cities[city]?.customers ?? {};
  let w = 0;
  let total = 0;
  for (const t of types) {
    const weight = (t.appearance[slot] || t.appearance.tarde || 0.1) * (mix[t.id] ?? 1);
    w += weight;
    total += weight * interestScore(t, item);
  }
  return w ? (total / w) * item.value * demandOf(s, item.category, city) : 0;
}

function arrange(s: GameState, c: Content, rng: Rng, st: ShopStaff, m: StaffMember, rate: number, city: string, slot: TimeSlot) {
  if (!rng.chance(Math.min(1, rate))) return;
  const p = workerProgress(c, s, m.id);
  const level = oficioLevel(p.xp.criterio) + effectSum(c, p, 'vidriera');
  const noise = Math.max(0, ST.noiseBase - ST.noisePerLevel * (level - 1));
  const scored = (i: ItemInstance) => saleScore(c, s, i, city, slot) * (1 + rng.range(-noise, noise));
  let changes = 0;
  const candidates = displayCandidates(s).map((i) => ({ i, score: scored(i) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const slots = displaySlots(c, s);
  while (exhibitedItems(s).length < slots && candidates.length) {
    candidates.shift()!.i.exhibited = true;
    changes++;
  }
  // Con más criterio, cambia lo que no se vende por algo mejor (nunca toca lo reservado).
  if (level >= ST.swapFromLevel && candidates.length) {
    const shown = exhibitedItems(s).filter((i) => !i.reserved).map((i) => ({ i, score: scored(i) })).sort((a, b) => a.score - b.score);
    const worst = shown[0];
    const best = candidates[0];
    if (worst && best.score > worst.score * ST.swapMargin) {
      worst.i.exhibited = false;
      best.i.exhibited = true;
      changes++;
    }
  }
  st.report.exhibited += changes;
  levelNote(st, addWorkXp(c, s, rng, m.id, 'criterio', ST.xpSlot + changes * ST.xpPerChange));
}

function sell(s: GameState, c: Content, rng: Rng, st: ShopStaff, sellers: StaffMember[], rate: (m: StaffMember) => number, city: string) {
  const best = [...sellers].sort((a, b) => priceRatio(c, s, b.id) - priceRatio(c, s, a.id))[0];
  const ratio = priceRatio(c, s, best.id);
  const extra = (sellers.length - 1) * ST.extraCustomersPerSeller + sellers.reduce((a, m) => a + effectSum(c, peekProgress(c, s, m.id), 'clientes'), 0);
  let customers = generateCustomers(c, s, rng, city);
  if (extra > 0) customers = customers.concat(generateCustomers(c, s, rng, city).slice(0, Math.round(extra)));
  const attend = Math.min(1, sellers.reduce((a, m) => a + rate(m), 0) / sellers.length);
  for (const customer of customers) {
    if (!rng.chance(attend)) continue;
    const type = c.customers[customer.typeId];
    const candidates = exhibitedItems(s)
      .map((item) => ({ item, score: interestScore(type, item) * (1 + (demandOf(s, item.category, city) - 1) * BALANCE.demand.customerWeight) }))
      .filter(({ item, score }) => score > 0 && item.value <= customer.budget * 1.1);
    if (!candidates.length) continue;
    const { item } = rng.weighted(candidates.map((x) => [x, x.score] as const));
    const range = bulkRange(type, item);
    const qty = range ? Math.min(item.quantity, rng.int(range[0], range[1])) : 1;
    const rep = s.reputation[city] ?? 0;
    const valuation = item.value * qty * type.generosity * (1 + preferenceMatch(type, item)) * (0.9 + rep / 200) * demandOf(s, item.category, city);
    const price = Math.max(1, Math.round(Math.min(valuation, customer.budget) * ratio));
    item.quantity -= qty;
    if (item.quantity <= 0) {
      s.items = s.items.filter((x) => x.uid !== item.uid);
      delete s.belt[item.uid];
    }
    registerSale(s, item.category, qty, city);
    s.gold += price;
    s.stats.goldEarned += price;
    s.stats.itemsSold += qty;
    changeReputation(s, city, BALANCE.shop.repOnSale);
    st.report.sold += qty;
    st.report.earned += price;
    const who = rng.weighted(sellers.map((m) => [m, rate(m)] as const));
    levelNote(st, addWorkXp(c, s, rng, who.id, 'ventas', ST.xpSale + price / ST.xpSalePerGold));
  }
  for (const m of sellers) levelNote(st, addWorkXp(c, s, rng, m.id, 'ventas', ST.xpSlot));
}

function forgeWork(s: GameState, c: Content, rng: Rng, st: ShopStaff, m: StaffMember, rate: number) {
  const name = workerName(c, s, m.id);
  if (!m.piece) {
    const busy = (o: WorkOrder) => st.staff.filter((x) => x.piece?.order === o.id).length;
    const order = st.orders.find((o) => o.qty - o.done - busy(o) > 0);
    if (!order) return note(st, `${name} no tiene pedidos: encargale piezas desde «Personal».`);
    const needs = computeDesign(c, order.blueprintId, order.materials).needs;
    const missing = Object.entries(needs).find(([id, q]) => !hasMaterial(s, id, q));
    if (missing) return note(st, `Falta ${c.materials[missing[0]]?.name ?? missing[0]} para «${order.name}».`);
    const p = workerProgress(c, s, m.id);
    const free = rng.chance(effectSum(c, p, 'ahorro'));
    if (!free) for (const [id, q] of Object.entries(needs)) addMaterial(s, id, -q);
    m.piece = { order: order.id, work: 0, ...(free ? { free: true } : {}) };
  }
  const order = st.orders.find((o) => o.id === m.piece!.order);
  if (!order) {
    delete m.piece;
    return;
  }
  m.piece.work += rate;
  levelNote(st, addWorkXp(c, s, rng, m.id, 'forja', ST.xpSlot));
  const bp = c.blueprints[order.blueprintId];
  if (m.piece.work < bp.slots) return;
  delete m.piece;
  const item = makePiece(s, c, rng, m.id, order);
  if (!item) {
    st.report.ruined += 1;
    levelNote(st, addWorkXp(c, s, rng, m.id, 'forja', ST.xpRuined));
    return;
  }
  order.done += 1;
  st.report.made[order.name] = (st.report.made[order.name] ?? 0) + item.quantity;
  levelNote(st, addWorkXp(c, s, rng, m.id, 'forja', ST.xpPiece * bp.slots + item.quality * ST.xpPerQuality));
  if (order.done >= order.qty) {
    st.orders = st.orders.filter((o) => o.id !== order.id);
    note(st, `Pedido terminado: ${order.qty}× ${order.name}.`);
  }
}

/**
 * Una pieza del aprendiz: arranca con la calidad de base (más las mejoras del yunque y sus rasgos) y golpea con
 * prudencia según su nivel de Forja: con más nivel da más golpes y se arriesga menos a los defectos.
 * Sin temple, acabado ni encantamientos. Puede arruinarse.
 */
export function makePiece(s: GameState, c: Content, rng: Rng, id: string, order: WorkOrder): ItemInstance | null {
  const p = workerProgress(c, s, id);
  const lvl = oficioLevel(p.xp.forja);
  const bp = c.blueprints[order.blueprintId];
  const design = computeDesign(c, order.blueprintId, order.materials);
  const catBonus = p.traits.reduce((a, t) => {
    const e = c.workTraits[t]?.effect.calidadEn;
    return a + (e && e.categories.includes(bp.category) ? e.value : 0);
  }, 0);
  const session: ForgeSession = {
    kind: 'pieza', blueprintId: order.blueprintId, materials: { ...order.materials }, stage: 'forging', hits: 0,
    quality: F.startQuality + workshopBonus(c, s, 'forjaCalidadInicial') + effectSum(c, p, 'calidad') + catBonus,
    defects: 0, traits: [], finish: [], instability: design.instability,
  };
  const mods: ForgeMods = { defect: workshopBonus(c, s, 'forjaDefecto') - effectSum(c, p, 'defecto'), perfect: 0, trait: 0 };
  const target = Math.min(F.traitTierHits[2], ST.hitsBase + lvl);
  while (session.hits < target) {
    if (session.defects >= ST.maxDefects || defectChanceFor(session, lvl, mods) > ST.maxRisk) break;
    if (strike(session, rng, lvl, mods).ruined) return null;
  }
  const synergyTraits = design.synergies.map((x) => x.effect.trait).filter((t): t is string => !!t);
  session.traits = rollTraits(c, session, bp.category, rng, lvl, synergyTraits, mods);
  session.stage = 'enchant';
  const { rarityScore: _score, design: _design, ...rest } = buildItem(c, session, []);
  const item: ItemInstance = { ...rest, uid: nextUid(s, 'it'), exhibited: false, createdDay: s.day, madeBy: id };
  if (bp.batch) item.quantity = Math.round(item.quantity * (1 + (workshopBonus(c, s, 'loteExtra') + effectSum(c, p, 'lote')) / 100));
  s.items.push(item);
  return item;
}

// ───────────────────────── Resumen ─────────────────────────

/** Si el herrero está en la herrería, cuenta lo que hizo el personal desde la última vez y lo pone en cero. */
export function staffReportEvents(s: GameState): GameEvent[] {
  if (s.expedition || s.location !== HOME_SHOP) return [];
  const st = s.staff.shops[HOME_SHOP];
  if (!st) return [];
  const r = st.report;
  const parts: string[] = [];
  if (r.sold) parts.push(`vendió ${r.sold} por ${r.earned} de oro`);
  const made = Object.entries(r.made).map(([n, q]) => `${q}× ${n}`);
  if (made.length) parts.push(`forjó ${made.join(', ')}`);
  if (r.ruined) parts.push(`arruinó ${r.ruined} pieza${r.ruined > 1 ? 's' : ''}`);
  if (r.exhibited) parts.push(`cambió ${r.exhibited} cosa${r.exhibited > 1 ? 's' : ''} de la vidriera`);
  const notes = r.notes;
  st.report = emptyReport();
  if (!parts.length && !notes.length) return [];
  const text = [parts.length ? `Tu personal ${parts.join(' · ')}.` : '', ...notes].filter(Boolean).join(' ');
  return [{ type: 'toast', text, tone: r.sold || made.length ? 'good' : 'info' }];
}

/** Relación mínima de lealtad (para la UI). */
export function loyaltyRateLabel(s: GameState, id: string): string | null {
  if (s.characters[id]?.bond !== 'esclavo') return null;
  const lvl = relationLevel(s.npcs[id]?.relation ?? 0) as RelationLevel;
  const r = ST.loyaltyRate[lvl] ?? 1;
  return r < 1 ? `Rinde ${Math.round(r * 100)}% por su lealtad (${lvl}).` : null;
}

/** Reservar (o liberar) una pieza: el encargado no la pone en la vidriera ni la saca. */
export function toggleReserved(s: GameState, _ctx: Ctx, uid: string): GameEvent[] {
  const item = s.items.find((i) => i.uid === uid);
  if (!item) throw new GameError('Ese objeto no existe.');
  item.reserved = !item.reserved;
  return [];
}
