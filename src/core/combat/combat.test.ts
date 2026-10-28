import { describe, expect, it } from 'vitest';
import { equipItem } from '../party/equipment';
import { fixedRng } from '../rng';
import { makeItem, setup } from '../testUtils';
import type { GameState } from '../types';
import type { MonsterGroup } from '../world/types';
import { closeReport, combatAiStep, combatFlee, combatSkill } from '../world/expedition';
import { aiTurn } from './ai';
import { calcAttack } from './damage';
import { beginTurn, buildCombat, currentUnit, endTurn, moveUnit, useSkill } from './engine';
import { attackSide, reachable } from './grid';
import { resolveCombat } from './result';
import type { CombatUnit } from './types';

function arm(s: GameState, ctx: ReturnType<typeof setup>['ctx']) {
  const daga = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }, 70);
  equipItem(s, ctx, 'herrero', daga.uid);
  return daga;
}

/** Arma una expedición mínima con un combate contra los monstruos dados. */
function fight(monsters: string[], arena = 'pradera_loma', seed = 7) {
  const { s, ctx } = setup(seed);
  arm(s, ctx);
  const group: MonsterGroup = { id: 'g1', x: 5, y: 5, zone: 0, monsters, threat: 0, aggressive: false };
  s.expedition = {
    regionId: 'linde_brezal', pos: { x: 4, y: 5 }, energy: 20, maxEnergy: 20, spent: 0, bag: {}, capacity: 30,
    nodes: [], groups: [group], members: ['herrero'], combat: null, report: null, nightSpawned: false, nextId: 2,
  };
  s.expedition.combat = buildCombat(ctx.c, s, group, arena, ['herrero']);
  beginTurn(ctx.c, s, ctx.rng);
  return { s, ctx, cs: s.expedition.combat! };
}

