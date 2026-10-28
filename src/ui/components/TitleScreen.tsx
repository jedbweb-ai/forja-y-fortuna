import { useState } from 'react';
import { store } from '../hooks';

function tryFullscreen() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (coarse && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function TitleScreen({ hasSave }: { hasSave: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const start = (fn: () => void) => {
    tryFullscreen();
    fn();
  };
  return (
    <div className="title">
      <div className="title-card">
        <div className="title-anvil">⚒️</div>
        <h1>Forja &amp; Fortuna</h1>
        <p className="tagline">No sos un héroe. Sos quien les forja el destino.</p>
        <div className="title-buttons">
          {hasSave && <button className="btn primary big" onClick={() => start(() => store.continueGame())}>Continuar</button>}
          {!confirm ? (
            <button className={`btn big ${hasSave ? '' : 'primary'}`} onClick={() => (hasSave ? setConfirm(true) : start(() => store.newGame()))}>
              Nueva partida
            </button>
          ) : (
            <button className="btn big danger" onClick={() => start(() => store.deleteSaveAndRestart())}>¿Seguro? Se pierde la partida actual</button>
          )}
        </div>
      </div>
    </div>
  );
}
