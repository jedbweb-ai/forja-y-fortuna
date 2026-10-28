import { BALANCE } from '../config/balance';
import { npcsAt } from './city';
import { GameError, type Content, type Ctx } from './content';
import { acquireGrimoire } from './magic/grimoires';
import { addMaterial, changeRelation, changeReputation, currentCity, hasMaterial } from './state';
import { startQuest } from './town/quests';
import { slotName } from './time';
import type { Condition, Dialogue, DialogueEffect, DialogueNode, DialogueOption, GameEvent, GameState } from './types';

export function checkCondition(s: GameState, cond: Condition): boolean {
  switch (cond.type) {
    case 'gold': return s.gold >= cond.min;
    case 'flag': {
      const v = s.flags[cond.flag];
      const ok = cond.equals === undefined ? !!v : v === cond.equals;
      return cond.not ? !ok : ok;
    }
    case 'relationMin': return (s.npcs[cond.npc]?.relation ?? 0) >= cond.value;
    case 'relationMax': return (s.npcs[cond.npc]?.relation ?? 0) <= cond.value;
    case 'slot': return cond.in.includes(slotName(s));
    case 'hasMaterial': return hasMaterial(s, cond.id, cond.qty);
    case 'discovered': {
      const known = s.discoveredSynergies.includes(cond.synergy);
      return cond.not ? !known : known;
    }
    case 'dayMin': return s.day >= cond.value;
    case 'itemsForgedMin': return s.stats.itemsForged >= cond.value;
    case 'reputationMin': return (s.reputation[currentCity()] ?? 0) >= cond.value;
    case 'questDone': {
      const done = s.quests.done.includes(cond.id);
      return cond.not ? !done : done;
    }
    case 'questActive': {
      const active = s.quests.active.some((a) => a.id === cond.id);
      return cond.not ? !active : active;
    }
    case 'inParty': {
      const inParty = s.party.includes(cond.npc);
      return cond.not ? !inParty : inParty;
    }
    case 'servant': {
      const ch = s.characters[cond.npc];
      return !!ch && !ch.escaped && ch.bond === (cond.freed ? 'liberado' : 'esclavo');
    }
  }
}

export function checkAll(s: GameState, conds: Condition[] | undefined): boolean {
  return (conds ?? []).every((k) => checkCondition(s, k));
}

export function applyEffect(s: GameState, c: Content, e: DialogueEffect): GameEvent[] {
  switch (e.type) {
    case 'relation': changeRelation(s, e.npc, e.delta); return [];
    case 'gold': s.gold = Math.max(0, s.gold + e.delta); return [];
    case 'flag': s.flags[e.flag] = e.value; return [];
    case 'giveMaterial':
      addMaterial(s, e.id, e.qty);
      return [{ type: 'toast', text: `Recibiste ${e.qty}× ${c.materials[e.id].name}.`, tone: 'good' }];
    case 'takeMaterial': addMaterial(s, e.id, -e.qty); return [];
    case 'reputation': changeReputation(s, currentCity(), e.delta); return [];
    case 'discoverSynergy':
      if (s.discoveredSynergies.includes(e.id)) return [];
      s.discoveredSynergies.push(e.id);
      return [
        { type: 'synergyDiscovered', id: e.id },
        { type: 'toast', text: `Libro del herrero: anotaste «${c.synergies[e.id].name}».`, tone: 'good' },
      ];
    case 'giveGrimoire':
      return acquireGrimoire(s, c, e.id);
    case 'discoverPotion':
      if (s.discoveredPotions.includes(e.id)) return [];
      s.discoveredPotions.push(e.id);
      return [{ type: 'toast', text: `Receta nueva: ${c.potions[e.id].name}.`, tone: 'good' }];
    case 'offerQuest':
      return startQuest(s, c, e.id);
    case 'giveBlueprint':
      if (s.knownBlueprints.includes(e.id)) return [];
      s.knownBlueprints.push(e.id);
      return [{ type: 'toast', text: `Plano nuevo: ${c.blueprints[e.id].name}.`, tone: 'good' }];
    case 'giveEnchantment':
      if (s.knownEnchantments.includes(e.id)) return [];
      s.knownEnchantments.push(e.id);
      return [{ type: 'toast', text: `Encantamiento nuevo: ${c.enchantments[e.id].name}.`, tone: 'good' }];
  }
}

