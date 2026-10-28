import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { goTo } from '../city';
import { equipItem } from '../party/equipment';
import { characterProfile } from '../party/stats';
import { fixedRng } from '../rng';
import { makeItem, setup, withRng } from '../testUtils';
import { brew, matchRecipe, mixProps, setBelt } from './alchemy';
import { computeAbilities } from './abilities';
import { acquireGrimoire, buyBlueprint, buyGrimoire, readGrimoire } from './grimoires';

const c = CONTENT;

describe('habilidades activas (usos y enfriamiento variables)', () => {
  const base = { quality: 50, affinities: {}, traits: [] as string[] };

  it('más rareza da más usos por combate', () => {
    const comun = computeAbilities(c, ['runa_llama'], { ...base, rarity: 'común' }, { runa_llama: 50 })[0];
    const leg = computeAbilities(c, ['runa_llama'], { ...base, rarity: 'legendario' }, { runa_llama: 50 })[0];
    expect(leg.uses).toBeGreaterThan(comun.uses);
  });

  it('una runa bien grabada pega más (y da un uso extra)', () => {
    const mala = computeAbilities(c, ['runa_llama'], { ...base, rarity: 'común' }, { runa_llama: 20 })[0];
    const buena = computeAbilities(c, ['runa_llama'], { ...base, rarity: 'común' }, { runa_llama: 95 })[0];
    expect(buena.power).toBeGreaterThan(mala.power);
    expect(buena.uses).toBe(mala.uses + 1);
  });

  it('una pieza de calidad recarga antes y la afinidad potencia', () => {
    const normal = computeAbilities(c, ['runa_llama'], { ...base, rarity: 'común' }, { runa_llama: 50 })[0];
    const fina = computeAbilities(c, ['runa_llama'], { ...base, quality: 80, affinities: { fuego: 3 }, rarity: 'común' }, { runa_llama: 50 })[0];
    expect(fina.cooldown).toBeLessThan(normal.cooldown);
    expect(fina.power).toBeGreaterThan(normal.power);
  });
});

describe('grimorios', () => {
  it('leerlos enseña encantamientos para siempre y revela combinaciones', () => {
    const { s, ctx } = setup();
    acquireGrimoire(s, c, 'tratado_fuego_vivo');
    expect(s.knownEnchantments).not.toContain('abanico_brasas');
    readGrimoire(s, ctx, 'tratado_fuego_vivo');
    expect(s.knownEnchantments).toContain('abanico_brasas');
    expect(s.discoveredSynergies).toContain('brasa_viva');
    expect(() => readGrimoire(s, ctx, 'tratado_fuego_vivo')).toThrow();
  });

  it('la librería vende grimorios y planos', () => {
    const { s, ctx } = setup();
    s.gold = 1000;
    expect(() => buyGrimoire(s, ctx, 'codice_escarcha')).toThrow();
    goTo(s, ctx, 'libreria');
    buyGrimoire(s, ctx, 'codice_escarcha');
    expect(s.grimoires).toEqual([{ id: 'codice_escarcha', read: false }]);
    expect(() => buyGrimoire(s, ctx, 'libro_tormentas')).toThrow();
    buyBlueprint(s, ctx, 'bombas');
    expect(s.knownBlueprints).toContain('bombas');
  });
});

describe('alquimia', () => {
  it('las propiedades de los ingredientes eligen la receta', () => {
    expect(matchRecipe(c, mixProps(c, ['hoja_alivio', 'hoja_alivio']))?.id).toBe('pocion_curacion');
    expect(matchRecipe(c, mixProps(c, ['hoja_alivio', 'hoja_alivio', 'hoja_alivio']))?.id).toBe('pocion_curacion_mayor');
    expect(matchRecipe(c, mixProps(c, ['raiz_amarga', 'hoja_alivio']))?.id).toBe('antidoto');
    expect(matchRecipe(c, mixProps(c, ['ascua_salamandrilla', 'flor_brasa']))?.id).toBe('r_esencia_ignea');
    expect(matchRecipe(c, mixProps(c, ['pino' as never]))).toBeNull();
  });

  it('destilar da pociones, descubre recetas secretas y gasta una franja', () => {
    const { s, ctx } = setup();
    s.materials.hoja_alivio = 3;
    brew(s, withRng(ctx, fixedRng([0.99])), ['hoja_alivio', 'hoja_alivio', 'hoja_alivio'], 'suave');
    const pot = s.items.find((i) => i.potion?.recipe === 'pocion_curacion_mayor');
    expect(pot?.quantity).toBe(2);
    expect(s.discoveredPotions).toContain('pocion_curacion_mayor');
    expect(s.slot).toBe(1);
  });

  it('a fuego fuerte puede arruinarse', () => {
    const { s, ctx } = setup();
    s.materials.hoja_alivio = 2;
    brew(s, withRng(ctx, fixedRng([0])), ['hoja_alivio', 'hoja_alivio'], 'fuerte');
    expect(s.items.some((i) => i.potion)).toBe(false);
  });

  it('el cinturón del grupo tiene un límite', () => {
    const { s, ctx } = setup();
    s.materials.hoja_alivio = 8;
    for (let i = 0; i < 3; i++) brew(s, withRng(ctx, fixedRng([0.99])), ['hoja_alivio', 'hoja_alivio'], 'suave');
    const pot = s.items.find((i) => i.potion)!;
    expect(pot.quantity).toBe(9);
    setBelt(s, ctx, pot.uid, 6);
    expect(() => setBelt(s, ctx, pot.uid, 7)).toThrow();
    expect(s.belt[pot.uid]).toBe(6);
  });
});

describe('joyería', () => {
  it('dos anillos y un amuleto por personaje, con requisito de voluntad', () => {
    const { s, ctx } = setup();
    const r1 = makeItem(s, 'anillo', { aro: 'plata', engarce: 'rubi' });
    const r2 = makeItem(s, 'anillo', { aro: 'cobre', engarce: 'zafiro' });
    const am = makeItem(s, 'amuleto', { cadena: 'plata', colgante: 'opalo_lunar' });
    equipItem(s, ctx, 'herrero', r1.uid);
    equipItem(s, ctx, 'herrero', r2.uid);
    equipItem(s, ctx, 'herrero', am.uid);
    const h = s.characters.herrero;
    expect(h.equipment.anillo1).toBe(r1.uid);
    expect(h.equipment.anillo2).toBe(r2.uid);
    expect(h.equipment.amuleto).toBe(am.uid);
    const p = characterProfile(c, s, h);
    expect(p.elemental.fuego).toBeLessThan(1);
    expect(p.jewels).toHaveLength(3);
  });
});
