import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { currentCity } from '../../core/state';
import { slotName } from '../../core/time';
import type { City, CityLocation } from '../../core/types';
import { artScale, facing, installWalkBob, isRealArt } from '../render/assets';
import { AMBIENT_VARIANTS } from '../render/placeholders';
import { CITY_PLACES } from '../render/illustrated';
import { drawWalledTown } from '../render/townMap';
import { SLOT_LIGHT } from './lighting';

const MAP_W = 1280;
const MAP_H = 720;

/** Mapa ilustrado de la ciudad con edificios tocables. */
export class CityMapScene extends Phaser.Scene {
  private unsubs: (() => void)[] = [];
  private cityId = '';

  constructor(private store: GameStore) {
    super('CityMap');
  }

  create() {
    installWalkBob(this);
    // También es el fondo de la pantalla de título, cuando todavía no hay partida.
    const state = this.store.getSnapshot().state;
    const city = this.store.content.cities[state ? currentCity(state) : 'valdebrasa'];
    this.cityId = city.id;
    const slot = state ? slotName(state) : 'mañana';
    const light = SLOT_LIGHT[slot];
    this.cameras.main.setBackgroundColor(light.bg);

    // Con ilustración de la ciudad, la imagen entera reemplaza al pueblo dibujado y a los edificios sueltos.
    const illustrated = isRealArt(`ciudad.${city.id}`);
    if (illustrated) this.add.image(0, 0, `ciudad.${city.id}`).setOrigin(0, 0).setDisplaySize(MAP_W, MAP_H).setDepth(-100);
    const plaza = this.drawTown(city, !illustrated);
    const doors: { x: number; y: number }[] = [];
    for (const loc of city.locations) doors.push(this.drawBuilding(loc, illustrated ? CITY_PLACES[city.id]?.[loc.id] : undefined));
    this.spawnWalkers(doors, slot === 'noche' ? 2 : 6, plaza);

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

  /**
   * La ciudad vista desde el aire: muralla, calles desde la plaza y casas entre los edificios (render/townMap.ts).
   * Valdebrasa es un pueblo de valle con río; Puertoseco, un puerto sobre una bahía; Fuerte Ceniza, una fortaleza
   * en estrella. Devuelve la plaza, por donde pasa la gente que camina.
   */
  private drawTown(city: City, draw = true) {
    const kind = city.ground;
    const { locations } = city;
    const square = locations.find((l) => l.kind === (kind === 'fortaleza' ? 'tablon' : 'mercado')) ?? locations[0];
    const plaza = kind === 'puerto' ? { x: MAP_W / 2, y: 430 } : { x: square.map.x, y: square.map.y + square.map.h * 0.5 };
    const shape = {
      valle: { wall: { cx: MAP_W / 2, cy: 370, rx: 600, ry: 330 }, gates: [180, 0, 90, 270] },
      puerto: { wall: { cx: MAP_W / 2, cy: 640, rx: 660, ry: 610 }, gates: [270, 215, 325], shore: { center: 575, edge: 615 } },
      fortaleza: { wall: { cx: MAP_W / 2, cy: 380, rx: 610, ry: 330 }, gates: [90, 150] },
    }[kind];
    if (!draw) return plaza;
    drawWalledTown(this, {
      key: `town.${city.id}`, kind, w: MAP_W, h: MAP_H, plaza, seed: 7, ...shape,
      river: kind === 'valle'
        ? [{ x: 600, y: -140 }, { x: 590, y: 0 }, { x: 540, y: 90 }, { x: 570, y: 170 }, { x: 530, y: 250 }, { x: 490, y: 330 }, { x: 500, y: 400 }, { x: 455, y: 460 }, { x: 470, y: 540 }, { x: 530, y: 610 }, { x: 520, y: 700 }, { x: 560, y: 860 }]
        : undefined,
      buildings: locations.map(({ name, map: { x, y, w, h } }) => {
        // La imagen del edificio y su nombre debajo quedan libres de casas.
        const half = Math.max((w + 20) / 2, name.length * 5.5 + 8) + 6;
        return { door: { x, y: y + h * 0.4 + 8 }, box: { x0: x - half, x1: x + half, y0: y - h * 0.6 - 6, y1: y + h * 0.5 + 40 } };
      }),
    });
    return plaza;
  }

  /** Un lugar de la ciudad: su edificio, su nombre y la zona tocable. Sobre una ilustración (at), solo nombre y zona. */
  private drawBuilding(loc: CityLocation, at?: { x: number; y: number }): { x: number; y: number } {
    const { w, h, roof } = loc.map;
    const illustrated = !!at || isRealArt(`ciudad.${this.cityId}`);
    const { x, y } = at ?? loc.map;
    const roofColor = parseInt(roof.slice(1), 16);
    const wall = loc.available ? 0xf0e0c0 : 0xb8b0a0;
    const c = this.add.container(x, y).setDepth(y + h);
    const g = this.add.graphics();
    if (illustrated) {
      // El edificio ya está en la ilustración.
    } else if (isRealArt(`build.${loc.id}`)) {
      // Arte definitivo del edificio: apoyado sobre la misma base que el dibujado.
      g.fillStyle(0x000000, 0.18).fillEllipse(0, h * 0.42, w * 1.1, h * 0.35);
      c.add(g);
      const img = this.add.image(0, h * 0.4, `build.${loc.id}`).setOrigin(0.5, 1);
      if (!loc.available) img.setTint(0x9a948a);
      c.add(img);
    } else {
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
    }

    const label = this.add.text(0, h * 0.5 + 6, loc.available ? loc.name : `${loc.name}\n(próximamente)`, {
      fontFamily: 'system-ui, sans-serif', fontSize: loc.available ? '22px' : '17px', fontStyle: loc.available ? 'bold' : 'normal',
      color: loc.available ? '#fff8e8' : '#d6d0c4',
      backgroundColor: loc.available ? '#3a2418cc' : '#3a3a3acc', padding: { x: 6, y: 3 }, align: 'center',
    }).setOrigin(0.5, 0).setResolution(2);
    c.add(label);

    const state = this.store.getSnapshot().state;
    if (state?.location === loc.id) {
      const marker = this.add.sprite(w / 2 - 6, h * 0.25, 'char.herrero').setScale(artScale('char.herrero', 2)).setOrigin(0.5, 1);
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

  /** Gente caminando entre las puertas de los edificios. Si hay plaza, van por las calles, pasando por ella. */
  private spawnWalkers(doors: { x: number; y: number }[], count: number, plaza: { x: number; y: number } | null) {
    for (let i = 0; i < count; i++) {
      const key = `char.amb.${i % AMBIENT_VARIANTS}`;
      const start = Phaser.Utils.Array.GetRandom(doors);
      const s = this.add.sprite(start.x, start.y, key).setScale(artScale(key, 1.6)).setOrigin(0.5, 1);
      const leg = (to: { x: number; y: number }, delay: number, next: () => void) => {
        const dist = Phaser.Math.Distance.Between(s.x, s.y, to.x, to.y);
        const f = facing(key, to.x - s.x, to.y - s.y);
        s.play(`${f.key}.walk`, true).setFlipX(f.flip);
        this.tweens.add({ targets: s, x: to.x, y: to.y, duration: dist * 22, delay, onUpdate: () => s.setDepth(s.y), onComplete: next });
      };
      const walk = () => {
        const to = Phaser.Utils.Array.GetRandom(doors);
        const delay = Phaser.Math.Between(300, 2500);
        if (!plaza) return leg(to, delay, walk);
        const mid = { x: plaza.x + Phaser.Math.Between(-90, 90), y: plaza.y + Phaser.Math.Between(-20, 30) };
        leg(mid, delay, () => leg(to, 0, walk));
      };
      walk();
    }
  }
}
