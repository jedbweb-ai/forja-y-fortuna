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

export function setDebugPersisted(on: boolean) {
  try {
    localStorage.setItem('fyf.debug', on ? '1' : '0');
  } catch {
    // Sin almacenamiento: el modo debug dura solo esta sesión.
  }
  store.setUi({ debug: on });
}
