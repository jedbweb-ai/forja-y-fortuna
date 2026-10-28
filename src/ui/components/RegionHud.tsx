import { bagLoad } from '../../core/combat/result';
import { maxHp } from '../../core/party/progression';
import { returnHome } from '../../core/world/expedition';
import { Panel } from './Panel';
import { store, useGame } from '../hooks';

/** Barra inferior durante la exploración. */
export function RegionHud() {
  const s = useGame();
  const e = s.expedition!;
  const r = store.content.regions[e.regionId];
  const load = bagLoad(e.bag);
  return (
    <div className="locbar region-bar">
      <div className="region-stats">
        <span className="locbar-title">{r.name}</span>
        <span className="chip" title="Energía">⚡ {Math.floor(e.energy)}/{e.maxEnergy}</span>
        <span className={`chip ${load >= e.capacity ? 'warn' : ''}`} title="Carga">🎒 {load}/{e.capacity}</span>
        {e.members.map((id) => {
          const ch = s.characters[id];
          return ch ? <span key={id} className="chip hide-sm" title={ch.name}>❤️ {ch.name.split(' ')[0]} {ch.hp}/{maxHp(ch)}</span> : null;
        })}
      </div>
      <div className="locbar-actions">
        <button className="btn" onClick={() => store.openPanel('bag')}>🎒 Bolsa</button>
        <button className="btn" onClick={() => store.openPanel('party')}>🛡️ Grupo</button>
        <button className="btn primary" onClick={() => store.run(returnHome)}>🏠 Volver</button>
      </div>
      {e.energy <= 0 && <div className="region-hint">Sin energía: volvé a la ciudad.</div>}
      {e.energy > 0 && <div className="region-hint">Tocá el mapa para caminar · Tocá vetas y árboles para recolectar · Los grupos de monstruos pelean al contacto</div>}
    </div>
  );
}

export function BagPanel() {
  const s = useGame();
  const e = s.expedition;
  const c = store.content;
  if (!e) return null;
  const entries = Object.entries(e.bag).filter(([, q]) => q > 0);
  return (
    <Panel title="Bolsa de la expedición" subtitle={`${bagLoad(e.bag)} de ${e.capacity} · Pasa al taller al volver`}>
      {!entries.length && <p className="muted">Todavía no juntaste nada.</p>}
      <ul className="item-rows">
        {entries.map(([id, q]) => (
          <li key={id}>
            <span className="swatch" style={{ background: c.materials[id].color }} />
            <span className="grow"><b>{c.materials[id].name}</b></span>
            <b>×{q}</b>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
