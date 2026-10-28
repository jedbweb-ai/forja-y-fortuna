import { describe, expect, it } from 'vitest';
import { beginTurn, buildCombat, useSkill } from '../combat/engine';
import { runCommand } from '../commands';
import { createRng } from '../rng';
import { makeItem, setup, toasts } from '../testUtils';
import { closeReport, combatEndTurn, engageGroup, startExpedition } from './expedition';
import { bossFlag, regionOpen, regionPath } from './region';

describe('Ruinas del Vigía y Tierras del Dragón', () => {
  it('las Ruinas se abren con reputación renombrada en Valdebrasa', () => {
    const { s, ctx } = setup();
    const ruinas = ctx.c.regions.ruinas_vigia;
    expect(regionOpen(s, ruinas)).toBe(false);
    expect(() => startExpedition(s, ctx, 'ruinas_vigia')).toThrow(/renombrada/);
    s.reputation.valdebrasa = 70;
    expect(regionOpen(s, ruinas)).toBe(true);
    expect(() => startExpedition(s, ctx, 'ruinas_vigia')).not.toThrow();
  });

  it('vencer a Malgor abre el camino a las Tierras del Dragón, y su jefa pelea en la caldera', () => {
    const { s, ctx } = setup();
    s.reputation.valdebrasa = 120;
    expect(regionOpen(s, ctx.c.regions.tierras_dragon)).toBe(false);
    startExpedition(s, ctx, 'ruinas_vigia');
    const e = s.expedition!;
    const boss = e.groups.find((g) => g.boss)!;
    engageGroup(ctx.c, s, ctx.rng, boss);
    const cs = e.combat!;
    expect(cs.arenaId).toBe('ruinas_grieta');
    for (const u of cs.units) if (u.side === 'enemy') Object.assign(u, { hp: 0, alive: false });
    const hero = cs.units.find((u) => u.side === 'party')!;
    cs.order = [hero.id];
    cs.turnIndex = 0;
    const events = runCommand(s, ctx, combatEndTurn, hero.id);
    expect(s.flags[bossFlag('ruinas_vigia')]).toBe(true);
    expect(toasts(events)).toContain('Se abre el camino a Tierras del Dragón.');
    runCommand(s, ctx, closeReport);
    expect(regionOpen(s, ctx.c.regions.tierras_dragon)).toBe(true);
  });

  it('en las dos regiones el jefe espera en su guarida, alcanzable desde la entrada', () => {
    for (const id of ['ruinas_vigia', 'tierras_dragon']) {
      const { s, ctx } = setup();
      s.reputation.valdebrasa = 120;
      s.flags[bossFlag('ruinas_vigia')] = true;
      startExpedition(s, ctx, id);
      const e = s.expedition!;
      const boss = e.groups.find((g) => g.boss)!;
      expect(regionPath(ctx.c.regions[id], e.pos, { x: boss.x, y: boss.y }), id).toBeTruthy();
      expect(e.groups.filter((g) => !g.boss).length).toBeGreaterThan(3);
    }
  });

  it('Cendralia anuncia su aliento en cono y al turno siguiente cae sobre esas casillas', () => {
    const { s, ctx } = setup();
    s.reputation.valdebrasa = 120;
    s.flags[bossFlag('ruinas_vigia')] = true;
    startExpedition(s, ctx, 'tierras_dragon');
    const e = s.expedition!;
    e.combat = buildCombat(ctx.c, s, { id: 'gx', x: 0, y: 0, zone: 2, monsters: ['cendralia'], threat: 30, boss: true, aggressive: false }, 'volcan_caldera', e.members);
    const cs = e.combat;
    const boss = cs.units.find((u) => u.monsterId === 'cendralia')!;
    const hero = cs.units.find((u) => u.side === 'party')!;
    Object.assign(boss, { x: 5, y: 4 });
    Object.assign(hero, { x: 4, y: 4 });
    const fx = useSkill(ctx.c, s, createRng(1), boss.id, 'aliento_caldera', { x: hero.x, y: hero.y });
    expect(fx.some((f) => f.kind === 'telegraph')).toBe(true);
    expect(cs.pending![0].tiles.length).toBeGreaterThan(3);
    const hp = hero.hp;
    cs.order = [boss.id];
    cs.turnIndex = 0;
    beginTurn(ctx.c, s, createRng(3));
    expect(hero.hp).toBeLessThan(hp);
    expect(cs.pending).toHaveLength(0);
  });

  it('hierro y garras de demonio dan una pieza oscura que hace sangrar', () => {
    const { s } = setup();
    const daga = makeItem(s, 'daga', { hoja: 'garra_demonio', guarda: 'hierro', mango: 'pino' });
    expect(daga.synergies).toContain('hierro_demoniaco');
    expect(daga.traits).toContain('sangrado');
    expect(daga.affinities.oscuro).toBeGreaterThan(0);
    const peto = makeItem(s, 'peto', { placas: 'escama_dragon', forro: 'cuero_wyvern' });
    expect(peto.synergies).toEqual(expect.arrayContaining(['peto_escamas', 'forro_wyvern']));
  });
});
