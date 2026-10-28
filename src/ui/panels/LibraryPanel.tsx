import { cityLocation } from '../../core/city';
import { buyBlueprint, buyGrimoire, hasGrimoire } from '../../core/magic/grimoires';
import { Panel } from '../components/Panel';
import { CATEGORY_LABEL } from '../format';
import { store, useGame } from '../hooks';

/** Librería: grimorios (se leen después en el libro del herrero) y planos raros. */
export function LibraryPanel() {
  const s = useGame();
  const c = store.content;
  const loc = cityLocation(c, s.location);
  if (!loc || loc.kind !== 'libreria') return <Panel title="Librería"><p>Los grimorios se compran en la librería.</p></Panel>;

  return (
    <Panel title={loc.name} subtitle={`🪙 ${Math.floor(s.gold)} disponibles`} wide>
      <h4>Grimorios</h4>
      <p className="muted small">Un grimorio se lee una vez y enseña encantamientos para siempre. Después se aplican con reactivos y oro, sin gastar runas.</p>
      <ul className="item-rows">
        {(loc.grimoires ?? []).map((id) => c.grimoires[id]).map((g) => {
          const owned = hasGrimoire(s, g.id);
          return (
            <li key={g.id} className={owned ? 'dim' : ''}>
              <span className="grow">
                <b>📖 {g.name}</b> <small className="muted">nivel {g.tier}</small>
                <small className="muted block">{g.description}</small>
                <small className="block">Enseña: {g.teaches.map((e) => c.enchantments[e].name).join(', ')}</small>
              </span>
              {owned ? <span className="muted small">Ya lo tenés</span> : (
                <button className="btn" disabled={s.gold < g.price} onClick={() => store.run(buyGrimoire, g.id)}>🪙 {g.price}</button>
              )}
            </li>
          );
        })}
      </ul>
      <h4>Planos</h4>
      <ul className="item-rows">
        {(loc.blueprintsForSale ?? []).map((offer) => {
          const b = c.blueprints[offer.id];
          const known = s.knownBlueprints.includes(b.id);
          return (
            <li key={b.id} className={known ? 'dim' : ''}>
              <span className="grow">
                <b>{b.name}</b> <small className="muted">{CATEGORY_LABEL[b.category]}{b.batch ? ` · lote ×${b.batch}` : ''}</small>
                <small className="muted block">{b.description}</small>
              </span>
              {known ? <span className="muted small">Ya lo conocés</span> : (
                <button className="btn" disabled={s.gold < offer.price} onClick={() => store.run(buyBlueprint, b.id)}>🪙 {offer.price}</button>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
