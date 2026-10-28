import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { generatePlaceholders } from '../render/placeholders';

export class BootScene extends Phaser.Scene {
  constructor(private store: GameStore) {
    super('Boot');
  }

  create() {
    // Acá se cargarían los sprites reales con las mismas claves que los placeholders.
    generatePlaceholders(this, this.store.content);
    this.game.events.emit('assets-ready');
  }
}
