import { useState } from 'react';
import { cityLocation } from '../../core/city';
import { buyMaterial, marketStock, quickSell, quickSellPrice } from '../../core/economy/market';
import { materialPrice, materialStock } from '../../core/economy/monsterMarket';
import { activeEvents } from '../../core/town/cityEvents';
import { exclusiveStock, npcLevel, ownerOf, refusesTrade, tradeMult } from '../../core/town/relations';
import type { MaterialType } from '../../core/types';
import { DemandTag } from '../components/DemandTag';
import { Panel, Tabs } from '../components/Panel';
import { MATERIAL_TYPE_LABEL, money } from '../format';
import { store, useGame } from '../hooks';
import { Swatch, itemIcon } from '../components/Swatch';

export function MarketPanel() {
  const s = useGame();
  const c = store.content;
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const stock = marketStock(c, s, s.location).map((id) => c.materials[id]);
  const exclusive = exclusiveStock(c, s, s.location);
  const groups = [...new Set(stock.map((m) => m.type))] as MaterialType[];
  const owner = ownerOf(c, s.location);
  const refuse = refusesTrade(c, s, s.location);
  const mult = tradeMult(c, s, s.location);
  const events = activeEvents(c, s);
  const here = cityLocation(c, s.location);
  const canSellHere = here?.kind === 'mercado' || here?.kind === 'muelle';

  return (
    <Panel title={s.location === 'mercado' ? 'Puesto de Ilse' : cityLocation(c, s.location)?.name ?? 'Tienda'} subtitle={`🪙 ${Math.floor(s.gold)} disponibles`} wide>
      <Tabs
        value={tab}
        onChange={setTab}
        options={canSellHere ? [{ id: 'buy', label: 'Comprar materiales' }, { id: 'sell', label: 'Venta rápida' }] : [{ id: 'buy', label: 'Comprar' }]}
      />
      {owner && (
        <p className={`small ${refuse ? 'bad-text' : 'muted'}`}>
          {refuse ?? `${c.npcs[owner].name} · relación ${npcLevel(s, owner)}${mult !== 1 ? ` · precios ${mult < 1 ? '−' : '+'}${Math.round(Math.abs(1 - mult) * 100)}%` : ''}`}
        </p>
      )}
      {tab === 'buy' && s.market && canSellHere && (
        <div className="news">
          <b>📰 Noticias del día {s.market.day}</b>
          {s.market.news.map((n) => <p key={n} className="small">{n}</p>)}
          {events.map((e) => <p key={e.id} className="small">📢 {e.name}</p>)}
          <p className="small muted">Las partes de monstruo llegan en cantidad limitada y salen caras: cazarlas en las expediciones rinde más.</p>
        </div>
      )}
      {tab === 'buy' && groups.map((g) => (
        <section key={g} className="market-group">
          <h4>{MATERIAL_TYPE_LABEL[g]}</h4>
          <ul className="item-rows">
            {stock.filter((m) => m.type === g).map((m) => {
              const price = materialPrice(c, s, m.id);
              const left = materialStock(c, s, m.id);
              const limited = Number.isFinite(left);
              const trend = price > m.price ? '▲' : price < m.price ? '▼' : '';
              const blocked = !!refuse;
              return (
                <li key={m.id} className={limited && left === 0 ? 'dim' : ''}>
                  <Swatch icon={`icon.${m.id}`} color={m.color} />
                  <span className="grow">
                    <b>{m.name}</b> {exclusive.includes(m.id) && <span className="tag secret">exclusivo</span>}{' '}
                    <small className="muted">tier {m.tier} · tenés {s.materials[m.id] ?? 0}{limited ? ` · ${left ? `quedan ${left}` : 'agotado hoy'}` : ''}</small>
                    <small className="muted block">{m.description}</small>
                  </span>
                  <span className="price">🪙 {price} {trend && <small className={price > m.price ? 'bad-text' : 'good-text'}>{trend}</small>}</span>
                  <button className="btn" disabled={blocked || s.gold < price || left < 1} onClick={() => store.run(buyMaterial, m.id, 1)}>+1</button>
                  <button className="btn" disabled={blocked || s.gold < price * 5 || left < 5} onClick={() => store.run(buyMaterial, m.id, 5)}>+5</button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {tab === 'sell' && (
        <>
          <p className="muted small">Venta al por mayor: plata rápida, pero pagan menos de la mitad del valor. Vender mucho de lo mismo baja la demanda (y el precio) unos días.</p>
          {!s.items.length && <p className="muted">No tenés objetos para vender.</p>}
          <ul className="item-rows">
            {s.items.filter((i) => !i.equippedBy).map((i) => (
              <li key={i.uid}>
                <Swatch icon={itemIcon(i)} color={i.color} />
                <span className="grow">
                  <b>{i.name}</b> <DemandTag category={i.category} />
                  <small className="muted block">{i.rarity}{i.quantity > 1 ? ` · ×${i.quantity}` : ''} · valor {money(i.value * i.quantity)}</small>
                </span>
                <button className="btn" onClick={() => store.run(quickSell, i.uid, i.quantity)}>Vender por 🪙 {quickSellPrice(s, i, i.quantity)}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
