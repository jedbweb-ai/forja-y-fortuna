import Phaser from 'phaser';
import { currentCity } from '../../core/state';
import { dungeonUnlocked } from '../../core/dungeon/dungeon';
import { regionOpen } from '../../core/world/region';
import { isRealArt } from '../render/assets';
import type { GameStore } from '../../bridge/GameStore';

const W = 1280;
const H = 720;

/** Mapa del mundo: Valdebrasa y las regiones, con su nivel de peligro. */
export class WorldMapScene extends Phaser.Scene {
  constructor(private store: GameStore) {
    super('World');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2a2230);
    // Con arte definitivo, la ilustración del mapa (world.mapa) reemplaza al pergamino dibujado.
    this.art = this.textures.exists('world.mapa') && isRealArt('world.mapa');
    if (this.art) this.add.image(20, 20, 'world.mapa').setOrigin(0, 0).setDisplaySize(W - 40, H - 40);
    const g = this.add.graphics();
    if (!this.art) this.drawParchment(g);
    this.label(W / 2, 30, 'El Valle y más allá', { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#5a3a24' });
    this.drawPlaces(g);
  }

  private art = false;

  /** Texto del mapa. Sobre el arte definitivo lleva fondo oscuro y letra clara para que se lea encima del dibujo. */
  private label(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle, dim = false) {
    const s = this.art ? { ...style, color: dim ? '#d6d0c4' : '#fff8e8', backgroundColor: '#3a2418cc', padding: { x: 6, y: 3 } } : style;
    return this.add.text(x, y, text, s).setOrigin(0.5, 0).setResolution(2);
  }

  /** Pergamino dibujado (placeholder del mapa del mundo). */
  private drawParchment(g: Phaser.GameObjects.Graphics) {
    // Pergamino y tierras
    g.fillStyle(0xe8d6a8, 1).fillRoundedRect(20, 20, W - 40, H - 40, 24);
    g.fillStyle(0xd9c18a, 1);
    for (let i = 0; i < 40; i++) g.fillCircle(60 + ((i * 211) % (W - 120)), 60 + ((i * 137) % (H - 120)), 30 + (i % 5) * 10);
    g.fillStyle(0x9fc4d8, 1).fillEllipse(120, 600, 260, 160).fillEllipse(1180, 650, 220, 120);
    // Montañas y bosques de adorno
    for (let i = 0; i < 14; i++) {
      const x = 700 + (i % 7) * 70;
      const y = 120 + Math.floor(i / 7) * 60;
      g.fillStyle(0x8a7a6a, 1).fillTriangle(x - 30, y + 30, x, y - 20, x + 30, y + 30);
      g.fillStyle(0xf4f1ea, 1).fillTriangle(x - 8, y - 6, x, y - 20, x + 8, y - 6);
    }
    for (let i = 0; i < 18; i++) g.fillStyle(0x5a8a4a, 1).fillCircle(680 + (i % 6) * 34, 250 + Math.floor(i / 6) * 30, 16);
  }

  /** Ciudades, regiones y mazmorras sobre el mapa. */
  private drawPlaces(g: Phaser.GameObjects.Graphics) {
    // Ciudades: la actual vuelve a su mapa; las otras abren el viaje.
    const state = this.store.getSnapshot().state;
    const here = state ? currentCity(state) : 'valdebrasa';
    const HOME = this.store.content.cities[here].world;
    for (const city of Object.values(this.store.content.cities)) {
      const { x, y } = city.world;
      const mine = city.id === here;
      const route = this.store.content.cities[here].routes.find((r) => r.to === city.id);
      if (route) {
        const road = this.add.graphics();
        road.lineStyle(5, 0x8a6a42, 0.8).lineBetween(HOME.x, HOME.y, x, y);
      }
      g.fillStyle(0x7a3b2e, 1).fillRect(x - 22, y - 10, 44, 24);
      g.fillStyle(mine ? 0xc0563b : 0x5a6a8a, 1).fillTriangle(x - 28, y - 10, x, y - 34, x + 28, y - 10);
      this.label(x, y + 22, mine ? `${city.name}\n(estás acá)` : route ? `${city.name}\n${route.slots} franjas` : city.name, {
        fontFamily: 'Georgia, serif', fontSize: '22px', color: '#3a2418', fontStyle: 'bold', align: 'center',
      });
      const zone = this.add.zone(x, y, 140, 100).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (mine) this.store.setUi({ view: 'location' });
        else this.store.setUi({ panel: 'travel', travelTo: city.id });
      });
    }

