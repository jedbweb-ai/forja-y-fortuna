import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../config/balance';
import { runCommand } from '../commands';
import { buyMaterial, quickSell, quickSellPrice } from '../economy/market';
import { materialPrice } from '../economy/monsterMarket';
import { partyUnits } from '../combat/engine';
import { fixedRng } from '../rng';
import { relationLevel } from '../state';
import { makeItem, setup, toasts } from '../testUtils';
import { advanceTime } from '../time';
import {
  auctionBid, auctionLeave, auctionNext, auctionPass, auctionStart, consignItem, dailyAuction, prepareLots,
} from './auction';
import { chooseEventOption, customerMult, startCityEvent } from './cityEvents';
import { acceptContract, deliverContract, refreshContractOffers } from './contracts';
import { demandOf, registerSale } from './demand';
import { abandonQuest, acceptQuest, deliverQuest, recordKills, startQuest } from './quests';
import { claimPerks, exclusiveStock, giftPoints, giveGift, refusesTrade, tradeMult } from './relations';
import { buyServant, freeServant, loyaltyCombat, servantEscapes, wageFor } from './servants';

describe('relaciones y regalos', () => {
  it('cada NPC reacciona según sus gustos y se anota lo descubierto', () => {
    const { s, ctx } = setup();
    s.location = 'mercado';
    s.slot = 0;
    s.materials.acero = 2;
    const before = s.npcs.ilse.relation;
    const ev = giveGift(s, ctx, 'ilse', { kind: 'material', id: 'acero' });
    expect(s.npcs.ilse.relation).toBe(before + BALANCE.relations.giftPoints.ama * BALANCE.relations.materialGiftMult);
    expect(s.npcs.ilse.knownTastes).toContain('ama:acero');
    expect(toasts(ev)[0]).toMatch(/encantó/);
    // Un regalo por día.
    expect(() => giveGift(s, ctx, 'ilse', { kind: 'material', id: 'acero' })).toThrow();
  });

  it('una pieza forjada por vos vale más que el material suelto', () => {
    const { s, ctx } = setup();
    const it = makeItem(s, 'escudo_mediano', { tablas: 'roble', refuerzo: 'hierro', correas: 'cuero_curtido' }, 60);
    const forged = giftPoints(ctx.c, s, 'aldana', { kind: 'item', uid: it.uid });
    expect(forged.taste).toBe('ama');
    expect(forged.points).toBeGreaterThan(BALANCE.relations.giftPoints.ama);
  });

  it('el dueño cobra según la relación, no atiende si es hostil y da exclusivos a los amigos', () => {
    const { s, ctx } = setup();
    s.location = 'mercado';
    expect(tradeMult(ctx.c, s, 'mercado')).toBe(1);
    s.npcs.ilse.relation = 50;
    expect(tradeMult(ctx.c, s, 'mercado')).toBeCloseTo(0.9);
    expect(exclusiveStock(ctx.c, s, 'mercado')).toContain('esmeralda');
    expect(materialPrice(ctx.c, s, 'hierro')).toBeLessThan(ctx.c.materials.hierro.price);
    s.npcs.ilse.relation = -80;
    expect(refusesTrade(ctx.c, s, 'mercado')).toBeTruthy();
    s.gold = 999;
    expect(() => buyMaterial(s, ctx, 'hierro', 1)).toThrow();
  });

  it('al subir de nivel el NPC enseña lo suyo una sola vez', () => {
    const { s, ctx } = setup();
    s.npcs.aldana.relation = 50;
    const ev = claimPerks(s, ctx.c);
    expect(s.knownBlueprints).toContain('cota_malla');
    expect(toasts(ev).some((t) => t.includes('Cota de malla'))).toBe(true);
    expect(claimPerks(s, ctx.c)).toEqual([]);
  });

  it('un NPC hostil habla mal de vos y baja la reputación', () => {
    const { s, ctx } = setup();
    s.npcs.ruperto.relation = -90;
    s.reputation.valdebrasa = 20;
    for (let i = 0; i < 30; i++) runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(s.reputation.valdebrasa).toBeLessThan(20);
  });
});

