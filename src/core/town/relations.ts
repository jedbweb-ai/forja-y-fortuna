import { BALANCE } from '../../config/balance';
import { cityLocation, npcsAt } from '../city';
import { GameError, type Content, type Ctx } from '../content';
import { acquireGrimoire } from '../magic/grimoires';
import type { Rng } from '../rng';
import { addMaterial, changeRelation, changeReputation, currentCity, relationLevel } from '../state';
import { RELATION_LEVELS, type GameEvent, type GameState, type GiftTaste, type Npc, type RelationLevel } from '../types';
import type { RelationPerk } from './types';

const R = BALANCE.relations;

export function npcLevel(s: GameState, npcId: string): RelationLevel {
  return relationLevel(s.npcs[npcId]?.relation ?? 0);
}

const idx = (l: RelationLevel) => RELATION_LEVELS.indexOf(l);

/**
 * Si un desbloqueo de cierto nivel está activo. Los niveles buenos (conocido en adelante)
 * valen desde ese nivel para arriba; los malos (desconfiado, hostil), desde ahí para abajo.
 */
export function levelReached(unlock: RelationLevel, current: RelationLevel): boolean {
  return idx(unlock) >= idx('neutral') ? idx(current) >= idx(unlock) : idx(current) <= idx(unlock);
}

export function activePerks(c: Content, s: GameState, npcId: string): RelationPerk[] {
  const lvl = npcLevel(s, npcId);
  return (c.npcs[npcId]?.unlocks ?? []).filter((u) => levelReached(u.level, lvl)).flatMap((u) => u.perks ?? []);
}

// ───────────────────────── Comercio ─────────────────────────

export function ownerOf(c: Content, locationId: string): string | undefined {
  return cityLocation(c, locationId)?.owner;
}

/** Multiplicador de precio al comprar en un lugar, según la relación con su dueño. */
export function tradeMult(c: Content, s: GameState, locationId: string): number {
  const owner = ownerOf(c, locationId);
  if (!owner) return 1;
  let mult = R.ownerPriceMult[npcLevel(s, owner)] ?? 1;
  for (const p of activePerks(c, s, owner)) if (p.kind === 'discount') mult *= 1 - p.pct / 100;
  return mult;
}

/** Motivo por el que el dueño no te atiende, o null. */
export function refusesTrade(c: Content, s: GameState, locationId: string): string | null {
  const owner = ownerOf(c, locationId);
  if (!owner || !levelReached(R.refuseTradeAt as RelationLevel, npcLevel(s, owner))) return null;
  return `${c.npcs[owner].name} no te quiere atender. Primero arreglá las cosas con ${c.npcs[owner].name.split(' ')[0]}.`;
}

/** Materiales que el dueño solo te vende a vos por la relación. */
export function exclusiveStock(c: Content, s: GameState, locationId: string): string[] {
  const owner = ownerOf(c, locationId);
  if (!owner) return [];
  return activePerks(c, s, owner).flatMap((p) => (p.kind === 'stock' ? p.materials : []));
}

// ───────────────────────── Regalos ─────────────────────────

export type GiftRef = { kind: 'material'; id: string } | { kind: 'item'; uid: string };

/** Claves con las que se busca el gusto del NPC: id, tipo, categoría, tags, afinidades, materiales y acabados. */
export function giftKeys(c: Content, s: GameState, ref: GiftRef): string[] {
  if (ref.kind === 'material') {
    const m = c.materials[ref.id];
    return m ? [m.id, m.type, ...(m.tags ?? []), ...Object.keys(m.affinities ?? {})] : [];
  }
  const it = s.items.find((i) => i.uid === ref.uid);
  if (!it) return [];
  const affinities = Object.entries(it.affinities).filter(([, v]) => (v ?? 0) > 0).map(([k]) => k);
  return [it.blueprintId, it.category, ...it.tags, ...affinities, ...Object.values(it.materials), ...it.enchantments, ...it.finish];
}

