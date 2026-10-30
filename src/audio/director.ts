import type { GameStore } from '../bridge/GameStore';
import type { GameState } from '../core/types';
import { music } from './music';
import { musicCandidates } from './musicKey';
import { subscribeAudioPrefs } from './prefs';
import { audioContext, sfx } from './sfx';

// Conecta el sonido con el juego: elige la música según dónde estás y toca los efectos de las acciones.
// Los efectos del combate van en CombatScene, sincronizados con cada animación.

const levels = (s: GameState) => Object.values(s.characters).reduce((n, c) => n + c.level, 0);

export function installAudio(store: GameStore) {
  // Los navegadores no dejan sonar nada hasta el primer toque o tecla.
  const unlock = () => {
    audioContext();
    music.resume();
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => music.setHidden(document.visibilityState === 'hidden'));

  // Clic suave en cualquier botón de la interfaz.
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement | null)?.closest?.('button');
    if (b && !b.disabled) sfx('click');
  }, true);

  subscribeAudioPrefs(() => music.refresh());

  let prev: GameState | null = null;
  let prevPanel = store.getSnapshot().ui.panel;
  let lastToast = 0;
  store.subscribe(() => {
    const { state, ui } = store.getSnapshot();
    music.play(musicCandidates(ui.screen, ui.view, state));
    // Avisos de error (no se puede, falta oro...): un zumbido corto.
    for (const t of ui.toasts) {
      if (t.id <= lastToast) continue;
      lastToast = t.id;
      if (t.tone === 'bad') sfx('error');
    }
    if (ui.panel !== prevPanel) {
      if (ui.panel && !prevPanel) sfx('abrir');
      else if (!ui.panel && prevPanel) sfx('cerrar');
      prevPanel = ui.panel;
    }
    if (prev && state && prev !== state) {
      if (state.gold > prev.gold) sfx('monedas');
      else if (state.gold < prev.gold) sfx('pagar');
      if (levels(state) > levels(prev)) sfx('nivel');
    }
    prev = state;
  });

  store.onEvent((e) => {
    switch (e.type) {
      case 'gameLoaded': prev = store.getSnapshot().state; break;
      case 'forgeHit': sfx(e.result === 'perfecto' ? 'martillo_perfecto' : e.result === 'defecto' ? 'martillo_defecto' : 'martillo'); break;
      case 'forgeRuined': sfx('arruinado'); break;
      case 'itemCreated': sfx('templado'); break;
      case 'synergyDiscovered': sfx('sinergia'); break;
      case 'brewed': sfx('pocion'); break;
      case 'gathered': sfx('recoger'); break;
      case 'expeditionStarted': sfx('partir'); break;
      case 'combatEnded':
        if (e.outcome !== 'fled' && !music.jingle(e.outcome === 'victory' ? 'victoria' : 'derrota')) sfx(e.outcome === 'victory' ? 'victoria' : 'derrota');
        break;
    }
  });
}
