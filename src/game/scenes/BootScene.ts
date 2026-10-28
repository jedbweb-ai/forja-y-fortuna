import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { ensureWalkAnims, loadArt, prepareArt } from '../render/assets';
import { generatePlaceholders } from '../render/placeholders';

export class BootScene extends Phaser.Scene {
  constructor(private store: GameStore) {
    super('Boot');
  }

  preload() {
    loadArt(this);
  }

  create() {
    // Primero el arte definitivo que haya; los placeholders completan lo que falta (mismas claves).
    prepareArt(this);
    generatePlaceholders(this, this.store.content);
    ensureWalkAnims(this);
    this.game.events.emit('assets-ready');
  }
}
