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
    if (this.art) {
      this.add.image(20, 20, 'world.mapa').setOrigin(0, 0).setDisplaySize(W - 40, H - 40).setDepth(-20);
      this.ambient();
    }
    const g = this.add.graphics();
    if (!this.art) this.drawParchment(g);
    this.label(W / 2, 30, 'El Valle y más allá', { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#5a3a24' });
    this.drawPlaces(g);
  }

  private art = false;

  /**
   * Marcador dibujado de un lugar (world.<id>), si existe: apoyado sobre su punto, con el nombre debajo.
   * Los lugares abiertos se mueven un poco; los cerrados quedan grises.
   */
  private marker(id: string, x: number, y: number, open: boolean): boolean {
    const key = `world.${id}`;
    if (!isRealArt(key)) return false;
    const img = this.add.image(x, y + 18, key).setOrigin(0.5, 1);
    if (!open) img.setTint(0x8a8270);
    else this.tweens.add({ targets: img, y: img.y - 4, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut', delay: (x * 7) % 900 });
    return true;
  }

  /** Vida sobre la ilustración: nubes que pasan, humo del volcán y brillos en el agua. */
  private ambient() {
    if (!this.textures.exists('fx.cloud')) {
      // Nube en pixel: círculos blancos superpuestos, dibujada a la mitad y mostrada al doble.
      const g = this.make.graphics({}, false);
      for (const [cx, cy, r] of [[18, 14, 9], [30, 10, 11], [43, 14, 9], [26, 17, 8], [37, 18, 7]]) g.fillStyle(0xffffff, 1).fillCircle(cx, cy, r);
      g.generateTexture('fx.cloud', 56, 28);
      g.destroy();
    }
    // Lo que hay debajo de cada punto del dibujo: tierra, agua o nada (afuera de la isla).
    const src = this.textures.get('world.mapa').getSourceImage() as HTMLCanvasElement;
    const data = src.getContext?.('2d')?.getImageData(0, 0, src.width, src.height).data;
    const sx = src.width / (W - 40), sy = src.height / (H - 40);
    const pixel = (x: number, y: number) => {
      const px = Math.floor((x - 20) * sx), py = Math.floor((y - 20) * sy);
      if (!data || px < 0 || py < 0 || px >= src.width || py >= src.height) return null;
      const i = (py * src.width + px) * 4;
      return data[i + 3] ? [data[i], data[i + 1], data[i + 2]] : null;
    };
    // Nubes que pasan despacio. Afuera de la isla se desvanecen (sobre el fondo oscuro parecerían manchas).
    for (let i = 0; i < 5; i++) {
      const base = 0.14 + Math.random() * 0.1;
      const c = this.add.image(Phaser.Math.Between(0, W), 130 + i * 100 + Phaser.Math.Between(-20, 20), 'fx.cloud')
        .setScale(2 + Math.random() * 1.5).setAlpha(0).setDepth(-11);
      const drift = () => {
        const speed = 18 + Math.random() * 14; // píxeles por segundo
        this.tweens.add({
          targets: c, x: W + 150, duration: ((W + 150 - c.x) / speed) * 1000,
          onUpdate: () => c.setAlpha(Phaser.Math.Linear(c.alpha, pixel(c.x, c.y) ? base : 0, 0.03)),
          onComplete: () => { c.x = -150; drift(); },
        });
      };
      drift();
    }
    // Humo que sale del volcán de las Tierras del Dragón
    this.time.addEvent({
      delay: 700, loop: true, callback: () => {
        const puff = this.add.image(1030 + Phaser.Math.Between(-4, 4), 88, 'fx.cloud').setScale(0.25).setTint(0x8a8a92).setAlpha(0.6).setDepth(-12);
        this.tweens.add({ targets: puff, x: puff.x + 24, y: puff.y - 50, scale: 0.55, alpha: 0, duration: 2800, onComplete: () => puff.destroy() });
      },
    });
    // Brillos sobre el agua: se buscan los puntos azules del dibujo y titilan algunos al azar.
    const water: { x: number; y: number }[] = [];
    for (let y = 20; y < H - 20; y += 8) {
      for (let x = 20; x < W - 20; x += 8) {
        const c = pixel(x, y);
        if (c && c[2] > c[0] + 40 && c[2] > c[1]) water.push({ x, y });
      }
    }
    if (!water.length) return;
    this.time.addEvent({
      delay: 250, loop: true, callback: () => {
        const p = Phaser.Utils.Array.GetRandom(water);
        const glint = this.add.rectangle(p.x, p.y, 6, 2, 0xe8f8ff).setAlpha(0).setDepth(-15);
        this.tweens.add({ targets: glint, alpha: 0.9, yoyo: true, duration: 500, onComplete: () => glint.destroy() });
      },
    });
  }

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
      if (!this.marker(city.id, x, y, true)) {
        g.fillStyle(0x7a3b2e, 1).fillRect(x - 22, y - 10, 44, 24);
        g.fillStyle(mine ? 0xc0563b : 0x5a6a8a, 1).fillTriangle(x - 28, y - 10, x, y - 34, x + 28, y - 10);
      }
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
      if (!this.marker(region.id, x, y, open)) {
        const marker = this.add.circle(x, y, 18, open ? 0xc0392b : 0x8a8270).setStrokeStyle(4, 0x3a2418);
        if (open) this.tweens.add({ targets: marker, scale: 1.15, yoyo: true, repeat: -1, duration: 700 });
      }
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
      if (!this.marker(d.id, x, y, open)) {
        const g2 = this.add.graphics();
        g2.fillStyle(open ? 0x3a2a4a : 0x6a6470, 1).fillTriangle(x - 26, y + 14, x, y - 24, x + 26, y + 14);
        g2.fillStyle(0x0c0a10, 1).fillTriangle(x - 10, y + 14, x, y - 4, x + 10, y + 14);
      }
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
