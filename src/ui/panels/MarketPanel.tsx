import { useState } from 'react';
import { cityLocation } from '../../core/city';
import { buyMaterial, marketStock, quickSell, quickSellPrice } from '../../core/economy/market';
import { materialPrice, materialStock } from '../../core/economy/monsterMarket';
import type { MaterialType } from '../../core/types';
import { Panel, Tabs } from '../components/Panel';
import { MATERIAL_TYPE_LABEL, money } from '../format';
import { store, useGame } from '../hooks';

export function MarketPanel() {
  const s = useGame();
  const c = store.content;
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const stock = marketStock(c, s.location).map((id) => c.materials[id]);
  const groups = [...new Set(stock.map((m) => m.type))] as MaterialType[];

  return (
    <Panel title={s.location === 'mercado' ? 'Puesto de Ilse' : cityLocation(c, s.location)?.name ?? 'Tienda'} subtitle={`🪙 ${Math.floor(s.gold)} disponibles`} wide>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'buy', label: 'Comprar materiales' }, { id: 'sell', label: 'Venta rápida' }]} />
      {tab === 'buy' && s.market && s.location === 'mercado' && (
        <div className="news">
          <b>📰 Noticias del día {s.market.day}</b>
          {s.market.news.map((n) => <p key={n} className="small">{n}</p>)}
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
              return (
                <li key={m.id} className={limited && left === 0 ? 'dim' : ''}>
                  <span className="swatch" style={{ background: m.color }} />
                  <span className="grow">
                    <b>{m.name}</b> <small className="muted">tier {m.tier} · tenés {s.materials[m.id] ?? 0}{limited ? ` · ${left ? `quedan ${left}` : 'agotado hoy'}` : ''}</small>
                    <small className="muted block">{m.description}</small>
                  </span>
                  <span className="price">🪙 {price} {trend && <small className={price > m.price ? 'bad-text' : 'good-text'}>{trend}</small>}</span>
                  <button className="btn" disabled={s.gold < price || left < 1} onClick={() => store.run(buyMaterial, m.id, 1)}>+1</button>
                  <button className="btn" disabled={s.gold < price * 5 || left < 5} onClick={() => store.run(buyMaterial, m.id, 5)}>+5</button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {tab === 'sell' && (
        <>
          <p className="muted small">Venta al por mayor: plata rápida, pero pagan menos de la mitad del valor.</p>
          {!s.items.length && <p className="muted">No tenés objetos para vender.</p>}
          <ul className="item-rows">
            {s.items.filter((i) => !i.equippedBy).map((i) => (
              <li key={i.uid}>
                <span className="swatch" style={{ background: i.color }} />
                <span className="grow"><b>{i.name}</b> <small className="muted">{i.rarity}{i.quantity > 1 ? ` · ×${i.quantity}` : ''} · valor {money(i.value * i.quantity)}</small></span>
                <button className="btn" onClick={() => store.run(quickSell, i.uid, i.quantity)}>Vender por 🪙 {quickSellPrice(i.value, i.quantity)}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
