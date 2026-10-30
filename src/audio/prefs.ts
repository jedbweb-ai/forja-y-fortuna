// Volumen de música y efectos. Es del dispositivo (no de la partida): se guarda en el navegador.

export interface AudioPrefs {
  music: number;
  sfx: number;
  muted: boolean;
}

const KEY = 'fyf.audio';
const DEFAULTS: AudioPrefs = { music: 0.6, sfx: 0.7, muted: false };

function load(): AudioPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // Sin almacenamiento: valores por defecto.
  }
  return { ...DEFAULTS };
}

let prefs = load();
const listeners = new Set<() => void>();

export const getAudioPrefs = () => prefs;

export function subscribeAudioPrefs(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setAudioPrefs(patch: Partial<AudioPrefs>) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Sin almacenamiento: el cambio dura esta sesión.
  }
  listeners.forEach((fn) => fn());
}

/** Volumen efectivo (0-1) de un canal. */
export const volumeOf = (channel: 'music' | 'sfx') => (prefs.muted ? 0 : prefs[channel]);
