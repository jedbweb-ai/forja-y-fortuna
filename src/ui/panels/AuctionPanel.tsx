import { useEffect, useState } from 'react';
import { BALANCE } from '../../config/balance';
import {
  auctionAnnounced, auctionBid, auctionLeave, auctionNext, auctionPass, auctionStart, bidStep, consignItem, isAuctionDay, sessionLot, withdrawItem,
} from '../../core/town/auction';
import { refusesTrade } from '../../core/town/relations';
import { Panel, Tabs } from '../components/Panel';
import { RARITY_CLASS, money } from '../format';
import { store, useGame } from '../hooks';

/** Casa de subastas: lotes anunciados, consignación y la subasta en vivo. */
export function AuctionPanel() {
  const s = useGame();
  const [tab, setTab] = useState<'lots' | 'consign'>('lots');
  const au = s.auction;
  if (au.session) return <LiveAuction />;
  const refuse = refusesTrade(store.content, s, s.location);
  const daysLeft = au.day - s.day;

  return (
    <Panel
      title="Casa de subastas"
      subtitle={isAuctionDay(s) ? '¡Hoy es la gran subasta!' : `Próxima subasta: día ${au.day} (faltan ${daysLeft} día${daysLeft === 1 ? '' : 's'})`}
      wide
    >
      <Tabs value={tab} onChange={setTab} options={[{ id: 'lots', label: 'Lotes' }, { id: 'consign', label: `Consignar (${au.consigned.length}/${BALANCE.auction.maxConsign})` }]} />
      {refuse && <p className="bad-text small">{refuse}</p>}
      {tab === 'lots' && <Lots />}
      {tab === 'consign' && <Consign />}
    </Panel>
  );
}

function Lots() {
  const s = useGame();
  const c = store.content;
  const au = s.auction;
  if (!auctionAnnounced(s)) {
    return <p className="muted">Los lotes se anuncian {BALANCE.auction.announceDays} días antes de la subasta, en el tablón y acá.</p>;
  }
  const attended = au.attended === s.day;
  return (
    <>
      {isAuctionDay(s) && !attended && (
        <div className="row">
          <button className="btn primary big" disabled={!au.lots.length && !au.consigned.length} onClick={() => store.run(auctionStart)}>
            🔨 Entrar a la subasta · {BALANCE.auction.attendSlots} franja
          </button>
          <small className="muted">Pujás por rondas contra los demás postores. Lo que consignaste se vende ahí mismo.</small>
        </div>
      )}
      {attended && <p className="muted">Ya estuviste en la subasta de hoy.</p>}
      <ul className="item-rows">
        {au.lots.map((l) => {
          const def = c.auctionLots[l.lotId];
          return (
            <li key={l.lotId}>
              <span className="grow">
                <b>{l.name}</b> {def.unique && <span className="tag secret">único</span>}
                <small className="muted block">{def.description}</small>
              </span>
              <span className="price">Sale a 🪙 {l.base}</span>
            </li>
          );
        })}
        {!au.lots.length && <p className="muted small">Esta vez la casa no tiene lotes propios.</p>}
      </ul>
    </>
  );
}

