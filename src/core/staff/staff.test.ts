import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { makeSaveFile, migrateSave } from '../../persistence/saveFile';
import { runCommand } from '../commands';
import { exhibitedItems, toggleExhibit } from '../economy/shop';
import { dbgHire } from '../../debug/commands';
import { createMercenary } from '../party/progression';
import { buyUpgrade } from '../progress/progress';
import { createInitialState } from '../state';
import { makeItem, setup, toasts } from '../testUtils';
import { advanceTime } from '../time';
import type { GameState } from '../types';
import {
  addOrder, assignStaff, branchBlock, buyBranch, displayCandidates, hireTarget, fireWorker, hireBlock, hireWorker, joinBlock, oficioLevel, refreshWorkerMarket,
  removeStaff, setStaffRole, staffSlots,
} from './staff';

const DAGA = { hoja: 'hierro', guarda: 'hierro', mango: 'pino' };

/** Un compañero comprado en el mercado de esclavos, con la lealtad dada. */
function buyServant(s: GameState, id: string, relation: number) {
  const ch = createMercenary(CONTENT.mercenaries[id]);
  ch.wage = 0;
  ch.bond = 'esclavo';
  s.characters[id] = ch;
  s.party.push(id);
  s.npcs[id].relation = relation;
}

const pass = (s: GameState, ctx: ReturnType<typeof setup>['ctx'], slots: number) => runCommand(s, ctx, (st) => advanceTime(st, slots));

describe('quién trabaja', () => {
  it('los mercenarios solo pelean; los esclavos pueden trabajar y dejan el grupo', () => {
    const { s, ctx } = setup();
    dbgHire(s, ctx, 'brunilda');
    expect(joinBlock(ctx.c, s, 'brunilda')).toMatch(/solo pelean/);
    buyServant(s, 'yago', 0);
    assignStaff(s, ctx, 'yago', 'vendedor');
    expect(s.party).not.toContain('yago');
    expect(s.staff.shops.herreria.staff).toEqual([{ id: 'yago', role: 'vendedor' }]);
    // Hay un solo puesto: nadie más entra hasta ampliar el taller.
    buyServant(s, 'sabela', 0);
    expect(joinBlock(ctx.c, s, 'sabela')).toMatch(/más puestos/);
    s.gold = 1000;
    s.materials.roble = 20;
    buyUpgrade(s, ctx, 'personal');
    expect(staffSlots(ctx.c, s)).toBe(2);
    assignStaff(s, ctx, 'sabela');
    removeStaff(s, ctx, 'yago');
    expect(s.party).toContain('yago');
  });
});

describe('vendedor', () => {
  it('vende lo exhibido mientras pasan las franjas y aprende Ventas', () => {
    const { s, ctx } = setup();
    buyServant(s, 'yago', 50);
    assignStaff(s, ctx, 'yago', 'vendedor');
    for (let i = 0; i < 8; i++) makeItem(s, 'daga', DAGA, 50).exhibited = true;
    const gold = s.gold;
    pass(s, ctx, 6);
    expect(s.items.filter((i) => i.exhibited).length).toBeLessThan(8);
    expect(s.gold).toBeGreaterThan(gold);
    expect(s.staff.workers.yago.xp.ventas).toBeGreaterThan(0);
  });

  it('un esclavo hostil rinde menos que uno leal', () => {
    const sold = (relation: number) => {
      const { s, ctx } = setup(7);
      buyServant(s, 'yago', relation);
      assignStaff(s, ctx, 'yago', 'vendedor');
      for (let i = 0; i < 30; i++) makeItem(s, 'daga', DAGA, 50).exhibited = true;
      pass(s, ctx, 12);
      return 30 - s.items.length;
    };
    expect(sold(-80)).toBeLessThan(sold(60));
  });
});

describe('encargado', () => {
  it('llena la vidriera con lo que no está reservado ni comprado en la subasta', () => {
    const { s, ctx } = setup();
    buyServant(s, 'yago', 50);
    assignStaff(s, ctx, 'yago', 'encargado');
    const kept = makeItem(s, 'daga', DAGA, 80);
    kept.reserved = true;
    const bought = makeItem(s, 'daga', DAGA, 80);
    bought.tags.push('subasta');
    for (let i = 0; i < 4; i++) makeItem(s, 'daga', DAGA, 50);
    expect(displayCandidates(s)).toHaveLength(4);
    pass(s, ctx, 2);
    expect(s.items.filter((i) => i.exhibited)).toHaveLength(4);
    expect(kept.exhibited).toBe(false);
    expect(bought.exhibited).toBe(false);
  });
});

describe('aprendiz', () => {
  it('repite piezas que ya forjaste, gasta los materiales y deja las piezas en el inventario', () => {
    const { s, ctx } = setup();
    buyServant(s, 'yago', 50);
    assignStaff(s, ctx, 'yago', 'aprendiz');
    expect(() => addOrder(s, ctx, 'daga', DAGA, 3)).toThrow(/ya forjaste/);
    s.staff.forged.push('daga');
    addOrder(s, ctx, 'daga', DAGA, 3);
    s.materials.hierro = 40;
    s.materials.pino = 20;
    const hierro = s.materials.hierro;
    pass(s, ctx, 9);
    const made = s.items.filter((i) => i.madeBy === 'yago');
    expect(made.length).toBeGreaterThan(0);
    expect(s.materials.hierro).toBeLessThan(hierro);
    expect(s.staff.workers.yago.xp.forja).toBeGreaterThan(0);
  });

  it('sin materiales no arranca y lo avisa al volver a la herrería', () => {
    const { s, ctx } = setup();
    buyServant(s, 'yago', 50);
    assignStaff(s, ctx, 'yago', 'aprendiz');
    s.staff.forged.push('daga');
    addOrder(s, ctx, 'daga', DAGA, 1);
    s.materials = {};
    const text = toasts(pass(s, ctx, 1)).join(' ');
    expect(text).toMatch(/Falta/);
  });
});

