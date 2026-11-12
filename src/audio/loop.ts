// Prepara un tema para sonar en el juego: saca el silencio de relleno del mp3, iguala el volumen entre temas
// y funde el final con el principio para que, al repetirse, no se note el corte. Trabaja sobre muestras sueltas
// (sin Web Audio), así se puede probar.

/**
 * Volumen percibido al que se llevan todos los temas (en LUFS, la medida que usan radios y plataformas de música).
 * Se mide como lo escucha el oído: los graves pesan menos y los agudos medios más, y no cuentan los silencios.
 */
export const TARGET_LUFS = -16;
/** Debajo de esto se considera silencio (el relleno que agrega el mp3 al principio y al final). */
const SILENCE = 0.003;
/** Fundido del empalme: corto si el tema ya empalma bien; largo si termina mucho más fuerte o más suave de lo que empieza. */
const SEAM_SHORT = 0.05;
const SEAM_LONG = 2;

export interface Prepared {
  channels: Float32Array[];
  /** Ganancia para llevarlo al volumen común (sin pasarse de 0,95 de pico). */
  gain: number;
  /** Segundos del fundido del empalme (0 si no se repite). */
  seam: number;
}

const rmsOf = (chs: Float32Array[], a: number, b: number) => {
  let s = 0;
  for (const c of chs) for (let i = a; i < b; i++) s += c[i] * c[i];
  return Math.sqrt(s / Math.max(1, (b - a) * chs.length));
};

/** Filtro biquad aplicado a una copia de la señal. */
function biquad(x: Float32Array, b0: number, b1: number, b2: number, a1: number, a2: number) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v;
    y[i] = v;
  }
  return y;
}

/** Ponderación K: realce de agudos medios y corte de graves, como escucha el oído (norma ITU-R BS.1770). */
function kWeight(x: Float32Array, fs: number) {
  // Etapa 1: realce de unos 4 dB arriba de ~1,7 kHz.
  let K = Math.tan((Math.PI * 1681.974450955533) / fs);
  const Q1 = 0.7071752369554196, Vh = 10 ** (3.999843853973347 / 20), Vb = Vh ** 0.4996667741545416;
  let a0 = 1 + K / Q1 + K * K;
  const s1 = biquad(x, (Vh + (Vb * K) / Q1 + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q1 + K * K) / a0, (2 * (K * K - 1)) / a0, (1 - K / Q1 + K * K) / a0);
  // Etapa 2: corte de graves por debajo de ~38 Hz.
  K = Math.tan((Math.PI * 38.13547087602444) / fs);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  return biquad(s1, 1, -2, 1, (2 * (K * K - 1)) / a0, (1 - K / Q2 + K * K) / a0);
}

/** Volumen integrado en LUFS: bloques de 400 ms ponderados, sin contar silencios ni partes muy bajas. */
export function loudness(chs: Float32Array[], fs: number): number {
  const weighted = chs.map((c) => kWeight(c, fs));
  const block = Math.floor(fs * 0.4);
  const hop = Math.floor(block / 4);
  const blocks: number[] = [];
  for (let start = 0; start + block <= weighted[0].length; start += hop) {
    let z = 0;
    for (const c of weighted) {
      let s = 0;
      for (let i = start; i < start + block; i++) s += c[i] * c[i];
      z += s / block;
    }
    blocks.push(z);
  }
  if (!blocks.length) return -70;
  const lufs = (z: number) => -0.691 + 10 * Math.log10(Math.max(z, 1e-12));
  const mean = (zs: number[]) => zs.reduce((a, b) => a + b, 0) / zs.length;
  const loud = blocks.filter((z) => lufs(z) > -70);
  if (!loud.length) return -70;
  const relative = lufs(mean(loud)) - 10;
  const gated = loud.filter((z) => lufs(z) > relative);
  return lufs(mean(gated.length ? gated : loud));
}

export function prepareTrack(input: Float32Array[], sampleRate: number, loop: boolean): Prepared {
  const n = input[0].length;
  const loud = (i: number) => input.some((c) => Math.abs(c[i]) > SILENCE);
  let start = 0;
  while (start < n - 1 && !loud(start)) start++;
  let end = n;
  while (end > start + 1 && !loud(end - 1)) end--;
  let chs = input.map((c) => c.slice(start, end));
  const len = end - start;

  let peak = 0;
  for (const c of chs) for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(c[i]));
  const level = loudness(chs, sampleRate);
  const gain = level > -70 ? Math.min(10 ** ((TARGET_LUFS - level) / 20), 0.95 / Math.max(peak, 1e-6)) : 1;

  if (!loop) return { channels: chs, gain, seam: 0 };

  // Si el final y el principio tienen volúmenes muy distintos, el empalme se funde más largo.
  const probe = Math.min(Math.floor(sampleRate * 2), Math.floor(len / 4));
  const ratio = rmsOf(chs, len - probe, len) / Math.max(rmsOf(chs, 0, probe), 1e-6);
  const seam = ratio > 2 || ratio < 0.5 ? SEAM_LONG : SEAM_SHORT;
  const L = Math.min(Math.floor(sampleRate * seam), Math.floor(len / 4));
  // Los últimos L se mezclan sobre los primeros L y el tema queda L más corto: el final pasa a ser el principio.
  chs = chs.map((c) => {
    const out = c.slice(0, len - L);
    for (let i = 0; i < L; i++) {
      const t = i / L;
      out[i] = c[i] * Math.sin((t * Math.PI) / 2) + c[len - L + i] * Math.cos((t * Math.PI) / 2);
    }
    return out;
  });
  return { channels: chs, gain, seam: L / sampleRate };
}
