import { SLOTS, type GameEvent, type GameState, type TimeSlot } from './types';

export function slotName(s: Pick<GameState, 'slot'>): TimeSlot {
  return SLOTS[s.slot];
}

/** Avanza `n` franjas. Devuelve los eventos de cambio de tiempo. */
export function advanceTime(s: GameState, n: number): GameEvent[] {
  let newDay = false;
  for (let i = 0; i < n; i++) {
    s.slot += 1;
    if (s.slot >= SLOTS.length) {
      s.slot = 0;
      s.day += 1;
      newDay = true;
    }
  }
  if (n > 0) s.outing = false;
  const events: GameEvent[] = [{ type: 'timeAdvanced', day: s.day, slot: s.slot, newDay }];
  if (newDay) events.push({ type: 'toast', text: `Amanece el día ${s.day}.`, tone: 'info' });
  return events;
}

/** Saltea hasta la mañana del día siguiente (dormir). */
export function sleep(s: GameState): GameEvent[] {
  return advanceTime(s, SLOTS.length - s.slot);
}
