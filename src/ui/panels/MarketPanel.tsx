import { useState } from 'react';
import { buyMaterial, marketStock, quickSell, quickSellPrice } from '../../core/economy/market';
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
    <Panel title="Puesto de Ilse" subtitle={`🪙 ${Math.floor(s.gold)} disponibles`} wide>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'buy', label: 'Comprar materiales' }, { id: 'sell', label: 'Venta rápida' }]} />
      {tab === 'buy' && groups.map((g) => (
        <section key={g} className="market-group">
          <h4>{MATERIAL_TYPE_LABEL[g]}</h4>
          <ul className="item-rows">
            {stock.filter((m) => m.type === g).map((m) => (
              <li key={m.id}>
                <span className="swatch" style={{ background: m.color }} />
                <span className="grow">
                  <b>{m.name}</b> <small className="muted">tier {m.tier} · tenés {s.materials[m.id] ?? 0}</small>
                  <small className="muted block">{m.description}</small>
                </span>
                <span className="price">🪙 {m.price}</span>
                <button className="btn" disabled={s.gold < m.price} onClick={() => store.run(buyMaterial, m.id, 1)}>+1</button>
                <button className="btn" disabled={s.gold < m.price * 5} onClick={() => store.run(buyMaterial, m.id, 5)}>+5</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {tab === 'sell' && (
        <>
          <p className="muted small">Venta al por mayor: plata rápida, pero pagan menos de la mitad del valor.</p>
          {!s.items.length && <p className="muted">No tenés objetos para vender.</p>}
          <ul className="item-rows">
            {s.items.map((i) => (
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
