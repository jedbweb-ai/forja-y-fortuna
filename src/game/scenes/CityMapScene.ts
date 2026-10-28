import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { currentCity } from '../../core/state';
import { slotName } from '../../core/time';
import type { CityLocation } from '../../core/types';
import { AMBIENT_VARIANTS } from '../render/placeholders';
import { SLOT_LIGHT } from './lighting';

const MAP_W = 1280;
const MAP_H = 720;

/** Mapa ilustrado de la ciudad con edificios tocables. */
export class CityMapScene extends Phaser.Scene {
  private unsubs: (() => void)[] = [];

  constructor(private store: GameStore) {
    super('CityMap');
  }

  create() {
    // También es el fondo de la pantalla de título, cuando todavía no hay partida.
    const state = this.store.getSnapshot().state;
    const city = this.store.content.cities[state ? currentCity(state) : 'valdebrasa'];
    const slot = state ? slotName(state) : 'mañana';
    const light = SLOT_LIGHT[slot];
    this.cameras.main.setBackgroundColor(light.bg);

    this.drawGround(city.ground);
    const doors: { x: number; y: number }[] = [];
    for (const loc of city.locations) doors.push(this.drawBuilding(loc));
    this.spawnWalkers(doors, slot === 'noche' ? 2 : 6);

    this.add.text(MAP_W / 2, 26, city.name, {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: '#fff4dc', stroke: '#3a2418', strokeThickness: 6,
    }).setOrigin(0.5, 0).setResolution(2).setDepth(2000);

    this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W * 2, MAP_H * 2, light.color, light.alpha).setDepth(1500);
    if (light.lamps) {
      for (const d of doors) this.add.image(d.x, d.y - 10, 'fx.glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(1600).setScale(0.8);
    }

    this.fit();
    this.scale.on('resize', this.fit, this);
    this.unsubs.push(this.store.onEvent((e) => { if (e.type === 'timeAdvanced') this.scene.restart(); }));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fit, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private fit() {
    const cam = this.cameras.main;
    const { width, height } = this.scale.gameSize;
    const zoom = Math.min(width / MAP_W, (height - 60) / MAP_H);
    cam.setZoom(zoom);
    cam.centerOn(MAP_W / 2, MAP_H / 2 - 10 / zoom);
  }

  private drawGround(ground: 'valle' | 'puerto' | 'fortaleza') {
    if (ground === 'puerto') return this.drawPort();
    if (ground === 'fortaleza') return this.drawFortress();
    const g = this.add.graphics();
    g.fillStyle(0x7cb35a, 1).fillRect(-200, -200, MAP_W + 400, MAP_H + 400);
    g.fillStyle(0x6aa84f, 1);
    for (let i = 0; i < 60; i++) g.fillCircle((i * 197) % MAP_W, (i * 113) % MAP_H, 18 + (i % 4) * 6);
    // Río con puente
    g.fillStyle(0x4a90c8, 1);
    g.fillPoints([
      new Phaser.Math.Vector2(520, -40), new Phaser.Math.Vector2(580, -40), new Phaser.Math.Vector2(560, 200),
      new Phaser.Math.Vector2(520, 420), new Phaser.Math.Vector2(560, 760), new Phaser.Math.Vector2(500, 760),
      new Phaser.Math.Vector2(460, 420), new Phaser.Math.Vector2(500, 200),
    ], true);
    // Caminos
    g.lineStyle(26, 0xc9a66b, 1);
    g.lineBetween(120, 470, 1240, 470);
    g.lineBetween(640, 120, 640, 640);
    g.lineBetween(300, 470, 210, 300);
    g.lineBetween(980, 470, 1060, 260);
    g.lineBetween(640, 300, 860, 220);
    g.lineBetween(980, 470, 1150, 640);
    g.lineBetween(300, 470, 200, 620);
    g.fillStyle(0x8b5a2b, 1).fillRect(470, 456, 110, 28);
    g.lineStyle(2, 0x5e3a1e, 1);
    for (let x = 476; x < 580; x += 10) g.lineBetween(x, 456, x, 484);
    // Árboles
    for (let i = 0; i < 26; i++) {
      const x = 40 + ((i * 263) % (MAP_W - 80));
      const y = 80 + ((i * 151) % (MAP_H - 120));
      if (Math.abs(y - 470) < 40 || Math.abs(x - 640) < 40) continue;
      this.add.image(x, y, 'prop.tree').setScale(0.7).setDepth(y);
    }
  }

  /** Puerto: arena, mar al sur y un muelle de madera. */
  private drawPort() {
    const g = this.add.graphics();
    g.fillStyle(0xe8d6a8, 1).fillRect(-200, -200, MAP_W + 400, MAP_H + 400);
    g.fillStyle(0xd9c18a, 1);
    for (let i = 0; i < 40; i++) g.fillCircle((i * 197) % MAP_W, (i * 113) % 470, 14 + (i % 4) * 5);
    g.fillStyle(0x3a7ab8, 1).fillRect(-200, 610, MAP_W + 400, 400);
    g.fillStyle(0x5a9ad0, 1);
    for (let i = 0; i < 20; i++) g.fillRect((i * 151) % MAP_W, 640 + (i % 4) * 20, 40, 3);
    g.fillStyle(0x8b5a2b, 1).fillRect(560, 600, 160, 30).fillRect(620, 600, 40, 120);
    g.lineStyle(26, 0xc9a66b, 1);
    g.lineBetween(120, 470, 1200, 470);
    g.lineBetween(640, 140, 640, 600);
    g.lineBetween(220, 470, 220, 250);
    g.lineBetween(1050, 470, 1050, 230);
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 220;
      this.add.image(x, 120, 'prop.tree').setScale(0.6).setTint(0x9acb6a).setDepth(120);
    }
  }