function applyEffects(s: GameState, c: Content, effects: DialogueEffect[] | undefined): GameEvent[] {
  return (effects ?? []).flatMap((e) => applyEffect(s, c, e));
}

/** Diálogo que corresponde ahora con un NPC, o null si ya se habló hoy. */
export function pickDialogue(c: Content, s: GameState, npcId: string): Dialogue | null {
  const st = s.npcs[npcId];
  if (st && st.lastTalkDay === s.day) return null;
  const seen = st?.seenDialogues ?? [];
  const candidates = Object.values(c.dialogues)
    .filter((d) => d.npc === npcId && !(d.once && seen.includes(d.id)) && checkAll(s, d.conditions))
    .sort((a, b) => b.priority - a.priority);
  return candidates[0] ?? null;
}

export function visibleOptions(s: GameState, node: DialogueNode): { option: DialogueOption; index: number; enabled: boolean }[] {
  return (node.options ?? []).map((option, index) => ({ option, index, enabled: checkAll(s, option.conditions) }));
}

export interface TalkResult {
  dialogueId: string | null;
  nodeId: string | null;
  busyLine?: string;
}

/** Empieza una conversación. Respeta la presencia del NPC y el límite diario. */
export function startTalk(s: GameState, { c, rng }: Ctx, npcId: string, out: { result?: TalkResult }): GameEvent[] {
  const npc = c.npcs[npcId];
  if (!npc) throw new GameError('Esa persona no existe.');
  // Los compañeros del grupo charlan en cualquier lado de la ciudad.
  const present = npcsAt(c, s, s.location).includes(npcId) || (s.party.includes(npcId) && !s.expedition);
  if (!present) throw new GameError(`${npc.name} no está acá ahora.`);
  const dialogue = pickDialogue(c, s, npcId);
  if (!dialogue) {
    out.result = { dialogueId: null, nodeId: null, busyLine: rng.pick(npc.busyLines) };
    return [];
  }
  const st = s.npcs[npcId];
  // El límite diario es de conversaciones (BALANCE.relations.dailyTalkLimit = 1 por ahora).
  if (BALANCE.relations.dailyTalkLimit > 0) st.lastTalkDay = s.day;
  if (!st.seenDialogues.includes(dialogue.id)) st.seenDialogues.push(dialogue.id);
  out.result = { dialogueId: dialogue.id, nodeId: dialogue.start };
  return applyEffects(s, c, dialogue.nodes[dialogue.start].effects);
}

/** Elige una opción. Devuelve el próximo nodo en `out` (null = fin). */
export function chooseOption(s: GameState, { c }: Ctx, dialogueId: string, nodeId: string, index: number, out: { next?: string | null }): GameEvent[] {
  const node = c.dialogues[dialogueId]?.nodes[nodeId];
  const option = node?.options?.[index];
  if (!node || !option) throw new GameError('Opción inválida.');
  if (!checkAll(s, option.conditions)) throw new GameError('No podés elegir eso ahora.');
  const events = applyEffects(s, c, option.effects);
  out.next = option.next ?? null;
  if (option.next) events.push(...applyEffects(s, c, c.dialogues[dialogueId].nodes[option.next].effects));
  return events;
}

/** Avanza un nodo sin opciones. */
export function continueNode(s: GameState, { c }: Ctx, dialogueId: string, nodeId: string, out: { next?: string | null }): GameEvent[] {
  const node = c.dialogues[dialogueId]?.nodes[nodeId];
  if (!node) throw new GameError('Nodo inválido.');
  out.next = node.next ?? null;
  return node.next ? applyEffects(s, c, c.dialogues[dialogueId].nodes[node.next].effects) : [];
}
