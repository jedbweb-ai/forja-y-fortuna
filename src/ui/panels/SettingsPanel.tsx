import { useState } from 'react';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

export function SettingsPanel() {
  const s = useGame();
  const [confirm, setConfirm] = useState(false);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    else document.documentElement.requestFullscreen?.().catch(() => store.toast('Este navegador no permite pantalla completa.', 'bad'));
  };
  return (
    <Panel title="Ajustes">
      <label className="setting">
        <input type="checkbox" checked={s.settings.skipItemCard} onChange={(e) => store.updateSettings({ skipItemCard: e.target.checked })} />
        <span>Saltear la tarjeta del objeto terminado <small className="muted block">Muestra solo un aviso breve.</small></span>
      </label>
      <div className="row">
        <button className="btn" onClick={toggleFullscreen}>⛶ Pantalla completa</button>
        <button className="btn" onClick={() => { store.saveNow(); store.toast('Partida guardada.', 'good'); }}>💾 Guardar ahora</button>
      </div>
      <p className="muted small">La partida se guarda sola en este dispositivo después de cada acción.</p>
      <hr />
      {!confirm ? (
        <button className="btn danger" onClick={() => setConfirm(true)}>Borrar partida y empezar de nuevo</button>
      ) : (
        <div className="row">
          <button className="btn danger" onClick={() => { store.deleteSaveAndRestart(); setConfirm(false); }}>Sí, borrar todo</button>
          <button className="btn" onClick={() => setConfirm(false)}>Cancelar</button>
        </div>
      )}
      <p className="muted small">Forja &amp; Fortuna · Fase 1 · v{__APP_VERSION__}</p>
    </Panel>
  );
}
