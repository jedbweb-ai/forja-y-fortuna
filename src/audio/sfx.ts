import { volumeOf } from './prefs';

// Efectos de sonido generados por código con Web Audio, estilo retro: no hay archivos.
// Cada efecto es una receta de tonos y ruido. Para reemplazar uno por un archivo, ver docs/GUIA_DE_SONIDO.md.

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

/** Crea el contexto de audio. Los navegadores solo lo dejan sonar después de un toque o una tecla. */
export function audioContext(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    out = ctx.createGain();
    out.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  delay?: number;
  /** Frecuencia final (desliza desde la inicial). */
  to?: number;
  attack?: number;
}

function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const c = ctx!;
  const t = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  const vol = o.vol ?? 0.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out!);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

interface NoiseOpts {
  filter?: BiquadFilterType;
  freq?: number;
  to?: number;
  q?: number;
  vol?: number;
  delay?: number;
  attack?: number;
}

function noise(dur: number, o: NoiseOpts = {}) {
  const c = ctx!;
  const t = c.currentTime + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? 'lowpass';
  f.frequency.setValueAtTime(o.freq ?? 1000, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  const vol = o.vol ?? 0.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out!);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const notes = (freqs: number[], step: number, dur: number, o: ToneOpts = {}) =>
  freqs.forEach((f, i) => tone(f, dur, { ...o, delay: (o.delay ?? 0) + i * step }));

/** Golpe de martillo sobre el yunque: parciales metálicos que no son armónicos. */
function clang(pitch: number, vol: number) {
  for (const [ratio, v, d] of [[1, 1, 0.5], [1.63, 0.6, 0.35], [2.7, 0.4, 0.25], [4.1, 0.25, 0.15]]) {
    tone(820 * pitch * ratio, d, { type: 'sine', vol: vol * v });
  }
  noise(0.05, { filter: 'bandpass', freq: 3200, q: 0.8, vol: vol * 0.8 });
}

const SOUNDS = {
  // Interfaz
  click: () => tone(1100, 0.035, { vol: 0.06 }),
  abrir: () => tone(520, 0.09, { type: 'triangle', to: 820, vol: 0.12 }),
  cerrar: () => tone(760, 0.08, { type: 'triangle', to: 460, vol: 0.1 }),
  error: () => notes([180, 150], 0.09, 0.08, { vol: 0.1 }),
  // Herrería
  martillo: () => clang(0.96 + Math.random() * 0.08, 0.22),
  martillo_perfecto: () => {
    clang(1.05, 0.24);
    tone(1760, 0.6, { type: 'sine', vol: 0.12, delay: 0.04 });
    tone(2637, 0.5, { type: 'sine', vol: 0.06, delay: 0.08 });
  },
  martillo_defecto: () => {
    clang(0.78, 0.18);
    tone(140, 0.18, { type: 'triangle', to: 70, vol: 0.25 });
  },
  arruinado: () => {
    tone(320, 0.6, { type: 'sawtooth', to: 70, vol: 0.12 });
    noise(0.5, { filter: 'lowpass', freq: 900, to: 200, vol: 0.15 });
  },
  templado: () => {
    noise(0.9, { filter: 'highpass', freq: 3500, to: 6000, vol: 0.12, attack: 0.02 });
    notes([1047, 1319, 1568, 2093], 0.07, 0.35, { type: 'triangle', vol: 0.08, delay: 0.15 });
  },
  pocion: () => {
    for (let i = 0; i < 4; i++) tone(500 + Math.random() * 500, 0.08, { type: 'sine', to: 1400, vol: 0.08, delay: i * 0.07 });
  },
  sinergia: () => notes([784, 988, 1175, 1568], 0.08, 0.4, { type: 'triangle', vol: 0.09 }),
  // Dinero
  monedas: () => {
    tone(1975, 0.12, { vol: 0.07 });
    tone(2637, 0.22, { vol: 0.07, delay: 0.07 });
  },
  pagar: () => {
    tone(1319, 0.1, { vol: 0.06 });
    tone(1047, 0.16, { vol: 0.06, delay: 0.06 });
  },
  // Expedición
  recoger: () => {
    tone(660, 0.07, { type: 'triangle', vol: 0.12 });
    tone(990, 0.12, { type: 'triangle', vol: 0.1, delay: 0.06 });
  },
  partir: () => noise(0.5, { filter: 'bandpass', freq: 400, to: 1600, q: 1.5, vol: 0.1, attack: 0.15 }),
  // Combate
  golpe: () => {
    noise(0.12, { filter: 'lowpass', freq: 1400, to: 300, vol: 0.28 });
    tone(150, 0.12, { type: 'sine', to: 60, vol: 0.3 });
  },
  critico: () => {
    noise(0.2, { filter: 'lowpass', freq: 3000, to: 300, vol: 0.32 });
    tone(240, 0.22, { type: 'square', to: 50, vol: 0.18 });
    tone(1600, 0.15, { type: 'sine', vol: 0.08 });
  },
  falla: () => noise(0.18, { filter: 'bandpass', freq: 600, to: 2400, q: 2, vol: 0.12, attack: 0.04 }),
  flecha: () => {
    noise(0.12, { filter: 'bandpass', freq: 2500, to: 4000, q: 3, vol: 0.12 });
    tone(1400, 0.1, { type: 'triangle', to: 700, vol: 0.05 });
  },
  magia: () => {
    notes([660, 880, 1320], 0.05, 0.25, { type: 'triangle', vol: 0.09 });
    noise(0.35, { filter: 'highpass', freq: 5000, vol: 0.05, attack: 0.05 });
  },
  fuego: () => noise(0.45, { filter: 'lowpass', freq: 600, to: 2400, vol: 0.22, attack: 0.05 }),
  hielo: () => notes([2093, 2637, 3136, 2349], 0.04, 0.2, { type: 'sine', vol: 0.07 }),
  rayo: () => {
    noise(0.25, { filter: 'highpass', freq: 2000, vol: 0.2 });
    tone(70, 0.25, { type: 'square', vol: 0.12 });
  },
  curar: () => {
    tone(523, 0.35, { type: 'sine', to: 1047, vol: 0.1, attack: 0.05 });
    tone(784, 0.3, { type: 'sine', vol: 0.06, delay: 0.12 });
  },
  refuerzo: () => notes([392, 523, 659], 0.06, 0.18, { type: 'triangle', vol: 0.1 }),
  estado: () => tone(280, 0.18, { type: 'square', to: 190, vol: 0.06 }),
  empuje: () => tone(110, 0.16, { type: 'sine', to: 55, vol: 0.3 }),
  muerte: () => {
    tone(330, 0.5, { type: 'sawtooth', to: 55, vol: 0.1 });
    noise(0.4, { filter: 'lowpass', freq: 500, to: 100, vol: 0.12 });
  },
  aparece: () => {
    noise(0.35, { filter: 'lowpass', freq: 200, to: 1500, vol: 0.12, attack: 0.1 });
    tone(110, 0.35, { type: 'triangle', to: 440, vol: 0.1 });
  },
  aviso: () => notes([220, 220], 0.16, 0.1, { vol: 0.09 }),
  // Logros
  nivel: () => notes([523, 659, 784, 1047, 1319], 0.07, 0.25, { vol: 0.07 }),
  victoria: () => {
    notes([523, 659, 784], 0.11, 0.14, { vol: 0.08 });
    for (const f of [1047, 784, 659]) tone(f, 0.7, { vol: 0.06, delay: 0.36 });
  },
  derrota: () => notes([392, 349, 311, 262], 0.22, 0.4, { type: 'triangle', vol: 0.12 }),
} satisfies Record<string, () => void>;

export type SfxId = keyof typeof SOUNDS;
export const SFX_IDS = Object.keys(SOUNDS) as SfxId[];

/** Toca un efecto de sonido. Si el audio todavía no está habilitado (nadie tocó la pantalla), no hace nada. */
export function sfx(id: SfxId) {
  const v = volumeOf('sfx');
  if (!v || !ctx || ctx.state !== 'running') return;
  out!.gain.value = v;
  SOUNDS[id]();
}
