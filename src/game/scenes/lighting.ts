import type { TimeSlot } from '../../core/types';

/** Ambiente de cada franja: color y opacidad del velo de luz, y si se prenden los faroles. */
export const SLOT_LIGHT: Record<TimeSlot, { color: number; alpha: number; lamps: boolean; bg: number }> = {
  'mañana': { color: 0xfff1c9, alpha: 0.08, lamps: false, bg: 0x2a3a4a },
  tarde: { color: 0xff9a4a, alpha: 0.14, lamps: false, bg: 0x3a2a3a },
  noche: { color: 0x0a1238, alpha: 0.5, lamps: true, bg: 0x0d0f1e },
};
