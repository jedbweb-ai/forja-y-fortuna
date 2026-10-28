import { BALANCE } from '../../config/balance';
import type { UnitAbility } from '../combat/types';
import type { Content } from '../content';
import type { Affinities, Affinity, GameState, ItemInstance } from '../types';
import { attr, maxHp } from './progression';
import type { Character, DamageType, WeaponKind } from './types';

const CH = BALANCE.character;
const MG = BALANCE.magic;
const DAMAGE_TYPES: DamageType[] = ['cortante', 'contundente', 'perforante'];

/** Stats de combate de un personaje, calculados a partir de atributos y equipo. */
export interface CombatProfile {
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  move: number;
  jump: number;
  evasion: number;
  crit: number;
  weaponKind: WeaponKind;
  damageType: DamageType;
  affinities: Affinities;
  /** Multiplicador de daño elemental recibido (armadura, escudo y joyas con afinidad protegen de ese elemento). */
  elemental: Partial<Record<Affinity, number>>;
  combat: Record<string, number>;
  skills: string[];
  /** Habilidades activas del equipo (acción → usos, enfriamiento y potencia). */
  abilities: Record<string, UnitAbility>;
  /** Arrojadizo del cinturón y su daño. */
  throwUid?: string;
  throwAtk?: number;
  weapon?: ItemInstance;
  shield?: ItemInstance;
  armor?: ItemInstance;
  jewels: ItemInstance[];
  warnings: string[];
}

export function equippedItem(s: GameState, uid: string | undefined): ItemInstance | undefined {
  return uid ? s.items.find((i) => i.uid === uid) : undefined;
}

/** Requisitos de atributos: fuerza por peso; voluntad por encantamientos y por el poder de las gemas en joyas. */
export function itemRequirements(item: ItemInstance): { fuerza: number; voluntad: number } {
  const gemPower = item.category === 'joyeria' ? Object.values(item.affinities).reduce((a, v) => a + (v ?? 0), 0) : 0;
  return {
    fuerza: item.category === 'joyeria' ? 0 : Math.ceil(item.stats.wgt * CH.strengthPerWeight),
    voluntad: item.enchantments.length * CH.willPerEnchantment + Math.ceil(gemPower / 2),
  };
}

export function weaponKindOf(c: Content, item: ItemInstance | undefined): WeaponKind {
  if (!item) return 'punos';
  const bp = c.blueprints[item.blueprintId];
  if (bp?.weaponKind) return bp.weaponKind;
  if (item.category === 'distancia') return 'arco';
  if (item.category === 'herramienta') return 'herramienta';
  return 'punos';
}

export function damageTypeOf(item: ItemInstance | undefined, kind: WeaponKind): DamageType {
  if (kind === 'arco') return 'perforante';
  return DAMAGE_TYPES.find((t) => item?.tags.includes(t)) ?? 'contundente';
}

/** Suma los efectos de combate de rasgos y encantamientos de un objeto. */
export function itemCombatProps(c: Content, item: ItemInstance, into: Record<string, number>) {
  const sources = [...item.traits.map((t) => c.traits[t]?.combat), ...item.enchantments.map((e) => c.enchantments[e]?.combat)];
  for (const src of sources) {
    for (const [k, v] of Object.entries(src ?? {})) if (typeof v === 'number') into[k] = (into[k] ?? 0) + v;
  }
}

