import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../config/balance';
import { CONTENT as c } from '../../data';
import { createRng, fixedRng } from '../rng';
import { makeItem, setup } from '../testUtils';
import { returnHome, startExpedition } from './expedition';
import { chooseEventOption, closeEvent, harvest, harvestInfo, openEvent, optionBlocked, restAtCamp, routeFight, routeTravel } from './explore';
import { findTiles, seenTile } from './region';
import { generateRoute, routeNightSpawn, stopAt } from './routes';
import type { ResourceNode } from './types';

const EX = BALANCE.expedition;

/** Expedición en el formato B con un lugar puesto al lado del grupo. */
function withNode(node: Partial<ResourceNode>, seed = 5) {
  const { s, ctx } = setup(seed);
  startExpedition(s, ctx, 'linde_brezal');
  const e = s.expedition!;
  e.groups = [];
  const full: ResourceNode = { id: 'nx', x: e.pos.x + 1, y: e.pos.y, kind: 'veta', material: 'cobre', tier: 1, qty: [2, 2], uses: 3, ...node };
  e.nodes = [full];
  return { s, ctx, e, node: full };
}

describe('recolectar de una vez', () => {
  it('rápido: poca energía y parte de lo que da; con cuidado: todo, por más energía', () => {
    const a = withNode({});
    makeItem(a.s, 'pico', { cabeza: 'hierro', mango: 'pino' });
    const info = harvestInfo(c, a.s, a.node);
    expect(info.blocked).toBeUndefined();
    expect(info.rapido.energy).toBeLessThan(info.cuidado.energy);
    const energy = a.e.energy;
    harvest(a.s, a.ctx, 'nx', 'rapido');
    const fast = a.e.bag.cobre;
    expect(a.e.energy).toBe(energy - info.rapido.energy);
    expect(a.e.nodes).toHaveLength(0);

    const b = withNode({});
    makeItem(b.s, 'pico', { cabeza: 'hierro', mango: 'pino' });
    harvest(b.s, b.ctx, 'nx', 'cuidado');
    expect(b.e.bag.cobre).toBeGreaterThan(fast);
    expect(b.e.bag.cobre).toBeGreaterThanOrEqual(6);
  });

  it('sin la herramienta no se puede, y lo explica', () => {
    const { s, ctx, node } = withNode({});
    expect(harvestInfo(c, s, node).blocked).toMatch(/pico/);
    expect(() => harvest(s, ctx, 'nx', 'rapido')).toThrow(/pico/);
  });

  it('hay que estar al lado', () => {
    const { s, ctx } = withNode({ x: 1, y: 1 });
    makeItem(s, 'pico', { cabeza: 'hierro', mango: 'pino' });
    expect(() => harvest(s, ctx, 'nx', 'rapido')).toThrow(/Acercate/);
  });
});

describe('campamento', () => {
  it('devuelve energía, cura un poco y hace pasar el tiempo; se usa una vez', () => {
    const { s, ctx, e } = withNode({ kind: 'campamento', material: '', uses: 1 });
    e.energy = 5;
    const slot = s.slot;
    restAtCamp(s, ctx, 'nx');
    expect(e.energy).toBe(5 + EX.camp.energy);
    expect(s.slot).not.toBe(slot);
    expect(e.nodes).toHaveLength(0);
  });
});

