import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../config/balance';
import { goTo, sleepUntilMorning, travelTo } from '../city';
import { runCommand } from '../commands';
import { generateCustomers, openShop } from '../economy/shop';
import { fixedRng } from '../rng';
import { setup, toasts, withRng } from '../testUtils';
import { advanceTime } from '../time';
import { closeReport, returnHome, startExpedition } from '../world/expedition';
import { startCityEvent } from './cityEvents';
import { demandOf } from './demand';
import { acceptQuest } from './quests';

function at(city: string, seed = 3) {
  const { s, ctx } = setup(seed);
  travelTo(s, withRng(ctx, fixedRng([0.99])), city);
  return { s, ctx };
}

describe('varias ciudades', () => {
  it('viajar tarda franjas y te deja en la llegada de la otra ciudad', () => {
    const { s, ctx } = setup();
    const before = s.day * 3 + s.slot;
    const ev = travelTo(s, withRng(ctx, fixedRng([0.99])), 'puertoseco');
    expect(s.city).toBe('puertoseco');
    expect(s.location).toBe('ps_muelle');
    expect(s.day * 3 + s.slot - before).toBe(3);
    expect(toasts(ev).some((t) => t.includes('Puertoseco'))).toBe(true);
    expect(() => goTo(s, ctx, 'mercado')).toThrow();
    goTo(s, ctx, 'ps_mercado');
    expect(s.location).toBe('ps_mercado');
  });

  it('un encuentro en el camino se pelea y después se sigue viaje; si caés, perdés oro', () => {
    const { s, ctx } = setup();
    s.gold = 1000;
    travelTo(s, withRng(ctx, fixedRng([0])), 'fuerte_ceniza');
    expect(s.expedition?.travel?.to).toBe('fuerte_ceniza');
    expect(s.expedition?.combat).toBeTruthy();
    const e = s.expedition!;
    e.combat!.outcome = 'defeat';
    e.report = { outcome: 'defeat', loot: {}, lost: {}, notes: [], xp: 0, levelUps: [], injured: [] };
    closeReport(s, ctx);
    expect(s.expedition).toBeNull();
    expect(s.city).toBe('fuerte_ceniza');
    expect(s.gold).toBe(1000 - Math.floor(1000 * BALANCE.travel.defeatGoldLoss));
  });

  it('en otra ciudad se duerme en la posada (pagando) y se arma un puesto ambulante en el mercado', () => {
    const { s, ctx } = at('puertoseco');
    goTo(s, ctx, 'ps_posada');
    s.slot = 2;
    const gold = s.gold;
    sleepUntilMorning(s, ctx);
    expect(s.gold).toBe(gold - BALANCE.travel.innPrice);
    goTo(s, ctx, 'ps_mercado');
    openShop(s, ctx);
    expect(s.shop).toBeTruthy();
  });

  it('cada ciudad tiene sus clientes y su demanda', () => {
    const { s, ctx } = at('puertoseco');
    const types = new Set(Array.from({ length: 20 }, () => generateCustomers(ctx.c, s, ctx.rng).map((x) => x.typeId)).flat());
    expect(types.has('marinero')).toBe(true);
    expect(types.has('soldado')).toBe(false);
    for (let i = 0; i < 8; i++) runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(demandOf(s, 'arrojadizo', 'puertoseco')).toBeGreaterThan(1.2);
    expect(demandOf(s, 'armadura', 'fuerte_ceniza')).toBeGreaterThan(1.2);
    // En Valdebrasa puede haber eventos, pero nunca la demanda de armaduras de la frontera.
    expect(demandOf(s, 'armadura', 'valdebrasa')).toBeLessThan(demandOf(s, 'armadura', 'fuerte_ceniza'));
  });

  it('los encargos se aceptan en el gremio de su ciudad y los eventos pasan en la suya', () => {
    const { s, ctx } = at('fuerte_ceniza');
    runCommand(s, ctx, () => []);
    const offer = s.quests.offers.find((o) => o.city === 'fuerte_ceniza' && o.board === 'gremio')!;
    expect(offer).toBeTruthy();
    expect(() => acceptQuest(s, ctx, offer.id)).toThrow();
    goTo(s, ctx, 'fc_intendencia');
    acceptQuest(s, ctx, offer.id);
    startCityEvent(s, ctx.c, ctx.rng, 'ps_tormenta');
    expect(s.cityEvents.active.find((a) => a.id === 'ps_tormenta')?.city).toBe('puertoseco');
  });

  it('desde otra ciudad, la expedición vuelve a donde saliste', () => {
    const { s, ctx } = at('puertoseco');
    goTo(s, ctx, 'ps_posada');
    startExpedition(s, ctx, 'linde_brezal');
    returnHome(s, ctx);
    expect(s.location).toBe('ps_posada');
    expect(s.city).toBe('puertoseco');
  });
});
