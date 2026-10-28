import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { maxHp } from '../party/progression';
import { addMaterial, addXp, hasMaterial, nextUid, skillLevel } from '../state';
import { advanceTime } from '../time';
import type { GameEvent, GameState, ItemInstance } from '../types';
import { ALCHEMY_PROPS, type AlchemyProps, type PotionDef } from './types';

const AL = BALANCE.alchemy;
export type Heat = 'suave' | 'medio' | 'fuerte';

/** Suma las propiedades alquímicas de los ingredientes (una unidad de cada uno). */
export function mixProps(c: Content, ingredients: string[]): AlchemyProps {
  const out: AlchemyProps = {};
  for (const id of ingredients) {
    for (const [k, v] of Object.entries(c.materials[id]?.alchemy ?? {}) as [keyof AlchemyProps, number][]) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

/** La receta de mayor prioridad cuyos mínimos se cumplen (o null: brebaje turbio). */
export function matchRecipe(c: Content, props: AlchemyProps): PotionDef | null {
  const fits = Object.values(c.potions).filter((p) => ALCHEMY_PROPS.every((k) => (props[k] ?? 0) >= (p.requires[k] ?? 0)));
  const weight = (p: PotionDef) => Object.values(p.requires).reduce((a, v) => a + (v ?? 0), 0);
  return fits.sort((a, b) => b.priority - a.priority || weight(b) - weight(a))[0] ?? null;
}

export function potencyFor(def: PotionDef, props: AlchemyProps, heatBonus: number): number {
  const over = (props[def.main] ?? 0) - (def.requires[def.main] ?? 0);
  return Math.max(1, 1 + over + heatBonus);
}

export function failChance(s: GameState, heat: Heat): number {
  return Math.max(0, AL.heat[heat].fail - (skillLevel(s.skills.alquimia) - 1) * AL.failReductionPerLevel);
}

export function potionItem(s: GameState, def: PotionDef, potency: number, qty: number): ItemInstance {
  return {
    uid: nextUid(s, 'po'), blueprintId: def.id, name: potency > 1 ? `${def.name} (potencia ${potency})` : def.name,
    category: 'pocion', materials: {}, stats: { atk: 0, def: 0, spd: 0, wgt: 0, dur: 0 }, affinities: {},
    quality: Math.min(100, potency * 20), defects: 0, traits: [], synergies: [], finish: [], enchantments: [],
    rarity: potency >= 4 ? 'raro' : potency >= 2 ? 'poco común' : 'común', tags: ['pocion', 'consumible'], beauty: 0,
    durability: 1, maxDurability: 1, value: Math.round(def.value * (1 + 0.25 * (potency - 1))), quantity: qty,
    exhibited: false, createdDay: s.day, color: def.color, potion: { recipe: def.id, potency },
  };
}

/** Destilar en la mesa de alquimia: 2 o 3 ingredientes y un fuego. Consume una franja. */
export function brew(s: GameState, { c, rng }: Ctx, ingredients: string[], heat: Heat): GameEvent[] {
  if (s.location !== 'herreria' || s.expedition) throw new GameError('La mesa de alquimia está en tu herrería.');
  if (s.forge || s.shop) throw new GameError('Ahora no podés destilar.');
  if (ingredients.length < 2 || ingredients.length > 3) throw new GameError('Elegí entre 2 y 3 ingredientes.');
  const needs: Record<string, number> = {};
  for (const id of ingredients) {
    if (!c.materials[id]?.alchemy) throw new GameError(`${c.materials[id]?.name ?? id} no sirve para alquimia.`);
    needs[id] = (needs[id] ?? 0) + 1;
  }
  for (const [id, q] of Object.entries(needs)) if (!hasMaterial(s, id, q)) throw new GameError(`Te falta ${c.materials[id].name}.`);
  for (const [id, q] of Object.entries(needs)) addMaterial(s, id, -q);

  const props = mixProps(c, ingredients);
  const def = matchRecipe(c, props);
  const events: GameEvent[] = [];
  if (!def || rng.chance(failChance(s, heat))) {
    addXp(s, 'alquimia', 2);
    events.push({ type: 'toast', text: def ? '¡El fuego fue demasiado fuerte y se arruinó la tanda!' : 'Salió un brebaje turbio que no sirve para nada.', tone: 'bad' });
    return [...events, ...advanceTime(s, 1)];
  }
  const potency = potencyFor(def, props, AL.heat[heat].potency);
  const discovered = !s.discoveredPotions.includes(def.id);
  if (discovered) s.discoveredPotions.push(def.id);
  if (def.output.kind === 'material') {
    addMaterial(s, def.output.material, def.qty);
  } else {
    const same = s.items.find((i) => i.potion?.recipe === def.id && i.potion.potency === potency);
    if (same) same.quantity += def.qty;
    else s.items.push(potionItem(s, def, potency, def.qty));
  }
  addXp(s, 'alquimia', AL.xpPerBrew + potency);
  events.push({ type: 'brewed', recipe: def.id, name: def.name, qty: def.qty, discovered });
  events.push({ type: 'toast', text: `${discovered ? '¡Receta nueva! ' : ''}${def.name} ×${def.qty}${def.output.kind === 'pocion' ? ` (potencia ${potency})` : ''}.`, tone: 'good' });
  return [...events, ...advanceTime(s, 1)];
}

// ───────────────────────── Cinturón de pociones del grupo ─────────────────────────

export function beltTotal(s: GameState): number {
  return Object.values(s.belt).reduce((a, q) => a + q, 0);
}

/** Saca del cinturón las pociones que ya no existen. */
export function cleanBelt(s: GameState) {
  for (const [uid, q] of Object.entries(s.belt)) {
    const item = s.items.find((i) => i.uid === uid);
    if (!item) delete s.belt[uid];
    else s.belt[uid] = Math.min(q, item.quantity);
    if (s.belt[uid] === 0) delete s.belt[uid];
  }
}

export function setBelt(s: GameState, _ctx: Ctx, uid: string, qty: number): GameEvent[] {
  if (s.expedition?.combat) throw new GameError('No en pleno combate.');
  const item = s.items.find((i) => i.uid === uid && i.potion);
  if (!item) throw new GameError('Esa poción no existe.');
  qty = Math.max(0, Math.min(qty, item.quantity));
  const others = beltTotal(s) - (s.belt[uid] ?? 0);
  if (others + qty > AL.beltSize) throw new GameError(`El cinturón lleva hasta ${AL.beltSize} pociones.`);
  if (qty) s.belt[uid] = qty;
  else delete s.belt[uid];
  return [];
}

/** Gasta una poción del cinturón. */
export function consumePotion(s: GameState, uid: string): ItemInstance {
  const item = s.items.find((i) => i.uid === uid && i.potion);
  if (!item || !(s.belt[uid] > 0)) throw new GameError('Esa poción no está en el cinturón.');
  item.quantity -= 1;
  s.belt[uid] -= 1;
  if (item.quantity <= 0) s.items = s.items.filter((i) => i.uid !== uid);
  cleanBelt(s);
  return item;
}

/** Usar una poción de curación fuera del combate (durante la expedición). */
export function fieldPotion(s: GameState, { c }: Ctx, uid: string, charId: string): GameEvent[] {
  if (s.expedition?.combat) throw new GameError('En combate se usa desde las acciones.');
  const item = s.items.find((i) => i.uid === uid);
  const def = item?.potion ? c.potions[item.potion.recipe] : undefined;
  if (!item || !def || def.output.kind !== 'pocion' || def.output.effect.type !== 'curar') throw new GameError('Fuera del combate solo sirven las de curación.');
  const ch = s.characters[charId];
  if (!ch) throw new GameError('Personaje inexistente.');
  const pct = def.output.effect.pct * (1 + AL.healPerPotency * (item.potion!.potency - 1));
  // Fuera del combate se puede tomar de cualquier poción del inventario.
  item.quantity -= 1;
  if (item.quantity <= 0) s.items = s.items.filter((i) => i.uid !== uid);
  cleanBelt(s);
  const heal = Math.round(maxHp(ch) * pct);
  ch.hp = Math.min(maxHp(ch), ch.hp + heal);
  return [{ type: 'toast', text: `${ch.name} recupera ${heal} de vida.`, tone: 'good' }];
}
