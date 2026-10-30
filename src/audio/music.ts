import { volumeOf } from './prefs';

// Música de fondo. Cada archivo de src/assets/audio/musica/ se publica aparte y se baja recién cuando suena
// (no entra en la carga inicial). El nombre del archivo es la clave del lugar: "valdebrasa.mp3".

const FILES = import.meta.glob('/src/assets/audio/musica/*.{mp3,ogg,m4a}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const MUSIC: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), url]),
);

/** Temas cortos que suenan una vez (victoria, derrota) en vez de repetirse. */
const JINGLES = new Set(['victoria', 'derrota']);

const FADE_MS = 1200;

interface Track {
  key: string;
  el: HTMLAudioElement;
  /** 0-1: cuánto entró el fundido. */
  level: number;
  target: number;
}

/** Reproduce un tema a la vez, con fundido cruzado al cambiar. */
class MusicPlayer {
  private tracks: Track[] = [];
  private wanted: string | null = null;
  private duck = 1;
  private duckUntil = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private last = 0;
  private hidden = false;

  /** Elige el primer candidato que tenga archivo; sin ninguno, la música se apaga. */
  play(candidates: string[]) {
    const key = candidates.find((k) => MUSIC[k] && !JINGLES.has(k)) ?? null;
    if (key === this.wanted) return;
    this.wanted = key;
    for (const t of this.tracks) t.target = t.key === key ? 1 : 0;
    if (key && !this.tracks.some((t) => t.key === key)) {
      const el = new Audio(MUSIC[key]);
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      this.tracks.push({ key, el, level: 0, target: 1 });
      this.start(el);
    }
    this.tick();
  }

  /** Tema corto (victoria, derrota): baja la música mientras suena. Devuelve false si no hay archivo. */
  jingle(key: string): boolean {
    const url = MUSIC[key];
    if (!url) return false;
    const el = new Audio(url);
    el.volume = volumeOf('music');
    this.start(el);
    this.duck = 0.15;
    this.duckUntil = Date.now() + 4000;
    el.addEventListener('loadedmetadata', () => { this.duckUntil = Date.now() + el.duration * 1000; });
    return true;
  }

  /** Después del primer toque (los navegadores bloquean el audio antes) o al volver a la pestaña. */
  resume() {
    if (this.hidden) return;
    for (const t of this.tracks) if (t.target > 0 && t.el.paused) this.start(t.el);
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (hidden) for (const t of this.tracks) t.el.pause();
    else this.resume();
  }

  /** Aplica un cambio de volumen de los ajustes. */
  refresh() {
    this.tick();
  }

  private start(el: HTMLAudioElement) {
    if (this.hidden) return;
    el.play().catch(() => undefined);
  }

  private tick = () => {
    const now = Date.now();
    const dt = this.last ? Math.min(now - this.last, 200) : 16;
    this.last = now;
    if (now > this.duckUntil) this.duck = Math.min(1, this.duck + dt / FADE_MS);
    const vol = volumeOf('music') * this.duck;
    for (const t of this.tracks) {
      const step = dt / FADE_MS;
      t.level = t.target > t.level ? Math.min(t.target, t.level + step) : Math.max(t.target, t.level - step);
      t.el.volume = Math.max(0, Math.min(1, vol * t.level));
    }
    // Los temas que terminaron de apagarse se descartan.
    for (const t of this.tracks.filter((x) => x.target === 0 && x.level === 0)) t.el.pause();
    this.tracks = this.tracks.filter((x) => x.target > 0 || x.level > 0);
    const settling = this.tracks.some((t) => t.level !== t.target) || this.duck < 1;
    if (settling && !this.timer) this.timer = setInterval(this.tick, 50);
    if (!settling && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.last = 0;
    }
  };
}

export const music = new MusicPlayer();
