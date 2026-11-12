import { describe, expect, it } from 'vitest';
import { loudness, prepareTrack, TARGET_LUFS } from './loop';

const SR = 8000;
/** Tono de una frecuencia, con silencio de relleno a los costados. */
const tone = (secs: number, amp: number, hz = 440, pad = 0) => {
  const c = new Float32Array(Math.round((secs + pad * 2) * SR));
  for (let i = 0; i < secs * SR; i++) c[pad * SR + i] = Math.sin((2 * Math.PI * hz * i) / SR) * amp;
  return c;
};
const scaled = (c: Float32Array, g: number) => c.map((x) => x * g);

describe('preparar un tema', () => {
  it('saca el silencio de relleno del principio y del final', () => {
    const p = prepareTrack([tone(4, 0.5, 440, 0.2)], SR, false);
    expect(p.channels[0].length).toBeLessThan(4 * SR + 5);
  });

  it('iguala el volumen percibido: un tema bajito sube y uno fuerte baja, sin pasarse de pico', () => {
    for (const amp of [0.03, 0.8]) {
      const p = prepareTrack([tone(4, amp)], SR, false);
      expect(loudness([scaled(p.channels[0], p.gain)], SR)).toBeCloseTo(TARGET_LUFS, 0);
      expect(amp * p.gain).toBeLessThanOrEqual(0.95);
    }
  });

  it('mide como el oído: un tema grave recibe más volumen que uno agudo con la misma energía', () => {
    const bass = prepareTrack([tone(4, 0.1, 50)], SR, false);
    const mid = prepareTrack([tone(4, 0.1, 2000)], SR, false);
    expect(bass.gain).toBeGreaterThan(mid.gain);
  });

  it('el empalme no salta: el último valor sigue al primero', () => {
    // Un tema que termina en un valor distinto del que empieza.
    const c = new Float32Array(10 * SR).map((_, i) => 0.3 + 0.2 * Math.sin(i / 400) + (i > 9 * SR ? 0.2 : 0));
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