describe('encargos', () => {
  it('los avisos aparecen solos y se aceptan en su tablero', () => {
    const { s, ctx } = setup();
    runCommand(s, ctx, () => []);
    const offer = s.quests.offers.find((o) => o.board === 'gremio')!;
    expect(offer).toBeTruthy();
    expect(() => acceptQuest(s, ctx, offer.id)).toThrow(/gremio/);
    s.location = 'gremio';
    acceptQuest(s, ctx, offer.id);
    expect(s.quests.active[0].id).toBe(offer.id);
  });

  it('se entrega una pieza que cumple y se cobra el premio', () => {
    const { s, ctx } = setup();
    startQuest(s, ctx.c, 'g_escudo');
    const uid = s.quests.active[0].uid;
    expect(() => deliverQuest(s, ctx, uid)).toThrow();
    makeItem(s, 'escudo_mediano', { tablas: 'roble', refuerzo: 'hierro', correas: 'cuero_curtido' }, 60);
    const gold = s.gold;
    deliverQuest(s, ctx, uid);
    expect(s.gold).toBe(gold + ctx.c.quests.g_escudo.reward.gold!);
    expect(s.items.some((i) => i.category === 'escudo')).toBe(false);
    expect(s.quests.done).toContain('g_escudo');
  });

  it('las cacerías cuentan presas y un encargo vencido falla con castigo', () => {
    const { s, ctx } = setup();
    startQuest(s, ctx.c, 'g_gelines');
    recordKills(s, ctx.c, 'linde_brezal', ['gelin_verde', 'gelin_acido', 'lobo_gris']);
    expect(s.quests.active[0].progress).toBe(2);
    s.reputation.valdebrasa = 10;
    runCommand(s, ctx, (st) => advanceTime(st, 3 * 7));
    expect(s.quests.active).toHaveLength(0);
    expect(s.quests.failed).toContain('g_gelines');
    expect(s.reputation.valdebrasa).toBeLessThan(10);
  });

  it('abandonar baja la relación con quien lo pidió', () => {
    const { s, ctx } = setup();
    startQuest(s, ctx.c, 'n_aldana_prueba');
    abandonQuest(s, ctx, s.quests.active[0].uid);
    expect(s.npcs.aldana.relation).toBeLessThan(0);
  });
});

describe('contratos', () => {
  it('se cobra por entrega y, si una entrega vence sin cumplir, se rompe', () => {
    const { s, ctx } = setup();
    s.contracts.offers = [{ id: 'k_picos', until: 99, city: 'valdebrasa' }];
    s.location = 'gremio';
    acceptContract(s, ctx, 'k_picos');
    const uid = s.contracts.active[0].uid;
    makeItem(s, 'pico', { cabeza: 'hierro', mango: 'roble' }, 50);
    const gold = s.gold;
    deliverContract(s, ctx, uid);
    expect(s.gold).toBe(gold + ctx.c.contracts.k_picos.pricePerUnit);
    expect(s.contracts.active[0].delivered).toBe(1);
    // Vence la primera entrega (2 picos) con solo 1 entregado.
    runCommand(s, ctx, (st) => advanceTime(st, 3 * 4));
    expect(s.contracts.active).toHaveLength(0);
    expect(s.npcs.odalrico.relation).toBeLessThan(2);
  });

  it('Ruperto enojado se queda a veces con un contrato', () => {
    const { s, ctx } = setup();
    s.npcs.ruperto.relation = -60;
    const ev = refreshContractOffers(s, ctx.c, fixedRng([0.1, 0.2, 0.0, 0.1]));
    expect(s.contracts.lostToRival.length + s.contracts.offers.length).toBeGreaterThan(0);
    if (s.contracts.lostToRival.length) expect(toasts(ev)[0]).toMatch(/Ruperto/);
  });
});

describe('demanda y eventos', () => {
  it('vender mucho de lo mismo baja el precio y se recupera con los días', () => {
    const { s, ctx } = setup();
    s.location = 'mercado';
    const a = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }, 50);
    const first = quickSellPrice(s, a, 1);
    quickSell(s, ctx, a.uid, 1);
    for (let i = 0; i < 5; i++) registerSale(s, 'arma', 1);
    const b = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }, 50);
    expect(quickSellPrice(s, b, 1)).toBeLessThan(first);
    const low = demandOf(s, 'arma');
    runCommand(s, ctx, (st) => advanceTime(st, 6));
    expect(demandOf(s, 'arma')).toBeGreaterThan(low);
  });

  it('un evento mueve clientes y demanda, y las decisiones toman partido', () => {
    const { s, ctx } = setup();
    startCityEvent(s, ctx.c, ctx.rng, 'goblins_camino');
    expect(customerMult(ctx.c, s, 'guardia')).toBeGreaterThan(1);
    runCommand(s, ctx, (st) => advanceTime(st, 3));
    expect(demandOf(s, 'arma')).toBeGreaterThan(1);
    s.location = 'tablon';
    s.gold = 100;
    chooseEventOption(s, ctx, 'goblins_camino', 0);
    expect(s.npcs.braulio.relation).toBe(8);
    expect(() => chooseEventOption(s, ctx, 'goblins_camino', 1)).toThrow();
  });
});