describe('contratación', () => {
  it('se contrata en el tablón, ocupa un puesto, cobra cada día y se puede despedir', () => {
    const { s, ctx } = setup();
    refreshWorkerMarket(s, ctx.c, ctx.rng);
    const id = s.staff.market.valdebrasa.offer[0];
    expect(id).toBeTruthy();
    expect(hireBlock(ctx.c, s, id)).toMatch(/tablón/);
    s.location = 'tablon';
    s.gold = 500;
    hireWorker(s, ctx, id);
    expect(s.staff.hired).toEqual([id]);
    expect(s.staff.shops.herreria.staff[0].id).toBe(id);
    // Llega con los niveles que trae.
    const def = ctx.c.workers[id];
    expect(oficioLevel(s.staff.workers[id].xp.forja)).toBe(def.oficios.forja);
    s.location = 'herreria';
    setStaffRole(s, ctx, id, 'aprendiz');
    const gold = s.gold;
    pass(s, ctx, 3);
    expect(s.gold).toBe(gold - def.wage);
    fireWorker(s, ctx, id);
    expect(s.staff.hired).toEqual([]);
    expect(s.staff.shops.herreria.staff).toEqual([]);
  });

  it('si no se le paga, renuncia', () => {
    const { s, ctx } = setup();
    refreshWorkerMarket(s, ctx.c, ctx.rng);
    const id = s.staff.market.valdebrasa.offer[0];
    s.location = 'tablon';
    s.gold = 500;
    hireWorker(s, ctx, id);
    s.gold = 0;
    s.location = 'herreria';
    const events = pass(s, ctx, 3 * 5);
    expect(s.staff.hired).toEqual([]);
    expect(toasts(events).join(' ')).toMatch(/renunció/);
  });
});

describe('partidas guardadas', () => {
  it('el ayudante de una partida vieja pasa a ser el vendedor', () => {
    const st = createInitialState(CONTENT, 1) as unknown as Record<string, unknown>;
    const ch = createMercenary(CONTENT.mercenaries.yago);
    ch.bond = 'esclavo';
    (st.characters as Record<string, unknown>).yago = ch;
    delete st.staff;
    st.assistant = 'yago';
    const v7 = { ...makeSaveFile(st as unknown as GameState), version: 7 };
    const out = migrateSave(JSON.parse(JSON.stringify(v7)));
    expect(out.state.staff.shops.herreria.staff).toEqual([{ id: 'yago', role: 'vendedor' }]);
    expect((out.state as unknown as Record<string, unknown>).assistant).toBeUndefined();
  });
});

describe('sucursales', () => {
  it('se compran con oro y reputación, tienen su vidriera y su personal, y venden con los clientes de su ciudad', () => {
    const { s, ctx } = setup();
    s.city = 'puertoseco';
    s.location = 'ps_taller';
    s.gold = 2000;
    expect(branchBlock(ctx.c, s)).toMatch(/reputación/);
    s.reputation.puertoseco = 40;
    buyBranch(s, ctx);
    expect(s.staff.branches).toEqual(['ps_taller']);
    // La vidriera del taller es aparte de la de la herrería.
    const home = makeItem(s, 'daga', DAGA, 50);
    home.exhibited = true;
    const here = makeItem(s, 'daga', DAGA, 50);
    toggleExhibit(s, ctx, here.uid);
    expect(here.shopId).toBe('ps_taller');
    expect(exhibitedItems(s, 'ps_taller').map((i) => i.uid)).toEqual([here.uid]);
    expect(exhibitedItems(s).map((i) => i.uid)).toEqual([home.uid]);
    // Un esclavo que viaja con vos se puede quedar a atender; uno que espera en Valdebrasa, no.
    buyServant(s, 'yago', 50);
    buyServant(s, 'sabela', 50);
    s.party = s.party.filter((p) => p !== 'sabela');
    expect(joinBlock(ctx.c, s, 'sabela', 'ps_taller')).toMatch(/grupo/);
    assignStaff(s, ctx, 'yago', 'vendedor');
    expect(s.staff.shops.ps_taller.staff[0].id).toBe('yago');
    for (let i = 0; i < 6; i++) toggleExhibit(s, ctx, makeItem(s, 'daga', DAGA, 50).uid);
    s.location = 'ps_posada';
    const gold = s.gold;
    pass(s, ctx, 6);
    expect(s.gold).toBeGreaterThan(gold);
    expect(exhibitedItems(s, 'ps_taller').length).toBeLessThan(7);
    // Lo de la herrería no se tocó.
    expect(home.exhibited).toBe(true);
  });

  it('lo que contratás en la ciudad de un taller tuyo va a trabajar ahí', () => {
    const { s, ctx } = setup();
    s.city = 'puertoseco';
    s.staff.branches.push('ps_taller');
    refreshWorkerMarket(s, ctx.c, ctx.rng);
    s.location = 'ps_gremio';
    s.gold = 500;
    const id = s.staff.market.puertoseco.offer[0];
    expect(hireTarget(ctx.c, s)).toBe('ps_taller');
    hireWorker(s, ctx, id);
    expect(s.staff.shops.ps_taller.staff.map((m) => m.id)).toEqual([id]);
  });
});
