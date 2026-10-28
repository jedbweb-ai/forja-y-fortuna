import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { checkAll } from '../dialogue';
import type { Rng } from '../rng';
import { addMaterial, currentCity, nextUid } from '../state';
import type { GameEvent, GameState } from '../types';
import { applyPenalty, applyReward, describeReward, takeUnits, unitsAvailable } from './craft';
import type { ActiveQuest, QuestDef } from './types';

// Encargos: piezas con requisitos, materiales, cacerías y jefes. Tienen plazo, premio y castigo.

const Q = BALANCE.quests;

export function questGiverName(c: Content, q: QuestDef): string {
  if (q.giver) return c.npcs[q.giver]?.name ?? q.giver;
  return q.client ?? (q.board === 'gremio' ? 'Gremio de aventureros' : 'Aviso anónimo');
}

function eligible(s: GameState, q: QuestDef): boolean {
  if (s.quests.active.some((a) => a.id === q.id)) return false;
  if (!q.repeatable && s.quests.done.includes(q.id)) return false;
  if ((q.minReputation ?? -Infinity) > (s.reputation[currentCity()] ?? 0)) return false;
  return checkAll(s, q.conditions);
}

/** Renueva los avisos del gremio y del tablón cada tantos días. */
export function refreshQuestOffers(s: GameState, c: Content, rng: Rng) {
  const qs = s.quests;
  qs.offers = qs.offers.filter((o) => o.until >= s.day && !qs.active.some((a) => a.id === o.id));
  if (qs.lastRefresh && s.day < qs.lastRefresh + Q.refreshDays) return;
  qs.lastRefresh = s.day;
  for (const board of ['gremio', 'tablon'] as const) {
    const have = qs.offers.filter((o) => o.board === board);
    const pool = Object.values(c.quests).filter((q) => q.board === board && eligible(s, q) && !qs.offers.some((o) => o.id === q.id));
    for (let i = have.length; i < Q.offersPerBoard && pool.length; i++) {
      const q = rng.weighted(pool.map((x) => [x, x.weight ?? 1] as const));
      pool.splice(pool.indexOf(q), 1);
      qs.offers.push({ id: q.id, board, until: s.day + Q.offerDays - 1 });
    }
  }
}

/** Activa un encargo (desde un tablero o porque un NPC te lo pidió en una charla). */
export function startQuest(s: GameState, c: Content, id: string): GameEvent[] {
  const q = c.quests[id];
  if (!q) throw new GameError('Ese encargo no existe.');
  if (s.quests.active.some((a) => a.id === id)) return [];
  if (s.quests.active.length >= Q.maxActive) throw new GameError(`Ya tenés ${Q.maxActive} encargos en curso.`);
  s.quests.active.push({ uid: nextUid(s, 'q'), id, accepted: s.day, deadline: s.day + q.days, progress: 0 });
  s.quests.offers = s.quests.offers.filter((o) => o.id !== id);
  return [{ type: 'toast', text: `Encargo aceptado: ${q.title} (plazo ${q.days} días).`, tone: 'info' }];
}

export function acceptQuest(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const offer = s.quests.offers.find((o) => o.id === id);
  if (!offer) throw new GameError('Ese aviso ya no está.');
  if (s.location !== offer.board) throw new GameError(offer.board === 'gremio' ? 'Se acepta en el gremio.' : 'Se acepta en el tablón.');
  return startQuest(s, c, id);
}

export function questProgress(c: Content, s: GameState, aq: ActiveQuest): { have: number; need: number } {
  const o = c.quests[aq.id].objective;
  switch (o.kind) {
    case 'craft': return { have: Math.min(o.qty, unitsAvailable(s, o)), need: o.qty };
    case 'materials': return { have: Math.min(o.qty, s.materials[o.material] ?? 0), need: o.qty };
    case 'hunt': return { have: Math.min(o.count, aq.progress), need: o.count };
    case 'boss': return { have: Math.min(1, aq.progress), need: 1 };
  }
}

export function deliverQuest(s: GameState, { c }: Ctx, uid: string): GameEvent[] {
  const aq = s.quests.active.find((a) => a.uid === uid);
  if (!aq) throw new GameError('Ese encargo no está activo.');
  if (s.expedition) throw new GameError('Los encargos se entregan en la ciudad.');
  const q = c.quests[aq.id];
  const { have, need } = questProgress(c, s, aq);
  if (have < need) throw new GameError('Todavía no cumpliste lo que pide.');
  const o = q.objective;
  if (o.kind === 'craft') takeUnits(s, o, o.qty);
  if (o.kind === 'materials') addMaterial(s, o.material, -o.qty);
  s.quests.active = s.quests.active.filter((a) => a.uid !== uid);
  s.quests.done.push(q.id);
  const events = applyReward(s, c, q.reward, q.giver);
  events.unshift({ type: 'toast', text: `✔ ${q.title}: ${describeReward(c, q.reward)}`, tone: 'good' });
  return events;
}

export function abandonQuest(s: GameState, { c }: Ctx, uid: string): GameEvent[] {
  const aq = s.quests.active.find((a) => a.uid === uid);
  if (!aq) throw new GameError('Ese encargo no está activo.');
  const q = c.quests[aq.id];
  s.quests.active = s.quests.active.filter((a) => a.uid !== uid);
  s.quests.failed.push(q.id);
  applyPenalty(s, q.penalty, q.giver);
  return [{ type: 'toast', text: `Abandonaste «${q.title}». ${questGiverName(c, q)} no queda contento.`, tone: 'bad' }];
}

/** Cada mañana: los encargos vencidos fallan. */
export function dailyQuests(s: GameState, c: Content): GameEvent[] {
  const events: GameEvent[] = [];
  for (const aq of [...s.quests.active]) {
    if (aq.deadline >= s.day) continue;
    const q = c.quests[aq.id];
    s.quests.active = s.quests.active.filter((a) => a.uid !== aq.uid);
    s.quests.failed.push(q.id);
    applyPenalty(s, q.penalty, q.giver);
    events.push({ type: 'toast', text: `Se venció el encargo «${q.title}».`, tone: 'bad' });
  }
  return events;
}

/** Al ganar un combate: suma presas a las cacerías y marca jefes vencidos. */
export function recordKills(s: GameState, c: Content, regionId: string, monsterIds: string[]): GameEvent[] {
  const events: GameEvent[] = [];
  for (const aq of s.quests.active) {
    const o = c.quests[aq.id].objective;
    if (o.kind === 'hunt') {
      if (o.region && o.region !== regionId) continue;
      const n = monsterIds.filter((id) => (!o.monster || id === o.monster) && (!o.family || c.monsters[id]?.family === o.family)).length;
      if (!n) continue;
      const before = aq.progress;
      aq.progress = Math.min(o.count, aq.progress + n);
      if (before < o.count && aq.progress >= o.count) {
        events.push({ type: 'toast', text: `Encargo listo para entregar: ${c.quests[aq.id].title}.`, tone: 'good' });
      }
    }
    if (o.kind === 'boss' && o.region === regionId && monsterIds.some((id) => c.monsters[id]?.boss) && !aq.progress) {
      aq.progress = 1;
      events.push({ type: 'toast', text: `Encargo listo para entregar: ${c.quests[aq.id].title}.`, tone: 'good' });
    }
  }
  return events;
}