export function giftTaste(npc: Npc, keys: string[]): { taste: GiftTaste; key?: string } {
  for (const taste of ['ama', 'disgusta', 'gusta'] as const) {
    const key = keys.find((k) => npc.gifts[taste]?.includes(k));
    if (key) return { taste, key };
  }
  return { taste: 'indiferente' };
}

/** Si un objeto lo forjaste vos (y no es una poción ni algo comprado en la subasta). */
export function isForged(c: Content, s: GameState, uid: string): boolean {
  const it = s.items.find((i) => i.uid === uid);
  return !!it && !!c.blueprints[it.blueprintId] && !it.tags.includes('subasta');
}

export function giftPoints(c: Content, s: GameState, npcId: string, ref: GiftRef): { taste: GiftTaste; key?: string; points: number } {
  const npc = c.npcs[npcId];
  const { taste, key } = giftTaste(npc, giftKeys(c, s, ref));
  let points = R.giftPoints[taste];
  if (ref.kind === 'material') points *= R.materialGiftMult;
  else if (taste !== 'disgusta' && isForged(c, s, ref.uid)) {
    const q = s.items.find((i) => i.uid === ref.uid)!.quality;
    points = points * R.forgedGiftMult + Math.floor(q * R.forgedGiftPerQuality);
  }
  return { taste, key, points: Math.round(points) };
}

export function canGiftToday(s: GameState, npcId: string): boolean {
  return R.dailyGiftLimit <= 0 || s.npcs[npcId]?.lastGiftDay !== s.day;
}

/** Puede recibir regalos: está en este lugar o anda con vos en el grupo. */
export function npcReachable(c: Content, s: GameState, npcId: string): boolean {
  return npcsAt(c, s, s.location).includes(npcId) || (s.party.includes(npcId) && !s.expedition);
}

const TASTE_REACTION: Record<GiftTaste, string> = {
  ama: '¡le encantó!',
  gusta: 'le gustó.',
  indiferente: 'lo agradece, sin más.',
  disgusta: 'no le gustó nada.',
};

export function giveGift(s: GameState, { c }: Ctx, npcId: string, ref: GiftRef): GameEvent[] {
  const npc = c.npcs[npcId];
  if (!npc) throw new GameError('Esa persona no existe.');
  if (!npcReachable(c, s, npcId)) throw new GameError(`${npc.name} no está acá.`);
  if (!canGiftToday(s, npcId)) throw new GameError(`Ya le regalaste algo hoy a ${npc.name.split(' ')[0]}.`);
  const { taste, key, points } = giftPoints(c, s, npcId, ref);
  let what: string;
  if (ref.kind === 'material') {
    if ((s.materials[ref.id] ?? 0) < 1) throw new GameError('No tenés ese material.');
    addMaterial(s, ref.id, -1);
    what = c.materials[ref.id].name;
  } else {
    const it = s.items.find((i) => i.uid === ref.uid);
    if (!it) throw new GameError('Ese objeto no existe.');
    if (it.equippedBy) throw new GameError('Primero sacáselo a quien lo tiene equipado.');
    it.quantity -= 1;
    if (it.quantity <= 0) s.items = s.items.filter((i) => i.uid !== it.uid);
    delete s.belt[it.uid];
    what = it.name;
  }
  const st = s.npcs[npcId];
  st.lastGiftDay = s.day;
  if (key && taste !== 'indiferente') {
    const tag = `${taste}:${key}`;
    st.knownTastes = [...new Set([...(st.knownTastes ?? []), tag])];
  }
  changeRelation(s, npcId, points);
  return [{
    type: 'toast',
    text: `Le diste ${what} a ${npc.name.split(' ')[0]}: ${TASTE_REACTION[taste]} (${points >= 0 ? '+' : ''}${points})`,
    tone: points > 0 ? 'good' : points < 0 ? 'bad' : 'info',
  }];
}