export function characterProfile(c: Content, s: GameState, ch: Character): CombatProfile {
  const weapon = equippedItem(s, ch.equipment.arma);
  const shield = equippedItem(s, ch.equipment.escudo);
  const armor = equippedItem(s, ch.equipment.cuerpo);
  const jewels = [ch.equipment.anillo1, ch.equipment.anillo2, ch.equipment.amuleto].map((u) => equippedItem(s, u)).filter((i): i is ItemInstance => !!i);
  const belt = equippedItem(s, ch.equipment.cinturon);
  const warnings: string[] = [];

  // Penalización por requisitos no cumplidos o por equipo roto.
  const mult = (item: ItemInstance | undefined) => {
    if (!item) return 1;
    let m = 1;
    const req = itemRequirements(item);
    if (attr(ch, 'fuerza') < req.fuerza) {
      warnings.push(`${item.name}: necesita fuerza ${req.fuerza}.`);
      m *= CH.unmetPenalty;
    }
    if (attr(ch, 'voluntad') < req.voluntad) {
      warnings.push(`${item.name}: necesita voluntad ${req.voluntad}.`);
      m *= CH.unmetPenalty;
    }
    if (item.durability <= 0) {
      warnings.push(`${item.name} está rota: repárala en la forja.`);
      m *= CH.brokenPenalty;
    }
    return m;
  };

  const kind = weaponKindOf(c, weapon);
  const fuerza = attr(ch, 'fuerza');
  const agilidad = attr(ch, 'agilidad');
  const resistencia = attr(ch, 'resistencia');
  const totalWgt = (weapon?.stats.wgt ?? 0) + (shield?.stats.wgt ?? 0) + (armor?.stats.wgt ?? 0);

  const atk = weapon
    ? weapon.stats.atk * mult(weapon) + (kind === 'arco' ? agilidad * CH.rangedPerAgilidad : fuerza * CH.meleePerFuerza)
    : fuerza * CH.unarmedPerFuerza;
  const jewelMult = jewels.map((j) => mult(j));
  const def = (armor ? armor.stats.def * CH.armorDefFactor * mult(armor) : 0)
    + (shield ? shield.stats.def * CH.shieldDefFactor * mult(shield) : 0)
    + jewels.reduce((a, j, i) => a + j.stats.def * CH.shieldDefFactor * jewelMult[i], 0)
    + resistencia * CH.defPerResistencia;
  const spd = CH.baseSpd + agilidad * CH.spdPerAgilidad + (weapon?.stats.spd ?? 0) * CH.weaponSpdFactor - totalWgt * CH.weightSpdPenalty;
  const move = Math.max(2, CH.baseMove + (agilidad >= 9 ? 1 : 0) - ((armor?.stats.wgt ?? 0) > CH.heavyArmorWeight ? 1 : 0));
  const jump = CH.baseJump + (agilidad >= 8 ? 1 : 0);

  const worn = [weapon, shield, armor, ...jewels].filter((i): i is ItemInstance => !!i);
  const combat: Record<string, number> = {};
  for (const item of worn) itemCombatProps(c, item, combat);

  const elemental: Partial<Record<Affinity, number>> = {};
  for (const item of [shield, armor, ...jewels]) {
    for (const [a, v] of Object.entries(item?.affinities ?? {}) as [Affinity, number][]) {
      elemental[a] = Math.max(0.4, (elemental[a] ?? 1) - v * 0.1);
    }
  }

  // Habilidades activas de todo el equipo. Las joyas del mismo elemento las potencian.
  const abilities: Record<string, UnitAbility> = {};
  for (const item of worn) {
    for (const ab of item.abilities ?? []) {
      const prev = abilities[ab.skill];
      abilities[ab.skill] = prev
        ? { uses: prev.uses + ab.uses, cooldown: Math.min(prev.cooldown, ab.cooldown), power: Math.max(prev.power, ab.power) }
        : { uses: ab.uses, cooldown: ab.cooldown, power: ab.power };
    }
  }
  for (const [skillId, ab] of Object.entries(abilities)) {
    const el = c.skills[skillId]?.element;
    const jewelPoints = el ? jewels.reduce((a, j) => a + (j.affinities[el] ?? 0), 0) : 0;
    ab.uses += combat.abilityUses ?? 0;
    ab.cooldown = Math.max(1, ab.cooldown - (combat.cooldownReduce ?? 0));
    ab.power = Math.round((ab.power + Math.min(MG.jewelPowerMax, jewelPoints * MG.jewelPowerPerPoint) + (combat.abilityPower ?? 0) / 100) * 100) / 100;
  }

  const throwSkill = belt ? c.blueprints[belt.blueprintId]?.throwSkill : undefined;
  const skills = [
    ...(c.weaponSkills[kind] ?? []),
    ...(shield ? c.weaponSkills.escudo : []),
    ...Object.keys(abilities),
    ...(throwSkill && belt && belt.quantity > 0 ? [throwSkill] : []),
  ];

  return {
    maxHp: maxHp(ch),
    atk: Math.round(atk * 10) / 10,
    def: Math.round(def * 10) / 10,
    spd: Math.round(spd * 10) / 10,
    move,
    jump,
    evasion: agilidad * CH.evasionPerAgilidad,
    crit: CH.baseCrit + agilidad * CH.critPerAgilidad + (combat.critPct ?? 0) / 100,
    weaponKind: kind,
    damageType: damageTypeOf(weapon, kind),
    affinities: { ...(weapon?.affinities ?? {}) },
    elemental,
    combat,
    skills: [...new Set(skills)],
    abilities,
    throwUid: belt && belt.quantity > 0 ? belt.uid : undefined,
    throwAtk: belt ? Math.round((belt.stats.atk + agilidad * CH.rangedPerAgilidad) * 10) / 10 : undefined,
    weapon,
    shield,
    armor,
    jewels,
    warnings,
  };
}
