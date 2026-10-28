import { BALANCE } from '../../config/balance';
import type { Content } from '../content';
import type { GameState } from '../types';
import { ATTRIBUTES, type Attributes, type Character, type MercenaryDef } from './types';

const CH = BALANCE.character;

export function attr(ch: Character, a: keyof Attributes): number {
  return Math.floor(ch.attributes[a]);
}

export function maxHp(ch: Character): number {
  return CH.baseHp + attr(ch, 'resistencia') * CH.hpPerResistencia + (ch.level - 1) * CH.hpPerLevel;
}

export function xpToNext(level: number): number {
  return CH.xpPerLevel * level;
}

export function createHerrero(): Character {
  const h = BALANCE.herrero;
  const ch: Character = {
    id: 'herrero', name: h.name, specialty: 'herrero', level: 1, xp: 0,
    attributes: { ...h.attributes }, equipment: {}, hp: 0, injuredUntilDay: 0, look: { ...h.look },
  };
  ch.hp = maxHp(ch);
  return ch;
}

export function createMercenary(def: MercenaryDef): Character {
  const ch: Character = {
    id: def.id, name: def.name, specialty: def.specialty, level: def.level, xp: 0,
    attributes: { ...def.attributes }, equipment: {}, hp: 0, injuredUntilDay: 0, look: { ...def.look },
    wage: def.wage, unpaidDays: 0,
  };
  ch.hp = maxHp(ch);
  return ch;
}

function growthOf(c: Content, ch: Character): Attributes {
  return ch.id === 'herrero' ? BALANCE.herrero.growth : (c.mercenaries[ch.id]?.growth ?? BALANCE.herrero.growth);
}

/** Suma experiencia y sube de nivel. Devuelve cuántos niveles ganó. */
export function gainXp(c: Content, ch: Character, xp: number): number {
  let ups = 0;
  ch.xp += Math.round(xp);
  while (ch.level < CH.maxLevel && ch.xp >= xpToNext(ch.level)) {
    ch.xp -= xpToNext(ch.level);
    const before = maxHp(ch);
    ch.level += 1;
    const g = growthOf(c, ch);
    for (const a of ATTRIBUTES) ch.attributes[a] += g[a];
    ch.hp += maxHp(ch) - before;
    ups++;
  }
  return ups;
}

export function isInjured(s: GameState, ch: Character): boolean {
  return ch.injuredUntilDay > s.day;
}

export function partyMembers(s: GameState): Character[] {
  return s.party.map((id) => s.characters[id]).filter(Boolean);
}
