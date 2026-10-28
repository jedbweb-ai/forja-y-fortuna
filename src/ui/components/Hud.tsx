import { useRef } from 'react';
import { setDebugPersisted } from '../../bridge/store';
import { cityLocation } from '../../core/city';
import { currentCity, skillLevel } from '../../core/state';
import { slotName } from '../../core/time';
import { SLOT_ICON } from '../format';
import { store, useSnapshot } from '../hooks';

export function Hud() {
  const { state, ui } = useSnapshot();
  const taps = useRef<number[]>([]);
  if (!state) return null;
  const slot = slotName(state);
  const loc = cityLocation(store.content, state.location);

  // 5 toques rápidos en el logo activan o desactivan el modo debug.
  const onLogo = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 1500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setDebugPersisted(!ui.debug);
      store.toast(ui.debug ? 'Modo debug desactivado' : 'Modo debug activado');
    }
  };

  return (
    <header className="hud">
      <button className="hud-logo" onClick={onLogo} aria-label="Forja y Fortuna">⚒️ <span>Forja &amp; Fortuna</span></button>
      <div className="hud-stats">
        <span className="chip" title="Día y franja">Día {state.day} · {SLOT_ICON[slot]} {slot}</span>
        <span className="chip gold" title="Oro">🪙 {Math.floor(state.gold)}</span>
        <span className="chip" title="Reputación en la ciudad">⭐ {state.reputation[currentCity()] ?? 0}</span>
        <span className="chip hide-sm" title="Nivel de Herrería">🔨 Nv {skillLevel(state.skills.herreria)}</span>
        {state.outing && <span className="chip warn" title={`Recorriendo la ciudad (${loc?.name}). La franja se gasta al volver al taller.`}>🚶 En la ciudad</span>}
      </div>
      <nav className="hud-actions">
        <button className="btn-icon" onClick={() => store.openPanel('inventory')} aria-label="Inventario" title="Inventario">🎒</button>
        <button className="btn-icon" onClick={() => store.openPanel('book')} aria-label="Libro del herrero" title="Libro del herrero">📖</button>
        <button className="btn-icon" onClick={() => store.openPanel('settings')} aria-label="Ajustes" title="Ajustes">⚙️</button>
        {ui.debug && <button className="btn-icon debug" onClick={() => store.openPanel('debug')} aria-label="Debug" title="Debug">🐞</button>}
      </nav>
    </header>
  );
}
