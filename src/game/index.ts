import Phaser from 'phaser';
import type { GameStore, Snapshot } from '../bridge/GameStore';
import { BootScene } from './scenes/BootScene';
import { CityMapScene } from './scenes/CityMapScene';
import { LiveScene } from './scenes/LiveScene';

/** Crea el juego de Phaser y sincroniza la escena visible con el estado del store. */
export function createGame(parent: HTMLElement, store: GameStore): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1b1420',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    // Sin eventos de ventana: los toques sobre la UI de React no deben llegar a la escena.
    input: { activePointers: 2, windowEvents: false },
    scene: [new BootScene(store), new CityMapScene(store), new LiveScene(store)],
  });

  let ready = false;
  let current = '';

  const desired = (snap: Snapshot): { key: string; id: string; data?: object } => {
    if (snap.ui.screen !== 'game' || !snap.state || snap.ui.view === 'map') return { key: 'CityMap', id: 'map' };
    return { key: 'Live', id: `live:${snap.state.location}`, data: { locationId: snap.state.location } };
  };

  const sync = () => {
    if (!ready) return;
    const want = desired(store.getSnapshot());
    if (want.id === current) return;
    current = want.id;
    for (const key of ['CityMap', 'Live']) if (game.scene.isActive(key) || game.scene.isPaused(key)) game.scene.stop(key);
    game.scene.start(want.key, want.data);
  };

  game.events.once('assets-ready', () => {
    ready = true;
    sync();
  });
  store.subscribe(sync);
  store.onEvent((e) => {
    if (e.type === 'gameLoaded') {
      current = '';
      sync();
    }
  });
  return game;
}
