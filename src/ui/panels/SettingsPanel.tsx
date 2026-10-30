import { useState, useSyncExternalStore } from 'react';
import { getAudioPrefs, setAudioPrefs, subscribeAudioPrefs } from '../../audio/prefs';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';
import { SHORTCUTS } from '../shortcuts';

export function SettingsPanel() {
  const s = useGame();
  const [confirm, setConfirm] = useState(false);
  const audio = useSyncExternalStore(subscribeAudioPrefs, getAudioPrefs);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    else document.documentElement.requestFullscreen?.().catch(() => store.toast('Este navegador no permite pantalla completa.', 'bad'));
  };
  return (
    <Panel title="Ajustes">
      <h3>Sonido</h3>
      {(['music', 'sfx'] as const).map((ch) => (
        <label key={ch} className="volume">
          <span>{ch === 'music' ? 'Música' : 'Efectos'}</span>
          <input type="range" min={0} max={100} step={5} value={Math.round(audio[ch] * 100)} disabled={audio.muted}
            onChange={(e) => setAudioPrefs({ [ch]: Number(e.target.value) / 100 })} />
          <output>{Math.round(audio[ch] * 100)}%</output>
        </label>
      ))}
      <label className="setting">
        <input type="checkbox" checked={audio.muted} onChange={(e) => setAudioPrefs({ muted: e.target.checked })} />
        <span>Silenciar todo <small className="muted block">El volumen queda guardado en este dispositivo.</small></span>
      </label>
      <hr />
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
