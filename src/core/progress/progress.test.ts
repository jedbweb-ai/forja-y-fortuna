import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../config/balance';
import { buildCombat } from '../combat/engine';
import { runCommand } from '../commands';
import { toggleExhibit } from '../economy/shop';
import { forgeBegin } from '../forge/commands';
import { failChance } from '../magic/alchemy';
import { dbgHire } from '../../debug/commands';
import { startDungeon } from '../dungeon/dungeon';
import { xpForLevel } from '../state';
import { makeItem, setup } from '../testUtils';
import { advanceTime } from '../time';
import { permadeath } from '../world/expedition';
import {
  assignAssistant, bonus, buyUpgrade, displaySlots, learnTalent, maxPartySize, talentBlock, talentPoints,
} from './progress';

describe('talentos', () => {
  it('cada nivel de una habilidad da un punto y los talentos suman bonos', () => {
    const { s, ctx } = setup();
    expect(talentPoints(ctx.c, s, 'herreria').free).toBe(0);
    expect(() => learnTalent(s, ctx, 'fuego_parejo')).toThrow();
    s.skills.herreria = xpForLevel(3);
    expect(talentPoints(ctx.c, s, 'herreria').free).toBe(2);
    learnTalent(s, ctx, 'fuego_parejo');
    learnTalent(s, ctx, 'fuego_parejo');
    expect(talentPoints(ctx.c, s, 'herreria').free).toBe(0);
    expect(bonus(ctx.c, s, 'forjaCalidadInicial')).toBe(6);
    // La pieza arranca con la calidad extra.
    forgeBegin(s, ctx, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    expect(s.forge!.quality).toBe(BALANCE.forge.startQuality + 6);
  });

  it('respetan el nivel mínimo y el talento previo', () => {
    const { s, ctx } = setup();
    s.skills.herreria = xpForLevel(6);
    expect(talentBlock(ctx.c, s, 'golpe_maestro')).toMatch(/Ojo experto/);
    learnTalent(s, ctx, 'golpe_firme');
    learnTalent(s, ctx, 'ojo_experto');
    expect(talentBlock(ctx.c, s, 'golpe_maestro')).toBeNull();
    s.skills.alquimia = xpForLevel(3);
    learnTalent(s, ctx, 'pulso_firme');
    expect(failChance(s, 'fuerte', bonus(ctx.c, s, 'alquimiaFalla'))).toBeLessThan(failChance(s, 'fuerte'));
  });
});

describe('mejoras de la herrería', () => {
  it('se construyen con oro y materiales y suben las vitrinas', () => {
    const { s, ctx } = setup();
    s.gold = 1000;
    s.materials.roble = 20;
    expect(displaySlots(ctx.c, s)).toBe(BALANCE.shop.displaySlots);
    buyUpgrade(s, ctx, 'vitrinas');
    expect(displaySlots(ctx.c, s)).toBe(BALANCE.shop.displaySlots + 4);
    for (let i = 0; i < 12; i++) toggleExhibit(s, ctx, makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }).uid);
    expect(s.items.filter((i) => i.exhibited).length).toBe(12);
  });

  it('el cuarto para compañeros pide reputación renombrada y agranda el grupo', () => {
    const { s, ctx } = setup();
    s.gold = 2000;
    s.materials.roble = 20;
    s.materials.cuero_curtido = 10;
    expect(() => buyUpgrade(s, ctx, 'cuarto')).toThrow(/reputación/);
    s.reputation.valdebrasa = 70;
    buyUpgrade(s, ctx, 'cuarto');
    expect(maxPartySize(ctx.c, s)).toBe(4);
    for (const id of ['brunilda', 'ciro', 'nayra']) dbgHire(s, ctx, id);
    expect(s.party).toHaveLength(4);
  });
});

describe('ayudante', () => {
  it('solo un compañero de confianza atiende, y vende lo exhibido mientras no estás', () => {
    const { s, ctx } = setup();
    dbgHire(s, ctx, 'brunilda');
    expect(() => assignAssistant(s, ctx, 'brunilda')).toThrow(/confianza/);
    s.npcs.brunilda.relation = 50;
    assignAssistant(s, ctx, 'brunilda');
    expect(s.assistant).toBe('brunilda');
    expect(s.party).not.toContain('brunilda');
    for (let i = 0; i < 6; i++) makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }, 50).exhibited = true;
    const gold = s.gold;
    runCommand(s, ctx, (st) => advanceTime(st, 6));
    expect(s.items.filter((i) => i.exhibited).length).toBeLessThan(6);
    expect(s.gold).toBeGreaterThan(gold - 100);
  });
});

describe('muerte permanente', () => {
  it('apagada no pasa nada; prendida, los compañeros caídos en mazmorras peligrosas no vuelven', () => {
    const { s, ctx } = setup();
    dbgHire(s, ctx, 'brunilda');
    s.reputation.valdebrasa = 40;
    startDungeon(s, ctx, 'cuevas_eco');
    const e = s.expedition!;
    e.combat = buildCombat(ctx.c, s, { id: 'g', x: 0, y: 0, zone: 0, monsters: ['gargola', 'gargola'], threat: 8, aggressive: false }, 'cueva_lava', e.members);
    const unit = e.combat.units.find((u) => u.charId === 'brunilda')!;
    unit.alive = false;
    expect(permadeath(s, ctx.c)).toEqual([]);
    s.settings.permadeath = true;
    permadeath(s, ctx.c);
    expect(s.characters.brunilda.dead).toBe(true);
    expect(s.party).not.toContain('brunilda');
    // El herrero nunca muere.
    e.combat.units.find((u) => u.charId === 'herrero')!.alive = false;
    permadeath(s, ctx.c);
    expect(s.characters.herrero.dead).toBeUndefined();
  });
});
