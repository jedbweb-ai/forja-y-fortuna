import { BALANCE } from '../../config/balance';
import { hireBlock, hireTarget, hireWorker, workerOffer } from '../../core/staff/staff';
import { shopName } from '../../core/economy/shops';
import { OFICIO_NAMES, OFICIOS } from '../../core/staff/types';
import { currentCity } from '../../core/state';
import { Portrait } from '../components/Swatch';
import { store, useGame } from '../hooks';

/** Bolsa de trabajo del tablón: gente que busca trabajo en tu herrería. */
export function WorkersOffer() {
  const s = useGame();
  const c = store.content;
  const offer = workerOffer(s).map((id) => c.workers[id]).filter(Boolean);
  const market = s.staff.market[currentCity(s)];
  const next = market ? market.lastRefresh + BALANCE.staff.refreshDays : null;
  const target = hireTarget(c, s);

  return (
    <>
      <p className="small muted">
        Gente que busca trabajo en tu herrería. No pelea: atiende, arma la vidriera o forja. Se paga al contratar y después un sueldo por día.
        {target ? `Quien contrates va a trabajar a ${shopName(c, target)}` : 'No tenés puestos libres en tus tiendas'}{next ? ` · nuevos candidatos el día ${next}` : ''}.
      </p>
      {!offer.length && <p className="muted">Hoy no hay nadie buscando trabajo.</p>}
      <div className="quest-grid">
        {offer.map((w) => {
          const block = hireBlock(c, s, w.id);
          return (
            <article key={w.id} className="quest-card">
              <header className="row">
                <Portrait id={w.id} look={w.look} size="small" />
                <span className="grow"><b>{w.name}</b> <small className="muted block">{w.title}</small></span>
              </header>
              <p className="small"><i>«{w.quote}»</i></p>
              <p className="small muted">{w.description}</p>
              <p className="small">{OFICIOS.map((o) => `${OFICIO_NAMES[o]} ${w.oficios[o]}`).join(' · ')}</p>
              <ul className="tag-list">
                {w.traits.map((t) => (
                  <li key={t} className={c.workTraits[t]?.negative ? 'bad-text' : 'trait'}>◆ {c.workTraits[t]?.name}: <span className="muted">{c.workTraits[t]?.description}</span></li>
                ))}
              </ul>
              <p className="small">Contratarlo 🪙 {w.hireCost} · sueldo 🪙 {w.wage} por día</p>
              <div className="row">
                <button className="btn primary" disabled={!!block} onClick={() => store.run(hireWorker, w.id)}>Contratar</button>
                {block && <small className="muted">{block}</small>}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
