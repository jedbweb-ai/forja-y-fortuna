import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { addMaterial, addXp, hasMaterial, nextUid, skillLevel } from '../state';
import { advanceTime } from '../time';
import { RARITIES, type GameEvent, type GameState, type ItemCategory, type ItemInstance, type Rarity, type SkillId } from '../types';
import { computeDesign, isAllowed, quenchApplies } from './design';
import { rollTraits, strike, type ForgeMods } from './forging';
import { bonus } from '../progress/progress';
import { buildItem, enchantSlotsFor, qualityLabel, rarityIndex } from './item';

const SPECIALTY: Partial<Record<ItemCategory, SkillId>> = {
  escudo: 'armeria', armadura: 'armeria', distancia: 'flecheria', municion: 'flecheria', arrojadizo: 'flecheria', joyeria: 'joyeria',
};

type Cost = { gold?: number; material?: string; qty?: number };

function canPay(s: GameState, cost: Cost) {
  return (s.gold >= (cost.gold ?? 0)) && (!cost.material || hasMaterial(s, cost.material, cost.qty ?? 1));
}

function pay(s: GameState, c: Content, cost: Cost) {
  if (!canPay(s, cost)) {
    const what = cost.material ? `${cost.qty ?? 1}× ${c.materials[cost.material]?.name ?? cost.material}` : `${cost.gold} de oro`;
    throw new GameError(`Te falta: ${what}.`);
  }
  s.gold -= cost.gold ?? 0;
  if (cost.material) addMaterial(s, cost.material, -(cost.qty ?? 1));
}

function session(s: GameState) {
  if (!s.forge) throw new GameError('No hay ninguna pieza en el yunque.');
  return s.forge;
}

function checkWorkshop(s: GameState) {
  if (s.forge) throw new GameError('Ya hay un trabajo en curso.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  if (s.location !== 'herreria' || s.expedition) throw new GameError('Para trabajar tenés que estar en tu herrería.');
}

/** Bonos de talentos y mejoras para los golpes de la forja. */
export function forgeMods(c: Content, s: GameState): ForgeMods {
  return { defect: bonus(c, s, 'forjaDefecto'), perfect: bonus(c, s, 'forjaPerfecto'), trait: bonus(c, s, 'forjaRasgo') };
}

/** Habilidad que se usa para la etapa de golpes (herrería, joyería o runas). */
function workSkill(c: Content, s: GameState): SkillId {
  const f = s.forge;
  if (f?.kind === 'runa') return 'runas';
  return f && c.blueprints[f.blueprintId]?.station === 'joyeria' ? 'joyeria' : 'herreria';
}

export function forgeBegin(s: GameState, { c }: Ctx, blueprintId: string, materials: Record<string, string>): GameEvent[] {
  checkWorkshop(s);
  if (!s.knownBlueprints.includes(blueprintId)) throw new GameError('Todavía no conocés ese plano.');
  const bp = c.blueprints[blueprintId];
  for (const part of bp.parts) {
    if (!materials[part.slot] || !isAllowed(c, part, materials[part.slot])) throw new GameError(`Elegí un material válido para: ${part.label}.`);
  }
  const design = computeDesign(c, blueprintId, materials);
  for (const [id, q] of Object.entries(design.needs)) {
    if (!hasMaterial(s, id, q)) throw new GameError(`Te falta ${c.materials[id].name} (necesitás ${q}).`);
  }
  for (const [id, q] of Object.entries(design.needs)) addMaterial(s, id, -q);
  const startQuality = BALANCE.forge.startQuality + bonus(c, s, 'forjaCalidadInicial') + (bp.station === 'joyeria' ? bonus(c, s, 'joyaCalidad') : 0);
  s.forge = {
    kind: 'pieza', blueprintId, materials: { ...materials }, stage: 'forging', hits: 0, quality: startQuality,
    defects: 0, traits: [], finish: [], instability: design.instability,
  };
  return [];
}

/** Mesa de runas: se gastan los materiales de la runa y se pasa al grabado (golpes de cincel). */
export function runeBegin(s: GameState, { c }: Ctx, enchantmentId: string): GameEvent[] {
  checkWorkshop(s);
  const e = c.enchantments[enchantmentId];
  if (!e || e.source !== 'runa' || !s.knownEnchantments.includes(enchantmentId)) throw new GameError('No conocés esa runa.');
  for (const k of e.cost) if (!hasMaterial(s, k.material, k.qty)) throw new GameError(`Te falta ${c.materials[k.material].name} (necesitás ${k.qty}).`);
  for (const k of e.cost) addMaterial(s, k.material, -k.qty);
  s.forge = {
    kind: 'runa', blueprintId: enchantmentId, materials: {}, stage: 'forging', hits: 0, quality: BALANCE.forge.startQuality + bonus(c, s, 'runaCalidad'),
    defects: 0, traits: [], finish: [], instability: 0,
  };
  return [];
}

export function forgeStrike(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'forging') throw new GameError('El forjado ya terminó.');
  const { result, ruined } = strike(f, rng, skillLevel(s.skills[workSkill(c, s)]), forgeMods(c, s));
  const events: GameEvent[] = [{ type: 'forgeHit', result }];
  if (ruined) {
    const name = f.kind === 'runa' ? c.enchantments[f.blueprintId].name : c.blueprints[f.blueprintId].name;
    const slots = f.kind === 'runa' ? 1 : c.blueprints[f.blueprintId].slots;
    s.forge = null;
    s.stats.itemsRuined += 1;
    addXp(s, f.kind === 'runa' ? 'runas' : 'herreria', BALANCE.forge.xpRuined);
    events.push({ type: 'forgeRuined', name });
    events.push({ type: 'toast', text: `¡Se partió! ${name} arruinada.`, tone: 'bad' });
    events.push(...advanceTime(s, slots));
  }
  return events;
}

