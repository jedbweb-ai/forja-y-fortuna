import { BALANCE } from '../../config/balance';
import {
  assignAssistant, assistantBlock, buyUpgrade, displaySlots, maxPartySize, removeAssistant, upgradeBlock, upgradeLevel,
} from '../../core/progress/progress';
import { relationLevel } from '../../core/state';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

/** La herrería: mejoras con niveles y el ayudante que atiende la tienda. */
export function WorkshopPanel() {
  const s = useGame();
  const c = store.content;
  const candidates = Object.values(s.characters).filter((ch) => ch.id !== 'herrero' && c.mercenaries[ch.id] && !ch.escaped && !ch.dead);
  const assistant = s.assistant ? s.characters[s.assistant] : null;

  return (
    <Panel
      title="Tu herrería"
      subtitle={`Exhibición ${displaySlots(c, s)} lugares · Grupo de hasta ${maxPartySize(c, s)} · 🪙 ${Math.floor(s.gold)}`}
      wide
    >
      <h4>Ayudante en la tienda</h4>
      <p className="small muted">
        Cuando no atendés vos, el ayudante vende lo que está exhibido: sin regatear, al {Math.round(BALANCE.assistant.priceRatio * 100)}% de lo que pagaría el cliente.
        Tiene que ser un compañero con relación «{BALANCE.assistant.minLevel}» o más, o uno liberado. Mientras atiende, no sale de expedición.
      </p>
      {assistant ? (
        <div className="row">
          <span className="grow">🧑‍🔧 <b>{assistant.name}</b> atiende la tienda.</span>
          <button className="btn" onClick={() => store.run(removeAssistant)}>Sacarlo de la tienda</button>
        </div>
      ) : (
        <ul className="item-rows">
          {candidates.map((ch) => {
            const block = assistantBlock(c, s, ch.id);
            return (
              <li key={ch.id}>
                <span className="grow">
                  <b>{ch.name}</b> <small className="muted">relación {relationLevel(s.npcs[ch.id]?.relation ?? 0)}{ch.bond === 'liberado' ? ' · libre' : ''}</small>
                  {block && <small className="muted block">{block}</small>}
                </span>
                <button className="btn" disabled={!!block} onClick={() => store.run(assignAssistant, ch.id)}>Dejarlo a cargo</button>
              </li>
            );
          })}
          {!candidates.length && <p className="muted small">Todavía no tenés compañeros. Contratá mercenarios en la taberna o comprá en el mercado de esclavos.</p>}
        </ul>
      )}

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
