import { describe, expect, it } from 'vitest';
import { prepareTrack, TARGET_RMS } from './loop';

const SR = 1000;
const tone = (secs: number, amp: number, pad = 0) => {
  const c = new Float32Array(Math.round((secs + pad * 2) * SR));
  for (let i = 0; i < secs * SR; i++) c[pad * SR + i] = Math.sin(i * 0.3) * amp;
  return c;
};
const rms = (c: Float32Array) => Math.sqrt(c.reduce((s, x) => s + x * x, 0) / c.length);

describe('preparar un tema', () => {
  it('saca el silencio de relleno del principio y del final', () => {
    const p = prepareTrack([tone(10, 0.5, 0.2)], SR, false);
    expect(p.channels[0].length).toBeLessThan(10 * SR + 5);
    expect(Math.abs(p.channels[0][0])).toBeLessThan(0.01 + 0.5);
  });

  it('iguala el volumen: un tema bajito sube y uno fuerte baja, sin pasarse de pico', () => {
    const quiet = prepareTrack([tone(10, 0.05)], SR, false);
    const loud = prepareTrack([tone(10, 0.8)], SR, false);
    expect(rms(quiet.channels[0]) * quiet.gain).toBeCloseTo(TARGET_RMS, 2);
    expect(rms(loud.channels[0]) * loud.gain).toBeCloseTo(TARGET_RMS, 2);
    expect(0.8 * loud.gain).toBeLessThanOrEqual(0.95);
  });

  it('el empalme no salta: el último valor sigue al primero', () => {
    // Un tema que termina en un valor distinto del que empieza.
    const c = new Float32Array(10 * SR).map((_, i) => 0.3 + 0.2 * Math.sin(i / 50) + (i > 9 * SR ? 0.2 : 0));
    const p = prepareTrack([c], SR, true);
    const out = p.channels[0];
    expect(Math.abs(out[out.length - 1] - out[0])).toBeLessThan(0.05);
    expect(p.seam).toBeCloseTo(0.05, 2);
  });

  it('si termina mucho más fuerte de lo que empieza, el fundido es largo', () => {
    const c = new Float32Array(20 * SR).map((_, i) => Math.sin(i * 0.3) * (i < 3 * SR ? 0.05 : 0.6));
    expect(prepareTrack([c], SR, true).seam).toBe(2);
  });

  it('los temas cortos (victoria, derrota) no se funden', () => {
    expect(prepareTrack([tone(7, 0.5)], SR, false).seam).toBe(0);
  });
});
