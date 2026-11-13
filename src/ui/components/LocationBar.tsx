import { cityLocation, npcsAt, restSlot, sleepUntilMorning } from '../../core/city';
import { BALANCE } from '../../config/balance';
import { currentCity, homeCity } from '../../core/state';
import { canOpenShop } from '../../core/economy/shop';
import { ownsBranch } from '../../core/economy/shops';
import { buyBranch } from '../../core/staff/staff';
import { damagedItems } from '../../core/forge/repair';
import { slotName } from '../../core/time';
import { talentPoints } from '../../core/progress/progress';
import type { SkillId } from '../../core/types';
import { isAuctionDay } from '../../core/town/auction';
import { store, useSnapshot } from '../hooks';
import { Portrait } from './Swatch';

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
          <button className="btn" onClick={() => store.setUi({ view: 'location' })}>🏘️ Volver a {c.cities[currentCity(state)].name}</button>
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
          <button className="btn" data-key="x" onClick={() => store.showWorld()}>🧭 Mapa del mundo</button>
          <button className="btn" onClick={() => store.setUi({ view: 'location' })}>Volver a {here?.name}</button>
        </div>
      </div>
    );
  }

  const loc = cityLocation(c, state.location)!;
  const npcs = npcsAt(c, state, state.location);
  const night = slotName(state) === 'noche';
  const damaged = damagedItems(state).length;
  const staffPicks = Object.values(state.staff.workers).reduce((a, p) => a + p.picks.length, 0);
  const freePoints = (Object.keys(state.skills) as SkillId[]).reduce((a, k) => a + talentPoints(c, state, k).free, 0);

  return (
    <div className="locbar">
      <span className="locbar-title">{loc.name}</span>
      <div className="locbar-actions">
        {loc.id === 'herreria' && (
          <>
            {state.forge ? (
              <button className="btn primary" data-key="f" onClick={() => store.openPanel('forge')}>🔨 Seguir trabajando</button>
            ) : (
              <>
                <button className="btn primary" data-key="f" onClick={() => store.openForge('yunque')}>🔨 Forjar</button>
                <button className="btn" onClick={() => store.openForge('joyeria')}>💍 Joyería</button>
                <button className="btn" onClick={() => store.openForge('runas')}>ᚱ Runas</button>
              </>
            )}
            <button className="btn" onClick={() => store.openPanel('alchemy')}>⚗️ Alquimia</button>
            <button className="btn" onClick={() => store.openPanel('workshop')}>🏗️ Taller</button>
            <button className="btn" onClick={() => store.openPanel('staff')}>🧑‍🏭 Personal{staffPicks > 0 ? ` (${staffPicks})` : ''}</button>
            <button className="btn" onClick={() => store.openPanel('talents')}>📈 Talentos{freePoints > 0 ? ` (${freePoints})` : ''}</button>
            <button className="btn" data-key="t" onClick={() => store.openPanel('shop')}>{state.shop ? '🛎️ Tienda abierta' : '🛎️ Atender tienda'}</button>
            {damaged > 0 && <button className="btn" onClick={() => store.openPanel('repair')}>🛠️ Reparar ({damaged})</button>}
            <button className="btn" data-key="x" onClick={() => store.showWorld()}>🧭 Expedición</button>
            <button className="btn" data-key="d" onClick={() => store.run(night ? sleepUntilMorning : restSlot)}>{night ? '🛏️ Dormir' : '⏳ Descansar'}</button>
          </>
        )}
        {(loc.kind === 'mercado' || loc.kind === 'muelle') && <button className="btn primary" onClick={() => store.openPanel('market')}>🧺 {loc.kind === 'muelle' ? 'Mercadería del barco' : 'Puesto de materiales'}</button>}
        {loc.branch && (ownsBranch(state, loc.id) ? (
          <>
            <button className="btn primary" data-key="t" onClick={() => store.openPanel('shop')}>{state.shop ? '🛎️ Tienda abierta' : '🛎️ Atender tienda'}</button>
            <button className="btn" onClick={() => store.openPanel('staff')}>🧑‍🏭 Personal</button>
          </>
        ) : (
          <button className="btn primary" onClick={() => store.run(buyBranch)}>🏠 Comprar el local · 🪙 {loc.branch.price} · reputación {loc.branch.reputation}</button>
        ))}
        {canOpenShop(c, state) && loc.id !== 'herreria' && !loc.branch && (
          <button className="btn" onClick={() => store.openPanel('shop')}>{state.shop ? '🛖 Puesto abierto' : '🛖 Puesto ambulante'}</button>
        )}
        {loc.kind === 'posada' && (
          <>
            <button className="btn" onClick={() => store.run(restSlot)}>⏳ Descansar</button>
            <button className="btn" onClick={() => store.run(sleepUntilMorning)}>🛏️ Dormir · 🪙 {BALANCE.travel.innPrice}</button>
          </>
        )}
        {loc.kind === 'alquimista' && <button className="btn primary" onClick={() => store.openPanel('market')}>🌿 Hierbas y reactivos</button>}
        {loc.kind === 'libreria' && <button className="btn primary" onClick={() => store.openPanel('library')}>📚 Grimorios y planos</button>}
        {loc.id === 'taberna' && <button className="btn primary" onClick={() => store.openPanel('mercenaries')}>🍺 Mercenarios</button>}
        {loc.kind === 'gremio' && <button className="btn primary" onClick={() => store.openPanel('quests')}>📜 Encargos y contratos</button>}
        {loc.kind === 'tablon' && <button className="btn primary" onClick={() => store.openPanel('quests')}>📢 Avisos y encargos</button>}
        {loc.kind === 'subastas' && <button className="btn primary" onClick={() => store.openPanel('auction')}>🔨 Subasta{isAuctionDay(state) ? ' (¡hoy!)' : ''}</button>}
        {loc.kind === 'esclavos' && <button className="btn primary" onClick={() => store.openPanel('servants')}>⛓️ Tratos</button>}
        {npcs.map((id) => (
          <button key={id} className="btn talk" onClick={() => store.talkTo(id)}><Portrait id={id} look={c.npcs[id].look} size="tiny" /> {c.npcs[id].name.split(' ')[0]}</button>
        ))}
        {loc.id !== 'herreria' && currentCity(state) !== homeCity() && <button className="btn" data-key="x" onClick={() => store.showWorld()}>🧭 Viajar</button>}
        <button className="btn" data-key="m" onClick={() => store.showMap()}>🗺️ Ciudad</button>
      </div>
    </div>
  );
}
