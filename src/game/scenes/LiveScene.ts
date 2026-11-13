import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { cityLocation, npcsAt } from '../../core/city';
import { pickDialogue } from '../../core/dialogue';
import { slotName } from '../../core/time';
import type { HotspotDef, LiveSceneDef, LocationKind, TimeSlot } from '../../core/types';
import { ILLUSTRATED, ILLUSTRATION, projectOnFloor, type IllustratedInterior } from '../render/illustrated';
import { isoBounds, isoDepth, isoToScreen, TILE_H } from '../render/iso';
import { artScale, facing, installWalkBob, isRealArt, queueLazyArt, smoothArt } from '../render/assets';
import { AMBIENT_VARIANTS, GUARD_VARIANTS } from '../render/placeholders';
import { drawInteriorWalls, drawWindowLight, isIndoor, WALL_H } from '../render/interior';
import { SLOT_LIGHT } from './lighting';
import { coverFit, installDragPan } from '../render/camera';

interface Tile { x: number; y: number }

const STEP_MS = 420;
const CHAR_SCALE = 2;
/** Ancho de la calle de afuera de los interiores: vereda y dos carriles. */
const STREET_W = 3;
/** Cuánta gente pasa por la calle de afuera según la hora. */
const PASSERSBY: Record<TimeSlot, number> = { 'mañana': 4, tarde: 5, noche: 2 };

/** Escena viva de un lugar: el herrero parado, NPCs con rutinas simples, carretas y animales. */
export class LiveScene extends Phaser.Scene {
  private locId = '';
  private def!: LiveSceneDef;
  private kind: LocationKind = 'herreria';
  /** Ilustración del lugar, si tiene: la grilla se proyecta sobre su piso. */
  private ill: IllustratedInterior | null = null;
  /** Tamaño de las figuras respecto del normal (en una ilustración, según sus muebles). */
  private k = 1;
  /** Grilla entera: el lugar más la calle de afuera, si tiene (la calle son las últimas filas). */
  private cols = 0;
  private rows = 0;
  /** Ancho de la calle de afuera (0 si no hay). */
  private streetW = 0;

  /** Posición en pantalla del centro de una casilla (en una ilustración, sobre su piso dibujado). */
  private at(c: number, r: number) {
    return this.ill ? projectOnFloor(this.ill, this.cols, this.rows, c + 0.5, r + 0.5) : isoToScreen(c, r);
  }

  /** Fila de la calle de afuera (carril 0 = la vereda, pegada al local). */
  private streetRow(lane: number) {
    return this.def.rows + lane;
  }

  /** Puertas del lugar (una ilustración puede tenerlas en otro lado). */
  private get doors(): Tile[] {
    return this.ill?.doors ? this.ill.doors.map(([x, y]) => ({ x, y })) : this.def.doors;
  }

  private isDoor(t: Tile) {
    return this.doors.some((d) => d.x === t.x && d.y === t.y);
  }

  /** Orden de dibujo: en una ilustración, por la altura en pantalla; si no, por la diagonal isométrica. */
  private depth(c: number, r: number, bias = 0) {
    return this.ill ? Math.round(this.at(c, r).y) * 10 + bias : isoDepth(c, r, bias);
  }

  /** Dónde aparece el herrero, cada NPC y el cliente (una ilustración puede cambiarlos). */
  private spawnSpot() {
    const s = this.ill?.spots?.spawn;
    return s ? { x: s[0], y: s[1] } : this.def.spawn;
  }

  private npcSpot(id: string) {
    // El personal de la herrería se para en el lugar de su puesto.
    const staff = this.store.state.staff.shops[this.locId]?.staff ?? [];
    const member = staff.find((m) => m.id === id);
    if (member) {
      const i = staff.filter((m) => m.role === member.role).indexOf(member);
      const ill = this.ill?.spots?.staff?.[member.role];
      const list = ill ? ill.map(([x, y]) => ({ x, y })) : this.def.staffSpots?.[member.role];
      if (list?.length) return list[i % list.length];
    }
    const s = this.ill?.spots?.npc?.[id];
    return s ? { x: s[0], y: s[1] } : this.def.npcSpots[id];
  }

