import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { installAudio } from './audio/director';
import { store } from './bridge/store';
import { createGame } from './game';
import { App } from './ui/App';
import { installShortcuts } from './ui/shortcuts';
import './ui/styles.css';

const game = createGame(document.getElementById('game')!, store);
if (store.getSnapshot().ui.debug) (window as unknown as { fyfGame: typeof game }).fyfGame = game;
createRoot(document.getElementById('ui')!).render(<App />);
installAudio(store);
store.init();
installShortcuts();

// Guardar al minimizar o cerrar la pestaña.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.saveNow();
});

if (import.meta.env.PROD) registerSW({ immediate: true });
