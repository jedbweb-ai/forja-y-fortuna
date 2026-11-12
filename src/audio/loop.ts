// Prepara un tema para sonar en el juego: saca el silencio de relleno del mp3, iguala el volumen entre temas
// y funde el final con el principio para que, al repetirse, no se note el corte. Trabaja sobre muestras sueltas
// (sin Web Audio), así se puede probar.

/** Volumen medio (RMS) al que se llevan todos los temas. */
export const TARGET_RMS = 0.16;
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
  const rms = rmsOf(chs, 0, len);
  const gain = rms > 0 ? Math.min(TARGET_RMS / rms, 0.95 / Math.max(peak, 1e-6)) : 1;

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
