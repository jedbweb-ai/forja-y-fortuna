import { useEffect, useState } from 'react';
import { displaySlots } from '../../core/progress/progress';
import {
  acceptOffer, askPrice, closeShop, customerCount, declineCustomer, exhibitedItems, nextCustomer, openShop, suggestedPrice, toggleExhibit,
} from '../../core/economy/shop';
import { slotName } from '../../core/time';
import { Panel } from '../components/Panel';
import { money, RARITY_CLASS } from '../format';
import { store, useGame } from '../hooks';

export function ShopPanel() {
  const s = useGame();
  if (s.location !== 'herreria') return <Panel title="Tienda"><p>La tienda se atiende desde tu herrería.</p></Panel>;
  return s.shop ? <ShopSessionView /> : <ShopSetup />;
}

function ShopSetup() {
  const s = useGame();
  const shown = exhibitedItems(s).length;
  return (
    <Panel
      title="Tu tienda"
      subtitle={`Exhibición ${shown}/${displaySlots(store.content, s)} · Esperás unos ${customerCount(s)} clientes esta ${slotName(s)}`}
      footer={
        <button className="btn primary big" disabled={!!s.forge} onClick={() => store.run(openShop)}>
          🛎️ Abrir la tienda · consume la franja
        </button>
      }
    >
      {s.forge && <p className="bad-text">Tenés una pieza en el yunque: terminala antes de abrir.</p>}
      {!s.items.length && <p className="muted">No tenés nada para vender. ¡Andá a forjar!</p>}
      <ul className="item-rows">
        {s.items.filter((i) => !i.equippedBy).map((i) => (
          <li key={i.uid} className={RARITY_CLASS[i.rarity]}>
            <label className="check">
              <input type="checkbox" checked={i.exhibited} onChange={() => store.run(toggleExhibit, i.uid)} />
              <span className="swatch" style={{ background: i.color }} />
              <span className="grow">
                <b>{i.name}</b>
                <small className="muted">{i.rarity} · calidad {i.quality}{i.quantity > 1 ? ` · ×${i.quantity}` : ''}</small>
              </span>
              <span>🪙 {money(i.value)}{i.quantity > 1 ? ' c/u' : ''}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="muted small">Los clientes miran lo que está en exhibición. Cada tipo de cliente busca cosas distintas: los guardias, defensa; los cazadores, flechas y arcos; los nobles, piezas bellas y grabadas.</p>
    </Panel>
  );
}

function ShopSessionView() {
  const s = useGame();
  const c = store.content;
  const sh = s.shop!;
  const customer = sh.customers[sh.index];
  const type = customer && c.customers[customer.typeId];
  const n = sh.negotiation;
  const item = n && s.items.find((i) => i.uid === n.itemUid);
  const suggested = suggestedPrice(s);
  const [price, setPrice] = useState(suggested);
  useEffect(() => setPrice(suggested), [suggested, sh.index]);
  const remaining = sh.customers.length - sh.index - 1;
  const done = !customer;

  return (
    <Panel
      title="Tienda abierta"
      subtitle={`Cliente ${Math.min(sh.index + 1, sh.customers.length)} de ${sh.customers.length} · Ganado hoy: 🪙 ${sh.earned}`}
      onClose={() => store.closePanel()}
      footer={
        sh.status !== 'negotiating' && (
          <div className="row">
            {!done && remaining > 0 && <button className="btn primary big" onClick={() => store.run(nextCustomer)}>Siguiente cliente ({remaining})</button>}
            <button className={`btn big ${done || remaining === 0 ? 'primary' : ''}`} onClick={() => { if (store.run(closeShop)) store.closePanel(); }}>
              Cerrar la tienda
            </button>
          </div>
        )
      }
    >
      {!done && (
        <div className="customer">
          <div className="customer-head">
            <span className="portrait small" style={{ background: `#${customer.look.body.toString(16).padStart(6, '0')}` }} />
            <div>
              <b>{customer.name}</b> <span className="muted">· {type.name}</span>
              {n && <div className="patience">Paciencia: {'●'.repeat(Math.max(0, n.patience))}{'○'.repeat(Math.max(0, type.patience - n.patience))}</div>}
            </div>
          </div>
          <blockquote className="speech">{sh.line}</blockquote>

          {n && item && (
            <div className="haggle">
              <div className="muted">
                {n.qty > 1 ? `${n.qty}× ` : ''}{item.name} · valor base 🪙 {suggested}
              </div>
              <div className="price-row">
                <button className="btn" onClick={() => setPrice(Math.max(1, Math.round(price * 0.9)))}>−10%</button>
                <input
                  type="number" inputMode="numeric" min={1} value={price}
                  onChange={(e) => setPrice(Math.max(1, Number(e.target.value) || 1))} aria-label="Precio"
                />
                <button className="btn" onClick={() => setPrice(Math.round(price * 1.1))}>+10%</button>
                <button className="btn" onClick={() => setPrice(Math.round(suggested * 1.25))}>+25% sobre valor</button>
              </div>
              <div className="row">
                <button className="btn primary big" onClick={() => store.run(askPrice, price)}>Pedir 🪙 {price}</button>
                {n.rounds > 0 && <button className="btn big good" onClick={() => store.run(acceptOffer)}>Aceptar 🪙 {n.lastOffer}</button>}
                {n.rounds === 0 && <button className="btn big good" onClick={() => store.run(askPrice, n.opening)}>Aceptar 🪙 {n.opening}</button>}
                <button className="btn" onClick={() => store.run(declineCustomer)}>No vender</button>
              </div>
            </div>
          )}
        </div>
      )}
      {(done || (remaining <= 0 && sh.status === 'resolved')) && (
        <div className="shop-summary">
          <h3>Fin de la jornada</h3>
          {sh.sold.length ? (
            <ul>{sh.sold.map((x, i) => <li key={i}>{x.qty > 1 ? `${x.qty}× ` : ''}{x.itemName} → {x.customer}: 🪙 {x.price}</li>)}</ul>
          ) : <p className="muted">No vendiste nada esta vez.</p>}
        </div>
      )}
    </Panel>
  );
}
