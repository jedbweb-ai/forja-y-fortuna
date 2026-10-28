import type { Content } from '../content';
import { acquireGrimoire } from '../magic/grimoires';
import { addMaterial, changeRelation, changeReputation, currentCity } from '../state';
import { RARITIES, type GameEvent, type GameState, type ItemInstance } from '../types';
import type { CraftSpec, QuestReward } from './types';

// Piezas que piden encargos y contratos, y recompensas que dan.

const STAT_NAME: Record<string, string> = { atk: 'ataque', def: 'defensa', spd: 'velocidad', wgt: 'peso', dur: 'durabilidad' };

export function itemMeets(spec: CraftSpec, item: ItemInstance): boolean {
  if (item.equippedBy || item.quantity <= 0) return false;
  if (spec.category && item.category !== spec.category) return false;
  if (spec.blueprints && !spec.blueprints.includes(item.blueprintId)) return false;
  if (spec.minQuality && item.quality < spec.minQuality) return false;
  if (spec.minRarity && RARITIES.indexOf(item.rarity) < RARITIES.indexOf(spec.minRarity)) return false;
  if (spec.affinity && (item.affinities[spec.affinity] ?? 0) < (spec.minAffinity ?? 1)) return false;
  if (spec.stat && item.stats[spec.stat.key] < spec.stat.min) return false;
  if (spec.trait && !item.traits.includes(spec.trait)) return false;
  if (spec.tag && !item.tags.includes(spec.tag)) return false;
  return true;
}

/** Piezas que sirven, de la de menos valor a la de más (se entregan primero las más baratas). */
export function matchingItems(s: GameState, spec: CraftSpec): ItemInstance[] {
  return s.items.filter((i) => itemMeets(spec, i)).sort((a, b) => a.value - b.value);
}

export function unitsAvailable(s: GameState, spec: CraftSpec): number {
  return matchingItems(s, spec).reduce((a, i) => a + i.quantity, 0);
}

/** Saca `qty` unidades de las piezas que sirven. Devuelve lo entregado. */
export function takeUnits(s: GameState, spec: CraftSpec, qty: number): { name: string; qty: number }[] {
  const out: { name: string; qty: number }[] = [];
  let left = qty;
  for (const it of matchingItems(s, spec)) {
    if (left <= 0) break;
    const n = Math.min(left, it.quantity);
    it.quantity -= n;
    left -= n;
    out.push({ name: it.name, qty: n });
    if (it.quantity <= 0) {
      s.items = s.items.filter((i) => i.uid !== it.uid);
      delete s.belt[it.uid];
    }
  }
  return out;
}

/** Descripción corta de lo que se pide ("Espada larga · calidad 50+ · fuego 2+"). */
export function describeSpec(c: Content, spec: CraftSpec): string {
  const parts: string[] = [];
  if (spec.blueprints) parts.push(spec.blueprints.map((b) => c.blueprints[b]?.name ?? c.potions[b]?.name ?? b).join(' o '));
  else if (spec.category) parts.push(CATEGORY_NAME[spec.category] ?? spec.category);
  if (spec.minQuality) parts.push(`calidad ${spec.minQuality}+`);
  if (spec.minRarity) parts.push(`${spec.minRarity} o mejor`);
  if (spec.affinity) parts.push(`${spec.affinity} ${spec.minAffinity ?? 1}+`);
  if (spec.stat) parts.push(`${STAT_NAME[spec.stat.key]} ${spec.stat.min}+`);
  if (spec.trait) parts.push(`rasgo «${c.traits[spec.trait]?.name ?? spec.trait}»`);
  if (spec.tag) parts.push(`que sea ${spec.tag}`);
  return parts.join(' · ');
}

const CATEGORY_NAME: Record<string, string> = {
  arma: 'Arma', distancia: 'Arma a distancia', municion: 'Munición', arrojadizo: 'Arrojadizos', escudo: 'Escudo',
  armadura: 'Armadura', joyeria: 'Joya', herramienta: 'Herramienta', pocion: 'Poción', runa: 'Runa',
};

export function describeReward(c: Content, r: QuestReward): string {
  const parts: string[] = [];
  if (r.gold) parts.push(`🪙 ${r.gold}`);
  if (r.reputation) parts.push(`⭐ ${r.reputation > 0 ? '+' : ''}${r.reputation}`);
  if (r.relation) parts.push(`relación +${r.relation}`);
  r.materials?.forEach((m) => parts.push(`${m.qty}× ${c.materials[m.id]?.name ?? m.id}`));
  if (r.blueprint) parts.push(`plano: ${c.blueprints[r.blueprint]?.name}`);
  if (r.enchantment) parts.push(`encantamiento: ${c.enchantments[r.enchantment]?.name}`);
  if (r.potion) parts.push(`receta: ${c.potions[r.potion]?.name}`);
  if (r.grimoire) parts.push(`grimorio: ${c.grimoires[r.grimoire]?.name}`);
  if (r.synergy) parts.push('un secreto de forja');
  return parts.join(' · ');
}

export function applyReward(s: GameState, c: Content, r: QuestReward, giver?: string): GameEvent[] {
  const events: GameEvent[] = [];
  if (r.gold) {
    s.gold += r.gold;
    s.stats.goldEarned += r.gold;
  }
  if (r.reputation) changeReputation(s, currentCity(), r.reputation);
  if (r.relation && giver) changeRelation(s, giver, r.relation);
  r.materials?.forEach((m) => addMaterial(s, m.id, m.qty));
  if (r.blueprint && !s.knownBlueprints.includes(r.blueprint)) s.knownBlueprints.push(r.blueprint);
  if (r.enchantment && !s.knownEnchantments.includes(r.enchantment)) s.knownEnchantments.push(r.enchantment);
  if (r.potion && !s.discoveredPotions.includes(r.potion)) s.discoveredPotions.push(r.potion);
  if (r.synergy && !s.discoveredSynergies.includes(r.synergy)) {
    s.discoveredSynergies.push(r.synergy);
    events.push({ type: 'synergyDiscovered', id: r.synergy });
  }
  if (r.grimoire) events.push(...acquireGrimoire(s, c, r.grimoire));
  if (r.flag) s.flags[r.flag] = true;
  return events;
}

export function applyPenalty(s: GameState, p: { reputation?: number; relation?: number }, giver?: string) {
  if (p.reputation) changeReputation(s, currentCity(), -Math.abs(p.reputation));
  if (p.relation && giver) changeRelation(s, giver, -Math.abs(p.relation));
}
