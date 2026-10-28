import { planTurn } from '../core/combat/ai';
import * as expeditionCommands from '../core/world/expedition';
import { CONTENT } from '../data';
import { validateContent } from '../data/validate';
import { IndexedDbRepository } from '../persistence/indexedDbRepository';
import { GameStore } from './GameStore';

function debugEnabled(): boolean {
  try {
    if (new URLSearchParams(location.search).has('debug')) return true;
    return localStorage.getItem('fyf.debug') === '1';
  } catch {
    return false;
  }
}

const errors = validateContent(CONTENT);
if (errors.length) console.error('Errores en el contenido del juego:\n' + errors.join('\n'));

export const store = new GameStore(CONTENT, new IndexedDbRepository(), debugEnabled());

// En modo debug, el store y los comandos de expedición quedan a mano en la consola (window.fyf / fyfCmd) para probar.
if (debugEnabled()) {
  const w = window as unknown as { fyf: GameStore; fyfCmd: typeof expeditionCommands; fyfPlan: typeof planTurn };
  w.fyf = store;
  w.fyfCmd = expeditionCommands;
  w.fyfPlan = planTurn;
}

export function setDebugPersisted(on: boolean) {
  try {
    localStorage.setItem('fyf.debug', on ? '1' : '0');
  } catch {
    // Sin almacenamiento: el modo debug dura solo esta sesión.
  }
  store.setUi({ debug: on });
}
