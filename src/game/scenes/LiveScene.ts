import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { cityLocation, npcsAt } from '../../core/city';
import { pickDialogue } from '../../core/dialogue';
import { slotName } from '../../core/time';
import type { HotspotDef, LiveSceneDef, TimeSlot } from '../../core/types';
import { isoBounds, isoDepth, isoToScreen, TILE_H } from '../render/iso';
import { artScale } from '../render/assets';
import { AMBIENT_VARIANTS, GUARD_VARIANTS } from '../render/placeholders';
import { SLOT_LIGHT } from './lighting';

interface Tile { x: number; y: number }

const STEP_MS = 420;
const CHAR_SCALE = 2;

/** Escena viva de un lugar: el herrero parado, NPCs con rutinas simples, carretas y animales. */
export class LiveScene extends Phaser.Scene {
  private locId = '';
  private def!: LiveSceneDef;
  private blocked = new Set<string>();
  private walkers: Phaser.GameObjects.Sprite[] = [];
  private unsubs: (() => void)[] = [];
  private customer?: { sprite: Phaser.GameObjects.Sprite; key: string };

  constructor(private store: GameStore) {
    super('Live');
  }

  init(data: { locationId: string }) {
    this.locId = data.locationId;
    this.walkers = [];
    this.customer = undefined;
  }

  create() {
    const loc = cityLocation(this.store.content, this.locId);
    if (!loc?.scene) throw new Error(`Lugar sin escena: ${this.locId}`);
    this.def = loc.scene;
    const state = this.store.state;
    const slot = slotName(state);
    const light = SLOT_LIGHT[slot];
    this.cameras.main.setBackgroundColor(light.bg);

    this.blocked = new Set(this.def.props.filter((p) => p.blocks).map((p) => `${p.x},${p.y}`));
    Object.values(this.def.npcSpots).forEach((p) => this.blocked.add(`${p.x},${p.y}`));
    this.blocked.add(`${this.def.spawn.x},${this.def.spawn.y}`);

    this.drawFloor();
    this.drawProps(light.lamps);
    this.drawHotspots();
    this.drawNamedNpcs();
    this.drawPlayer();
    this.spawnAmbient(slot);
    this.spawnAnimals();
    if (this.def.carts && this.def.roadRow !== undefined && slot !== 'noche') this.scheduleCart();

    const b = isoBounds(this.def.cols, this.def.rows);
    this.add.rectangle((b.left + b.right) / 2, (b.top + b.bottom) / 2, b.width * 4, b.height * 6, light.color, light.alpha).setDepth(9000);
    if (light.lamps) {
      for (const p of this.def.props.filter((q) => q.key === 'prop.lamp' || q.key === 'prop.fireplace' || q.key === 'prop.forge')) {
        const pos = isoToScreen(p.x, p.y);
        this.add.image(pos.x, pos.y - 40, 'fx.glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setScale(1.4);
      }
    }

    this.fit();
    this.scale.on('resize', this.fit, this);
    this.unsubs.push(this.store.onEvent((e) => {
      if (e.type === 'timeAdvanced') this.scene.restart({ locationId: this.locId });
      if (e.type === 'forgeHit') this.sparks(e.result === 'defecto');
    }));
    if (this.locId === 'herreria') {
      this.unsubs.push(this.store.subscribe(() => this.syncCustomer()));
      this.syncCustomer();
    }
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fit, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private fit() {
    const b = isoBounds(this.def.cols, this.def.rows);
    const { width, height } = this.scale.gameSize;
    const top = b.top - 70;
    const zoom = Phaser.Math.Clamp(Math.min(width / (b.width + 20), (height - 96) / (b.bottom - top)), 0.5, 2.6);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn((b.left + b.right) / 2, (top + b.bottom) / 2 - 10 / zoom);
  }

  // ── Construcción ──

  private drawFloor() {
    const { cols, rows, floor, roadRow } = this.def;
    const indoor = floor.startsWith('tile.wood');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = r === roadRow ? 'tile.road' : floor;
        // La variante solo existe en los placeholders (con arte definitivo no se mezclan estilos).
        const variant = (c * 7 + r * 3) % 5 === 0 && this.textures.exists(`${key}.1`) ? `${key}.1` : key;
        const p = isoToScreen(c, r);
        this.add.image(p.x, p.y, variant).setOrigin(0.5, 16 / 34).setDepth(-10000 + isoDepth(c, r));
      }
    }
    if (indoor) {
      // Paredes del fondo para los interiores.
      const g = this.add.graphics().setDepth(-20000);
      const wallH = 70;
      const lastRow = roadRow !== undefined ? roadRow - 1 : rows - 1;
      const a = isoToScreen(0, 0);
      const right = isoToScreen(cols - 1, 0);
      const left = isoToScreen(0, lastRow);
      const wall = floor === 'tile.wood_dark' ? 0x5a3f33 : 0x8a6a52;
      g.fillStyle(wall, 1);
      g.fillPoints([
        new Phaser.Math.Vector2(a.x, a.y - TILE_H / 2), new Phaser.Math.Vector2(right.x + 32, right.y),
        new Phaser.Math.Vector2(right.x + 32, right.y - wallH), new Phaser.Math.Vector2(a.x, a.y - TILE_H / 2 - wallH),
      ], true);
      g.fillStyle(0x000000, 0.18);
      g.fillPoints([
        new Phaser.Math.Vector2(a.x, a.y - TILE_H / 2), new Phaser.Math.Vector2(left.x - 32, left.y),
        new Phaser.Math.Vector2(left.x - 32, left.y - wallH), new Phaser.Math.Vector2(a.x, a.y - TILE_H / 2 - wallH),
      ], true);
      g.fillStyle(wall, 0.85);
      g.fillPoints([
        new Phaser.Math.Vector2(a.x, a.y - TILE_H / 2), new Phaser.Math.Vector2(left.x - 32, left.y),
        new Phaser.Math.Vector2(left.x - 32, left.y - wallH), new Phaser.Math.Vector2(a.x, a.y - TILE_H / 2 - wallH),
      ], true);
    }
  }

