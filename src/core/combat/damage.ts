import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import { itemCombatProps } from '../party/stats';
import type { Affinities, Affinity, GameState } from '../types';
import { arenaOf, attackSide, hasStatus, heightAt, terrainAt, type Pt } from './grid';
import { isWet, terrainFxAt } from './terrain';
import type { CombatSkill, CombatState, CombatUnit } from './types';

const CB = BALANCE.combat;
const TR = BALANCE.terrain;

export interface AttackCalc {
  hit: number;
  min: number;
  max: number;
  crit: number;
  side: 'front' | 'side' | 'back';
  element?: Affinity;
}

/** Aporte del lote de flechas actual (daño, afinidades y rasgos de la munición). */
export function ammoBonus(c: Content, s: GameState, u: CombatUnit) {
  const lot = u.ammoUid ? s.items.find((i) => i.uid === u.ammoUid && i.quantity > 0) : undefined;
  const combat: Record<string, number> = {};
  if (lot) itemCombatProps(c, lot, combat);
  return { atk: lot ? lot.stats.atk * CB.arrowAtkFactor : 0, affinities: lot?.affinities ?? {}, combat, available: !!lot };
}

/** Elemento dominante: el de la acción, o la afinidad más alta del arma (o del arrojadizo). */
export function dominantElement(skill: CombatSkill, affinities: Affinities, combat: Record<string, number>): Affinity | undefined {
  if (skill.element) return skill.element;
  if (combat.fireDamage) return 'fuego';
  const entries = Object.entries(affinities).filter(([, v]) => (v ?? 0) > 0) as [Affinity, number][];
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0];
}

/**
 * De dónde sale el golpe: arma (con flechas si corresponde) o arrojadizo del cinturón.
 * Incluye la potencia de la habilidad activa si la acción es una.
 */
export function attackProps(c: Content, s: GameState, u: CombatUnit, skill: CombatSkill) {
  if (skill.throw) {
    const lot = u.throwUid ? s.items.find((i) => i.uid === u.throwUid) : undefined;
    const combat: Record<string, number> = {};
    if (lot) itemCombatProps(c, lot, combat);
    return { combat, affinities: { ...(lot?.affinities ?? {}) } as Affinities, baseAtk: u.throwAtk ?? 0, extraAtk: 0, power: 1 };
  }
  const shot = skill.ammo ? ammoBonus(c, s, u) : null;
  const combat = { ...u.combat };
  if (shot) for (const [k, v] of Object.entries(shot.combat)) combat[k] = (combat[k] ?? 0) + v;
  const affinities: Affinities = { ...u.affinities };
  if (shot) for (const [k, v] of Object.entries(shot.affinities) as [Affinity, number][]) affinities[k] = (affinities[k] ?? 0) + v;
  return { combat, affinities, baseAtk: u.atk, extraAtk: shot ? shot.atk : 0, power: u.abilities[skill.id]?.power ?? 1 };
}

/** Calcula probabilidad de acierto y rango de daño sin tirar dados (sirve para la vista previa y la IA). */
export function calcAttack(c: Content, s: GameState, cs: CombatState, u: CombatUnit, t: CombatUnit, skill: CombatSkill, from: Pt = u): AttackCalc {
  const a = arenaOf(c, cs);
  const { combat, affinities, baseAtk, extraAtk, power } = attackProps(c, s, u, skill);
  const side = attackSide(t, from);
  const ranged = !!skill.ammo || !!skill.throw || skill.range[1] > 1;
  const element = dominantElement(skill, affinities, combat);

  let atk = (baseAtk + extraAtk) * (hasStatus(u, 'potenciado') ? 1.25 : 1);
  atk *= skill.power * power;
  if (side !== 'front' && skill.flankPower) atk *= skill.flankPower;

  const dh = heightAt(a, from.x, from.y) - heightAt(a, t.x, t.y);
  const heightMod = Math.min(CB.heightDamageMax, Math.max(CB.heightDamageMin, dh * CB.heightDamagePerLevel));
  const flankMod = side === 'back' ? CB.backBonus : side === 'side' ? CB.sideBonus : 0;
  const dtype = skill.damageType ?? u.damageType;
  let dmg = atk * (1 + heightMod + flankMod) * (t.resist[dtype] ?? 1);
  if (dtype === 'contundente' && t.combat.bluntResistPct) dmg *= 1 - t.combat.bluntResistPct / 100;

  // Daño elemental: cada punto de afinidad suma, multiplicado por la debilidad del objetivo.
  for (const [el, v] of Object.entries(affinities) as [Affinity, number][]) dmg += (v ?? 0) * CB.elementPerPoint * (t.elemental[el] ?? 1);
  if (combat.fireDamage) dmg += combat.fireDamage * (t.elemental.fuego ?? 1);
  if (skill.element && !affinities[skill.element]) dmg *= t.elemental[skill.element] ?? 1;
  if (combat.shockPct && hasStatus(t, 'mojado')) dmg *= 1 + combat.shockPct / 100;
  // El rayo castiga a los mojados y a los que están parados en agua.
  if (element === 'rayo' && (hasStatus(t, 'mojado') || isWet(c, cs, t))) dmg *= TR.wetShock;
  // Congelado sobre hielo: los golpes contundentes lo quiebran.
  if (dtype === 'contundente' && terrainFxAt(cs, t) === 'hielo' && hasStatus(t, 'inmovilizado')) dmg *= 1.25;
  if (element && t.statuses.some((st) => st.id === 'resguardo' && st.element === element && st.turns > 0)) dmg *= 0.5;

  const def = t.def * (hasStatus(t, 'corroido') ? 0.7 : 1) * (1 - (combat.armorPiercePct ?? 0) / 100);
  dmg -= def * CB.defFactor;
  dmg -= t.combat.flatReduction ?? 0;
  if (hasStatus(t, 'cubierto')) dmg *= CB.coverMult;
  if (hasStatus(t, 'protegido')) dmg *= 0.7;
  dmg = Math.max(1, dmg);

  const grass = terrainAt(a, t.x, t.y) === ',' && !cs.burnt.includes(`${t.x},${t.y}`);
  const evasion = t.evasion + (t.combat.evasionPct ?? 0) / 100 + (ranged && grass ? CB.tallGrassEvasion : 0)
    - (terrainFxAt(cs, t) === 'hielo' ? 0.1 : 0);
  const hitBonus = side === 'back' ? CB.backHit : side === 'side' ? CB.sideHit : 0;
  // Las áreas casi no fallan.
  const areaBonus = skill.area && skill.area !== 'single' ? 0.1 : 0;
  const hit = Math.min(CB.maxHit, Math.max(CB.minHit, CB.baseHit + hitBonus + areaBonus - evasion));
  const crit = Math.min(0.9, u.crit + (skill.critBonus ?? 0) + (combat.critPct ?? 0) / 100 + (side === 'back' ? 0.1 : 0));

  return {
    hit,
    min: Math.max(1, Math.round(dmg * CB.variance[0])),
    max: Math.max(1, Math.round(dmg * CB.variance[1])),
    crit,
    side,
    element,
  };
}

/** Daño esperado (para que la IA compare opciones). */
export function expectedDamage(calc: AttackCalc): number {
  const avg = (calc.min + calc.max) / 2;
  return calc.hit * avg * (1 + calc.crit * (CB.critMult - 1));
}
