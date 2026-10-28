import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../config/balance';
import { CONTENT } from '../../data';
import { createRng, fixedRng } from '../rng';
import { setup, withRng } from '../testUtils';
import type { ForgeSession } from '../types';
import { forgeBegin, forgeComplete, forgeFinish, forgeQuench, forgeStop, forgeStrike, runeBegin } from './commands';
import { computeDesign, isAllowed, quenchApplies } from './design';
import { defectChanceFor, hitOdds, rollTraits, strike, traitTierFor } from './forging';
import { buildItem, enchantSlotsFor, rarityFromScore } from './item';

const c = CONTENT;
const swordIron = { hoja: 'hierro', guarda: 'hierro', mango: 'pino', pomo: 'hierro' };

function session(over: Partial<ForgeSession> = {}): ForgeSession {
  return { blueprintId: 'espada_larga', materials: swordIron, stage: 'forging', hits: 0, quality: 12, defects: 0, traits: [], finish: [], instability: 0, ...over };
}

describe('diseño', () => {
  it('respeta los tipos de material por parte', () => {
    const daga = c.blueprints.daga;
    const hoja = daga.parts.find((p) => p.slot === 'hoja')!;
    expect(isAllowed(c, hoja, 'hierro')).toBe(true);
    expect(isAllowed(c, hoja, 'colmillo_lobo')).toBe(true);
    expect(isAllowed(c, hoja, 'pino')).toBe(false);
  });

  it('mejores materiales dan mejores stats', () => {
    const iron = computeDesign(c, 'espada_larga', swordIron);
    const steel = computeDesign(c, 'espada_larga', { ...swordIron, hoja: 'acero', guarda: 'acero', pomo: 'acero' });
    expect(steel.stats.atk).toBeGreaterThan(iron.stats.atk);
    expect(steel.stats.dur).toBeGreaterThan(iron.stats.dur);
    expect(iron.needs).toEqual({ hierro: 5, pino: 1 });
  });

  it('activa sinergias específicas y genéricas', () => {
    const daga = computeDesign(c, 'daga', { hoja: 'colmillo_lobo', guarda: 'hierro', mango: 'pino' });
    expect(daga.synergies.map((s) => s.id)).toContain('filo_colmillo');

    const pura = computeDesign(c, 'espada_larga', swordIron);
    expect(pura.synergies.map((s) => s.id)).toContain('metal_puro');

    const fuego = computeDesign(c, 'espada_larga', { hoja: 'brasalita', guarda: 'hierro', mango: 'pino', pomo: 'cuarzo_igneo' });
    const ids = fuego.synergies.map((s) => s.id);
    expect(ids).toContain('resonancia');
    expect(ids).toContain('brasa_viva');
    expect(fuego.affinities.fuego).toBeGreaterThanOrEqual(6);

    const choque = computeDesign(c, 'espada_larga', { hoja: 'brasalita', guarda: 'hierro', mango: 'pino', pomo: 'cuarzo_glacial' });
    expect(choque.synergies.map((s) => s.id)).toContain('inestabilidad');
    expect(choque.instability).toBeGreaterThan(0);
  });

  it('el temple solo aplica si hay metal', () => {
    const peto = c.blueprints.peto;
    expect(quenchApplies(c, peto, { placas: 'cuero_endurecido', forro: 'cuero_curtido' })).toBe(false);
    expect(quenchApplies(c, peto, { placas: 'hierro', forro: 'cuero_curtido' })).toBe(true);
    expect(quenchApplies(c, c.blueprints.arco_corto, { cuerpo: 'fresno', cuerda: 'cuerda_lino', empunadura: 'cuero_curtido' })).toBe(false);
  });
});

describe('forjado', () => {
  it('cada golpe sube el riesgo de defecto', () => {
    expect(defectChanceFor({ hits: 6, instability: 0 }, 1)).toBeGreaterThan(defectChanceFor({ hits: 1, instability: 0 }, 1));
    expect(defectChanceFor({ hits: 3, instability: 0.08 }, 1)).toBeGreaterThan(defectChanceFor({ hits: 3, instability: 0 }, 1));
    // La habilidad reduce el riesgo.
    expect(defectChanceFor({ hits: 5, instability: 0 }, 5)).toBeLessThan(defectChanceFor({ hits: 5, instability: 0 }, 1));
  });

  it('los golpes habilitan tiers de rasgo', () => {
    const [t1, t2, t3] = BALANCE.forge.traitTierHits;
    expect(traitTierFor(t1 - 1)).toBe(0);
    expect(traitTierFor(t1)).toBe(1);
    expect(traitTierFor(t2)).toBe(2);
    expect(traitTierFor(t3)).toBe(3);
    expect(hitOdds(session({ hits: 0 }), 1).hitsToNextTier).toBe(t1);
  });

  it('un golpe bueno sube la calidad', () => {
    const f = session();
    const { result } = strike(f, fixedRng([0.99, 0.5, 0.99]), 1);
    expect(result).toBe('bueno');
    expect(f.quality).toBeGreaterThan(12);
  });

  it('tres defectos arruinan la pieza', () => {
    const f = session();
    const rng = fixedRng([0]); // siempre cae en defecto
    expect(strike(f, rng, 1).ruined).toBe(false);
    expect(strike(f, rng, 1).ruined).toBe(false);
    expect(strike(f, rng, 1).ruined).toBe(true);
  });

  it('frenar con muchos golpes da rasgos de la categoría', () => {
    const f = session({ hits: 9 });
    const traits = rollTraits(c, f, 'arma', fixedRng([0, 0.5, 0.9]), 1, []);
    expect(traits.length).toBeGreaterThan(0);
    traits.forEach((t) => expect(c.traits[t].categories).toContain('arma'));
  });
});

