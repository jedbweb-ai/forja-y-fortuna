import { travelTo } from '../../core/city';
import { currentCity } from '../../core/state';
import { Panel } from '../components/Panel';
import { store, useGame, useSnapshot } from '../hooks';

const FAMILY: Record<string, string> = { gelines: 'gelines', goblins: 'goblins', bestias: 'bestias', no_muertos: 'no-muertos', constructos: 'constructos' };

/** Viaje a otra ciudad desde el mapa del mundo. */
export function TravelPanel() {
  const s = useGame();
  const { ui } = useSnapshot();
  const c = store.content;
  const to = ui.travelTo ? c.cities[ui.travelTo] : undefined;
  if (!to) return null;
  const from = c.cities[currentCity(s)];
  const route = from.routes.find((r) => r.to === to.id);
  const rep = s.reputation[to.id] ?? 0;
  const close = () => store.setUi({ panel: null, travelTo: null });
  return (
    <Panel
      title={to.name}
      subtitle={route ? `Desde ${from.name}: ${route.slots} franjas de viaje` : `No hay camino directo desde ${from.name}`}
      onClose={close}
      footer={route ? (
        <button className="btn primary big" onClick={() => { if (store.run(travelTo, to.id)) store.setUi({ view: 'location', panel: null, travelTo: null }); }}>
          🧳 Viajar
        </button>
      ) : undefined}
    >
      <p>{to.description}</p>
      {route && (
        <ul className="tag-list">
          <li>⏳ {route.slots} franjas ({route.slots >= 3 ? 'casi un día' : 'medio día'})</li>
          <li>⚔️ Encuentros en el camino: {Math.round(route.chance * 100)}% · {Object.keys(route.families).map((f) => FAMILY[f] ?? f).join(', ')}</li>
          <li>⭐ Tu reputación allá: {rep}</li>
        </ul>
      )}
      <p className="muted small">
        Tu herrería queda en Valdebrasa: allá se forja. En otras ciudades podés comprar, vender en el mercado (venta rápida o puesto ambulante),
        aceptar encargos y contratos, y dormir en la posada. Si el grupo cae en el camino, unos bandidos se llevan parte del oro.
      </p>
    </Panel>
  );
}
