import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { addMaterial, addXp, hasMaterial, nextUid, skillLevel } from '../state';
import { advanceTime } from '../time';
import type { GameEvent, GameState, ItemCategory, SkillId } from '../types';
import { computeDesign, isAllowed, quenchApplies } from './design';
import { rollTraits, strike } from './forging';
import { buildItem, enchantSlotsFor } from './item';

const SPECIALTY: Partial<Record<ItemCategory, SkillId>> = {
  escudo: 'armeria', armadura: 'armeria', distancia: 'flecheria', municion: 'flecheria', arrojadizo: 'flecheria',
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

export function forgeBegin(s: GameState, { c }: Ctx, blueprintId: string, materials: Record<string, string>): GameEvent[] {
  if (s.forge) throw new GameError('Ya hay una pieza en el yunque.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  if (s.location !== 'herreria') throw new GameError('Para forjar tenés que estar en tu herrería.');
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
  s.forge = {
    blueprintId, materials: { ...materials }, stage: 'forging', hits: 0, quality: BALANCE.forge.startQuality,
    defects: 0, traits: [], finish: [], instability: design.instability,
  };
  return [];
}

export function forgeStrike(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'forging') throw new GameError('El forjado ya terminó.');
  const { result, ruined } = strike(f, rng, skillLevel(s.skills.herreria));
  const events: GameEvent[] = [{ type: 'forgeHit', result }];
  if (ruined) {
    const bp = c.blueprints[f.blueprintId];
    s.forge = null;
    s.stats.itemsRuined += 1;
    addXp(s, 'herreria', BALANCE.forge.xpRuined);
    events.push({ type: 'forgeRuined', name: bp.name });
    events.push({ type: 'toast', text: `¡La pieza se partió! ${bp.name} arruinada.`, tone: 'bad' });
    events.push(...advanceTime(s, bp.slots));
  }
  return events;
}

export function forgeStop(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'forging') throw new GameError('El forjado ya terminó.');
  if (f.hits === 0) throw new GameError('Dale al menos un golpe.');
  const bp = c.blueprints[f.blueprintId];
  const synergyTraits = computeDesign(c, f.blueprintId, f.materials).synergies.map((x) => x.effect.trait).filter((t): t is string => !!t);
  f.traits = rollTraits(c, f, bp.category, rng, skillLevel(s.skills.herreria), synergyTraits);
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
    if (!allowed) throw new GameError(`Este objeto no admite ${opt.name.toLowerCase()}.`);
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

export function forgeComplete(s: GameState, { c }: Ctx, enchantments: string[]): GameEvent[] {
  const f = session(s);
  if (f.stage !== 'enchant') throw new GameError('Todavía no terminaste el acabado.');
  const bp = c.blueprints[f.blueprintId];
  const preview = buildItem(c, f, []);
  const slots = enchantSlotsFor(preview.rarity);
  if (enchantments.length > slots) throw new GameError(`Esta pieza admite ${slots} encantamiento(s).`);
  if (bp.batch && enchantments.length) throw new GameError('Los lotes no se encantan (todavía).');
  const needs: Record<string, number> = {};
  for (const id of enchantments) {
    const e = c.enchantments[id];
    if (!e || !s.knownEnchantments.includes(id)) throw new GameError('No conocés ese encantamiento.');
    if (!e.categories.includes(bp.category)) throw new GameError(`${e.name} no sirve para este tipo de objeto.`);
    for (const k of e.cost) needs[k.material] = (needs[k.material] ?? 0) + k.qty;
  }
  for (const [m, q] of Object.entries(needs)) {
    if (!hasMaterial(s, m, q)) throw new GameError(`Te falta ${c.materials[m].name} para la runa.`);
  }
  for (const [m, q] of Object.entries(needs)) addMaterial(s, m, -q);

  const build = buildItem(c, f, enchantments);
  const { rarityScore: _score, design: _design, ...rest } = build;
  const item = { ...rest, uid: nextUid(s, 'it'), exhibited: true, createdDay: s.day };
  s.items.push(item);
  s.forge = null;
  s.stats.itemsForged += 1;

  const newSynergies = item.synergies.filter((id) => !s.discoveredSynergies.includes(id));
  s.discoveredSynergies.push(...newSynergies);

  const xp = BALANCE.forge.xpBase * bp.slots + item.quality * BALANCE.forge.xpPerQuality;
  const events: GameEvent[] = [{ type: 'itemCreated', item, newSynergies }];
  if (addXp(s, 'herreria', xp)) events.push({ type: 'toast', text: `¡Herrería sube a nivel ${skillLevel(s.skills.herreria)}!`, tone: 'good' });
  const spec = SPECIALTY[bp.category];
  if (spec) addXp(s, spec, xp);
  if (enchantments.length) addXp(s, 'runas', 10 * enchantments.length);
  newSynergies.forEach((id) => events.push({ type: 'synergyDiscovered', id }));
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