  /** Escala de una figura en este lugar. */
  private fig(key: string) {
    return artScale(key, CHAR_SCALE) * this.k;
  }
  private blocked = new Set<string>();
  private walkers: Phaser.GameObjects.Sprite[] = [];
  private unsubs: (() => void)[] = [];
  private customer?: { sprite: Phaser.GameObjects.Sprite; key: string };
  /** En una ilustración, la imagen se desliza; lo tocable no se activa al soltar un deslizamiento. */
  private pan: { dragged: () => boolean } = { dragged: () => false };

  constructor(private store: GameStore) {
    super('Live');
  }

  init(data: { locationId: string }) {
    this.locId = data.locationId;
    this.walkers = [];
    this.customer = undefined;
  }

  /** La ilustración del lugar se baja recién al entrar. */
  preload() {
    const ill = ILLUSTRATED[this.locId];
    if (ill) queueLazyArt(this, ill.image);
  }

  create() {
    installWalkBob(this);
    const loc = cityLocation(this.store.content, this.locId);
    if (!loc?.scene) throw new Error(`Lugar sin escena: ${this.locId}`);
    this.def = loc.scene;
    this.kind = loc.kind;
    this.streetW = this.def.street ?? (isIndoor(this.kind) ? STREET_W : 0);
    this.cols = this.def.cols;
    this.rows = this.def.rows + this.streetW;
    const ill = ILLUSTRATED[this.locId];
    this.ill = ill && isRealArt(ill.image) && this.textures.exists(ill.image) ? ill : null;
    if (this.ill) smoothArt(this, this.ill.image);
    this.k = this.ill?.charScale ?? 1;
    const state = this.store.state;
    const slot = slotName(state);
    const light = SLOT_LIGHT[slot];
    this.cameras.main.setBackgroundColor(light.bg);

    this.blocked = new Set(this.ill
      ? this.ill.blocked.map(([x, y]) => `${x},${y}`)
      : this.def.props.filter((p) => p.blocks && this.textures.exists(p.key)).map((p) => `${p.x},${p.y}`));
    Object.keys(this.def.npcSpots).forEach((id) => { const p = this.npcSpot(id); this.blocked.add(`${p.x},${p.y}`); });
    for (const m of state.staff.shops[this.locId]?.staff ?? []) {
      const p = this.npcSpot(m.id);
      if (p) this.blocked.add(`${p.x},${p.y}`);
    }
    const spawn = this.spawnSpot();
    this.blocked.add(`${spawn.x},${spawn.y}`);

    if (this.ill) {
      this.add.image(0, 0, this.ill.image).setOrigin(0, 0).setDisplaySize(ILLUSTRATION.w, ILLUSTRATION.h).setDepth(-20000);
    } else {
      this.drawFloor();
      if (isIndoor(this.kind)) this.drawWalls(slot);
      this.drawProps(light.lamps);
    }
    this.drawHotspots();
    this.drawNamedNpcs();
    this.drawPlayer();
    this.spawnAmbient(slot);
    this.spawnAnimals();
    // Las carretas van por el carril de afuera de la calle (o por la fila de camino de un lugar al aire libre).
    const cartRow = this.streetW ? this.rows - 1 : this.def.roadRow;
    if (this.def.carts && cartRow !== undefined && slot !== 'noche') this.scheduleCart(cartRow);

    const b = isoBounds(this.cols, this.rows);
    this.add.rectangle((b.left + b.right) / 2, (b.top + b.bottom) / 2, b.width * 4, b.height * 6, light.color, light.alpha).setDepth(9000);
    if (light.lamps && !this.ill) {
      for (const p of this.def.props.filter((q) => q.key === 'prop.lamp' || q.key === 'prop.fireplace' || q.key === 'prop.forge')) {
        const pos = this.at(p.x, p.y);
        this.add.image(pos.x, pos.y - 40, 'fx.glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setScale(1.4);
      }
    }

    if (this.ill) this.pan = installDragPan(this);
    this.fit();
    this.scale.on('resize', this.fit, this);
    this.unsubs.push(this.store.onEvent((e) => {
      if (e.type === 'timeAdvanced') this.scene.restart({ locationId: this.locId });
      if (e.type === 'forgeHit') this.sparks(e.result === 'defecto');
    }));
    if (this.locId === 'herreria' || state.staff.branches.includes(this.locId)) {
      this.unsubs.push(this.store.subscribe(() => this.syncCustomer()));
      this.syncCustomer();
    }
    // Si cambia quién trabaja acá (o en qué puesto), se vuelve a armar la escena.
    const staffKey = (st: typeof state | null) => (st?.staff.shops[this.locId]?.staff ?? []).map((m) => `${m.id}:${m.role}`).join(',');
    const before = staffKey(state);
    this.unsubs.push(this.store.subscribe(() => {
      const now = this.store.getSnapshot().state;
      if (this.sys.isActive() && now && staffKey(now) !== before) this.scene.restart({ locationId: this.locId });
    }));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fit, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private fit() {
    if (this.ill) {
      // Llena el ancho; si sobra alto, se ve primero el centro del lugar y el resto se desliza.
      // (A mitad de camino entre el centro del piso y el de la imagen: se ven la pared del fondo y el mostrador.)
      const focus = (projectOnFloor(this.ill, this.cols, this.rows, this.cols / 2, this.def.rows / 2).y + ILLUSTRATION.h / 2) / 2;
      coverFit(this, ILLUSTRATION.w, ILLUSTRATION.h, focus);
      return;
    }
    const b = isoBounds(this.cols, this.rows);
    const { width, height } = this.scale.gameSize;
    const top = b.top - WALL_H;
    const zoom = Phaser.Math.Clamp(Math.min(width / (b.width + 20), (height - 96) / (b.bottom - top)), 0.5, 2.6);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn((b.left + b.right) / 2, (top + b.bottom) / 2 - 10 / zoom);
  }

  // ── Construcción ──

  private drawFloor() {
    const { floor, roadRow } = this.def;
    // La calle de afuera: la vereda de piedra (o de tierra, si el local ya es de piedra) y los carriles de camino.
    const sidewalk = floor === 'tile.stone' ? 'tile.dirt' : 'tile.stone';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const key = r >= this.def.rows ? (r === this.def.rows ? sidewalk : 'tile.road') : r === roadRow ? 'tile.road' : floor;
        // La variante solo existe en los placeholders (con arte definitivo no se mezclan estilos).
        const variant = (c * 7 + r * 3) % 5 === 0 && this.textures.exists(`${key}.1`) ? `${key}.1` : key;
        const p = this.at(c, r);
        this.add.image(p.x, p.y, variant).setOrigin(0.5, 16 / 34).setDepth(-10000 + this.depth(c, r));
      }
    }
  }

