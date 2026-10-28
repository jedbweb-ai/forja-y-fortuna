import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { validateContent } from '../data/validate';
import { goTo, restSlot } from './city';
import { createRng } from './rng';
import { relationLevel, skillLevel } from './state';
import { setup } from './testUtils';
import { advanceTime } from './time';

describe('rng', () => {
  it('es determinista con la misma semilla', () => {
    const a = createRng(7);
    const b = createRng(7);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
    seqA.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    seqA.forEach((v) => expect(v).toBeLessThan(1));
  });

  it('retoma la secuencia desde el estado guardado', () => {
    const a = createRng(99);
    a.next();
    const resumed = createRng(a.state());
    expect(resumed.next()).toBe(a.next());
  });
});

describe('contenido', () => {
  it('no tiene referencias rotas', () => {
    expect(validateContent(CONTENT)).toEqual([]);
  });

  it('hay entre 5 y 8 planos, con munición por lotes', () => {
    const bps = Object.values(CONTENT.blueprints);
    expect(bps.length).toBeGreaterThanOrEqual(5);
    expect(bps.length).toBeLessThanOrEqual(8);
    expect(bps.some((b) => b.category === 'municion' && (b.batch ?? 0) > 1)).toBe(true);
  });
});

describe('tiempo', () => {
  it('pasa de noche a la mañana siguiente', () => {
    const { s } = setup();
    s.slot = 2;
    const events = advanceTime(s, 1);
    expect(s.day).toBe(2);
    expect(s.slot).toBe(0);
    expect(events.some((e) => e.type === 'timeAdvanced' && e.newDay)).toBe(true);
  });

  it('salir a la ciudad consume la franja al volver al taller', () => {
    const { s, ctx } = setup();
    goTo(s, ctx, 'mercado');
    expect(s.outing).toBe(true);
    expect(s.slot).toBe(0);
    goTo(s, ctx, 'taberna');
    expect(s.slot).toBe(0);
    goTo(s, ctx, 'herreria');
    expect(s.slot).toBe(1);
    expect(s.outing).toBe(false);
  });

  it('no deja ir a lugares cerrados ni descansar fuera del taller', () => {
    const { s, ctx } = setup();
    expect(() => goTo(s, ctx, 'subastas')).toThrow();
    goTo(s, ctx, 'mercado');
    expect(() => restSlot(s, ctx)).toThrow();
  });
});

describe('progresión y relaciones', () => {
  it('nivel de habilidad crece con la experiencia', () => {
    expect(skillLevel(0)).toBe(1);
    expect(skillLevel(30)).toBe(2);
    expect(skillLevel(120)).toBe(3);
  });

  it('niveles de relación por umbral', () => {
    expect(relationLevel(-80)).toBe('hostil');
    expect(relationLevel(-20)).toBe('desconfiado');
    expect(relationLevel(0)).toBe('neutral');
    expect(relationLevel(20)).toBe('conocido');
    expect(relationLevel(50)).toBe('amigo');
    expect(relationLevel(90)).toBe('aliado');
  });
});