describe('combate: grilla', () => {
  it('el alcance de movimiento respeta alturas y no atraviesa enemigos', () => {
    const { s, ctx, cs } = fight(['gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const tiles = reachable(ctx.c, cs, hero);
    expect(tiles.size).toBeGreaterThan(3);
    for (const r of tiles.values()) expect(r.cost).toBeLessThanOrEqual(hero.move);
    void s;
  });

  it('detecta frente, costado y espalda', () => {
    const u = { x: 5, y: 5, facing: 0 } as CombatUnit; // mira hacia +x
    expect(attackSide(u, { x: 6, y: 5 })).toBe('front');
    expect(attackSide(u, { x: 4, y: 5 })).toBe('back');
    expect(attackSide(u, { x: 5, y: 6 })).toBe('side');
  });
});

describe('combate: daño', () => {
  it('por la espalda y desde arriba se pega más', () => {
    const { s, ctx, cs } = fight(['goblin_rasposo']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const gob = cs.units.find((u) => u.side === 'enemy')!;
    gob.x = 5; gob.y = 5; gob.facing = 2; // mira hacia -x
    const skill = ctx.c.skills.ataque;
    const front = calcAttack(ctx.c, s, cs, hero, gob, skill, { x: 4, y: 5 });
    const back = calcAttack(ctx.c, s, cs, hero, gob, skill, { x: 6, y: 5 });
    expect(back.side).toBe('back');
    expect(back.max).toBeGreaterThan(front.max);
    expect(back.hit).toBeGreaterThan(front.hit);
  });

  it('los gelines resisten los golpes contundentes', () => {
    const { s, ctx, cs } = fight(['gelin_verde']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const gel = cs.units.find((u) => u.side === 'enemy')!;
    const cut = calcAttack(ctx.c, s, cs, hero, gel, ctx.c.skills.ataque);
    const blunt = calcAttack(ctx.c, s, cs, hero, gel, { ...ctx.c.skills.ataque, damageType: 'contundente' });
    expect(blunt.max).toBeLessThan(cut.max);
  });
});

describe('combate: turnos y resultado', () => {
  it('moverse y atacar consume el turno, y la IA responde', () => {
    const { s, ctx, cs } = fight(['gelin_verde', 'gelin_verde']);
    let guard = 0;
    while (!cs.outcome && guard++ < 200) {
      const u = currentUnit(cs)!;
      if (u.side === 'enemy') {
        aiTurn(ctx.c, s, ctx.rng);
        continue;
      }
      const target = cs.units.find((x) => x.side === 'enemy' && x.alive)!;
      const spot = [...reachable(ctx.c, cs, u).values()].sort((a, b) => Math.abs(a.x - target.x) + Math.abs(a.y - target.y) - (Math.abs(b.x - target.x) + Math.abs(b.y - target.y)))[0];
      if (spot && !u.moved) moveUnit(ctx.c, s, u.id, spot);
      if (Math.abs(u.x - target.x) + Math.abs(u.y - target.y) === 1) useSkill(ctx.c, s, ctx.rng, u.id, 'ataque', target);
      if (!cs.outcome) endTurn(ctx.c, s, ctx.rng);
    }
    expect(cs.outcome).not.toBeNull();
  });

  it('victoria: botín a la bolsa y el grupo desaparece del mapa', () => {
    const { s, ctx, cs } = fight(['gelin_verde']);
    cs.units.filter((u) => u.side === 'enemy').forEach((u) => { u.alive = false; u.hp = 0; u.killedBy = { damageType: 'cortante' }; });
    cs.outcome = 'victory';
    const report = resolveCombat(ctx.c, s, fixedRng([0]));
    expect(report.outcome).toBe('victory');
    expect(s.expedition!.bag.gel_slime).toBeGreaterThan(0);
    expect(s.expedition!.groups).toHaveLength(0);
  });

  it('matar con fuego arruina el material', () => {
    const { s, ctx, cs } = fight(['gelin_verde']);
    cs.units.filter((u) => u.side === 'enemy').forEach((u) => { u.alive = false; u.hp = 0; u.killedBy = { element: 'fuego' }; });
    cs.outcome = 'victory';
    const report = resolveCombat(ctx.c, s, fixedRng([0]));
    expect(s.expedition!.bag.gel_slime).toBeUndefined();
    expect(report.notes.some((n) => n.includes('arruinó'))).toBe(true);
  });

  it('sin cuchillo de desuello no hay cuero', () => {
    const { s, ctx, cs } = fight(['lobo_gris'], 'bosque_claro');
    cs.units.filter((u) => u.side === 'enemy').forEach((u) => { u.alive = false; u.hp = 0; u.killedBy = { damageType: 'cortante' }; });
    cs.outcome = 'victory';
    resolveCombat(ctx.c, s, fixedRng([0]));
    expect(s.expedition!.bag.cuero_lobo).toBeUndefined();
    expect(s.expedition!.bag.colmillo_lobo).toBeGreaterThan(0);
  });

  it('derrota: se pierde la mitad de la bolsa y se vuelve a la ciudad', () => {
    const { s, ctx, cs } = fight(['goblin_rasposo']);
    s.expedition!.bag = { hierro: 10 };
    cs.units.filter((u) => u.side === 'party').forEach((u) => { u.alive = false; u.hp = 0; });
    cs.outcome = 'defeat';
    s.expedition!.report = resolveCombat(ctx.c, s, ctx.rng);
    const iron = s.materials.hierro ?? 0;
    closeReport(s, ctx);
    expect(s.expedition).toBeNull();
    expect(s.materials.hierro).toBe(iron + 5);
    expect(s.slot).toBe(0);
  });

  it('el gelín rey se divide a la mitad de su vida', () => {
    const { s, ctx, cs } = fight(['gelin_rey']);
    const hero = cs.units.find((u) => u.side === 'party')!;
    const king = cs.units.find((u) => u.side === 'enemy')!;
    king.hp = king.maxHp / 2 + 1;
    hero.x = king.x - 1; hero.y = king.y;
    cs.order = [hero.id, king.id];
    cs.turnIndex = 0;
    hero.atk = 30;
    combatSkill(s, { ...ctx, rng: fixedRng([0, 0.5, 0.99]) }, hero.id, 'ataque', king.x, king.y);
    expect(cs.units.filter((u) => u.side === 'enemy').length).toBeGreaterThanOrEqual(2);
  });

  it('se puede intentar huir', () => {
    const { s, ctx, cs } = fight(['gelin_verde']);
    const u = currentUnit(cs)!;
    if (u.side === 'enemy') combatAiStep(s, ctx);
    const hero = currentUnit(cs)!;
    combatFlee(s, { ...ctx, rng: fixedRng([0]) }, hero.id);
    expect(cs.outcome).toBe('fled');
  });
});