  /** Paredes del fondo con textura y lo colgado; de día entra luz por las ventanas y las antorchas siempre brillan. */
  private drawWalls(slot: TimeSlot) {
    const lights = drawInteriorWalls(this, this.def, this.kind);
    if (slot !== 'noche') for (const w of lights.windows) drawWindowLight(this, w, slot === 'mañana' ? 0.16 : 0.11);
    for (const t of lights.torches) {
      const glow = this.add.image(t.x, t.y - 6, 'fx.glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setScale(0.8).setAlpha(slot === 'noche' ? 1 : 0.5);
      this.tweens.add({ targets: glow, alpha: glow.alpha * 0.7, yoyo: true, repeat: -1, duration: 260 + Math.random() * 200 });
    }
  }

  private drawProps(night: boolean) {
    for (const p of this.def.props) {
      if (!this.textures.exists(p.key)) continue;
      const pos = this.at(p.x, p.y);
      if (p.key === 'prop.alfombra') {
        this.add.image(pos.x, pos.y, p.key).setDepth(-9600);
        continue;
      }
      const img = this.add.image(pos.x, pos.y + TILE_H / 2 - 2, p.key).setOrigin(0.5, 1).setDepth(this.depth(p.x, p.y, 5));
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
    const pos = this.at(h.x, h.y);
    const where = this.ill?.labels?.[h.id] ?? { x: pos.x, y: pos.y - 64 * this.k };
    const label = this.add.text(where.x, where.y, h.label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff8e8', backgroundColor: '#3a2418dd', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setResolution(2).setDepth(8000).setInteractive({ useHandCursor: true });
    // La zona tocable va sobre el mueble: en una ilustración, debajo de su nombre.
    const zone = (this.ill?.labels?.[h.id] ? this.add.zone(where.x, where.y + 60, 120, 100) : this.add.zone(pos.x, pos.y - 14, 70, 60)).setInteractive({ useHandCursor: true }).setDepth(8000);
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
    const tap = () => { if (!this.pan.dragged()) act(); };
    label.on('pointerup', tap);
    zone.on('pointerup', tap);
  }

  private drawNamedNpcs() {
    const c = this.store.content;
    const state = this.store.state;
    for (const npcId of npcsAt(c, state, this.locId)) {
      const spot = this.npcSpot(npcId);
      if (!spot) continue;
      const npc = c.npcs[npcId];
      const pos = this.at(spot.x, spot.y);
      // Un empleado sin dibujo propio todavía usa la figura de un vecino del pueblo.
      const own = `char.npc.${npcId}`;
      const key = isRealArt(own) || !c.workers[npcId] ? own : `char.amb.${[...npcId].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AMBIENT_VARIANTS}`;
      this.add.image(pos.x, pos.y + 4, 'fx.shadow').setDepth(this.depth(spot.x, spot.y, 6));
      const s = this.add.sprite(pos.x, pos.y + 6, key).setOrigin(0.5, 1).setScale(this.fig(key)).setDepth(this.depth(spot.x, spot.y, 7));
      this.tweens.add({ targets: s, scaleY: s.scaleY * 1.03, yoyo: true, repeat: -1, duration: 700 + spot.x * 40 });
      const name = this.add.text(pos.x, pos.y - 50 * this.k, npc.name, {
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
      const tapTalk = () => { if (!this.pan.dragged()) talk(); };
      s.on('pointerup', tapTalk);
      name.on('pointerup', tapTalk);
    }
  }

  private drawPlayer() {
    const { x, y } = this.spawnSpot();
    const pos = this.at(x, y);
    this.add.image(pos.x, pos.y + 4, 'fx.shadow').setDepth(this.depth(x, y, 6));
    const s = this.add.sprite(pos.x, pos.y + 6, 'char.herrero').setOrigin(0.5, 1).setScale(this.fig('char.herrero')).setDepth(this.depth(x, y, 7));
    s.setData('player', true);
    this.tweens.add({ targets: s, scaleY: s.scaleY * 1.04, yoyo: true, repeat: -1, duration: 650 });
    this.add.text(pos.x, pos.y - 50 * this.k, 'Vos', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#ffffff', stroke: '#1a1220', strokeThickness: 4,
    }).setOrigin(0.5, 1).setResolution(2).setDepth(8000);
  }

  // ── NPCs ambientales ──

  private freeTiles(): Tile[] {
    const out: Tile[] = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (!this.blocked.has(`${c},${r}`)) out.push({ x: c, y: r });
    return out;
  }

  /** Por dónde andan los de adentro: si el lugar tiene calle, solo el local (salen a la calle por las puertas). */
  private insideTiles(): Tile[] {
    return this.freeTiles().filter((t) => t.y < this.def.rows);
  }

  private isStreet = (t: Tile) => t.y >= this.def.rows;

  /**
   * Camino por BFS entre dos casillas (o null). Se puede llegar a una casilla ocupada si es el destino (el lugar de un
   * NPC, por ejemplo). Entre el local y la calle solo se pasa por las puertas. `allow` limita por dónde se camina.
   */
  private path(from: Tile, to: Tile, allow: (t: Tile) => boolean = () => true): Tile[] | null {
    const key = (t: Tile) => `${t.x},${t.y}`;
    const prev = new Map<string, Tile | null>([[key(from), null]]);
    const queue: Tile[] = [from];
    const edge = this.def.rows;
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur.x === to.x && cur.y === to.y) {
        const out: Tile[] = [];
        for (let t: Tile | null = cur; t; t = prev.get(key(t)) ?? null) out.unshift(t);
        return out.slice(1);
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: cur.x + dx, y: cur.y + dy };
        if (n.x < 0 || n.y < 0 || n.x >= this.cols || n.y >= this.rows) continue;
        const isTarget = n.x === to.x && n.y === to.y;
        if ((this.blocked.has(key(n)) && !isTarget) || prev.has(key(n)) || !allow(n)) continue;
        if (this.streetW && Math.min(cur.y, n.y) === edge - 1 && Math.max(cur.y, n.y) === edge && !this.isDoor(cur.y < n.y ? cur : n)) continue;
        prev.set(key(n), cur);
        queue.push(n);
      }
    }
    return null;
  }

  private spawnAmbient(slot: TimeSlot) {
    const count = this.def.ambient[slot];
    const free = this.streetW ? this.insideTiles() : this.freeTiles();
    for (let i = 0; i < count && free.length; i++) {
      const guard = !this.streetW && slot === 'noche' && i % 3 === 0;
      const key = guard ? `char.guard.${i % GUARD_VARIANTS}` : `char.amb.${(i * 3 + this.locId.length) % AMBIENT_VARIANTS}`;
      const t = Phaser.Utils.Array.GetRandom(free);
      const pos = this.at(t.x, t.y);
      const s = this.add.sprite(pos.x, pos.y + 6, key).setOrigin(0.5, 1).setScale(this.fig(key)).setDepth(this.depth(t.x, t.y, 7));
      s.setData({ tile: t, key });
      this.walkers.push(s);
      this.time.delayedCall(Phaser.Math.Between(0, 2000), () => this.nextAction(s));
    }
    if (!this.streetW) return;
    // La gente que pasa por la calle de afuera (de noche, alguna guardia haciendo la ronda).
    for (let i = 0; i < PASSERSBY[slot]; i++) {
      const guard = slot === 'noche' && i % 2 === 0;
      const key = guard ? `char.guard.${i % GUARD_VARIANTS}` : `char.amb.${(i * 5 + this.locId.length + 2) % AMBIENT_VARIANTS}`;
      const s = this.add.sprite(0, 0, key).setOrigin(0.5, 1).setScale(this.fig(key)).setAlpha(0);
      s.setData({ key });
      this.walkers.push(s);
      this.time.delayedCall(i === 0 ? 0 : Phaser.Math.Between(500, 9000), () => this.passBy(s));
    }
  }

  private nextAction(s: Phaser.GameObjects.Sprite) {
    if (!s.active) return;
    const tile: Tile = s.getData('tile');
    const r = Math.random();
    if (r < 0.55) {
      const free = this.streetW ? this.insideTiles() : this.freeTiles();
      const target = Phaser.Utils.Array.GetRandom(free);
      const steps = target && this.path(tile, target, (t) => !this.streetW || !this.isStreet(t))?.slice(0, 10);
      if (steps?.length) return this.walk(s, steps, () => this.nextAction(s));
    } else if (r < 0.88) {
      if (this.chat(s)) return this.later(s, () => this.nextAction(s));
    } else if (this.doors.length) {
      const door = Phaser.Utils.Array.GetRandom(this.doors);
      const steps = this.path(tile, door);
      if (steps?.length) {
        // Con calle: sale por la puerta, se va caminando por la calle y al rato vuelve a entrar.
        if (this.streetW) return this.walk(s, steps, () => this.leaveAndReturn(s));
        // Sin calle: sale por una puerta y vuelve a entrar al rato por otra.
        return this.walk(s, steps, () => {
          this.tweens.add({
            targets: s, alpha: 0, duration: 300, onComplete: () => {
              this.time.delayedCall(Phaser.Math.Between(1500, 5000), () => {
                if (!s.active) return;
                const back = Phaser.Utils.Array.GetRandom(this.doors);
                const pos = this.at(back.x, back.y);
                s.setPosition(pos.x, pos.y + 6).setData('tile', back).setDepth(this.depth(back.x, back.y, 7));
                this.tweens.add({ targets: s, alpha: 1, duration: 300, onComplete: () => this.nextAction(s) });
              });
            },
          });
        });
      }
    }
    this.later(s, () => this.nextAction(s));
  }

  /** Se queda quieto un rato y después sigue. */
  private later(s: Phaser.GameObjects.Sprite, next: () => void, min = 900, max = 3000) {
    s.stop();
    s.setTexture(s.getData('face') ?? s.getData('key'));
    this.time.delayedCall(Phaser.Math.Between(min, max), next);
  }

  /** Si tiene a alguien cerca, se da vuelta y charla (o discuten precios). */
  private chat(s: Phaser.GameObjects.Sprite): boolean {
    const buddy = this.walkers.find((w) => w !== s && w.active && w.alpha > 0.5 && Phaser.Math.Distance.Between(w.x, w.y, s.x, s.y) < 90 * this.k);
    if (!buddy) return false;
    const f = facing(s.getData('key'), buddy.x - s.x, buddy.y - s.y);
    s.setTexture(f.key).setFlipX(f.flip).setData('face', f.key);
    const bubble = this.add.image(s.x, s.y - 52 * this.k, 'fx.bubble').setDepth(8500).setScale(1.2);
    this.tweens.add({ targets: bubble, y: bubble.y - 3, yoyo: true, repeat: 3, duration: 250, onComplete: () => bubble.destroy() });
    return true;
  }

  // ── La calle de afuera ──

  /** Una punta de la calle, en el carril dado: la casilla del borde y un punto un paso afuera de la grilla. */
  private streetEnd(left: boolean, lane: number) {
    const tile = { x: left ? 0 : this.cols - 1, y: this.streetRow(lane) };
    return { tile, outside: { x: tile.x + (left ? -1 : 1), y: tile.y } };
  }

  /** Paso suelto hasta un punto (puede estar fuera de la grilla), apareciendo o desapareciendo de a poco. */
  private stepTo(s: Phaser.GameObjects.Sprite, to: Tile, alpha: number, done: () => void) {
    const key: string = s.getData('key');
    const pos = this.at(to.x, to.y);
    const f = facing(key, pos.x - s.x, pos.y + 6 - s.y);
    s.play(`${f.key}.walk`, true).setFlipX(f.flip).setData('face', f.key).setDepth(this.depth(to.x, to.y, 7));
    this.tweens.add({ targets: s, x: pos.x, y: pos.y + 6, alpha, duration: STEP_MS * 1.6, onComplete: () => { s.setData('tile', to); done(); } });
  }

  /** Entra a la calle por una punta (de a poco, como si viniera de más lejos). */
  private enterStreet(s: Phaser.GameObjects.Sprite, done: () => void) {
    const end = this.streetEnd(Math.random() < 0.5, Phaser.Math.Between(0, this.streetW - 1));
    const start = this.at(end.outside.x, end.outside.y);
    s.setPosition(start.x, start.y + 6).setAlpha(0).setVisible(true);
    this.stepTo(s, end.tile, 1, done);
  }

  /** Camina por la calle hasta una punta y se va (desaparece de a poco). */
  private exitStreet(s: Phaser.GameObjects.Sprite, done: () => void, left = Math.random() < 0.5) {
    const end = this.streetEnd(left, Phaser.Math.Between(0, this.streetW - 1));
    const steps = this.path(s.getData('tile'), end.tile, this.isStreet) ?? [];
    this.walk(s, steps, () => this.stepTo(s, end.outside, 0, () => {
      s.stop();
      done();
    }));
  }

  /**
   * Un transeúnte: entra por una punta de la calle, la recorre cambiando de carril, a veces se para a mirar la vidriera
   * o a charlar con alguien, y sale por la otra punta. Al rato vuelve a pasar otro (el mismo, con otro recorrido).
   */
  private passBy(s: Phaser.GameObjects.Sprite) {
    if (!s.active) return;
    this.enterStreet(s, () => {
      const from: Tile = s.getData('tile');
      const left = from.x !== 0;
      const mid = { x: Phaser.Math.Between(1, this.cols - 2), y: this.streetRow(Phaser.Math.Between(0, this.streetW - 1)) };
      const steps = this.path(from, mid, this.isStreet) ?? [];
      this.walk(s, steps, () => {
        const go = () => this.exitStreet(s, () => this.time.delayedCall(Phaser.Math.Between(1500, 8000), () => this.passBy(s)), left);
        const r = Math.random();
        if (r < 0.25 && this.chat(s)) return this.later(s, go, 1500, 3500);
        if (r < 0.5) {
          // Mira hacia el local un ratito.
          const tile: Tile = s.getData('tile');
          const here = this.at(tile.x, tile.y);
          const shop = this.at(tile.x, tile.y - 1);
          const f = facing(s.getData('key'), shop.x - here.x, shop.y - here.y);
          s.stop();
          s.setTexture(f.key).setFlipX(f.flip).setData('face', f.key);
          return this.time.delayedCall(Phaser.Math.Between(1200, 3500), go);
        }
        go();
      });
    });
  }

  /** Uno de adentro sale por la puerta, se va por la calle y al rato vuelve a entrar por una puerta. */
  private leaveAndReturn(s: Phaser.GameObjects.Sprite) {
    this.exitStreet(s, () => this.time.delayedCall(Phaser.Math.Between(3000, 9000), () => {
      if (!s.active) return;
      this.enterStreet(s, () => {
        const door = Phaser.Utils.Array.GetRandom(this.doors);
        const steps = this.path(s.getData('tile'), door) ?? [];
        this.walk(s, steps, () => this.nextAction(s));
      });
    }));
  }

  private walk(s: Phaser.GameObjects.Sprite, steps: Tile[], done: () => void) {
    const key: string = s.getData('key');
    let face = s.getData('face') ?? key;
    const go = (i: number) => {
      if (!s.active) return;
      if (i >= steps.length) {
        s.stop();
        s.setTexture(face);
        s.setData('face', face);
        return done();
      }
      const t = steps[i];
      const pos = this.at(t.x, t.y);
      const f = facing(key, pos.x - s.x, pos.y + 6 - s.y);
      face = f.key;
      s.play(`${f.key}.walk`, true).setFlipX(f.flip);
      this.tweens.add({
        targets: s, x: pos.x, y: pos.y + 6, duration: STEP_MS,
        onComplete: () => { s.setData('tile', t).setDepth(this.depth(t.x, t.y, 7)); go(i + 1); },
      });
    };
    go(0);
  }

  private spawnAnimals() {
    const free = this.streetW ? this.insideTiles() : this.freeTiles();
    for (const kind of this.def.animals) {
      const key = `animal.${kind}`;
      const t = Phaser.Utils.Array.GetRandom(free);
      if (!t) return;
      const pos = this.at(t.x, t.y);
      const a = this.add.sprite(pos.x, pos.y + 6, key).setOrigin(0.5, 1).setScale(artScale(key, 2) * this.k).setDepth(this.depth(t.x, t.y, 6));
      const hop = () => {
        if (!a.active) return;
        const cur = a.getData('tile') ?? t;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => ({ x: cur.x + dx, y: cur.y + dy }))
          .filter((n) => n.x >= 0 && n.y >= 0 && n.x < this.cols && n.y < this.rows && !this.blocked.has(`${n.x},${n.y}`));
        if (!opts.length) return;
        const n = Phaser.Utils.Array.GetRandom(opts);
        const p = this.at(n.x, n.y);
        const f = facing(key, p.x - a.x, p.y + 6 - a.y);
        a.setFlipX(f.flip).play(`${f.key}.walk`, true);
        this.tweens.add({
          targets: a, x: p.x, y: p.y + 6, duration: kind === 'gallina' ? 300 : 600, delay: Phaser.Math.Between(400, 3500),
          onComplete: () => { a.stop(); a.setTexture(f.key).setData('tile', n).setDepth(this.depth(n.x, n.y, 6)); hop(); },
        });
      };
      hop();
    }
  }

