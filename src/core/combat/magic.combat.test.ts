import { describe, expect, it } from 'vitest';
import { setBelt } from '../magic/alchemy';
import { equipItem } from '../party/equipment';
import { fixedRng } from '../rng';
import { makeItem, setup } from '../testUtils';
import type { GameState } from '../types';
import type { MonsterGroup } from '../world/types';
import { buildCombat, usePotion, useSkill } from './engine';
import { applyTerrain, areaTiles, terrainFxAt } from './terrain';
import type { CombatUnit } from './types';

/** Combate mínimo con el herrero (y su equipo) contra los monstruos dados. */
function fight(s: GameState, ctx: ReturnType<typeof setup>['ctx'], monsters: string[], arena = 'pradera_loma') {
  const group: MonsterGroup = { id: 'g1', x: 5, y: 5, zone: 0, monsters, threat: 0, aggressive: false };
  s.expedition = {
    regionId: 'linde_brezal', pos: { x: 4, y: 5 }, energy: 20, maxEnergy: 20, spent: 0, bag: {}, capacity: 30,
    nodes: [], groups: [group], members: ['herrero'], combat: null, report: null, nightSpawned: false, nextId: 2,
  };
  s.expedition.combat = buildCombat(ctx.c, s, group, arena, ['herrero']);
  return s.expedition.combat;
}

function place(u: CombatUnit, x: number, y: number) {
  u.x = x;
  u.y = y;
}

/** Acierta, daño medio, sin crítico ni estados (uno nuevo por uso: la secuencia avanza). */
const hitRng = () => fixedRng([0, 0.5, 0.99, 0.99, 0.99]);

describe('habilidades activas en combate', () => {
  it('gastan un uso y quedan en enfriamiento', () => {
    const { s, ctx } = setup();
    const daga = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    daga.enchantments = ['runa_llama'];
    daga.abilities = [{ skill: 'golpe_igneo', source: 'runa_llama', uses: 2, cooldown: 3, power: 1 }];
    equipItem(s, ctx, 'herrero', daga.uid);
    const cs = fight(s, ctx, ['gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const gel = cs.units.find((u) => u.side === 'enemy')!;
    place(hero, 3, 5); place(gel, 4, 5);
    expect(hero.skills).toContain('golpe_igneo');
    useSkill(ctx.c, s, hitRng(), hero.id, 'golpe_igneo', gel);
    expect(hero.abilities.golpe_igneo.uses).toBe(1);
    expect(hero.cooldowns.golpe_igneo).toBe(4);
    expect(gel.hp).toBeLessThan(gel.maxHp);
  });
});

describe('terreno', () => {
  it('el fuego prende la hierba alta y se propaga', () => {
    const { s, ctx } = setup();
    const cs = fight(s, ctx, ['gelin_verde']);
    const changed = applyTerrain(ctx.c, cs, [{ x: 2, y: 1 }], 'llamas');
    expect(changed.length).toBeGreaterThan(1);
    expect(terrainFxAt(cs, { x: 2, y: 1 })).toBe('llamas');
  });

  it('el hielo congela el agua', () => {
    const { s, ctx } = setup();
    const cs = fight(s, ctx, ['gelin_verde']);
    applyTerrain(ctx.c, cs, [{ x: 4, y: 6 }, { x: 0, y: 0 }], 'hielo');
    expect(terrainFxAt(cs, { x: 4, y: 6 })).toBe('hielo');
    expect(terrainFxAt(cs, { x: 0, y: 0 })).toBeUndefined();
  });

  it('cono y línea salen del atacante hacia el objetivo', () => {
    const { s, ctx } = setup();
    const cs = fight(s, ctx, ['gelin_verde']);
    const cone = areaTiles(ctx.c, cs, { x: 2, y: 2 }, ctx.c.skills.abanico_brasas, { x: 3, y: 2 });
    expect(cone).toEqual(expect.arrayContaining([{ x: 3, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }]));
    const line = areaTiles(ctx.c, cs, { x: 2, y: 2 }, ctx.c.skills.lanza_rayo, { x: 3, y: 2 });
    expect(line).toEqual([{ x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }]);
  });

  it('el rayo se propaga por el agua a otros enemigos', () => {
    const { s, ctx } = setup();
    const ring = makeItem(s, 'anillo', { aro: 'cobre', engarce: 'ambar' });
    ring.enchantments = ['tormenta'];
    ring.abilities = [{ skill: 'descarga', source: 'test', uses: 2, cooldown: 2, power: 1 }];
    equipItem(s, ctx, 'herrero', ring.uid);
    const cs = fight(s, ctx, ['gelin_verde', 'gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const [a, b] = cs.units.filter((u) => u.side === 'enemy');
    place(hero, 1, 6); place(a, 3, 7); place(b, 5, 7); // los dos en el agua del arroyo
    useSkill(ctx.c, s, hitRng(), hero.id, 'descarga', a);
    expect(b.hp).toBeLessThan(b.maxHp);
  });
});

describe('arrojadizos y pociones', () => {
  it('lanzar gasta una unidad del lote del cinturón', () => {
    const { s, ctx } = setup();
    const lote = makeItem(s, 'cuchillos_arrojadizos', { hoja: 'hierro', mango: 'pino' });
    equipItem(s, ctx, 'herrero', lote.uid);
    const cs = fight(s, ctx, ['gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const gel = cs.units.find((u) => u.side === 'enemy')!;
    place(hero, 1, 3); place(gel, 4, 3);
    expect(hero.skills).toContain('lanzar_cuchillo');
    useSkill(ctx.c, s, hitRng(), hero.id, 'lanzar_cuchillo', gel);
    expect(lote.quantity).toBe(9);
  });

  it('una bomba con ascua incendia la hierba', () => {
    const { s, ctx } = setup();
    const bombas = makeItem(s, 'bombas', { casco: 'hierro', carga: 'ascua_salamandrilla' });
    equipItem(s, ctx, 'herrero', bombas.uid);
    const cs = fight(s, ctx, ['gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    place(hero, 0, 3);
    useSkill(ctx.c, s, hitRng(), hero.id, 'lanzar_bomba', { x: 2, y: 1 });
    expect(terrainFxAt(cs, { x: 2, y: 1 })).toBe('llamas');
  });

  it('las pociones del cinturón curan en combate', () => {
    const { s, ctx } = setup();
    s.items.push({
      ...makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }),
      uid: 'pot1', category: 'pocion', quantity: 2, potion: { recipe: 'pocion_curacion', potency: 1 },
    });
    setBelt(s, ctx, 'pot1', 2);
    const cs = fight(s, ctx, ['gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    hero.hp = 5;
    usePotion(ctx.c, s, hitRng(), hero.id, 'pot1', hero);
    expect(hero.hp).toBeGreaterThan(5);
    expect(s.belt.pot1).toBe(1);
  });
});
