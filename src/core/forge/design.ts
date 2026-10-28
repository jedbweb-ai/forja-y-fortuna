import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import {
  AFFINITIES, STAT_KEYS,
  type Affinities, type Affinity, type Blueprint, type BlueprintPart, type Effect, type Material, type PartialStats,
  type Stats, type Synergy, type SynergyCondition,
} from '../types';

export const OPPOSED_AFFINITIES: [Affinity, Affinity][] = [
  ['fuego', 'hielo'],
  ['fuego', 'agua'],
  ['sagrado', 'oscuro'],
  ['tierra', 'viento'],
];

export interface DesignPreview {
  blueprint: Blueprint;
  materials: Record<string, string>;
  complete: boolean;
  stats: Stats;
  affinities: Affinities;
  synergies: Synergy[];
  instability: number;
  needs: Record<string, number>;
  materialCost: number;
  tags: string[];
  color: string;
}

export function emptyStats(): Stats {
  return { atk: 0, def: 0, spd: 0, wgt: 0, dur: 0 };
}

export function isAllowed(c: Content, part: BlueprintPart, materialId: string): boolean {
  const m = c.materials[materialId];
  if (!m) return false;
  return part.types.includes(m.type) || (part.extra?.includes(materialId) ?? false);
}

export function allowedMaterials(c: Content, part: BlueprintPart): Material[] {
  return Object.values(c.materials).filter((m) => isAllowed(c, part, m.id));
}

/** Materiales y cantidades que consume un diseño. */
export function materialNeeds(bp: Blueprint, materials: Record<string, string>): Record<string, number> {
  const needs: Record<string, number> = {};
  for (const part of bp.parts) {
    const id = materials[part.slot];
    if (id) needs[id] = (needs[id] ?? 0) + part.qty;
  }
  return needs;
}

function partMaterials(c: Content, bp: Blueprint, materials: Record<string, string>) {
  return bp.parts
    .map((part) => ({ part, mat: c.materials[materials[part.slot]] }))
    .filter((x): x is { part: BlueprintPart; mat: Material } => !!x.mat);
}

export function checkCondition(c: Content, bp: Blueprint, materials: Record<string, string>, cond: SynergyCondition): boolean {
  const parts = partMaterials(c, bp, materials);
  const ids = new Set(parts.map((p) => p.mat.id));
  switch (cond.kind) {
    case 'materials': return cond.all.every((m) => ids.has(m));
    case 'anyMaterial': return cond.any.some((m) => ids.has(m));
    case 'materialInSlot': {
      const id = materials[cond.slot];
      return !!id && [cond.material].flat().includes(id);
    }
    case 'tags': {
      const tags = new Set(parts.flatMap((p) => p.mat.tags ?? []));
      return cond.all.every((t) => tags.has(t));
    }
    case 'sameAffinity': return resonantAffinities(parts.map((p) => p.mat), cond.minParts).length > 0;
    case 'opposedAffinities': {
      const present = new Set(parts.flatMap((p) => Object.keys(p.mat.affinities ?? {})));
      return OPPOSED_AFFINITIES.some(([a, b]) => present.has(a) && present.has(b));
    }
    case 'category': return cond.in.includes(bp.category);
    case 'blueprint': return cond.in.includes(bp.id);
    case 'pureMetal': {
      const metals = parts.filter((p) => p.mat.type === 'metal');
      return metals.length >= cond.minParts && new Set(metals.map((p) => p.mat.id)).size === 1;
    }
  }
}

/** Afinidades presentes en al menos `minMaterials` materiales distintos. */
export function resonantAffinities(mats: Material[], minMaterials: number): Affinity[] {
  const unique = [...new Map(mats.map((m) => [m.id, m])).values()];
  return AFFINITIES.filter((a) => unique.filter((m) => (m.affinities?.[a] ?? 0) > 0).length >= minMaterials);
}

export function activeSynergies(c: Content, bp: Blueprint, materials: Record<string, string>): Synergy[] {
  return Object.values(c.synergies).filter((s) => s.when.every((w) => checkCondition(c, bp, materials, w)));
}

export function addAffinities(target: Affinities, add: Affinities | undefined, mult = 1) {
  if (!add) return;
  for (const [k, v] of Object.entries(add) as [Affinity, number][]) {
    target[k] = (target[k] ?? 0) + v * mult;
    if (!target[k]) delete target[k];
  }
}

export function sumStatPct(effects: (Effect | undefined)[]): PartialStats {
  const out: PartialStats = {};
  for (const e of effects) {
    for (const [k, v] of Object.entries(e?.statPct ?? {}) as [keyof Stats, number][]) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export function applyStatPct(stats: Stats, pct: PartialStats) {
  for (const k of STAT_KEYS) if (pct[k]) stats[k] *= 1 + (pct[k] as number) / 100;
}

export function computeDesign(c: Content, blueprintId: string, materials: Record<string, string>): DesignPreview {
  const bp = c.blueprints[blueprintId];
  if (!bp) throw new Error(`Plano inexistente: ${blueprintId}`);
  const parts = partMaterials(c, bp, materials);
  const complete = bp.parts.every((p) => materials[p.slot] && isAllowed(c, p, materials[p.slot]));

  const stats = emptyStats();
  for (const k of STAT_KEYS) {
    const raw = parts.reduce((acc, { part, mat }) => acc + part.weight * (mat.stats[k] ?? 0), 0);
    stats[k] = (bp.base[k] ?? 0) + (bp.scale[k] ?? 0) * raw;
  }
  stats.spd -= stats.wgt * BALANCE.forge.weightSpeedPenalty;

  const affinities: Affinities = {};
  for (const { mat } of parts) addAffinities(affinities, mat.affinities);

  const synergies = complete ? activeSynergies(c, bp, materials) : [];
  applyStatPct(stats, sumStatPct(synergies.map((s) => s.effect)));
  let instability = 0;
  for (const s of synergies) {
    addAffinities(affinities, s.effect.affinity);
    instability += s.effect.instability ?? 0;
    if (s.dynamicAffinity) {
      for (const a of resonantAffinities(parts.map((p) => p.mat), 2)) affinities[a] = (affinities[a] ?? 0) + 2;
    }
  }
  for (const k of STAT_KEYS) stats[k] = Math.max(0, stats[k]);

  const tags = new Set(bp.tags);
  for (const { mat } of parts) (mat.tags ?? []).forEach((t) => tags.add(t));
  for (const s of synergies) (s.effect.addTags ?? []).forEach((t) => tags.add(t));

  const needs = materialNeeds(bp, materials);
  const materialCost = Object.entries(needs).reduce((acc, [id, q]) => acc + (c.materials[id]?.price ?? 0) * q, 0);
  const main = parts[0]?.mat;

  return {
    blueprint: bp, materials: { ...materials }, complete, stats, affinities, synergies, instability,
    needs, materialCost, tags: [...tags], color: main?.color ?? '#888888',
  };
}

/** ¿El temple aplica? Solo si el plano lo permite y hay alguna parte de metal. */
export function quenchApplies(c: Content, bp: Blueprint, materials: Record<string, string>): boolean {
  return bp.quench && bp.parts.some((p) => c.materials[materials[p.slot]]?.type === 'metal');
}
