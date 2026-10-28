import { BALANCE } from '../../config/balance';
import { GameError, type Content, type Ctx } from '../content';
import { changeRelation } from '../state';
import type { GameEvent, GameState } from '../types';
import { unequipAll } from './equipment';
import { createMercenary, partyMembers } from './progression';
import type { MercenaryDef } from './types';

const M = BALANCE.mercenaries;

/** Mercenarios disponibles en la taberna (los que no están en tu grupo). */
export function availableMercenaries(c: Content, s: GameState): MercenaryDef[] {
  return Object.values(c.mercenaries).filter((m) => !s.party.includes(m.id));
}

export function hireMercenary(s: GameState, { c }: Ctx, id: string): GameEvent[] {
  const def = c.mercenaries[id];
  if (!def) throw new GameError('Ese mercenario no existe.');
  if (s.location !== 'taberna') throw new GameError('Los mercenarios se contratan en la taberna.');
  if (s.expedition) throw new GameError('Estás de expedición.');
  if (s.party.includes(id)) throw new GameError(`${def.name} ya está en tu grupo.`);
  if (s.party.length >= BALANCE.MAX_PARTY_SIZE) throw new GameError(`Tu grupo ya está completo (máximo ${BALANCE.MAX_PARTY_SIZE}).`);
  if ((s.npcs[id]?.relation ?? 0) <= M.leaveRelation) throw new GameError(`${def.name} no quiere saber nada con vos.`);
  if (s.gold < def.hireCost) throw new GameError(`Contratar a ${def.name} cuesta ${def.hireCost} de oro.`);
  s.gold -= def.hireCost;
  // Si ya trabajó con vos, vuelve con su nivel y experiencia.
  const ch = s.characters[id] ?? createMercenary(def);
  ch.wage = def.wage;
  ch.unpaidDays = 0;
  s.characters[id] = ch;
  s.party.push(id);
  changeRelation(s, id, 3);
  return [{ type: 'toast', text: `${def.name} se une a tu grupo. Cobra ${def.wage} de oro por día.`, tone: 'good' }];
}

function leave(s: GameState, id: string) {
  unequipAll(s, id);
  s.party = s.party.filter((p) => p !== id);
}

export function dismissMercenary(s: GameState, _ctx: Ctx, id: string): GameEvent[] {
  if (id === 'herrero') throw new GameError('No podés despedirte a vos mismo.');
  if (s.expedition) throw new GameError('No podés despedir a nadie en plena expedición.');
  if (!s.party.includes(id)) throw new GameError('No está en tu grupo.');
  leave(s, id);
  changeRelation(s, id, -3);
  return [{ type: 'toast', text: `${s.characters[id].name} deja el grupo y te devuelve el equipo.` }];
}

/** Al empezar un día: se paga a cada mercenario. Si no alcanza, la relación baja y puede irse. */
export function payWages(s: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const ch of partyMembers(s)) {
    if (ch.id === 'herrero' || !ch.wage) continue;
    if (s.gold >= ch.wage) {
      s.gold -= ch.wage;
      ch.unpaidDays = 0;
      changeRelation(s, ch.id, M.paidRelation);
      continue;
    }
    ch.unpaidDays = (ch.unpaidDays ?? 0) + 1;
    changeRelation(s, ch.id, M.unpaidRelation);
    const relation = s.npcs[ch.id]?.relation ?? 0;
    if ((ch.unpaidDays >= M.unpaidDaysToLeave || relation <= M.leaveRelation) && !s.expedition) {
      leave(s, ch.id);
      events.push({ type: 'toast', text: `${ch.name} se cansó de no cobrar y dejó el grupo.`, tone: 'bad' });
    } else {
      events.push({ type: 'toast', text: `No te alcanzó para pagarle a ${ch.name}. No está contento.`, tone: 'bad' });
    }
  }
  return events;
}

export function dailyWages(s: GameState): number {
  return partyMembers(s).reduce((a, ch) => a + (ch.wage ?? 0), 0);
}