function runeItem(s: GameState, c: Content, enchantmentId: string, quality: number, defects: number): ItemInstance {
  const e = c.enchantments[enchantmentId];
  const matCost = e.cost.reduce((a, k) => a + (c.materials[k.material]?.price ?? 0) * k.qty, 0);
  const q = Math.round(quality);
  return {
    uid: nextUid(s, 'ru'), blueprintId: enchantmentId, name: `${e.name} (${qualityLabel(q).toLowerCase()})`, category: 'runa',
    materials: {}, stats: { atk: 0, def: 0, spd: 0, wgt: 0, dur: 0 }, affinities: { ...(e.effect.affinity ?? {}) },
    quality: q, defects, traits: [], synergies: [], finish: [], enchantments: [],
    rarity: q >= 85 ? 'raro' : q >= 60 ? 'poco común' : 'común', tags: ['runa'], beauty: 0, durability: 1, maxDurability: 1,
    value: Math.max(1, Math.round(matCost * 1.5 * (0.6 + q / 100))), quantity: 1, exhibited: false, createdDay: s.day,
    color: '#6f6a8f',
  };
}

export function forgeStop(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'forging') throw new GameError('El forjado ya terminó.');
  if (f.hits === 0) throw new GameError('Dale al menos un golpe.');
  if (f.kind === 'runa') {
    const item = runeItem(s, c, f.blueprintId, f.quality, f.defects);
    s.items.push(item);
    s.forge = null;
    addXp(s, 'runas', 8 + item.quality * 0.1);
    return [{ type: 'itemCreated', item, newSynergies: [] }, ...advanceTime(s, 1)];
  }
  const bp = c.blueprints[f.blueprintId];
  const synergyTraits = computeDesign(c, f.blueprintId, f.materials).synergies.map((x) => x.effect.trait).filter((t): t is string => !!t);
  f.traits = rollTraits(c, f, bp.category, rng, skillLevel(s.skills[workSkill(c, s)]), synergyTraits, forgeMods(c, s));
  f.stage = quenchApplies(c, bp, f.materials) ? 'quench' : 'finish';
  return [];
}

