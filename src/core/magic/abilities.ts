import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import { RARITIES, type Affinities, type Rarity } from '../types';
import type { ItemAbility } from './types';

const MG = BALANCE.magic;

/**
 * Habilidades activas que gana un objeto al encantarlo. No son fijas: dependen de
 * - la rareza del objeto (más usos por combate),
 * - su calidad (recarga más rápido),
 * - la calidad de la runa con que se grabó (más potencia, a veces un uso extra),
 * - si su afinidad coincide con el elemento de la habilidad (más potencia),
 * - rasgos del objeto como "Inagotable" o "Canalizadora".
 */
export function computeAbilities(
  c: Content,
  enchantments: string[],
  item: { rarity: Rarity; quality: number; affinities: Affinities; traits: string[] },
  runeQuality: Record<string, number> = {},
): ItemAbility[] {
  const rarityIdx = RARITIES.indexOf(item.rarity);
  const traitProps: Record<string, number> = {};
  for (const t of item.traits) {
    for (const [k, v] of Object.entries(c.traits[t]?.combat ?? {})) if (typeof v === 'number') traitProps[k] = (traitProps[k] ?? 0) + v;
  }
  const out: ItemAbility[] = [];
  for (const id of enchantments) {
    const e = c.enchantments[id];
    if (!e?.ability) continue;
    const skill = c.skills[e.ability.skill];
    let uses = e.ability.uses + MG.usesByRarity[rarityIdx] + (traitProps.abilityUses ?? 0);
    let cooldown = e.ability.cooldown - (item.quality >= MG.fastCooldownQuality ? 1 : 0);
    let power = 1;
    const rq = runeQuality[id];
    if (e.source === 'runa' && rq !== undefined) {
      power = MG.runePowerBase + rq * MG.runePowerPerQuality;
      if (rq >= MG.runeExtraUseQuality) uses += 1;
    }
    if (skill?.element && (item.affinities[skill.element] ?? 0) >= 2) power += MG.affinityPowerBonus;
    power += (traitProps.abilityPower ?? 0) / 100;
    cooldown = Math.max(1, cooldown);
    out.push({ skill: e.ability.skill, source: id, uses: Math.max(1, uses), cooldown, power: Math.round(power * 100) / 100 });
  }
  return out;
}
