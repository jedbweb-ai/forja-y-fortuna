import { BALANCE } from '../../config/balance';
import { availableMercenaries, dailyWages, hireMercenary } from '../../core/party/mercenaries';
import { relationLevel } from '../../core/state';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

const SPECIALTY_PERK: Record<string, string> = {
  guerrero: 'Fuerza y resistencia altas: aguanta armaduras pesadas.',
  arquero: 'Agilidad alta: rinde con arcos (necesita flechas).',
  explorador: `+${BALANCE.mercenaries.exploradorEnergy} de energía en las expediciones.`,
  porteador: `+${BALANCE.mercenaries.porteadorCapacity} de carga en las expediciones.`,
};

export function MercenaryPanel() {
  const s = useGame();
  const c = store.content;
  const list = availableMercenaries(c, s);
  const full = s.party.length >= BALANCE.MAX_PARTY_SIZE;
  return (
    <Panel
      title="Mercenarios"
      subtitle={`Grupo ${s.party.length}/${BALANCE.MAX_PARTY_SIZE} · Sueldos diarios: 🪙 ${dailyWages(s)} · Pelean solo con el equipo que les forjes`}
      wide
    >
      {full && <p className="bad-text">Tu grupo está completo. Despedí a alguien desde el panel de Grupo para contratar a otro.</p>}
      <div className="merc-grid">
        {list.map((m) => {
          const rel = s.npcs[m.id]?.relation ?? 0;
          return (
            <article key={m.id} className="merc-card">
              <header>
                <span className="portrait small" style={{ background: `#${m.look.body.toString(16).padStart(6, '0')}` }} />
                <div>
                  <b>{m.name}</b>
                  <small className="muted block">{m.specialty} · nivel {m.level} · relación {relationLevel(rel)}</small>
                </div>
              </header>
              <blockquote className="speech small">“{m.quote}”</blockquote>
              <p className="small">{m.description}</p>
              <p className="small">✨ {SPECIALTY_PERK[m.specialty]}</p>
              <dl className="attrs">
                <div><dt>Fuerza</dt><dd>{m.attributes.fuerza}</dd></div>
                <div><dt>Agilidad</dt><dd>{m.attributes.agilidad}</dd></div>
                <div><dt>Resistencia</dt><dd>{m.attributes.resistencia}</dd></div>
                <div><dt>Voluntad</dt><dd>{m.attributes.voluntad}</dd></div>
              </dl>
              <div className="row">
                <button className="btn primary" disabled={full || s.gold < m.hireCost} onClick={() => store.run(hireMercenary, m.id)}>
                  Contratar · 🪙 {m.hireCost}
                </button>
                <span className="small muted">Después 🪙 {m.wage}/día</span>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