export function forgeQuench(s: GameState, { c }: Ctx, mediumId: string): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'quench') throw new GameError('No es momento de templar.');
  const medium = c.quench[mediumId];
  if (!medium) throw new GameError('Medio de temple desconocido.');
  pay(s, c, medium.cost);
  f.quench = mediumId;
  f.stage = 'finish';
  return [];
}

export interface FinishChoice {
  grip?: string;
  polish: string;
  engraving?: string;
}

export function forgeFinish(s: GameState, { c }: Ctx, choice: FinishChoice): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'finish') throw new GameError('No es momento del acabado.');
  const bp = c.blueprints[f.blueprintId];
  const picks: string[] = [];
  const add = (id: string | undefined, kind: 'grip' | 'polish' | 'engraving', allowed: boolean) => {
    if (!id) return;
    const opt = c.finishes[id];
    if (!opt || opt.kind !== kind) throw new GameError('Acabado inválido.');
    if (!allowed || (opt.categories && !opt.categories.includes(bp.category))) throw new GameError(`Este objeto no admite ${opt.name.toLowerCase()}.`);
    picks.push(id);
  };
  add(choice.grip, 'grip', bp.grip);
  add(choice.polish, 'polish', true);
  add(choice.engraving, 'engraving', bp.engrave);
  // Validar el total antes de cobrar nada.
  const totalGold = picks.reduce((a, id) => a + (c.finishes[id].cost.gold ?? 0), 0);
  if (s.gold < totalGold) throw new GameError(`El acabado cuesta ${totalGold} de oro.`);
  for (const id of picks) pay(s, c, c.finishes[id].cost);
  f.finish = picks;
  f.stage = 'enchant';
  return [];
}

/** Encantamiento elegido en la etapa 5: si es de runa, qué runa del inventario se gasta. */
export interface EnchantPick {
  id: string;
  rune?: string;
}

/** Valida y prepara los encantamientos: qué se paga y la calidad de cada runa. */
export function planEnchantments(c: Content, s: GameState, blueprintId: string, rarity: Rarity, picks: EnchantPick[]) {
  const bp = c.blueprints[blueprintId];
  const needs: Record<string, number> = {};
  let gold = 0;
  const runeQuality: Record<string, number> = {};
  const runes: string[] = [];
  for (const p of picks) {
    const e = c.enchantments[p.id];
    if (!e || !s.knownEnchantments.includes(p.id)) throw new GameError('No conocés ese encantamiento.');
    if (!e.categories.includes(bp.category)) throw new GameError(`${e.name} no sirve para este tipo de objeto.`);
    if (e.minRarity && rarityIndex(rarity) < RARITIES.indexOf(e.minRarity)) throw new GameError(`${e.name} pide una pieza ${e.minRarity} o mejor.`);
    if (e.source === 'runa') {
      const rune = s.items.find((i) => i.uid === p.rune && i.category === 'runa' && i.blueprintId === p.id);
      if (!rune) throw new GameError(`Necesitás una ${e.name} grabada en la mesa de runas.`);
      runeQuality[p.id] = rune.quality;
      runes.push(rune.uid);
    } else {
      for (const k of e.cost) needs[k.material] = (needs[k.material] ?? 0) + k.qty;
      gold += e.gold ?? 0;
    }
  }
  if (new Set(picks.map((p) => p.id)).size !== picks.length) throw new GameError('No se puede repetir el mismo encantamiento.');
  return { needs, gold, runeQuality, runes };
}

