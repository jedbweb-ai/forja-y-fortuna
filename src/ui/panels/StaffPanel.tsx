import { useState } from 'react';
import { BALANCE } from '../../config/balance';
import {
  addOrder, assignStaff, cancelOrder, fireWorker, joinBlock, learnWorkTrait, loyaltyRateLabel, oficioLevel, orderTemplates, peekProgress,
  peekShop, priceRatio, removeStaff, setStaffRole, staffCandidates, staffSlots, staffWages, workerName, xpForLevel,
} from '../../core/staff/staff';
import { OFICIO_NAMES, OFICIOS, ROLE_NAMES, ROLE_OFICIO, STAFF_ROLES, type StaffMember } from '../../core/staff/types';
import { relationLevel } from '../../core/state';
import { Panel } from '../components/Panel';
import { Portrait } from '../components/Swatch';
import { store, useGame } from '../hooks';

/** Qué hace cada puesto (para la ayuda del panel). */
const ROLE_HELP: Record<string, string> = {
  vendedor: 'atiende el mostrador y vende lo exhibido, sin regatear',
  encargado: 'arma la vidriera: pone lo que más se va a vender y saca lo que no sale',
  aprendiz: 'forja los pedidos que le dejes, con los materiales del inventario',
};

/** Quién trabaja en la herrería, en qué puesto, cómo viene aprendiendo y los pedidos del aprendiz. */
export function StaffPanel() {
  const s = useGame();
  const c = store.content;
  const st = peekShop(s);
  const slots = staffSlots(c, s);
  const candidates = staffCandidates(s);
  const templates = orderTemplates(c, s);
  const [tpl, setTpl] = useState(0);
  const [qty, setQty] = useState(5);
  const chosen = templates[Math.min(tpl, templates.length - 1)];

  return (
    <Panel title="Personal de la herrería" subtitle={`${st.staff.length}/${slots} puestos · sueldos 🪙 ${staffWages(c, s)} por día · 🪙 ${Math.floor(s.gold)}`} wide>
      <p className="small muted">
        El personal trabaja solo en cada franja de la mañana y de la tarde, estés o no: el {ROLE_NAMES.vendedor.toLowerCase()} {ROLE_HELP.vendedor};
        el {ROLE_NAMES.encargado.toLowerCase()} {ROLE_HELP.encargado}; el {ROLE_NAMES.aprendiz.toLowerCase()} {ROLE_HELP.aprendiz}.
        Cada uno sube de nivel en su oficio trabajando y, al llegar a los niveles {BALANCE.staff.pickAtLevels.join(', ')}, aprende algo nuevo.
        Pueden trabajar los compañeros comprados en el mercado de esclavos y los empleados que se contratan en el tablón; los mercenarios solo pelean.
      </p>

      {st.staff.length === 0 && <p className="muted">Todavía no trabaja nadie en la herrería.</p>}
      <div className="quest-grid">
        {st.staff.map((m) => <MemberCard key={m.id} m={m} />)}
      </div>

      {st.staff.length < slots && (
        <>
          <h4>Sumar a alguien</h4>
          <ul className="item-rows">
            {candidates.map((id) => {
              const block = joinBlock(c, s, id);
              return (
                <li key={id}>
                  <Portrait id={id} look={c.npcs[id]?.look} size="small" />
                  <span className="grow">
                    <b>{workerName(c, s, id)}</b>{' '}
                    <small className="muted">{s.characters[id]?.bond === 'liberado' ? 'liberado' : 'esclavo'} · lealtad {relationLevel(s.npcs[id]?.relation ?? 0)}{s.party.includes(id) ? ' · deja el grupo' : ''}</small>
                    {block && <small className="muted block">{block}</small>}
                  </span>
                  <button className="btn" disabled={!!block || s.location !== 'herreria'} onClick={() => store.run(assignStaff, id, undefined)}>Poner a trabajar</button>
                </li>
              );
            })}
          </ul>
          <p className="small muted">Para contratar empleados, andá al tablón de anuncios de cualquier ciudad (en Puertoseco, a la Casa de los Navegantes).</p>
        </>
      )}

      <h4>Pedidos del aprendiz</h4>
      {st.orders.length === 0 && <p className="small muted">Sin pedidos.</p>}
      <ul className="item-rows">
        {st.orders.map((o) => (
          <li key={o.id}>
            <span className="grow"><b>{o.name}</b> <small className="muted">{o.done}/{o.qty} hechas</small></span>
            <button className="btn" onClick={() => store.run(cancelOrder, o.id)}>Cancelar</button>
          </li>
        ))}
      </ul>
      {templates.length ? (
        <div className="row">
          <select value={tpl} onChange={(e) => setTpl(Number(e.target.value))}>
            {templates.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
          </select>
          <input type="number" min={1} max={BALANCE.staff.maxOrderQty} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: '4.5em' }} />
          <button className="btn primary" disabled={s.location !== 'herreria'} onClick={() => store.run(addOrder, chosen.blueprintId, chosen.materials, qty, chosen.name)}>Encargar</button>
        </div>
      ) : (
        <p className="small muted">El aprendiz repite piezas del yunque que ya forjaste vos: forjá alguna (o guardá un diseño en el libro) y aparece acá.</p>
      )}
    </Panel>
  );
}

