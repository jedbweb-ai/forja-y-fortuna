import { describe, expect, it } from 'vitest';
import { runCommand } from '../commands';
import { buyMaterial } from '../economy/market';
import { makeItem, setup, toasts } from '../testUtils';
import { advanceTime } from '../time';
import { currentStep, seeTip, setGuide, stepTarget } from './tutorial';

describe('guía de primeros pasos', () => {
  it('cada paso se cumple al hacerlo, en cualquier orden, y da su premio una sola vez', () => {
    const { s, ctx } = setup();
    s.tutorial.guide = true;
    expect(currentStep(ctx.c, s)?.id).toBe('forjar');
    expect(stepTarget(ctx.c, s, currentStep(ctx.c, s)!)).toBe('forjar');
    // Dormir antes que forjar también cuenta.
    const gold = s.gold;
    const events = runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(s.tutorial.done).toEqual(['dormir']);
    expect(s.gold).toBe(gold + 15);
    expect(toasts(events).join(' ')).toMatch(/📖/);
    runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(s.gold).toBe(gold + 15);
    // Comprar en el mercado.
    s.location = 'mercado';
    runCommand(s, ctx, buyMaterial, 'hierro', 1);
    expect(s.tutorial.done).toContain('comprar');
  });

  it('al terminar se apaga sola; al prenderla en una partida avanzada, lo hecho cuenta sin premio', () => {
    const { s, ctx } = setup();
    s.stats.itemsForged = 3;
    s.stats.itemsSold = 2;
    s.day = 5;
    const gold = s.gold;
    setGuide(s, ctx, true);
    expect(s.tutorial.done).toEqual(expect.arrayContaining(['forjar', 'vender', 'dormir']));
    expect(s.gold).toBe(gold);
    makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    s.tutorial.done = ctx.c.tutorial.steps.map((st) => st.id).filter((id) => id !== 'charlar');
    s.npcs.rulfa.lastTalkDay = 5;
    const events = runCommand(s, ctx, () => []);
    expect(s.tutorial.guide).toBe(false);
    expect(events.some((e) => e.type === 'tutorialDone')).toBe(true);
  });

  it('un consejo leído no vuelve a aparecer', () => {
    const { s, ctx } = setup();
    seeTip(s, ctx, 'combate');
    seeTip(s, ctx, 'combate');
    expect(s.tutorial.tips).toEqual(['combate']);
  });
});