  private drawProps(night: boolean) {
    for (const p of this.def.props) {
      const pos = isoToScreen(p.x, p.y);
      const img = this.add.image(pos.x, pos.y + TILE_H / 2 - 2, p.key).setOrigin(0.5, 1).setDepth(isoDepth(p.x, p.y, 5));
      if (p.key === 'prop.forge' || p.key === 'prop.fireplace') {
        this.tweens.add({ targets: img, alpha: 0.9, yoyo: true, repeat: -1, duration: 300 + Math.random() * 200 });
      }
      if (night && p.key === 'prop.lamp') img.setTint(0xfff0c0);
    }
  }

  private drawHotspots() {
    for (const h of this.def.hotspots) this.addHotspot(h);
  }

  private addHotspot(h: HotspotDef) {
    const pos = isoToScreen(h.x, h.y);
    const label = this.add.text(pos.x, pos.y - 64, h.label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff8e8', backgroundColor: '#3a2418dd', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setResolution(2).setDepth(8000).setInteractive({ useHandCursor: true });
    const zone = this.add.zone(pos.x, pos.y - 14, 70, 60).setInteractive({ useHandCursor: true }).setDepth(8000);
    this.tweens.add({ targets: label, y: label.y - 4, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
    const act = () => {
      this.tweens.add({ targets: label, scale: 1.15, yoyo: true, duration: 90 });
      switch (h.action) {
        case 'forge': return this.store.openForge('yunque');
        case 'runas': return this.store.openForge('runas');
        case 'joyeria': return this.store.openForge('joyeria');
        case 'alquimia': return this.store.openPanel('alchemy');
        case 'libreria': return this.store.openPanel('library');
        case 'gremio':
        case 'tablon': return this.store.openPanel('quests');
        case 'subastas': return this.store.openPanel('auction');
        case 'esclavos': return this.store.openPanel('servants');
        case 'shop': return this.store.openPanel('shop');
        case 'market': return this.store.openPanel('market');
        case 'inventory': return this.store.openPanel('inventory');
        case 'book': return this.store.openPanel('book');
        case 'npc': return h.npc && this.store.talkTo(h.npc);
      }
    };
    label.on('pointerdown', act);
    zone.on('pointerdown', act);
  }

  private drawNamedNpcs() {
    const c = this.store.content;
    const state = this.store.state;
    for (const npcId of npcsAt(c, state, this.locId)) {
      const spot = this.def.npcSpots[npcId];
      if (!spot) continue;
      const npc = c.npcs[npcId];
      const pos = isoToScreen(spot.x, spot.y);
      const key = `char.npc.${npcId}`;
      this.add.image(pos.x, pos.y + 4, 'fx.shadow').setDepth(isoDepth(spot.x, spot.y, 6));
      const s = this.add.sprite(pos.x, pos.y + 6, key).setOrigin(0.5, 1).setScale(CHAR_SCALE).setDepth(isoDepth(spot.x, spot.y, 7));
      this.tweens.add({ targets: s, scaleY: CHAR_SCALE * 1.03, yoyo: true, repeat: -1, duration: 700 + spot.x * 40 });
      const name = this.add.text(pos.x, pos.y - 50, npc.name, {
        fontFamily: 'system-ui, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffe9a8', stroke: '#1a1220', strokeThickness: 4,
      }).setOrigin(0.5, 1).setResolution(2).setDepth(8000);
      // El "!" indica que hoy hay charla nueva; se apaga al hablar.
      const alert = this.add.image(pos.x, name.y - 18, 'fx.alert').setOrigin(0.5, 1).setDepth(8001).setScale(1.2);
      this.tweens.add({ targets: alert, y: alert.y - 5, yoyo: true, repeat: -1, duration: 500 });
      const syncAlert = () => {
        const st = this.store.getSnapshot().state;
        if (st && alert.active) alert.setVisible(!!pickDialogue(c, st, npcId));
      };
      syncAlert();
      this.unsubs.push(this.store.subscribe(syncAlert));
      s.setInteractive({ useHandCursor: true });
      name.setInteractive({ useHandCursor: true });
      const talk = () => this.store.talkTo(npcId);
      s.on('pointerdown', talk);
      name.on('pointerdown', talk);
    }
  }

  private drawPlayer() {
    const { x, y } = this.def.spawn;
    const pos = isoToScreen(x, y);
    this.add.image(pos.x, pos.y + 4, 'fx.shadow').setDepth(isoDepth(x, y, 6));
    const s = this.add.sprite(pos.x, pos.y + 6, 'char.herrero').setOrigin(0.5, 1).setScale(CHAR_SCALE).setDepth(isoDepth(x, y, 7));
    s.setData('player', true);
    this.tweens.add({ targets: s, scaleY: CHAR_SCALE * 1.04, yoyo: true, repeat: -1, duration: 650 });
    this.add.text(pos.x, pos.y - 50, 'Vos', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#ffffff', stroke: '#1a1220', strokeThickness: 4,
    }).setOrigin(0.5, 1).setResolution(2).setDepth(8000);
  }

  // ── NPCs ambientales ──

  private freeTiles(): Tile[] {
    const out: Tile[] = [];
    for (let r = 0; r < this.def.rows; r++) for (let c = 0; c < this.def.cols; c++) if (!this.blocked.has(`${c},${r}`)) out.push({ x: c, y: r });
    return out;
  }

  /** En interiores con calle (la herrería), los transeúntes solo pasan por la calle. */
  private walkerTiles(): Tile[] {
    const { floor, roadRow } = this.def;
    const free = this.freeTiles();
    return floor.startsWith('tile.wood') && roadRow !== undefined ? free.filter((t) => t.y === roadRow) : free;
  }

  /** Camino por BFS entre dos casillas libres (o null). */
  private path(from: Tile, to: Tile): Tile[] | null {
    const key = (t: Tile) => `${t.x},${t.y}`;
    const prev = new Map<string, Tile | null>([[key(from), null]]);
    const queue: Tile[] = [from];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur.x === to.x && cur.y === to.y) {
        const out: Tile[] = [];
        for (let t: Tile | null = cur; t; t = prev.get(key(t)) ?? null) out.unshift(t);
        return out.slice(1);
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: cur.x + dx, y: cur.y + dy };
        if (n.x < 0 || n.y < 0 || n.x >= this.def.cols || n.y >= this.def.rows) continue;
        if (this.blocked.has(key(n)) || prev.has(key(n))) continue;
        prev.set(key(n), cur);
        queue.push(n);
      }
    }
    return null;
  }

  private spawnAmbient(slot: TimeSlot) {
    const count = this.def.ambient[slot];
    const free = this.walkerTiles();
    for (let i = 0; i < count; i++) {
      const guard = slot === 'noche' && i % 3 === 0;
      const key = guard ? `char.guard.${i % GUARD_VARIANTS}` : `char.amb.${(i * 3 + this.locId.length) % AMBIENT_VARIANTS}`;
      const t = Phaser.Utils.Array.GetRandom(free);
      const pos = isoToScreen(t.x, t.y);
      const s = this.add.sprite(pos.x, pos.y + 6, key).setOrigin(0.5, 1).setScale(CHAR_SCALE).setDepth(isoDepth(t.x, t.y, 7));
      s.setData({ tile: t, key });
      this.walkers.push(s);
      this.time.delayedCall(Phaser.Math.Between(0, 2000), () => this.nextAction(s));
    }
  }

  private nextAction(s: Phaser.GameObjects.Sprite) {
    if (!s.active) return;
    const tile: Tile = s.getData('tile');
    const r = Math.random();
    if (r < 0.55) {
      const free = this.walkerTiles();
      const target = Phaser.Utils.Array.GetRandom(free);
      const steps = this.path(tile, target)?.slice(0, 10);
      if (steps?.length) return this.walk(s, steps, () => this.nextAction(s));
    } else if (r < 0.88) {
      const buddy = this.walkers.find((w) => w !== s && w.active && Phaser.Math.Distance.Between(w.x, w.y, s.x, s.y) < 90);
      if (buddy) {
        // Charlan o discuten precios.
        s.setFlipX(buddy.x < s.x);
        const bubble = this.add.image(s.x, s.y - 52, 'fx.bubble').setDepth(8500).setScale(1.2);
        this.tweens.add({ targets: bubble, y: bubble.y - 3, yoyo: true, repeat: 3, duration: 250, onComplete: () => bubble.destroy() });
      }
    } else if (this.def.doors.length) {
      // Sale por una puerta y vuelve a entrar al rato por otra.
      const door = Phaser.Utils.Array.GetRandom(this.def.doors);
      const steps = this.path(tile, door);
      if (steps?.length) {
        return this.walk(s, steps, () => {
          this.tweens.add({
            targets: s, alpha: 0, duration: 300, onComplete: () => {
              this.time.delayedCall(Phaser.Math.Between(1500, 5000), () => {
                if (!s.active) return;
                const back = Phaser.Utils.Array.GetRandom(this.def.doors);
                const pos = isoToScreen(back.x, back.y);
                s.setPosition(pos.x, pos.y + 6).setData('tile', back).setDepth(isoDepth(back.x, back.y, 7));
                this.tweens.add({ targets: s, alpha: 1, duration: 300, onComplete: () => this.nextAction(s) });
              });
            },
          });
        });
      }
    }
    s.stop();
    s.setTexture(s.getData('key'));
    this.time.delayedCall(Phaser.Math.Between(900, 3000), () => this.nextAction(s));
  }

  private walk(s: Phaser.GameObjects.Sprite, steps: Tile[], done: () => void) {
    s.play(`${s.getData('key')}.walk`, true);
    const go = (i: number) => {
      if (!s.active) return;
      if (i >= steps.length) {
        s.stop();
        s.setTexture(s.getData('key'));
        return done();
      }
      const t = steps[i];
      const pos = isoToScreen(t.x, t.y);
      s.setFlipX(pos.x < s.x);
      this.tweens.add({
        targets: s, x: pos.x, y: pos.y + 6, duration: STEP_MS,
        onComplete: () => { s.setData('tile', t).setDepth(isoDepth(t.x, t.y, 7)); go(i + 1); },
      });
    };
    go(0);
  }

  private spawnAnimals() {
    const free = this.freeTiles();
    for (const kind of this.def.animals) {
      const key = `animal.${kind}`;
      const t = Phaser.Utils.Array.GetRandom(free);
      const pos = isoToScreen(t.x, t.y);
      const a = this.add.sprite(pos.x, pos.y + 6, key).setOrigin(0.5, 1).setScale(2).setDepth(isoDepth(t.x, t.y, 6));
      const hop = () => {
        if (!a.active) return;
        const cur = a.getData('tile') ?? t;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => ({ x: cur.x + dx, y: cur.y + dy }))
          .filter((n) => n.x >= 0 && n.y >= 0 && n.x < this.def.cols && n.y < this.def.rows && !this.blocked.has(`${n.x},${n.y}`));
        if (!opts.length) return;
        const n = Phaser.Utils.Array.GetRandom(opts);
        const p = isoToScreen(n.x, n.y);
        a.setFlipX(p.x < a.x).play(`${key}.walk`, true);
        this.tweens.add({
          targets: a, x: p.x, y: p.y + 6, duration: kind === 'gallina' ? 300 : 600, delay: Phaser.Math.Between(400, 3500),
          onComplete: () => { a.stop(); a.setTexture(key).setData('tile', n).setDepth(isoDepth(n.x, n.y, 6)); hop(); },
        });
      };
      hop();
    }
  }

  private scheduleCart() {
    this.time.delayedCall(Phaser.Math.Between(3000, 9000), () => {
      const row = this.def.roadRow!;
      const from = isoToScreen(-2, row);
      const to = isoToScreen(this.def.cols + 1, row);
      const cart = this.add.image(from.x, from.y + 4, 'cart').setOrigin(0.5, 1).setScale(artScale('cart', 1.6)).setDepth(isoDepth(-2, row, 8));
      this.tweens.add({
        targets: cart, x: to.x, y: to.y + 4, duration: 9000,
        onUpdate: () => cart.setDepth(isoDepth(this.def.cols, row, 8) - 1),
        onComplete: () => { cart.destroy(); this.scheduleCart(); },
      });
      this.tweens.add({ targets: cart, angle: 1.5, yoyo: true, repeat: -1, duration: 160 });
    });
  }

  // ── Reacciones ──

  private sparks(defect: boolean) {
    const anvil = this.def.hotspots.find((h) => h.action === 'forge');
    if (!anvil) return;
    const pos = isoToScreen(anvil.x, anvil.y);
    for (let i = 0; i < (defect ? 6 : 12); i++) {
      const sp = this.add.image(pos.x, pos.y - 20, 'fx.spark').setDepth(8600).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(defect ? 0xff4040 : Phaser.Utils.Array.GetRandom([0xffd04d, 0xff9a2d, 0xffffff]));
      this.tweens.add({
        targets: sp, x: pos.x + Phaser.Math.Between(-60, 60), y: pos.y - Phaser.Math.Between(30, 80), alpha: 0, scale: 0.4,
        duration: Phaser.Math.Between(250, 550), ease: 'Quad.out', onComplete: () => sp.destroy(),
      });
    }
    if (defect) this.cameras.main.shake(140, 0.006);
  }

  /** Muestra al cliente actual frente al mostrador mientras la tienda está abierta. */
  private syncCustomer() {
    if (!this.sys.isActive()) return;
    const shop = this.store.getSnapshot().state?.shop;
    const current = shop?.customers[shop.index];
    const wantKey = current ? `${current.id}-${shop!.index}` : undefined;
    if (this.customer && this.customer.key !== wantKey) {
      const old = this.customer.sprite;
      this.tweens.add({ targets: old, alpha: 0, duration: 250, onComplete: () => old.destroy() });
      this.customer = undefined;
    }
    if (!current || this.customer) return;
    const counter = this.def.hotspots.find((h) => h.action === 'shop')!;
    const spot = { x: counter.x, y: counter.y + 1 };
    const door = this.def.doors[0];
    const tex = `char.amb.${(shop!.index * 7 + current.name.length) % AMBIENT_VARIANTS}`;
    const start = isoToScreen(door.x, door.y);
    const end = isoToScreen(spot.x, spot.y);
    const s = this.add.sprite(start.x, start.y + 6, tex).setOrigin(0.5, 1).setScale(CHAR_SCALE).setDepth(isoDepth(spot.x, spot.y, 7));
    s.play(`${tex}.walk`).setFlipX(end.x < start.x);
    this.tweens.add({ targets: s, x: end.x, y: end.y + 6, duration: 1100, onComplete: () => { s.stop(); s.setTexture(tex).setFlipX(true); } });
    this.customer = { sprite: s, key: wantKey! };
  }
}
