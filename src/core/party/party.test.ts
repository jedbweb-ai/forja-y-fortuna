import { describe, expect, it } from 'vitest';
import { goTo } from '../city';
import { runCommand } from '../commands';
import { repairItems, repairCost } from '../forge/repair';
import { makeItem, setup } from '../testUtils';
import { advanceTime } from '../time';
import { equipItem, unequipItem } from './equipment';
import { dismissMercenary, hireMercenary } from './mercenaries';
import { gainXp, maxHp } from './progression';
import { characterProfile } from './stats';

describe('personajes y equipo', () => {
  it('el herrero empieza en el grupo y sin equipo pega con los puños', () => {
    const { s, ctx } = setup();
    expect(s.party).toEqual(['herrero']);
    const p = characterProfile(ctx.c, s, s.characters.herrero);
    expect(p.weaponKind).toBe('punos');
    expect(p.skills).toEqual(['punetazo']);
  });

  it('las acciones salen del equipo', () => {
    const { s, ctx } = setup();
    const daga = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    const escudo = makeItem(s, 'escudo_mediano', { tablas: 'roble', refuerzo: 'hierro', correas: 'cuero_curtido' });
    equipItem(s, ctx, 'herrero', daga.uid);
    equipItem(s, ctx, 'herrero', escudo.uid);
    const p = characterProfile(ctx.c, s, s.characters.herrero);
    expect(p.weaponKind).toBe('daga');
    expect(p.skills).toEqual(['ataque', 'punalada', 'cubrirse', 'empujon']);
    expect(p.atk).toBeGreaterThan(10);
    expect(daga.equippedBy).toBe('herrero');
  });

  it('el arco ocupa las dos manos', () => {
    const { s, ctx } = setup();
    const escudo = makeItem(s, 'escudo_mediano', { tablas: 'roble', refuerzo: 'hierro', correas: 'cuero_curtido' });
    const arco = makeItem(s, 'arco_corto', { cuerpo: 'fresno', cuerda: 'cuerda_lino', empunadura: 'cuero_curtido' });
    equipItem(s, ctx, 'herrero', escudo.uid);
    equipItem(s, ctx, 'herrero', arco.uid);
    expect(s.characters.herrero.equipment.escudo).toBeUndefined();
    expect(() => equipItem(s, ctx, 'herrero', escudo.uid)).toThrow();
    unequipItem(s, ctx, 'herrero', 'arma');
    expect(arco.equippedBy).toBeUndefined();
  });

  it('el equipo pesado sin fuerza suficiente penaliza', () => {
    const { s, ctx } = setup();
    const peto = makeItem(s, 'peto', { placas: 'chatarra_goblin', forro: 'cuero_curtido' });
    equipItem(s, ctx, 'herrero', peto.uid);
    s.characters.herrero.attributes.fuerza = 1;
    const p = characterProfile(ctx.c, s, s.characters.herrero);
    expect(p.warnings.length).toBeGreaterThan(0);
  });

  it('sube de nivel y mejora atributos y vida', () => {
    const { s, ctx } = setup();
    const h = s.characters.herrero;
    const hp = maxHp(h);
    const ups = gainXp(ctx.c, h, 200);
    expect(ups).toBeGreaterThan(0);
    expect(maxHp(h)).toBeGreaterThan(hp);
  });

  it('reparar cuesta oro y una franja', () => {
    const { s, ctx } = setup();
    const daga = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    daga.durability = 0;
    const cost = repairCost(daga);
    const gold = s.gold;
    repairItems(s, ctx, [daga.uid]);
    expect(daga.durability).toBe(daga.maxDurability);
    expect(s.gold).toBe(gold - cost);
    expect(s.slot).toBe(1);
  });
});

describe('mercenarios', () => {
  it('se contratan en la taberna y cobran cada mañana', () => {
    const { s, ctx } = setup();
    expect(() => hireMercenary(s, ctx, 'gualterio')).toThrow();
    goTo(s, ctx, 'taberna');
    hireMercenary(s, ctx, 'gualterio');
    expect(s.party).toEqual(['herrero', 'gualterio']);
    const gold = s.gold;
    runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(s.gold).toBe(gold - ctx.c.mercenaries.gualterio.wage);
  });

  it('si no se les paga se van', () => {
    const { s, ctx } = setup();
    goTo(s, ctx, 'taberna');
    hireMercenary(s, ctx, 'ciro');
    s.gold = 0;
    runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(s.party).toContain('ciro');
    runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(s.party).not.toContain('ciro');
  });

  it('el grupo tiene un máximo y despedir devuelve el equipo', () => {
    const { s, ctx } = setup();
    s.gold = 500;
    goTo(s, ctx, 'taberna');
    hireMercenary(s, ctx, 'brunilda');
    hireMercenary(s, ctx, 'ciro');
    expect(() => hireMercenary(s, ctx, 'nayra')).toThrow();
    const daga = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
    equipItem(s, ctx, 'brunilda', daga.uid);
    dismissMercenary(s, ctx, 'brunilda');
    expect(daga.equippedBy).toBeUndefined();
    expect(s.party).not.toContain('brunilda');
  });
});
