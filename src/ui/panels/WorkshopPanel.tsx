import { buyUpgrade, displaySlots, maxPartySize, upgradeBlock, upgradeLevel } from '../../core/progress/progress';
import { peekShop, staffSlots } from '../../core/staff/staff';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

/** La herrería: mejoras con niveles y acceso al personal. */
export function WorkshopPanel() {
  const s = useGame();
  const c = store.content;

  return (
    <Panel
      title="Tu herrería"
      subtitle={`Exhibición ${displaySlots(c, s)} lugares · Grupo de hasta ${maxPartySize(c, s)} · 🪙 ${Math.floor(s.gold)}`}
      wide
    >
      <h4>Personal</h4>
      <p className="small muted">
        Quién atiende, arma la vidriera y forja mientras no estás: {peekShop(s).staff.length}/{staffSlots(c, s)} puestos ocupados.
        La mejora «Puestos de trabajo» suma lugar para más gente.
      </p>
      <button className="btn" onClick={() => store.openPanel('staff')}>🧑‍🏭 Ver el personal</button>

      <h4>Mejoras</h4>
      <div className="quest-grid">
        {Object.values(c.upgrades).map((u) => {
          const lvl = upgradeLevel(s, u.id);
          const next = u.levels[lvl];
          const block = upgradeBlock(c, s, u.id);
          return (
            <article key={u.id} className={`quest-card ${lvl ? 'talent-on' : ''}`}>
              <header><b>{u.icon} {u.name}</b> <small className="muted">nivel {lvl}/{u.levels.length}</small></header>
              <p className="small">{u.description}</p>
              {next ? (
                <>
                  <p className="small good-text">Siguiente: {next.description}</p>
                  <p className="small">
                    🪙 {next.cost.gold}{next.cost.materials.map((m) => ` · ${m.qty}× ${c.materials[m.id].name} (${s.materials[m.id] ?? 0})`).join('')}
                    {next.reputationMin !== undefined ? ` · reputación ${next.reputationMin}` : ''}
                  </p>
                  <div className="row">
                    <button className="btn primary" disabled={!!block || s.location !== 'herreria'} onClick={() => store.run(buyUpgrade, u.id)}>Construir</button>
                    {block && <small className="muted">{block}</small>}
                  </div>
                </>
              ) : <p className="small muted">Al máximo.</p>}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
