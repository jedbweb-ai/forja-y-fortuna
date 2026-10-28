import { describe, expect, it } from 'vitest';
import { beginTurn, buildCombat } from '../combat/engine';
import { goTo } from '../city';
import { buyMaterial } from '../economy/market';
import { setup } from '../testUtils';
import { regionPath } from './region';
import { startExpedition } from './expedition';

describe('Montañas Grises y Pantano de Niebla', () => {
  it('se puede salir a las dos y el jefe espera en su guarida, alcanzable desde la entrada', () => {
    for (const id of ['montanas_grises', 'pantano_niebla']) {
      const { s, ctx } = setup();
      startExpedition(s, ctx, id);
      const e = s.expedition!;
      const boss = e.groups.find((g) => g.boss)!;
      expect(boss).toBeTruthy();
      const path = regionPath(ctx.c.regions[id], e.pos, { x: boss.x, y: boss.y });
      expect(path?.length).toBeGreaterThan(5);
    }
  });

  it('los trolls se curan solos cada turno', () => {
    const { s, ctx } = setup();
    startExpedition(s, ctx, 'pantano_niebla');
    const e = s.expedition!;
    e.combat = buildCombat(ctx.c, s, { id: 'g', x: 0, y: 0, zone: 0, monsters: ['troll'], threat: 8, aggressive: false }, 'pantano_charcos', e.members);
    const troll = e.combat.units.find((u) => u.monsterId === 'troll')!;
    troll.hp = 50;
    e.combat.order = [troll.id];
    e.combat.turnIndex = 0;
    beginTurn(ctx.c, s, ctx.rng);
    expect(troll.hp).toBe(56);
  });

  it('las tiendas especializadas de Valdebrasa venden lo suyo', () => {
    const { s, ctx } = setup();
    s.gold = 500;
    goTo(s, ctx, 'curtidor');
    buyMaterial(s, ctx, 'piel_gruesa', 1);
    expect(s.materials.piel_gruesa).toBe(1);
    goTo(s, ctx, 'maderero');
    buyMaterial(s, ctx, 'ebano', 1);
    expect(s.materials.ebano).toBe(1);
  });
});
