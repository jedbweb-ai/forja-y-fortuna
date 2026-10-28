import { cityLocation, npcsAt, restSlot, sleepUntilMorning } from '../../core/city';
import { damagedItems } from '../../core/forge/repair';
import { slotName } from '../../core/time';
import { store, useSnapshot } from '../hooks';

/** Barra inferior con las acciones del lugar. Todo lo tocable en la escena también está acá. */
export function LocationBar() {
  const { state, ui } = useSnapshot();
  if (!state) return null;
  const c = store.content;

  if (ui.view === 'world') {
    return (
      <div className="locbar">
        <span className="locbar-title">Mapa del mundo</span>
        <div className="locbar-actions">
          <span className="small muted">Tocá una región para preparar la expedición.</span>
          <button className="btn" onClick={() => store.setUi({ view: 'location' })}>🏘️ Volver a Valdebrasa</button>
        </div>
      </div>
    );
  }

  if (ui.view === 'map') {
    const here = cityLocation(c, state.location);
    return (
      <div className="locbar">
        <span className="locbar-title">Tocá un edificio para ir.</span>
        <div className="locbar-actions">
          <button className="btn" onClick={() => store.showWorld()}>🧭 Mapa del mundo</button>
          <button className="btn" onClick={() => store.setUi({ view: 'location' })}>Volver a {here?.name}</button>
        </div>
      </div>
    );
  }

  const loc = cityLocation(c, state.location)!;
  const npcs = npcsAt(c, state, state.location);
  const night = slotName(state) === 'noche';
  const damaged = damagedItems(state).length;

  return (
    <div className="locbar">
      <span className="locbar-title">{loc.name}</span>
      <div className="locbar-actions">
        {loc.id === 'herreria' && (
          <>
            {state.forge ? (
              <button className="btn primary" onClick={() => store.openPanel('forge')}>🔨 Seguir trabajando</button>
            ) : (
              <>
                <button className="btn primary" onClick={() => store.openForge('yunque')}>🔨 Forjar</button>
                <button className="btn" onClick={() => store.openForge('joyeria')}>💍 Joyería</button>
                <button className="btn" onClick={() => store.openForge('runas')}>ᚱ Runas</button>
              </>
            )}
            <button className="btn" onClick={() => store.openPanel('alchemy')}>⚗️ Alquimia</button>
            <button className="btn" onClick={() => store.openPanel('shop')}>{state.shop ? '🛎️ Tienda abierta' : '🛎️ Atender tienda'}</button>
            {damaged > 0 && <button className="btn" onClick={() => store.openPanel('repair')}>🛠️ Reparar ({damaged})</button>}
            <button className="btn" onClick={() => store.showWorld()}>🧭 Expedición</button>
            <button className="btn" onClick={() => store.run(night ? sleepUntilMorning : restSlot)}>{night ? '🛏️ Dormir' : '⏳ Descansar'}</button>
          </>
        )}
        {loc.id === 'mercado' && <button className="btn primary" onClick={() => store.openPanel('market')}>🧺 Puesto de materiales</button>}
        {loc.kind === 'alquimista' && <button className="btn primary" onClick={() => store.openPanel('market')}>🌿 Hierbas y reactivos</button>}
        {loc.kind === 'libreria' && <button className="btn primary" onClick={() => store.openPanel('library')}>📚 Grimorios y planos</button>}
        {loc.id === 'taberna' && <button className="btn primary" onClick={() => store.openPanel('mercenaries')}>🍺 Mercenarios</button>}
        {npcs.map((id) => (
          <button key={id} className="btn" onClick={() => store.talkTo(id)}>💬 {c.npcs[id].name.split(' ')[0]}</button>
        ))}
        <button className="btn" onClick={() => store.showMap()}>🗺️ Ciudad</button>
      </div>
    </div>
  );
}
