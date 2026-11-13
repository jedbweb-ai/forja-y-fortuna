import { useState } from 'react';
import { store } from '../hooks';

function tryFullscreen() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (coarse && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => undefined);
}

export function TitleScreen({ hasSave }: { hasSave: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [choose, setChoose] = useState(false);
  const begin = (guide: boolean) => start(() => (hasSave ? store.deleteSaveAndRestart(guide) : store.newGame(guide)));
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
          {hasSave && <button className="btn primary big" data-key="enter" onClick={() => start(() => store.continueGame())}>Continuar</button>}
          {choose ? (
            <>
              <button className="btn primary big" onClick={() => begin(true)}>📖 Con la guía del maestro</button>
              <button className="btn big" onClick={() => begin(false)}>Sin guía</button>
            </>
          ) : !confirm ? (
            <button className={`btn big ${hasSave ? '' : 'primary'}`} onClick={() => (hasSave ? setConfirm(true) : setChoose(true))}>
              Nueva partida
            </button>
          ) : (
            <button className="btn big danger" onClick={() => setChoose(true)}>¿Seguro? Se pierde la partida actual</button>
          )}
        </div>
      </div>
    </div>
  );
}
