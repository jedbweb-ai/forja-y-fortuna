import { describe, expect, it } from 'vitest';
import { goTo } from '../city';
import { forgeBegin, forgeComplete, forgeFinish, forgeQuench, forgeStop, forgeStrike } from '../forge/commands';
import { fixedRng } from '../rng';
import { setup, withRng } from '../testUtils';
import type { GameState } from '../types';
import type { Ctx } from '../content';
import { buyMaterial, quickSell } from './market';
import { acceptOffer, askPrice, closeShop, currentOffer, declineCustomer, minAsk, nextCustomer, openShop, startingAsk, suggestedPrice } from './shop';

function forgeDagger(s: GameState, ctx: Ctx) {
  forgeBegin(s, ctx, 'daga', { hoja: 'hierro', guarda: 'hierro', mango: 'pino' });
  const good = withRng(ctx, fixedRng([0.99, 0.5, 0.99]));
  for (let i = 0; i < 4; i++) forgeStrike(s, good);
  forgeStop(s, ctx);
  forgeQuench(s, ctx, 'aceite');
  forgeFinish(s, ctx, { grip: 'grip_ninguno', polish: 'pulido_basico', engraving: 'grabado_ninguno' });
  forgeComplete(s, ctx, []);
}

/** Abre la tienda y avanza hasta un cliente que quiera negociar. */
function openUntilNegotiation(s: GameState, ctx: Ctx) {
  openShop(s, ctx);
  while (s.shop!.status !== 'negotiating' && s.shop!.index < s.shop!.customers.length) nextCustomer(s, ctx);
  return s.shop!.negotiation;
}

describe('tienda', () => {
  it('genera clientes según la franja', () => {
    const { s, ctx } = setup();
    openShop(s, ctx);
    expect(s.shop!.customers.length).toBeGreaterThan(0);
  });

  it('vende si el precio pedido está dentro de lo que el cliente paga', () => {
    const { s, ctx } = setup(3);
    for (let i = 0; i < 3; i++) forgeDagger(s, ctx);
    s.slot = 0;
    const n = openUntilNegotiation(s, ctx);
    expect(n).not.toBeNull();
    const goldBefore = s.gold;
    askPrice(s, ctx, n!.maxPrice);
    expect(s.gold).toBe(goldBefore + n!.maxPrice);
    expect(s.shop!.status).toBe('resolved');
    expect(s.items.length).toBe(2);
  });

  it('un precio abusivo espanta al cliente y baja la reputación', () => {
    const { s, ctx } = setup(3);
    for (let i = 0; i < 3; i++) forgeDagger(s, ctx);
    s.slot = 0;
    const n = openUntilNegotiation(s, ctx)!;
    askPrice(s, ctx, n.maxPrice * 5);
    expect(s.shop!.status).toBe('resolved');
    expect(s.reputation.valdebrasa).toBeLessThan(0);
  });

  it('regateo: contraoferta que se puede aceptar', () => {
    const { s, ctx } = setup(3);
    for (let i = 0; i < 3; i++) forgeDagger(s, ctx);
    s.slot = 0;
    const n = openUntilNegotiation(s, ctx)!;
    const max = n.maxPrice;
    askPrice(s, ctx, Math.round(max * 1.3));
    if (s.shop!.status === 'negotiating') {
      const offer = s.shop!.negotiation!.lastOffer;
      expect(offer).toBeLessThanOrEqual(max);
      const goldBefore = s.gold;
      acceptOffer(s, ctx);
      expect(s.gold).toBe(goldBefore + offer);
    }
  });

  it('tu pedido arranca unas monedas por encima de la oferta del cliente, nunca por debajo', () => {
    const { s, ctx } = setup(3);
    for (let i = 0; i < 3; i++) forgeDagger(s, ctx);
    s.slot = 0;
    const n = openUntilNegotiation(s, ctx)!;
    // Si el cliente ofrece más que el valor del objeto, el pedido arranca por encima de su oferta.
    n.opening = suggestedPrice(s) + 10;
    expect(currentOffer(s)).toBe(n.opening);
    expect(startingAsk(s)).toBeGreaterThan(n.opening);
    expect(startingAsk(s)).toBe(n.opening + Math.max(1, Math.round(n.opening * 0.1)));
    expect(minAsk(s)).toBe(n.opening);
    // Si ofrece menos que el valor, arranca en el valor.
    n.opening = Math.max(1, Math.floor(suggestedPrice(s) / 2));
    expect(startingAsk(s)).toBe(Math.max(suggestedPrice(s), n.opening + Math.max(1, Math.round(n.opening * 0.1))));
    expect(startingAsk(s)).toBeGreaterThan(n.opening);
    // Después de una contraoferta, el piso es la contraoferta.
    n.rounds = 1;
    n.lastOffer = suggestedPrice(s) * 3;
    expect(minAsk(s)).toBe(n.lastOffer);
    expect(startingAsk(s)).toBeGreaterThan(n.lastOffer);
  });

  it('cerrar la tienda gasta la franja', () => {
    const { s, ctx } = setup();
    openShop(s, ctx);
    if (s.shop!.status === 'negotiating') declineCustomer(s, ctx);
    closeShop(s, ctx);
    expect(s.shop).toBeNull();
    expect(s.slot).toBe(1);
  });
});

describe('mercado', () => {
  it('compra materiales con oro', () => {
    const { s, ctx } = setup();
    goTo(s, ctx, 'mercado');
    const gold = s.gold;
    buyMaterial(s, ctx, 'acero', 2);
    expect(s.materials.acero).toBe(2);
    expect(s.gold).toBe(gold - 40);
    expect(() => buyMaterial(s, ctx, 'acero', 999)).toThrow();
  });

  it('la venta rápida paga menos que el valor', () => {
    const { s, ctx } = setup();
    forgeDagger(s, ctx);
    const item = s.items[0];
    goTo(s, ctx, 'mercado');
    const gold = s.gold;
    quickSell(s, ctx, item.uid, 1);
    expect(s.gold - gold).toBeLessThan(item.value);
    expect(s.items).toHaveLength(0);
  });
});
