import { useState, useSyncExternalStore } from 'react';
import { resetTips, setGuide } from '../../core/tutorial/tutorial';
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
        <input type="checkbox" checked={s.tutorial.guide} onChange={(e) => store.run(setGuide, e.target.checked)} />
        <span>Guía de primeros pasos <small className="muted block">Las notas del maestro: el próximo paso arriba a la izquierda. Lo que ya hiciste cuenta como hecho.</small></span>
      </label>
      <label className="setting">
        <input type="checkbox" checked={s.settings.tips} onChange={(e) => store.updateSettings({ tips: e.target.checked })} />
        <span>Consejos del maestro <small className="muted block">Un consejo la primera vez que entrás a cada cosa. <button className="linkish" onClick={(ev) => { ev.preventDefault(); store.run(resetTips); }}>Volver a verlos</button></small></span>
      </label>
      <label className="setting">
        <input type="checkbox" checked={!!s.settings.permadeath} onChange={(e) => store.updateSettings({ permadeath: e.target.checked })} />
        <span>
          Muerte permanente en mazmorras peligrosas
          <small className="muted block">Los compañeros que caen en mazmorras de 5 estrellas o más no vuelven. El herrero nunca muere.</small>
        </span>
      </label>
      <fieldset className="setting-choice">
        <legend>🧭 Formato de las expediciones (prueba) <small className="muted block">Vale desde la próxima salida. Las mazmorras no cambian.</small></legend>
        {([['rutas', 'A · Recorrido por paradas', 'Se elige el camino entre paradas; no se camina.'], ['libre', 'B · Exploración libre', 'Se camina por el mapa, con niebla que se va descubriendo.']] as const).map(([id, name, hint]) => (
          <label key={id} className="setting">
            <input type="radio" name="expedition-format" checked={(s.settings.expeditionFormat ?? 'rutas') === id} onChange={() => store.updateSettings({ expeditionFormat: id })} />
            <span>{name} <small className="muted block">{hint}</small></span>
          </label>
        ))}
      </fieldset>
      <label className="setting">
        <input type="checkbox" checked={!!s.settings.infiniteGold} onChange={(e) => store.setInfiniteGold(e.target.checked)} />
        <span>
          🧪 Oro ilimitado (modo prueba)
          <small className="muted block">Para probar cosas rápido: el oro no se gasta. Al apagarlo vuelve el oro que tenías antes.</small>
        </span>
      </label>
      <label className="setting">
        <input type="checkbox" checked={!!s.settings.invincible} onChange={(e) => store.updateSettings({ invincible: e.target.checked })} />
        <span>
          🛡️ Invencible (modo prueba)
          <small className="muted block">En las peleas, los enemigos no le hacen daño al grupo. Se puede prender o apagar en medio de un combate.</small>
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
