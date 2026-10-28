import { cityLocation, npcsAt, restSlot, sleepUntilMorning } from '../../core/city';
import { slotName } from '../../core/time';
import { store, useSnapshot } from '../hooks';

/** Barra inferior con las acciones del lugar. Todo lo tocable en la escena también está acá. */
export function LocationBar() {
  const { state, ui } = useSnapshot();
  if (!state) return null;
  const c = store.content;

  if (ui.view === 'map') {
    const here = cityLocation(c, state.location);
    return (
      <div className="locbar">
        <span className="locbar-title">Tocá un edificio para ir.</span>
        <button className="btn" onClick={() => store.setUi({ view: 'location' })}>Volver a {here?.name}</button>
      </div>
    );
  }

  const loc = cityLocation(c, state.location)!;
  const npcs = npcsAt(c, state, state.location);
  const night = slotName(state) === 'noche';

  return (
    <div className="locbar">
      <span className="locbar-title">{loc.name}</span>
      <div className="locbar-actions">
        {loc.id === 'herreria' && (
          <>
            <button className="btn primary" onClick={() => store.openPanel('forge')}>{state.forge ? '🔨 Seguir forjando' : '🔨 Forjar'}</button>
            <button className="btn" onClick={() => store.openPanel('shop')}>{state.shop ? '🛎️ Tienda abierta' : '🛎️ Atender tienda'}</button>
            <button className="btn" onClick={() => store.run(night ? sleepUntilMorning : restSlot)}>{night ? '🛏️ Dormir' : '⏳ Descansar'}</button>
          </>
        )}
        {loc.id === 'mercado' && <button className="btn primary" onClick={() => store.openPanel('market')}>🧺 Puesto de materiales</button>}
        {npcs.map((id) => (
          <button key={id} className="btn" onClick={() => store.talkTo(id)}>💬 {c.npcs[id].name}</button>
        ))}
        <button className="btn" onClick={() => store.showMap()}>🗺️ Ciudad</button>
      </div>
    </div>
  );
}