// ───────────────────────── Desbloqueos y rumores ─────────────────────────

/** Cobra las enseñanzas de los niveles de relación alcanzados (una vez cada una). */
export function claimPerks(s: GameState, c: Content): GameEvent[] {
  const events: GameEvent[] = [];
  for (const npc of Object.values(c.npcs)) {
    if (!npc.unlocks?.length) continue;
    const st = s.npcs[npc.id];
    if (!st) continue;
    const lvl = relationLevel(st.relation);
    for (const u of npc.unlocks) {
      if (idx(u.level) <= idx('neutral') || !levelReached(u.level, lvl) || st.perksClaimed?.includes(u.level)) continue;
      st.perksClaimed = [...(st.perksClaimed ?? []), u.level];
      const learned: string[] = [];
      for (const p of u.perks ?? []) {
        if (p.kind !== 'teach') continue;
        if (p.blueprint && !s.knownBlueprints.includes(p.blueprint)) {
          s.knownBlueprints.push(p.blueprint);
          learned.push(`el plano «${c.blueprints[p.blueprint].name}»`);
        }
        if (p.enchantment && !s.knownEnchantments.includes(p.enchantment)) {
          s.knownEnchantments.push(p.enchantment);
          learned.push(`el encantamiento «${c.enchantments[p.enchantment].name}»`);
        }
        if (p.potion && !s.discoveredPotions.includes(p.potion)) {
          s.discoveredPotions.push(p.potion);
          learned.push(`la receta «${c.potions[p.potion].name}»`);
        }
        if (p.synergy && !s.discoveredSynergies.includes(p.synergy)) {
          s.discoveredSynergies.push(p.synergy);
          events.push({ type: 'synergyDiscovered', id: p.synergy });
          learned.push(`la combinación «${c.synergies[p.synergy].name}»`);
        }
        if (p.grimoire) {
          events.push(...acquireGrimoire(s, c, p.grimoire));
          learned.push(`el grimorio «${c.grimoires[p.grimoire].name}»`);
        }
      }
      events.push({
        type: 'toast',
        text: learned.length
          ? `${npc.name} (${u.level}) te enseñó ${learned.join(', ')}.`
          : `${npc.name} ahora es ${u.level}: ${u.description}`,
        tone: 'good',
      });
    }
  }
  return events;
}

/** Cada mañana: rumores de los que te aprecian y habladurías de los que te odian. */
export function dailyRelations(s: GameState, c: Content, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  const rumors: GameState['cityEvents']['rumors'] = [];
  for (const npc of Object.values(c.npcs)) {
    if (s.party.includes(npc.id) || c.mercenaries[npc.id]?.kind === 'esclavo') continue;
    const lvl = npcLevel(s, npc.id);
    if (npc.rumors?.length && activePerks(c, s, npc.id).some((p) => p.kind === 'rumors') && rng.chance(R.rumorChance)) {
      rumors.push({ npc: npc.id, text: rng.pick(npc.rumors) });
    }
    if (levelReached('hostil', lvl) && rng.chance(R.hostileRumorChance)) {
      changeReputation(s, currentCity(), R.hostileRumorReputation);
      rumors.push({ npc: npc.id, text: `${npc.name} anda diciendo por ahí que tu trabajo es una estafa.` });
      events.push({ type: 'toast', text: `${npc.name.split(' ')[0]} habla mal de vos en la ciudad (${R.hostileRumorReputation} reputación).`, tone: 'bad' });
    }
  }
  s.cityEvents.rumors = rumors;
  return events;
}

/** NPC que ya conocés: hablaste, te regalaron o anda en tu grupo. */
export function knownNpcs(c: Content, s: GameState): string[] {
  return Object.keys(c.npcs).filter((id) => {
    const st = s.npcs[id];
    return s.party.includes(id) || !!st?.seenDialogues.length || !!st?.lastGiftDay;
  });
}