    const content = this.store.content;
    for (const region of Object.values(content.regions).filter((r) => !r.hidden)) {
      const { x, y } = region.world;
      const open = !!state && regionOpen(state, region);
      const u = region.unlock;
      // Qué falta para abrirla, en corto.
      const locked = !region.available ? 'próximamente'
        : !open && u ? (u.bossOf ? `vencé a ${content.monsters[content.regions[u.bossOf].boss!.monsters[0]].name.split(',')[0]}` : `reputación ${u.reputationMin}`)
        : '';
      // Camino punteado desde la ciudad
      const path = this.add.graphics();
      path.lineStyle(3, open ? 0x7a4e26 : 0xa89a7a, 1);
      const steps = 14;
      for (let i = 0; i < steps; i += 2) {
        const a = i / steps;
        const b = (i + 1) / steps;
        path.lineBetween(HOME.x + (x - HOME.x) * a, HOME.y + (y - HOME.y) * a, HOME.x + (x - HOME.x) * b, HOME.y + (y - HOME.y) * b);
      }
      const marker = this.add.circle(x, y, 18, open ? 0xc0392b : 0x8a8270).setStrokeStyle(4, 0x3a2418);
      if (open) this.tweens.add({ targets: marker, scale: 1.15, yoyo: true, repeat: -1, duration: 700 });
      this.label(x, y + 24, `${region.name}\n${'★'.repeat(Math.min(region.danger, 9))}${locked ? `\n(${locked})` : ''}`, {
        fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: open ? '#3a2418' : '#7a6e5a', align: 'center',
        fontStyle: open ? 'bold' : 'normal',
      }, !open);
      const zone = this.add.zone(x, y + 20, 170, 110).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (open) this.store.setUi({ panel: 'expedition', regionId: region.id });
        else this.store.toast(`${region.name}: ${u && region.available ? u.hint : 'todavía no se puede llegar.'}`);
      });
    }

    const s = state;
    for (const d of Object.values(this.store.content.dungeons)) {
      const open = !!s && dungeonUnlocked(s, d);
      // Una entrada escondida que no se encontró todavía no aparece en el mapa.
      if (!open && d.unlock.flag) continue;
      const { x, y } = d.world;
      const g2 = this.add.graphics();
      g2.fillStyle(open ? 0x3a2a4a : 0x6a6470, 1).fillTriangle(x - 26, y + 14, x, y - 24, x + 26, y + 14);
      g2.fillStyle(0x0c0a10, 1).fillTriangle(x - 10, y + 14, x, y - 4, x + 10, y + 14);
      const p = s?.dungeons.progress[d.id];
      this.label(x, y + 20, `${d.name}\n${'★'.repeat(Math.min(d.danger, 9))} · ${d.floors} pisos${open ? (p?.clears ? ` · ✔ ${p.clears}` : '') : '\n(cerrada)'}`, {
        fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: open ? '#3a2418' : '#7a6e5a', align: 'center', fontStyle: open ? 'bold' : 'normal',
      }, !open);
      const zone = this.add.zone(x, y + 10, 170, 100).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.store.setUi({ panel: 'dungeon', dungeonId: d.id }));
    }

    this.fit();
    this.scale.on('resize', this.fit, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fit, this));
  }

  private fit() {
    const { width, height } = this.scale.gameSize;
    const zoom = Math.min(width / W, (height - 60) / H);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(W / 2, H / 2);
  }
}