  private scheduleCart(row: number) {
    this.time.delayedCall(Phaser.Math.Between(3000, 9000), () => {
      const left = Math.random() < 0.5;
      const from = this.at(left ? -2 : this.cols + 1, row);
      const to = this.at(left ? this.cols + 1 : -2, row);
      const cart = this.add.image(from.x, from.y + 4, 'cart').setOrigin(0.5, 1).setScale(artScale('cart', 1.6) * this.k).setFlipX(!left)
        .setDepth(this.depth(-2, row, 8));
      this.tweens.add({
        targets: cart, x: to.x, y: to.y + 4, duration: 9000,
        onUpdate: () => cart.setDepth(this.ill ? Math.round(cart.y) * 10 + 8 : this.depth(this.cols, row, 8) - 1),
        onComplete: () => { cart.destroy(); this.scheduleCart(row); },
      });
      this.tweens.add({ targets: cart, angle: 1.5, yoyo: true, repeat: -1, duration: 160 });
    });
  }

  // ── Reacciones ──

  private sparks(defect: boolean) {
    const anvil = this.def.hotspots.find((h) => h.action === 'forge');
    if (!anvil) return;
    const pos = this.at(anvil.x, anvil.y);
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
    const c = this.ill?.spots?.customer;
    const spot = c ? { x: c[0], y: c[1] } : { x: counter.x, y: counter.y + 1 };
    const door = this.doors[0];
    const tex = `char.amb.${(shop!.index * 7 + current.name.length) % AMBIENT_VARIANTS}`;
    // En el mostrador queda mirando hacia él (hacia -y en la grilla).
    const atCounter = facing(tex, 1, -1);
    const s = this.add.sprite(0, 0, tex).setOrigin(0.5, 1).setScale(this.fig(tex)).setDepth(this.depth(spot.x, spot.y, 7));
    s.setData({ key: tex });
    this.customer = { sprite: s, key: wantKey! };
    const arrive = () => { s.stop(); s.setTexture(atCounter.key).setFlipX(atCounter.flip); };
    if (this.streetW) {
      // Llega caminando por la calle y entra por la puerta.
      this.enterStreet(s, () => this.walk(s, this.path(s.getData('tile'), spot) ?? [], arrive));
      return;
    }
    const start = this.at(door.x, door.y);
    const end = this.at(spot.x, spot.y);
    s.setPosition(start.x, start.y + 6);
    const go = facing(tex, end.x - start.x, end.y - start.y);
    s.play(`${go.key}.walk`).setFlipX(go.flip);
    this.tweens.add({ targets: s, x: end.x, y: end.y + 6, duration: 1100, onComplete: arrive });
  }
}