describe('rareza y valor', () => {
  it('umbrales de rareza', () => {
    expect(rarityFromScore(0)).toBe('común');
    expect(rarityFromScore(15)).toBe('poco común');
    expect(rarityFromScore(25)).toBe('raro');
    expect(rarityFromScore(40)).toBe('épico');
    expect(rarityFromScore(55)).toBe('legendario');
    expect(enchantSlotsFor('legendario')).toBeGreaterThan(enchantSlotsFor('común'));
  });

  it('más calidad vale más', () => {
    const low = buildItem(c, session({ quality: 20 }));
    const high = buildItem(c, session({ quality: 80 }));
    expect(high.value).toBeGreaterThan(low.value);
    expect(high.stats.atk).toBeGreaterThan(low.stats.atk);
  });

  it('los defectos bajan stats', () => {
    const ok = buildItem(c, session({ quality: 50 }));
    const bad = buildItem(c, session({ quality: 50, defects: 2 }));
    expect(bad.stats.atk).toBeLessThan(ok.stats.atk);
  });
});

describe('flujo completo de forja', () => {
  it('fabrica una espada: consume materiales, avanza el tiempo y anota sinergias', () => {
    const { s, ctx } = setup();
    const ironBefore = s.materials.hierro;
    forgeBegin(s, ctx, 'espada_larga', swordIron);
    expect(s.materials.hierro).toBe(ironBefore - 5);
    const goodHits = withRng(ctx, fixedRng([0.99, 0.5, 0.99]));
    for (let i = 0; i < 4; i++) forgeStrike(s, goodHits);
    forgeStop(s, withRng(ctx, createRng(1)));
    expect(s.forge?.stage).toBe('quench');
    forgeQuench(s, ctx, 'aceite');
    forgeFinish(s, ctx, { grip: 'grip_ninguno', polish: 'pulido_basico', engraving: 'grabado_ninguno' });
    const events = forgeComplete(s, ctx, []);
    expect(s.forge).toBeNull();
    expect(s.items).toHaveLength(1);
    expect(s.items[0].name).toContain('Espada larga');
    expect(s.slot).toBe(2); // 2 franjas
    expect(s.discoveredSynergies).toContain('metal_puro');
    expect(events.some((e) => e.type === 'itemCreated')).toBe(true);
  });

  it('las flechas salen por lote', () => {
    const { s, ctx } = setup();
    forgeBegin(s, ctx, 'flechas', { punta: 'hierro', astil: 'pino', emplumado: 'plumas_ganso' });
    forgeStrike(s, withRng(ctx, fixedRng([0.99, 0.5, 0.99])));
    forgeStop(s, ctx);
    forgeQuench(s, ctx, 'agua');
    forgeFinish(s, ctx, { polish: 'pulido_basico' });
    forgeComplete(s, ctx, []);
    expect(s.items[0].quantity).toBe(20);
  });

  it('no deja forjar sin materiales', () => {
    const { s, ctx } = setup();
    s.materials = {};
    expect(() => forgeBegin(s, ctx, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' })).toThrow();
  });

  it('una pieza arruinada se pierde y gasta el tiempo', () => {
    const { s, ctx } = setup();
    forgeBegin(s, ctx, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    const doom = withRng(ctx, fixedRng([0]));
    forgeStrike(s, doom);
    forgeStrike(s, doom);
    const events = forgeStrike(s, doom);
    expect(s.forge).toBeNull();
    expect(s.items).toHaveLength(0);
    expect(s.stats.itemsRuined).toBe(1);
    expect(events.some((e) => e.type === 'forgeRuined')).toBe(true);
  });

  it('la runa se graba en la mesa de runas y se gasta al encantar', () => {
    const { s, ctx } = setup();
    s.materials.piedra_runica = 1;
    s.materials.ascua_salamandrilla = 1;
    runeBegin(s, ctx, 'runa_brasa');
    expect(s.materials.piedra_runica).toBeUndefined();
    forgeStrike(s, withRng(ctx, fixedRng([0.99, 0.5, 0.99])));
    forgeStop(s, ctx);
    const rune = s.items.find((i) => i.category === 'runa')!;
    expect(rune.blueprintId).toBe('runa_brasa');
    forgeBegin(s, ctx, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    forgeStrike(s, withRng(ctx, fixedRng([0.99, 0.5, 0.99])));
    forgeStop(s, ctx);
    forgeQuench(s, ctx, 'agua');
    forgeFinish(s, ctx, { polish: 'pulido_basico' });
    expect(() => forgeComplete(s, ctx, [{ id: 'runa_brasa' }])).toThrow();
    forgeComplete(s, ctx, [{ id: 'runa_brasa', rune: rune.uid }]);
    const daga = s.items.find((i) => i.category === 'arma')!;
    expect(daga.enchantments).toEqual(['runa_brasa']);
    expect(daga.affinities.fuego).toBeGreaterThanOrEqual(2);
    expect(s.items.some((i) => i.category === 'runa')).toBe(false);
  });
});