function MemberCard({ m }: { m: StaffMember }) {
  const s = useGame();
  const c = store.content;
  const p = peekProgress(c, s, m.id);
  const def = c.workers[m.id];
  const ch = s.characters[m.id];
  const kind = def ? def.title : ch?.bond === 'liberado' ? 'Liberado' : 'Esclavo';
  const wage = def?.wage ?? ch?.wage ?? 0;
  const loyalty = loyaltyRateLabel(s, m.id);
  const order = m.piece ? peekShop(s).orders.find((o) => o.id === m.piece!.order) : undefined;

  return (
    <article className="quest-card">
      <header className="row">
        <Portrait id={m.id} look={def?.look ?? c.npcs[m.id]?.look} size="small" />
        <span className="grow"><b>{workerName(c, s, m.id)}</b> <small className="muted block">{kind}{wage ? ` · 🪙 ${wage}/día` : ''}</small></span>
      </header>
      <div className="row">
        {STAFF_ROLES.map((r) => (
          <button key={r} className={`btn ${m.role === r ? 'primary' : ''}`} disabled={s.location !== 'herreria'} onClick={() => store.run(setStaffRole, m.id, r)}>{ROLE_NAMES[r]}</button>
        ))}
      </div>
      <p className="small">
        {OFICIOS.map((o) => {
          const lvl = oficioLevel(p.xp[o]);
          const next = xpForLevel(lvl + 1);
          const pct = lvl >= BALANCE.staff.maxLevel ? 100 : Math.round(((p.xp[o] - xpForLevel(lvl)) / (next - xpForLevel(lvl))) * 100);
          return <span key={o} className={ROLE_OFICIO[m.role] === o ? 'good-text' : ''}>{OFICIO_NAMES[o]} {lvl} <small className="muted">({pct}%)</small>{o !== 'forja' ? ' · ' : ''}</span>;
        })}
      </p>
      {m.role === 'vendedor' && <p className="small muted">Cobra el {Math.round(priceRatio(c, s, m.id) * 100)}% de lo que pagaría el cliente.</p>}
      {m.role === 'aprendiz' && <p className="small muted">{order ? `Haciendo: ${order.name}` : 'Esperando pedidos.'}</p>}
      {p.traits.length > 0 && (
        <ul className="tag-list">
          {p.traits.map((t) => (
            <li key={t} className={c.workTraits[t]?.negative ? 'bad-text' : 'trait'} title={c.workTraits[t]?.description}>
              ◆ {c.workTraits[t]?.name}: <span className="muted">{c.workTraits[t]?.description}</span>
            </li>
          ))}
        </ul>
      )}
      {p.picks.map((options, i) => (
        <div key={i}>
          <p className="small good-text">Puede aprender algo nuevo:</p>
          <div className="row">
            {options.map((t) => (
              <button key={t} className="btn" title={c.workTraits[t]?.description} onClick={() => store.run(learnWorkTrait, m.id, i, t)}>{c.workTraits[t]?.name}</button>
            ))}
          </div>
        </div>
      ))}
      {loyalty && <p className="small bad-text">{loyalty}</p>}
      <div className="row">
        {def ? (
          <button className="btn" disabled={s.location !== 'herreria'} onClick={() => store.run(fireWorker, m.id)}>Despedir</button>
        ) : (
          <button className="btn" disabled={s.location !== 'herreria'} onClick={() => store.run(removeStaff, m.id)}>Sacarlo del puesto</button>
        )}
      </div>
    </article>
  );
}
