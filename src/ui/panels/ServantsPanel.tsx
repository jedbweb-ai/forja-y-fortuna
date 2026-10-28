import { BALANCE } from '../../config/balance';
import { maxPartySize } from '../../core/progress/progress';
import { refusesTrade } from '../../core/town/relations';
import { buyServant, freeServant, ownedServants, servantPrice } from '../../core/town/servants';
import { relationLevel } from '../../core/state';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

const SPECIALTY: Record<string, string> = { guerrero: 'guerrero', arquero: 'arquero', explorador: 'explorador', porteador: 'porteador' };

/** Mercado de esclavos: candidatos de la semana y tus compañeros comprados. */
export function ServantsPanel() {
  const s = useGame();
  const c = store.content;
  const offer = s.servantMarket.offer.map((id) => c.mercenaries[id]).filter(Boolean);
  const owned = ownedServants(s);
  const full = s.party.length >= maxPartySize(c, s);
  const refuse = refusesTrade(c, s, s.location);
  const nextRefresh = s.servantMarket.lastRefresh + BALANCE.servants.refreshDays;

  return (
    <Panel title="Mercado de esclavos" subtitle={`Corvino cambia los candidatos cada ${BALANCE.servants.refreshDays} días (próximo: día ${nextRefresh})`} wide>
      <p className="small muted">
        Se pagan una vez y no cobran sueldo, pero no confían en vos: su lealtad arranca baja.
        Con poca lealtad rinden menos y a veces no obedecen; si te odian, pueden escaparse cuando una expedición sale mal.
        La lealtad sube con buen equipo, victorias, charlas y regalos. Si los liberás, la lealtad llega al máximo, pero empiezan a cobrar.
      </p>
      {refuse && <p className="bad-text small">{refuse}</p>}
      {full && <p className="bad-text small">Tu grupo está completo: dejá a alguien en la herrería para sumar otro compañero.</p>}
      <div className="merc-grid">
        {offer.map((m) => {
          const price = servantPrice(c, s, m.id);
          return (
            <article key={m.id} className="merc-card">
              <header>
                <span className="portrait small" style={{ background: `#${m.look.body.toString(16).padStart(6, '0')}` }} />
                <div>
                  <b>{m.name}</b>
                  <small className="muted block">{SPECIALTY[m.specialty]} · nivel {m.level} · lealtad {relationLevel(s.npcs[m.id]?.relation ?? 0)}</small>
                </div>
              </header>
              <blockquote className="speech small">“{m.quote}”</blockquote>
              <p className="small">{m.description}</p>
              <dl className="attrs">
                <div><dt>Fuerza</dt><dd>{m.attributes.fuerza}</dd></div>
                <div><dt>Agilidad</dt><dd>{m.attributes.agilidad}</dd></div>
                <div><dt>Resistencia</dt><dd>{m.attributes.resistencia}</dd></div>
                <div><dt>Voluntad</dt><dd>{m.attributes.voluntad}</dd></div>
              </dl>
              <div className="row">
                <button className="btn primary" disabled={full || !!refuse || s.gold < price} onClick={() => store.run(buyServant, m.id)}>Comprar · 🪙 {price}</button>
                <span className="small muted">Libre cobraría 🪙 {m.freeWage}/día</span>
              </div>
            </article>
          );
        })}
        {!offer.length && <p className="muted">No hay nadie en venta esta semana.</p>}
      </div>
      {owned.length > 0 && (
        <>
          <h4>Tus compañeros</h4>
          <ul className="item-rows">
            {owned.map((ch) => {
              const lvl = relationLevel(s.npcs[ch.id]?.relation ?? 0);
              return (
                <li key={ch.id}>
                  <span className="grow">
                    <b>{ch.name}</b>
                    <small className="muted block">
                      {ch.bond === 'liberado' ? `Libre · cobra 🪙 ${ch.wage}/día` : 'Sin liberar'} · lealtad {lvl} · {s.party.includes(ch.id) ? 'en tu grupo' : 'en tu herrería'}
                    </small>
                  </span>
                  {ch.bond === 'esclavo' && (
                    <button className="btn good" onClick={() => store.run(freeServant, ch.id)}>Liberar · cobraría 🪙 {c.mercenaries[ch.id].freeWage}/día</button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
