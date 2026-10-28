import { useSyncExternalStore } from 'react';
import { store } from '../bridge/store';
import type { GameState } from '../core/types';

export function useSnapshot() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/** Estado de la partida en curso (solo usar dentro de la pantalla de juego). */
export function useGame(): GameState {
  const snap = useSnapshot();
  if (!snap.state) throw new Error('Sin partida');
  return snap.state;
}

export { store };
