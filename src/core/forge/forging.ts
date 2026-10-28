import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import type { Rng } from '../rng';
import { clamp } from '../state';
import type { ForgeSession, ItemCategory, Trait } from '../types';

const F = BALANCE.forge;

export interface HitOdds {
  /** Probabilidad de defecto del próximo golpe. */
  defect: number;
  perfect: number;
  /** Ganancia de calidad estimada (rango) del próximo golpe. */
  gain: [number, number];
  /** Tier de rasgo habilitado hoy (0 = ninguno). */
  traitTier: number;
  /** Chance de obtener rasgo si se frena ahora. */
  traitChance: number;
  /** Golpes que faltan para el próximo tier (null si ya está en el máximo). */
  hitsToNextTier: number | null;
  defectsLeft: number;
}

export function traitTierFor(hits: number): number {
  return F.traitTierHits.filter((h) => hits >= h).length;
}

export function traitChanceFor(hits: number, smithLevel: number): number {
  if (traitTierFor(hits) === 0) return 0;
  return clamp(F.traitChanceBase + F.traitChancePerHit * hits + F.traitChancePerLevel * (smithLevel - 1), 0, F.traitChanceMax);
}

export function defectChanceFor(session: Pick<ForgeSession, 'hits' | 'instability'>, smithLevel: number): number {
  const p = F.defectBase + F.defectPerHit * session.hits + session.instability - F.defectReductionPerLevel * (smithLevel - 1);
  return clamp(p, 0.01, F.defectMax);
}

function gainRange(quality: number): [number, number] {
  const factor = Math.max(0.2, 1 - quality / F.diminishingAt);
  return [F.qualityPerHit[0] * factor, F.qualityPerHit[1] * factor];
}

export function hitOdds(session: ForgeSession, smithLevel: number): HitOdds {
  const tier = traitTierFor(session.hits);
  const nextThreshold = F.traitTierHits.find((h) => h > session.hits);
  return {
    defect: defectChanceFor(session, smithLevel),
    perfect: F.perfectChance,
    gain: gainRange(session.quality),
    traitTier: tier,
    traitChance: traitChanceFor(session.hits, smithLevel),
    hitsToNextTier: nextThreshold === undefined ? null : nextThreshold - session.hits,
    defectsLeft: F.maxDefects - session.defects,
  };
}

/** Un golpe de martillo. Muta la sesión. Devuelve el resultado y si la pieza se arruinó. */
export function strike(session: ForgeSession, rng: Rng, smithLevel: number): { result: 'bueno' | 'perfecto' | 'defecto'; ruined: boolean } {
  const pDefect = defectChanceFor(session, smithLevel);
  session.hits += 1;
  if (rng.chance(pDefect)) {
    session.defects += 1;
    session.quality = Math.max(0, session.quality - F.defectQualityLoss);
    session.lastHit = 'defecto';
    return { result: 'defecto', ruined: session.defects >= F.maxDefects };
  }
  const [lo, hi] = gainRange(session.quality);
  let gain = rng.range(lo, hi);
  let result: 'bueno' | 'perfecto' = 'bueno';
  if (rng.chance(F.perfectChance)) {
    gain += F.perfectBonus;
    result = 'perfecto';
  }
  session.quality = Math.min(F.maxQuality, session.quality + gain);
  session.lastHit = result;
  return { result, ruined: false };
}

export function traitPool(c: Content, category: ItemCategory, maxTier: number, exclude: string[]): Trait[] {
  return Object.values(c.traits).filter(
    (t) => !t.synergyOnly && t.tier <= maxTier && t.categories.includes(category) && !exclude.includes(t.id),
  );
}

/** Al frenar: sortea los rasgos según los golpes dados. */
export function rollTraits(c: Content, session: ForgeSession, category: ItemCategory, rng: Rng, smithLevel: number, already: string[]): string[] {
  const tier = traitTierFor(session.hits);
  if (tier === 0) return [];
  const got: string[] = [];
  const pickOne = () => {
    const pool = traitPool(c, category, tier, [...already, ...got]);
    if (!pool.length) return;
    // Los rasgos del tier más alto habilitado salen más seguido.
    got.push(rng.weighted(pool.map((t) => [t.id, t.tier === tier ? 3 : 1] as const)));
  };
  if (rng.chance(traitChanceFor(session.hits, smithLevel))) pickOne();
  if (got.length && tier >= 3 && rng.chance(F.secondTraitChance)) pickOne();
  return got;
}