describe('gran subasta', () => {
  it('se anuncia antes y los lotes salen de la tabla', () => {
    const { s, ctx } = setup();
    s.day = s.auction.day - BALANCE.auction.announceDays - 1;
    prepareLots(s, ctx.c, ctx.rng);
    expect(s.auction.lots).toHaveLength(0);
    s.day += 1;
    prepareLots(s, ctx.c, ctx.rng);
    expect(s.auction.lots.length).toBeGreaterThanOrEqual(BALANCE.auction.lots[0]);
  });

  it('se puja por rondas y lo ganado llega al inventario', () => {
    const { s, ctx } = setup();
    s.day = s.auction.day;
    s.location = 'subastas';
    s.gold = 5000;
    s.auction.lots = [{ lotId: 'l_brasalita', base: 70, name: 'Barras de brasalita' }];
    auctionStart(s, ctx);
    let guard = 0;
    while (s.auction.session!.status === 'bidding' && guard++ < 60) auctionBid(s, ctx);
    const sess = s.auction.session!;
    expect(sess.status).toBe('sold');
    expect(sess.results[0].winner).toBe('Vos');
    expect(s.materials.brasalita).toBeGreaterThanOrEqual(6);
    auctionNext(s, ctx);
    const slot = s.slot;
    auctionLeave(s, ctx);
    expect(s.auction.session).toBeNull();
    expect(s.slot).not.toBe(slot);
  });

  it('si pasás, los demás pujan entre ellos', () => {
    const { s, ctx } = setup();
    s.day = s.auction.day;
    s.location = 'subastas';
    s.auction.lots = [{ lotId: 'l_opalos', base: 120, name: 'Dos ópalos lunares' }];
    auctionStart(s, ctx);
    auctionPass(s, ctx);
    expect(['sold', 'unsold']).toContain(s.auction.session!.status);
    expect(s.materials.opalo_lunar ?? 0).toBe(0);
  });

  it('lo consignado se vende aunque no vayas', () => {
    const { s, ctx } = setup();
    s.day = s.auction.day - 1;
    s.location = 'subastas';
    const it = makeItem(s, 'espada_larga', { hoja: 'acero', guarda: 'acero', mango: 'cuero_endurecido', pomo: 'acero' }, 80);
    consignItem(s, ctx, it.uid, 1);
    expect(s.items.find((i) => i.uid === it.uid)).toBeUndefined();
    s.day += 2;
    const gold = s.gold;
    dailyAuction(s, ctx.c, ctx.rng);
    const sold = s.gold > gold;
    const back = s.items.some((i) => i.uid === it.uid);
    expect(sold || back).toBe(true);
    expect(s.auction.day).toBeGreaterThan(s.day - 1);
  });
});

describe('mercado de esclavos y lealtad', () => {
  function buy(seed = 3) {
    const { s, ctx } = setup(seed);
    s.location = 'esclavos';
    s.gold = 500;
    s.servantMarket.offer = ['yago'];
    buyServant(s, ctx, 'yago');
    return { s, ctx };
  }

  it('se compra una vez, no cobra y arranca con poca lealtad', () => {
    const { s } = buy();
    expect(s.party).toContain('yago');
    expect(s.characters.yago.bond).toBe('esclavo');
    expect(wageFor(s, s.characters.yago)).toBe(0);
    expect(relationLevel(s.npcs.yago.relation)).toBe('hostil');
    expect(s.servantMarket.offer).not.toContain('yago');
  });

  it('con poca lealtad pelea peor y a veces no obedece; con mucha, mejor', () => {
    const { s, ctx } = buy();
    const hostile = loyaltyCombat(s, s.characters.yago);
    expect(hostile.mult).toBeLessThan(1);
    expect(hostile.disobey).toBeGreaterThan(0);
    const unit = partyUnits(ctx.c, s, ['yago'])[0];
    expect(unit.disobey).toBeGreaterThan(0);
    s.npcs.yago.relation = 80;
    expect(loyaltyCombat(s, s.characters.yago).mult).toBeGreaterThan(1);
    expect(loyaltyCombat(s, s.characters.yago).disobey).toBe(0);
  });

  it('si te odia, puede escaparse con lo puesto', () => {
    const { s } = buy();
    const sword = makeItem(s, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' }, 40);
    s.characters.yago.equipment.arma = sword.uid;
    sword.equippedBy = 'yago';
    const ev = servantEscapes(s, fixedRng([0]), ['yago']);
    expect(toasts(ev)[0]).toMatch(/escapó/);
    expect(s.party).not.toContain('yago');
    expect(s.characters.yago.escaped).toBe(true);
    expect(s.items.find((i) => i.uid === sword.uid)).toBeUndefined();
  });

  it('liberarlo da lealtad máxima pero empieza a cobrar', () => {
    const { s, ctx } = buy();
    freeServant(s, ctx, 'yago');
    expect(s.characters.yago.bond).toBe('liberado');
    expect(relationLevel(s.npcs.yago.relation)).toBe('aliado');
    expect(wageFor(s, s.characters.yago)).toBeGreaterThan(0);
    expect(loyaltyCombat(s, s.characters.yago).disobey).toBe(0);
  });

  it('los mercenarios con buena relación cobran menos', () => {
    const { s } = setup();
    s.characters.brunilda = { ...s.characters.herrero, id: 'brunilda', wage: 20 };
    expect(wageFor(s, s.characters.brunilda)).toBe(20);
    s.npcs.brunilda.relation = 80;
    expect(wageFor(s, s.characters.brunilda)).toBeLessThan(20);
  });
});
