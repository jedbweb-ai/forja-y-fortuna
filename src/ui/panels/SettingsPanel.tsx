import { useState } from 'react';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';
import { SHORTCUTS } from '../shortcuts';

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
      <label className="setting">
        <input type="checkbox" checked={!!s.settings.permadeath} onChange={(e) => store.updateSettings({ permadeath: e.target.checked })} />
        <span>
          Muerte permanente en mazmorras peligrosas
          <small className="muted block">Los compañeros que caen en mazmorras de 5 estrellas o más no vuelven. El herrero nunca muere.</small>
        </span>
      </label>
      <div className="row">
        <button className="btn" onClick={toggleFullscreen}>⛶ Pantalla completa</button>
        <button className="btn" onClick={() => { store.saveNow(); store.toast('Partida guardada.', 'good'); }}>💾 Guardar ahora</button>
      </div>
      <p className="muted small">La partida se guarda sola en este dispositivo después de cada acción.</p>
      <details className="shortcuts">
        <summary>⌨️ Atajos de teclado</summary>
        <ul>{SHORTCUTS.map((s) => <li key={s.keys}><kbd>{s.keys}</kbd> {s.text}</li>)}</ul>
      </details>
      <hr />
      {!confirm ? (
        <button className="btn danger" onClick={() => setConfirm(true)}>Borrar partida y empezar de nuevo</button>
      ) : (
        <div className="row">
          <button className="btn danger" onClick={() => { store.deleteSaveAndRestart(); setConfirm(false); }}>Sí, borrar todo</button>
          <button className="btn" onClick={() => setConfirm(false)}>Cancelar</button>
        </div>
      )}
      <p className="muted small">Forja &amp; Fortuna · v{__APP_VERSION__}</p>
    </Panel>
  );
}