function Consign() {
  const s = useGame();
  const au = s.auction;
  const [reserve, setReserve] = useState<Record<string, number>>({});
  const open = auctionAnnounced(s) && !(isAuctionDay(s) && au.attended === s.day);
  const items = s.items.filter((i) => !i.equippedBy && i.quantity > 0);
  return (
    <>
      <p className="muted small">
        Dejás la pieza en la casa y fijás un precio de reserva: si nadie lo paga, vuelve a tu arcón. La casa cobra el {Math.round(BALANCE.auction.commission * 100)}%.
        Si no vas a la subasta, la venden igual. Las piezas raras y bellas atraen a nobles y coleccionistas.
      </p>
      {!open && <p className="muted">La consignación abre cuando se anuncia la próxima subasta.</p>}
      {au.consigned.length > 0 && <h4>En consignación</h4>}
      <ul className="item-rows">
        {au.consigned.map((x) => (
          <li key={x.item.uid} className={RARITY_CLASS[x.item.rarity]}>
            <span className="swatch" style={{ background: x.item.color }} />
            <span className="grow"><b>{x.item.name}</b> <small className="muted">reserva {x.reserve} · valor {money(x.item.value * x.item.quantity)}</small></span>
            <button className="btn" onClick={() => store.run(withdrawItem, x.item.uid)}>Retirar</button>
          </li>
        ))}
      </ul>
      {open && au.consigned.length < BALANCE.auction.maxConsign && (
        <>
          <h4>Tus piezas</h4>
          <ul className="item-rows">
            {items.map((i) => {
              const value = Math.round(i.value * i.quantity);
              const r = reserve[i.uid] ?? value;
              return (
                <li key={i.uid} className={RARITY_CLASS[i.rarity]}>
                  <span className="swatch" style={{ background: i.color }} />
                  <span className="grow"><b>{i.name}</b> <small className="muted">{i.rarity}{i.quantity > 1 ? ` · ×${i.quantity}` : ''} · valor {money(value)}</small></span>
                  <span className="price-row">
                    <input
                      type="number" min={1} value={r} aria-label="Precio de reserva"
                      onChange={(e) => setReserve({ ...reserve, [i.uid]: Math.max(1, Number(e.target.value) || 1) })}
                    />
                    <button className="btn" onClick={() => store.run(consignItem, i.uid, r)}>Consignar</button>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

/** Subasta en vivo: las pujas de los demás aparecen de a una. */
function LiveAuction() {
  const s = useGame();
  const c = store.content;
  const sess = s.auction.session!;
  const lot = sessionLot(s);
  const [shown, setShown] = useState(1);

  // Las pujas aparecen de a una, para que se lean como una subasta de verdad.
  useEffect(() => setShown(1), [sess.index]);
  useEffect(() => {
    if (shown >= sess.log.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 550);
    return () => clearTimeout(t);
  }, [shown, sess.log.length]);

  const animating = sess.status !== 'finished' && shown < sess.log.length;
  const next = sess.leader ? sess.price + bidStep(sess.price) : sess.price;
  const leaderName = sess.leader === 'player' ? 'Vos' : sess.leader ? c.bidders[sess.leader]?.name : '—';
  const mine = !!lot?.consigned;

  return (
    <Panel title="🔨 Gran subasta" subtitle={`${sess.status === 'finished' ? 'Resultados' : `Lote ${sess.index + 1}`} · 🪙 ${Math.floor(s.gold)} disponibles`} wide>
      {sess.status !== 'finished' && lot && (
        <div className="auction-stage">
          <div>
            <h3>{lot.name} {mine && <span className="tag secret">tuyo</span>}</h3>
            {!mine && <p className="small muted">{c.auctionLots[lot.lotId]?.description}</p>}
            <p className="auction-price">🪙 {sess.price}</p>
            <p className="small">Va ganando: <b>{animating ? '…' : leaderName}</b></p>
            <p className="small muted">Postores: {sess.bidders.map((b) => `${c.bidders[b.id].name}${b.out ? ' (se retiró)' : ''}`).join(', ') || 'nadie'}</p>
          </div>
          <ol className="auction-log">
            {sess.log.slice(0, shown).map((line, i) => <li key={i}>{line}</li>)}
          </ol>
        </div>
      )}
      {sess.status === 'finished' && (
        <div className="shop-summary">
          <b>Terminó la subasta</b>
          <ul>
            {sess.results.map((r, i) => (
              <li key={i} className="small">
                {r.name}: {r.price ? `${r.winner} por ${r.price}` : 'sin vender'}{r.mine === 'compra' ? ' — ¡lo compraste!' : r.mine === 'venta' && r.price ? ' — tu venta' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="row">
        {sess.status === 'bidding' && !mine && (
          <>
            <button className="btn primary big" disabled={animating || sess.leader === 'player' || s.gold < next} onClick={() => store.run(auctionBid)}>
              Pujar 🪙 {next}
            </button>
            <button className="btn" disabled={animating || sess.leader === 'player'} onClick={() => store.run(auctionPass)}>Retirarme</button>
            {sess.leader === 'player' && <small className="muted">Vas ganando…</small>}
          </>
        )}
        {(sess.status === 'sold' || sess.status === 'unsold') && (
          <button className="btn primary" disabled={animating} onClick={() => store.run(auctionNext)}>Siguiente lote</button>
        )}
        {sess.status !== 'bidding' && (
          <button className="btn" disabled={animating} onClick={() => { if (store.run(auctionLeave)) store.closePanel(); }}>
            {sess.status === 'finished' ? 'Salir' : 'Irme antes'}
          </button>
        )}
      </div>
    </Panel>
  );
}
