import { describe, expect, it } from 'vitest';
import { runCommand } from '../commands';
import { buyMaterial } from '../economy/market';
import { goTo } from '../city';
import { createRng } from '../rng';
import { makeItem, setup } from '../testUtils';
import { generateGroup } from './encounters';
import { expMove, gather, returnHome, startExpedition } from './expedition';
import { regionPath } from './region';

describe('encuentros', () => {
  it('respetan el presupuesto y arman grupos de 2 a 7', () => {
    const { ctx } = setup();
    const zone = ctx.c.regions.linde_brezal.zoneDefs[0];
    for (let seed = 1; seed < 30; seed++) {
      const g = generateGroup(ctx.c, zone, 'mañana', createRng(seed));
      expect(g.monsters.length).toBeGreaterThanOrEqual(2);
      expect(g.monsters.length).toBeLessThanOrEqual(7);
      if (g.monsters.length > 2) expect(g.threat).toBeLessThanOrEqual(zone.budget[1]);
    }
  });

  it('de noche aparecen monstruos nocturnos', () => {
    const { ctx } = setup();
    const zone = ctx.c.regions.linde_brezal.zoneDefs[0];
    const seen = new Set<string>();
    for (let seed = 1; seed < 80; seed++) generateGroup(ctx.c, zone, 'noche', createRng(seed)).monsters.forEach((m) => seen.add(m));
    expect(seen.has('gelin_escarcha')).toBe(true);
  });
});

describe('expedición', () => {
  it('salir consume la franja de viaje y arma la región', () => {
    const { s, ctx } = setup();
    startExpedition(s, ctx, 'linde_brezal');
    const e = s.expedition!;
    expect(s.slot).toBe(1);
    expect(e.groups.some((g) => g.boss)).toBe(true);
    expect(e.groups.length).toBeGreaterThan(3);
    expect(e.nodes.length).toBeGreaterThan(3);
    expect(e.energy).toBe(e.maxEnergy);
  });

  it('caminar gasta energía y la energía hace pasar las franjas', () => {
    const { s, ctx } = setup(3);
    startExpedition(s, ctx, 'linde_brezal');
    const e = s.expedition!;
    e.groups = [];
    const before = e.energy;
    expMove(s, ctx, 5, 6);
    expect(e.pos).toEqual({ x: 5, y: 6 });
    expect(e.energy).toBeLessThan(before);
  });

  it('chocar con un grupo inicia el combate', () => {
    const { s, ctx } = setup(3);
    startExpedition(s, ctx, 'linde_brezal');
    const e = s.expedition!;
    e.groups = [{ id: 'gx', x: 4, y: 6, zone: 0, monsters: ['gelin_verde', 'gelin_verde'], threat: 4, aggressive: false }];
    expMove(s, ctx, 3, 6);
    expect(e.combat).not.toBeNull();
  });

  it('recolectar necesita la herramienta adecuada', () => {
    const { s, ctx } = setup(5);
    startExpedition(s, ctx, 'linde_brezal');
    const e = s.expedition!;
    e.groups = [];
    const r = ctx.c.regions.linde_brezal;
    const node = { id: 'nx', x: 3, y: 4, kind: 'veta' as const, material: 'cobre', tier: 1, qty: [2, 2] as [number, number], uses: 1 };
    e.nodes = [node];
    const spot = regionPath(r, e.pos, { x: 3, y: 5 })!;
    expect(spot).not.toBeNull();
    e.pos = { x: 3, y: 5 };
    expect(() => gather(s, ctx, 'nx')).toThrow(/pico/);
    makeItem(s, 'pico', { cabeza: 'hierro', mango: 'pino' });
    gather(s, ctx, 'nx');
    expect(e.bag.cobre).toBeGreaterThanOrEqual(2);
    expect(e.nodes).toHaveLength(0);
  });

  it('volver pasa la bolsa al taller', () => {
    const { s, ctx } = setup();
    startExpedition(s, ctx, 'linde_brezal');
    s.expedition!.bag = { roble: 3 };
    const before = s.materials.roble ?? 0;
    returnHome(s, ctx);
    expect(s.expedition).toBeNull();
    expect(s.materials.roble).toBe(before + 3);
    expect(s.location).toBe('herreria');
  });

  it('durante la expedición no se puede ir a la ciudad', () => {
    const { s, ctx } = setup();
    startExpedition(s, ctx, 'linde_brezal');
    expect(() => goTo(s, ctx, 'mercado')).toThrow();
  });
});

describe('mercado de partes de monstruo', () => {
  it('cambia cada día, con stock limitado y precio caro', () => {
    const { s, ctx } = setup(11);
    runCommand(s, ctx, () => []);
    const m = s.market!;
    expect(m.news.length).toBeGreaterThan(0);
    expect(Object.keys(m.stock)).toContain('cuero_lobo');
    const pricey = Object.values(m.priceMult).filter((x) => x > 1).length;
    expect(pricey).toBeGreaterThan(0);
  });

  it('no se puede comprar más de lo que hay', () => {
    const { s, ctx } = setup(11);
    runCommand(s, ctx, () => []);
    goTo(s, ctx, 'mercado');
    s.gold = 9999;
    s.market!.stock.gel_slime = 1;
    buyMaterial(s, ctx, 'gel_slime', 1);
    expect(() => buyMaterial(s, ctx, 'gel_slime', 1)).toThrow();
    buyMaterial(s, ctx, 'hierro', 20); // los materiales comunes no tienen límite
  });
});
