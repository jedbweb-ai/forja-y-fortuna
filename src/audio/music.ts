import { prepareTrack } from './loop';
import { volumeOf } from './prefs';
import { audioContext } from './sfx';

// Música de fondo. Cada archivo de src/assets/audio/musica/ se publica aparte y se baja recién cuando suena
// (no entra en la carga inicial). El nombre del archivo es la clave del lugar: "valdebrasa.mp3".
// Se reproduce con Web Audio: cada tema se prepara al cargarlo (volumen parejo y empalme sin corte, ver loop.ts)
// y se repite sin el hueco que deja el mp3.

const FILES = import.meta.glob('/src/assets/audio/musica/*.{mp3,ogg,m4a}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const MUSIC: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), url]),
);

/** Temas cortos que suenan una vez (victoria, derrota) en vez de repetirse. */
const JINGLES = new Set(['victoria', 'derrota']);

/**
 * Ajuste fino a oído, en decibeles, después de igualar el volumen (por ejemplo `jefe: -2` lo baja un poco,
 * `mazmorra: 3` lo sube). Cada 6 dB es el doble o la mitad de fuerte.
 */
const TRIM_DB: Record<string, number> = {};

const FADE_MS = 1200;
/** Temas preparados que se guardan en memoria (cada uno ocupa unos 40 MB): los demás se vuelven a cargar. */
const CACHE = 3;

interface Loaded {
  buffer: AudioBuffer;
  /** Ganancia para el volumen común. */
  norm: number;
}

interface Track {
  key: string;
  src: AudioBufferSourceNode | null;
  gain: GainNode | null;
  norm: number;
  /** 0-1: cuánto entró el fundido. */
  level: number;
  target: number;
}

/** Reproduce un tema a la vez, con fundido cruzado al cambiar. */
class MusicPlayer {
  private tracks: Track[] = [];
  private loaded = new Map<string, Promise<Loaded | null>>();
  private wanted: string | null = null;
  private duck = 1;
  private duckUntil = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private last = 0;

  /** Elige el primer candidato que tenga archivo; sin ninguno, la música se apaga. */
  play(candidates: string[]) {
    const key = candidates.find((k) => MUSIC[k] && !JINGLES.has(k)) ?? null;
    if (key === this.wanted) return;
    this.wanted = key;
    for (const t of this.tracks) t.target = t.key === key ? 1 : 0;
    if (key && !this.tracks.some((t) => t.key === key)) {
      const t: Track = { key, src: null, gain: null, norm: 1, level: 0, target: 1 };
      this.tracks.push(t);
      this.start(t);
    }
    this.tick();
  }

  /** Tema corto (victoria, derrota): baja la música mientras suena. Devuelve false si no hay archivo. */
  jingle(key: string): boolean {
    if (!MUSIC[key]) return false;
    this.duck = 0.15;
    this.duckUntil = Date.now() + 8000;
    this.tick();
    this.load(key).then((res) => {
      const ctx = audioContext();
      if (!res || !ctx) return;
      const g = ctx.createGain();
      g.gain.value = volumeOf('music') * res.norm;
      g.connect(ctx.destination);
      const src = ctx.createBufferSource();
      src.buffer = res.buffer;
      src.connect(g);
      src.onended = () => g.disconnect();
      src.start();
      this.duckUntil = Date.now() + res.buffer.duration * 1000;
    });
    return true;
  }

  /** Después del primer toque (los navegadores bloquean el audio antes): arranca lo que estaba esperando. */
  resume() {
    for (const t of this.tracks) if (!t.src) this.start(t);
  }

  /** Al cambiar de app o de pestaña se pausa todo el audio. */
  setHidden(hidden: boolean) {
    const ctx = audioContext();
    if (!ctx) return;
    if (hidden) ctx.suspend().catch(() => undefined);
    else ctx.resume().catch(() => undefined);
  }

  /** Aplica un cambio de volumen de los ajustes. */
  refresh() {
    this.tick();
  }

  /** Baja y prepara un tema (una sola vez mientras siga en memoria). */
  private load(key: string): Promise<Loaded | null> {
    let p = this.loaded.get(key);
    if (p) {
      // Lo usado recién pasa al final de la lista.
      this.loaded.delete(key);
      this.loaded.set(key, p);
      return p;
    }
    p = (async () => {
      const ctx = audioContext();
      if (!ctx) return null;
      try {
        const decoded = await ctx.decodeAudioData(await (await fetch(MUSIC[key])).arrayBuffer());
        const chs = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
        const prep = prepareTrack(chs, decoded.sampleRate, !JINGLES.has(key));
        const buffer = ctx.createBuffer(prep.channels.length, prep.channels[0].length, decoded.sampleRate);
        prep.channels.forEach((c, i) => buffer.getChannelData(i).set(c));
        return { buffer, norm: prep.gain * 10 ** ((TRIM_DB[key] ?? 0) / 20) };
      } catch (err) {
        console.warn(`No se pudo cargar la música "${key}"`, err);
        this.loaded.delete(key);
        return null;
      }
    })();
    this.loaded.set(key, p);
    // Se sueltan los más viejos que no estén sonando.
    for (const k of this.loaded.keys()) {
      if (this.loaded.size <= CACHE) break;
      if (!this.tracks.some((t) => t.key === k)) this.loaded.delete(k);
    }
    return p;
  }

  private async start(t: Track) {
    const res = await this.load(t.key);
    const ctx = audioContext();
    if (!res || !ctx || t.src || !this.tracks.includes(t)) return;
    t.gain = ctx.createGain();
    t.gain.gain.value = 0;
    t.gain.connect(ctx.destination);
    t.src = ctx.createBufferSource();
    t.src.buffer = res.buffer;
    t.src.loop = true;
    t.src.connect(t.gain);
    t.src.start();
    t.norm = res.norm;
    this.tick();
  }

  private tick = () => {
    const now = Date.now();
    const dt = this.last ? Math.min(now - this.last, 200) : 16;
    this.last = now;
    if (now > this.duckUntil) this.duck = Math.min(1, this.duck + dt / FADE_MS);
    const vol = volumeOf('music') * this.duck;
    for (const t of this.tracks) {
      // Mientras carga no avanza: el fundido arranca cuando empieza a sonar.
      if (!t.src) {
        if (t.target === 0) t.level = 0;
        continue;
      }
      const step = dt / FADE_MS;
      t.level = t.target > t.level ? Math.min(t.target, t.level + step) : Math.max(t.target, t.level - step);
      t.gain!.gain.value = vol * t.level * t.norm;
    }
    // Los temas que terminaron de apagarse se descartan.
    for (const t of this.tracks.filter((x) => x.target === 0 && x.level === 0)) {
      t.src?.stop();
      t.gain?.disconnect();
    }
    this.tracks = this.tracks.filter((x) => x.target > 0 || x.level > 0);
    const settling = this.tracks.some((t) => t.src && t.level !== t.target) || this.duck < 1;
    if (settling && !this.timer) this.timer = setInterval(this.tick, 50);
    if (!settling && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.last = 0;
    }
  };
}

export const music = new MusicPlayer();
