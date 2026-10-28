import { GameError, type Content, type Ctx } from '../content';
import type { GameEvent, GameState, ItemCategory, ItemInstance } from '../types';
import type { EquipSlot } from './types';

export function slotFor(category: ItemCategory): EquipSlot | null {
  switch (category) {
    case 'arma':
    case 'distancia':
    case 'herramienta':
      return 'arma';
    case 'escudo':
      return 'escudo';
    case 'armadura':
      return 'cuerpo';
    default:
      return null;
  }
}

function character(s: GameState, id: string) {
  const ch = s.characters[id];
  if (!ch || !s.party.includes(id)) throw new GameError('Ese personaje no está en tu grupo.');
  return ch;
}

function setSlot(s: GameState, charId: string, slot: EquipSlot, uid: string | undefined) {
  const ch = s.characters[charId];
  const prev = ch.equipment[slot];
  if (prev) {
    const old = s.items.find((i) => i.uid === prev);
    if (old) old.equippedBy = undefined;
  }
  if (uid) ch.equipment[slot] = uid;
  else delete ch.equipment[slot];
}

export function isTwoHanded(c: Content, item: ItemInstance | undefined): boolean {
  return !!item && !!c.blueprints[item.blueprintId]?.twoHanded;
}

export function equipItem(s: GameState, { c }: Ctx, charId: string, uid: string): GameEvent[] {
  if (s.expedition?.combat) throw new GameError('No podés cambiar el equipo en pleno combate.');
  const ch = character(s, charId);
  const item = s.items.find((i) => i.uid === uid);
  if (!item) throw new GameError('Ese objeto no existe.');
  const slot = slotFor(item.category);
  if (!slot || item.quantity !== 1) throw new GameError('Ese objeto no se puede equipar.');

  if (slot === 'escudo' && isTwoHanded(c, s.items.find((i) => i.uid === ch.equipment.arma))) {
    throw new GameError('El arma que tiene ocupa las dos manos.');
  }
  // Si otro personaje lo tenía, se lo saca.
  if (item.equippedBy && item.equippedBy !== charId) {
    const other = s.characters[item.equippedBy];
    if (other) for (const k of Object.keys(other.equipment) as EquipSlot[]) if (other.equipment[k] === uid) delete other.equipment[k];
  }
  setSlot(s, charId, slot, uid);
  item.equippedBy = charId;
  item.exhibited = false;
  if (isTwoHanded(c, item) && ch.equipment.escudo) setSlot(s, charId, 'escudo', undefined);
  return [];
}

export function unequipItem(s: GameState, _ctx: Ctx, charId: string, slot: EquipSlot): GameEvent[] {
  if (s.expedition?.combat) throw new GameError('No podés cambiar el equipo en pleno combate.');
  character(s, charId);
  setSlot(s, charId, slot, undefined);
  return [];
}

/** Saca todo el equipo de un personaje (al despedirlo o cuando se va). */
export function unequipAll(s: GameState, charId: string) {
  const ch = s.characters[charId];
  if (!ch) return;
  for (const slot of Object.keys(ch.equipment) as EquipSlot[]) setSlot(s, charId, slot, undefined);
}