export function forgeComplete(s: GameState, { c, rng }: Ctx, picks: EnchantPick[]): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'enchant') throw new GameError('Todavía no terminaste el acabado.');
  const bp = c.blueprints[f.blueprintId];
  const preview = buildItem(c, f, []);
  const slots = enchantSlotsFor(preview.rarity);
  if (picks.length > slots) throw new GameError(`Esta pieza admite ${slots} encantamiento(s).`);
  if (bp.batch && picks.length) throw new GameError('Los lotes no se encantan.');
  const plan = planEnchantments(c, s, f.blueprintId, preview.rarity, picks);
  for (const [m, q] of Object.entries(plan.needs)) if (!hasMaterial(s, m, q)) throw new GameError(`Te falta ${c.materials[m].name} como reactivo.`);
  if (s.gold < plan.gold) throw new GameError(`Los reactivos del grimorio cuestan además ${plan.gold} de oro.`);
  for (const [m, q] of Object.entries(plan.needs)) addMaterial(s, m, -q);
  s.gold -= plan.gold;
  s.items = s.items.filter((i) => !plan.runes.includes(i.uid));

  const build = buildItem(c, f, picks.map((p) => p.id), plan.runeQuality);
  const { rarityScore: _score, design: _design, ...rest } = build;
  const item = { ...rest, uid: nextUid(s, 'it'), exhibited: true, createdDay: s.day };
  // Talentos de armería y flechería.
  const atkPct = bonus(c, s, 'armaAtaque');
  const defPct = bonus(c, s, 'armaduraDefensa');
  if (atkPct && (item.category === 'arma' || item.category === 'distancia')) item.stats = { ...item.stats, atk: Math.round(item.stats.atk * (1 + atkPct / 100) * 10) / 10 };
  if (defPct && (item.category === 'armadura' || item.category === 'escudo')) item.stats = { ...item.stats, def: Math.round(item.stats.def * (1 + defPct / 100) * 10) / 10 };
  if (bp.batch) item.quantity = Math.round(item.quantity * (1 + bonus(c, s, 'loteExtra') / 100));
  s.items.push(item);
  s.forge = null;
  s.stats.itemsForged += 1;

  const newSynergies = item.synergies.filter((id) => !s.discoveredSynergies.includes(id));
  s.discoveredSynergies.push(...newSynergies);

  const xp = BALANCE.forge.xpBase * bp.slots + item.quality * BALANCE.forge.xpPerQuality;
  const events: GameEvent[] = [{ type: 'itemCreated', item, newSynergies }];
  const main = bp.station === 'joyeria' ? 'joyeria' : 'herreria';
  if (addXp(s, main, xp)) events.push({ type: 'toast', text: `¡${main === 'joyeria' ? 'Joyería' : 'Herrería'} sube a nivel ${skillLevel(s.skills[main])}!`, tone: 'good' });
  const spec = SPECIALTY[bp.category];
  if (spec && spec !== main) addXp(s, spec, xp);
  if (picks.length) addXp(s, 'runas', 10 * picks.length);
  newSynergies.forEach((id) => events.push({ type: 'synergyDiscovered', id }));
  // Intuición: a veces se te ocurre una combinación nueva (nunca los secretos únicos de las mazmorras).
  if (rng.chance(bonus(c, s, 'forjaIntuicion'))) {
    const locked = new Set([
      ...Object.values(c.dungeons).flatMap((d) => d.uniques.filter((u) => u.kind === 'synergy').map((u) => u.ref)),
      ...Object.values(c.riddles).map((r) => r.reward.synergy).filter(Boolean),
    ]);
    const pool = Object.values(c.synergies).filter((x) => !s.discoveredSynergies.includes(x.id) && !locked.has(x.id));
    if (pool.length) {
      const idea = rng.pick(pool);
      s.discoveredSynergies.push(idea.id);
      events.push({ type: 'synergyDiscovered', id: idea.id }, { type: 'toast', text: `Intuición: anotás en el libro «${idea.name}».`, tone: 'good' });
    }
  }
  events.push(...advanceTime(s, bp.slots));
  return events;
}

export function saveDesign(s: GameState, { c }: Ctx, name: string, blueprintId: string, materials: Record<string, string>): GameEvent[] {
  if (!c.blueprints[blueprintId]) throw new GameError('Plano inexistente.');
  const id = nextUid(s, 'ds');
  s.designs.push({ id, name: name.trim() || c.blueprints[blueprintId].name, blueprintId, materials: { ...materials } });
  return [{ type: 'toast', text: 'Diseño guardado en el libro.', tone: 'good' }];
}

export function deleteDesign(s: GameState, _ctx: Ctx, id: string): GameEvent[] {
  s.designs = s.designs.filter((d) => d.id !== id);
  return [];
}