  /** Fortaleza: tierra, muralla de piedra alrededor y torres en las esquinas. */
  private drawFortress() {
    const g = this.add.graphics();
    g.fillStyle(0x9a8a6a, 1).fillRect(-200, -200, MAP_W + 400, MAP_H + 400);
    g.fillStyle(0x8a7a5a, 1);
    for (let i = 0; i < 50; i++) g.fillCircle((i * 197) % MAP_W, (i * 113) % MAP_H, 12 + (i % 4) * 6);
    g.lineStyle(34, 0x6a6a72, 1).strokeRect(70, 80, MAP_W - 140, MAP_H - 130);
    g.lineStyle(4, 0x4a4a52, 1).strokeRect(53, 63, MAP_W - 106, MAP_H - 96);
    for (const [x, y] of [[70, 80], [MAP_W - 70, 80], [70, MAP_H - 50], [MAP_W - 70, MAP_H - 50]]) {
      g.fillStyle(0x5a5a62, 1).fillCircle(x, y, 34);
      g.fillStyle(0x7a7a82, 1).fillCircle(x, y, 26);
    }
    g.fillStyle(0x3a2a1a, 1).fillRect(MAP_W / 2 - 40, MAP_H - 66, 80, 34);
    g.lineStyle(24, 0xb89a6b, 1);
    g.lineBetween(160, 460, 1120, 460);
    g.lineBetween(640, 180, 640, 650);
    g.lineBetween(300, 460, 300, 330);
    g.lineBetween(1000, 460, 1000, 260);
  }

  private drawBuilding(loc: CityLocation): { x: number; y: number } {
    const { x, y, w, h, roof } = loc.map;
    const roofColor = parseInt(roof.slice(1), 16);
    const wall = loc.available ? 0xf0e0c0 : 0xb8b0a0;
    const c = this.add.container(x, y).setDepth(y + h);
    const g = this.add.graphics();
    // Sombra, paredes, techo, puerta y ventanas
    g.fillStyle(0x000000, 0.18).fillEllipse(0, h * 0.42, w * 1.1, h * 0.35);
    g.fillStyle(wall, 1).fillRect(-w / 2, -h * 0.1, w, h * 0.5);
    g.fillStyle(0x000000, 0.12).fillRect(w * 0.2, -h * 0.1, w * 0.3, h * 0.5);
    g.fillStyle(loc.available ? roofColor : 0x7d7468, 1);
    g.fillTriangle(-w / 2 - 10, -h * 0.1, 0, -h * 0.62, w / 2 + 10, -h * 0.1);
    g.fillStyle(0x000000, 0.15).fillTriangle(0, -h * 0.62, w / 2 + 10, -h * 0.1, w * 0.1, -h * 0.1);
    g.fillStyle(0x5e3a1e, 1).fillRect(-9, h * 0.12, 18, h * 0.28);
    g.fillStyle(loc.available ? 0xffe08a : 0x6e6a62, 1);
    g.fillRect(-w / 2 + 12, h * 0.02, 16, 14).fillRect(w / 2 - 28, h * 0.02, 16, 14);
    c.add(g);

    const label = this.add.text(0, h * 0.5 + 6, loc.available ? loc.name : `${loc.name}\n(próximamente)`, {
      fontFamily: 'system-ui, sans-serif', fontSize: loc.available ? '22px' : '17px', fontStyle: loc.available ? 'bold' : 'normal',
      color: loc.available ? '#fff8e8' : '#d6d0c4',
      backgroundColor: loc.available ? '#3a2418cc' : '#3a3a3acc', padding: { x: 6, y: 3 }, align: 'center',
    }).setOrigin(0.5, 0).setResolution(2);
    c.add(label);

    const state = this.store.getSnapshot().state;
    if (state?.location === loc.id) {
      const marker = this.add.sprite(w / 2 - 6, h * 0.25, 'char.herrero').setScale(2).setOrigin(0.5, 1);
      c.add(marker);
      this.tweens.add({ targets: marker, y: marker.y - 4, yoyo: true, repeat: -1, duration: 600 });
    }

    const zone = this.add.zone(0, h * 0.05, w + 20, h * 1.3).setInteractive({ useHandCursor: true });
    c.add(zone);
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: c, scale: 0.96, yoyo: true, duration: 80 });
      if (loc.available) this.store.goTo(loc.id);
      else this.store.toast(`${loc.name}: abre más adelante.`);
    });
    zone.on('pointerover', () => c.setScale(1.04));
    zone.on('pointerout', () => c.setScale(1));
    return { x, y: y + h * 0.4 };
  }

  /** Gente caminando entre las puertas de los edificios. */
  private spawnWalkers(doors: { x: number; y: number }[], count: number) {
    for (let i = 0; i < count; i++) {
      const key = `char.amb.${i % AMBIENT_VARIANTS}`;
      const start = Phaser.Utils.Array.GetRandom(doors);
      const s = this.add.sprite(start.x, start.y, key).setScale(1.6).setOrigin(0.5, 1);
      s.play(`${key}.walk`);
      const walk = () => {
        const to = Phaser.Utils.Array.GetRandom(doors);
        const dist = Phaser.Math.Distance.Between(s.x, s.y, to.x, to.y);
        s.setFlipX(to.x < s.x);
        this.tweens.add({
          targets: s, x: to.x, y: to.y, duration: dist * 22, delay: Phaser.Math.Between(300, 2500),
          onUpdate: () => s.setDepth(s.y), onComplete: walk,
        });
      };
      walk();
    }
  }
}
