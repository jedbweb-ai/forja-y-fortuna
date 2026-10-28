import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import { computeAbilities } from '../magic/abilities';
import { RARITIES, STAT_KEYS, type Affinities, type Effect, type ForgeSession, type ItemInstance, type Rarity } from '../types';
import { addAffinities, applyStatPct, computeDesign, sumStatPct, type DesignPreview } from './design';

const R = BALANCE.rarity;
const V = BALANCE.value;
const F = BALANCE.forge;

export interface ItemBuild extends Omit<ItemInstance, 'uid' | 'exhibited' | 'createdDay'> {
  rarityScore: number;
  design: DesignPreview;
}

export function rarityFromScore(score: number): Rarity {
  let idx = 0;
  R.thresholds.forEach((t, i) => { if (score >= t) idx = i; });
  return RARITIES[idx];
}

export function rarityIndex(r: Rarity): number {
  return RARITIES.indexOf(r);
}

export function enchantSlotsFor(r: Rarity): number {
  return R.enchantSlots[rarityIndex(r)];
}

export function qualityLabel(q: number): string {
  if (q >= 90) return 'Magistral';
  if (q >= 70) return 'Excelente';
  if (q >= 50) return 'Buena';
  if (q >= 30) return 'Correcta';
  return 'Tosca';
}

/** Construye el objeto resultante de una sesión de forja (sirve también de vista previa). */
export function buildItem(c: Content, session: ForgeSession, enchantments: string[] = [], runeQuality: Record<string, number> = {}): ItemBuild {
  const design = computeDesign(c, session.blueprintId, session.materials);
  const bp = design.blueprint;
  const stats = { ...design.stats };

  const finishes = session.finish.map((id) => c.finishes[id]).filter(Boolean);
  const quality = Math.min(F.maxQuality, session.quality + finishes.reduce((a, f) => a + (f.quality ?? 0), 0));

  // Calidad y defectos afectan ataque, defensa y durabilidad.
  const qMult = F.qualityStatMin + (F.qualityStatMax - F.qualityStatMin) * (quality / 100);
  const dMult = Math.max(0.2, 1 - (session.defects * F.defectStatPct) / 100);
  for (const k of ['atk', 'def', 'dur'] as const) stats[k] *= qMult * dMult;

  const quench = session.quench ? c.quench[session.quench] : undefined;
  const enchDefs = enchantments.map((e) => c.enchantments[e]).filter(Boolean);
  // Los rasgos salen de sinergias, del temple (líquidos especiales) y del forjado.
  const grantedTraits = [...design.synergies.map((s) => s.effect.trait), quench?.effect.trait]
    .filter((t): t is string => !!t && !!c.traits[t]?.categories.includes(bp.category));
  const allTraits = [...new Set([...grantedTraits, ...session.traits])];
  const traitDefs = allTraits.map((t) => c.traits[t]).filter(Boolean);

  const effects: (Effect | undefined)[] = [
    ...traitDefs.map((t) => t.effect), quench?.effect, ...finishes.map((f) => f.effect), ...enchDefs.map((e) => e.effect),
  ];
  applyStatPct(stats, sumStatPct(effects));
  for (const k of STAT_KEYS) stats[k] = Math.max(0, Math.round(stats[k] * 10) / 10);

  const affinities: Affinities = { ...design.affinities };
  for (const e of effects) addAffinities(affinities, e?.affinity);

  const tags = new Set(design.tags);
  for (const e of effects) (e?.addTags ?? []).forEach((t) => tags.add(t));

  const beauty = finishes.reduce((a, f) => a + (f.beauty ?? 0), 0) + (tags.has('noble') ? 1 : 0);

  // ── Rareza ──
  const materialScore = bp.parts.reduce((a, p) => a + p.weight * (c.materials[session.materials[p.slot]]?.tier ?? 1), 0) * R.materialTierWeight;
  const synergyScore = design.synergies.reduce((a, s) => a + (s.secret ? R.secretSynergy : R.synergy), 0);
  const rarityScore = materialScore + synergyScore + quality * R.qualityWeight
    + traitDefs.reduce((a, t) => a + t.tier * R.traitPerTier, 0)
    + enchDefs.length * R.enchantment + session.defects * R.defect;
  const rarity = rarityFromScore(rarityScore);

  // ── Valor ──
  let value = (design.materialCost * V.materialMult + bp.slots * V.laborPerSlot) * (V.qualityBase + quality / 100);
  const valuePct = [
    ...design.synergies.map((s) => s.effect.valuePct ?? 0),
    ...effects.map((e) => e?.valuePct ?? 0),
    ...traitDefs.map((t) => V.traitTierPct[t.tier]),
    enchDefs.length * V.enchantmentPct,
    beauty * V.beautyPct,
    session.defects * V.defectPct,
  ].reduce((a, b) => a + b, 0);
  value *= (1 + valuePct / 100) * V.rarityMult[rarityIndex(rarity)];
  const quantity = bp.batch ?? 1;
  value = Math.max(1, Math.round((value / quantity) * 10) / 10);

  return {
    blueprintId: bp.id,
    name: itemName(c, design, rarity),
    category: bp.category,
    materials: { ...session.materials },
    stats,
    affinities,
    quality: Math.round(quality),
    defects: session.defects,
    traits: allTraits,
    synergies: design.synergies.map((s) => s.id),
    quench: session.quench,
    finish: [...session.finish],
    enchantments: [...enchantments],
    rarity,
    tags: [...tags],
    beauty,
    durability: Math.round(stats.dur),
    maxDurability: Math.round(stats.dur),
    value,
    quantity,
    color: design.color,
    abilities: computeAbilities(c, enchantments, { rarity, quality: Math.round(quality), affinities, traits: allTraits }, runeQuality),
    rarityScore,
    design,
  };
}

function itemName(c: Content, design: DesignPreview, rarity: Rarity): string {
  const bp = design.blueprint;
  const main = c.materials[design.materials[bp.parts[0].slot]];
  const base = `${bp.name} de ${main ? main.name.toLowerCase() : '???'}`;
  if (rarityIndex(rarity) < 2) return base;
  // Desde raro, el objeto gana un epíteto por su sinergia más llamativa.
  const epithet = [...design.synergies].sort((a, b) => Number(b.secret) - Number(a.secret))[0];
  return epithet ? `${base} «${epithet.name}»` : base;
}