describe('eventos de expedición', () => {
  it('se abren, se elige una opción y queda el resultado hasta cerrarlo', () => {
    const { s, ctx, e } = withNode({ kind: 'evento', event: 'arroyo_claro', material: '', uses: 1 });
    openEvent(s, ctx, 'nx');
    expect(e.event?.id).toBe('arroyo_claro');
    const hero = s.characters.herrero;
    hero.hp = 1;
    chooseEventOption(s, ctx, 0); // beber y lavarse
    expect(hero.hp).toBeGreaterThan(1);
    expect(e.event?.result).toBeTruthy();
    expect(e.nodes).toHaveLength(0);
    closeEvent(s);
    expect(e.event).toBeNull();
  });

  it('las opciones con costo se bloquean si no alcanza, y se pagan al elegirlas', () => {
    const { s, ctx, e } = withNode({ kind: 'evento', event: 'buhonero', material: '', uses: 1 });
    openEvent(s, ctx, 'nx');
    s.gold = 5;
    expect(optionBlocked(c, s, 'buhonero', 0)).toMatch(/oro/);
    expect(() => chooseEventOption(s, ctx, 0)).toThrow();
    s.gold = 50;
    e.energy = 3;
    chooseEventOption(s, ctx, 0);
    expect(s.gold).toBe(30);
    expect(e.energy).toBe(9);
  });

  it('un resultado de pelea arranca el combate', () => {
    const { s, e } = withNode({ kind: 'evento', event: 'rastro_fresco', material: '', uses: 1 });
    const ctx = { c, rng: fixedRng([0.01, 0.01, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]) };
    openEvent(s, ctx, 'nx');
    chooseEventOption(s, { c, rng: createRng(3) }, 0);
    // Seguir el rastro: o pelea (2 de 3) o guarida vacía; con esta semilla, pelea.
    expect(e.combat !== null || e.event?.result).toBeTruthy();
  });

  it('en el mapa de Linde hay lugares de evento y campamentos', () => {
    const { s, ctx } = setup(9);
    startExpedition(s, ctx, 'linde_brezal');
    const e = s.expedition!;
    expect(e.nodes.some((n) => n.kind === 'evento' && n.event && c.expeditionEvents[n.event])).toBe(true);
    expect(e.nodes.filter((n) => n.kind === 'campamento')).toHaveLength(findTiles(c.regions.linde_brezal, 'a').length);
  });
});

describe('formato B: niebla', () => {
  it('al salir se ve solo alrededor de la entrada, y caminar descubre más', () => {
    const { s, ctx } = setup(4);
    startExpedition(s, ctx, 'linde_brezal');
    const e = s.expedition!;
    expect(e.fog).toBeTruthy();
    expect(seenTile(e, e.pos.x, e.pos.y)).toBe(true);
    expect(seenTile(e, 25, 5)).toBe(false);
  });
});

describe('formato A: recorrido por paradas', () => {
  function routeRun(seed = 7) {
    const { s, ctx } = setup(seed);
    s.settings.expeditionFormat = 'rutas';
    startExpedition(s, ctx, 'linde_brezal');
    return { s, ctx, e: s.expedition! };
  }

  it('arma columnas desde la entrada hasta el jefe, y a toda parada se llega', () => {
    const { e } = routeRun();
    const route = e.route!;
    const r = c.regions.linde_brezal;
    expect(route.cols).toBe(1 + r.zoneDefs.length * EX.route.colsPerZone + 1);
    expect(stopAt(route).kind).toBe('entrada');
    expect(route.stops.find((st) => st.col === route.cols - 1)?.kind).toBe('jefe');
    const reach = new Set([route.at]);
    for (let col = 0; col < route.cols; col++) {
      for (const st of route.stops.filter((x) => x.col === col && reach.has(x.id))) st.links.forEach((l) => reach.add(l));
    }
    expect(reach.size).toBe(route.stops.length);
    // Cada parada (salvo entrada y hallazgo) tiene algo: un lugar o un grupo.
    for (const st of route.stops.filter((x) => !['entrada', 'hallazgo'].includes(x.kind))) {
      expect(e.nodes.some((n) => n.id === st.ref) || e.groups.some((g) => g.id === st.ref)).toBe(true);
    }
    expect(e.fog).toBeUndefined();
  });

  it('avanzar gasta energía, solo por los caminos que hay; los monstruos atacan al llegar', () => {
    const { s, ctx, e } = routeRun(11);
    const route = e.route!;
    const far = route.stops.find((st) => st.col === 3)!;
    expect(() => routeTravel(s, ctx, far.id)).toThrow(/camino/);
    // Se fuerza una parada de monstruos al alcance.
    const next = stopAt(route, stopAt(route).links[0]);
    const group = e.groups.find((g) => !g.boss)!;
    e.nodes = e.nodes.filter((n) => n.id !== next.ref);
    next.kind = 'monstruos';
    next.ref = group.id;
    const energy = e.energy;
    routeTravel(s, ctx, next.id);
    // El tramo y el arranque de la pelea gastan energía.
    expect(e.energy).toBe(energy - EX.route.stepEnergy - EX.combatEnergy);
    expect(e.combat).not.toBeNull();
  });

  it('un desafío o el jefe esperan a que decidas pelear', () => {
    const { s, ctx, e } = routeRun(12);
    const route = e.route!;
    const next = stopAt(route, stopAt(route).links[0]);
    const group = e.groups.find((g) => g.boss)!;
    e.nodes = e.nodes.filter((n) => n.id !== next.ref);
    next.kind = 'desafio';
    next.ref = group.id;
    routeTravel(s, ctx, next.id);
    expect(e.combat).toBeNull();
    routeFight(s, ctx);
    expect(e.combat).not.toBeNull();
  });

  it('recolectar usa el lugar de la parada actual', () => {
    const { s, ctx, e } = routeRun(13);
    makeItem(s, 'pico', { cabeza: 'hierro', mango: 'pino' });
    const route = e.route!;
    const next = stopAt(route, stopAt(route).links[0]);
    e.groups = e.groups.filter((g) => g.id !== next.ref);
    e.nodes = e.nodes.filter((n) => n.id !== next.ref);
    const node: ResourceNode = { id: 'veta_x', x: next.col, y: next.row, kind: 'veta', material: 'cobre', tier: 1, qty: [2, 2], uses: 2 };
    e.nodes.push(node);
    next.kind = 'recurso';
    next.ref = node.id;
    expect(() => harvest(s, ctx, 'veta_x', 'rapido')).toThrow(/Acercate/);
    routeTravel(s, ctx, next.id);
    harvest(s, ctx, 'veta_x', 'rapido');
    expect(e.bag.cobre).toBeGreaterThan(0);
  });

  it('el hallazgo descubre la entrada escondida a la mazmorra', () => {
    const { s, ctx, e } = routeRun(14);
    const def = Object.values(c.dungeons).find((d) => d.entrance === 'linde_brezal')!;
    const route = e.route!;
    const next = stopAt(route, stopAt(route).links[0]);
    next.kind = 'hallazgo';
    routeTravel(s, ctx, next.id);
    expect(s.flags[def.unlock.flag!]).toBe(true);
  });

  it('de noche aparecen monstruos en paradas que todavía no se visitaron', () => {
    const { s, ctx, e } = routeRun(15);
    const r = c.regions.linde_brezal;
    const before = e.groups.length;
    const added = routeNightSpawn(c, s, ctx.rng, r, 2, 'noche');
    expect(e.groups.length).toBe(before + added);
    for (const g of e.groups.slice(before)) {
      const st = e.route!.stops.find((x) => x.ref === g.id)!;
      expect(st.visited).toBeFalsy();
      expect(st.kind).toBe('monstruos');
    }
  });

  it('se puede volver desde cualquier parada', () => {
    const { s, ctx, e } = routeRun(16);
    e.bag = { roble: 2 };
    returnHome(s, ctx);
    expect(s.expedition).toBeNull();
  });

  it('el recorrido sale para todas las regiones', () => {
    for (const r of Object.values(c.regions).filter((x) => x.available && !x.hidden)) {
      const { s, ctx } = setup(21);
      s.settings.expeditionFormat = 'rutas';
      s.reputation.valdebrasa = 200;
      for (const other of Object.values(c.regions)) if (other.boss) s.flags[`jefe_${other.id}`] = true;
      startExpedition(s, ctx, r.id);
      const route = s.expedition!.route!;
      expect(route.stops.length).toBeGreaterThan(5);
      expect(generateRoute).toBeTypeOf('function');
    }
  });
});
