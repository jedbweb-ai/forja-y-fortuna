import Phaser from 'phaser';
import type { GameStore } from '../../bridge/GameStore';
import { slotName } from '../../core/time';
import type { GameEvent, GameState } from '../../core/types';
import { dangerFor, expMove, gather } from '../../core/world/expedition';
import { adjacent, heightAt, isWalkable, regionSize, tileAt, zoneAt } from '../../core/world/region';
import type { ExpeditionState, MonsterGroup, RegionDef } from '../../core/world/types';
import { isoBounds, screenToIso } from '../render/iso';
import { drawGround, standDepth, tilePos } from '../render/terrain';
import { SLOT_LIGHT } from './lighting';

const DANGER_COLOR: Record<string, number> = { 'fácil': 0x6fcf6a, parejo: 0xffd04d, 'difícil': 0xff8a3d, mortal: 0xff3a3a };

/** Exploración isométrica de una región: caminar, recolectar y encontrarse con monstruos. */
export class RegionScene extends Phaser.Scene {
  private region!: RegionDef;
  private player!: Phaser.GameObjects.Container;
  private nodeObjs = new Map<string, Phaser.GameObjects.GameObject[]>();
  private groupObjs = new Map<string, Phaser.GameObjects.Container>();
  private overlay!: Phaser.GameObjects.Rectangle;
  private walking = false;
  private unsubs: (() => void)[] = [];
  private drag = { down: false, dragging: false, x: 0, y: 0 };

  constructor(private store: GameStore) {
    super('Region');
  }

  private get exp(): ExpeditionState | null {
    return this.store.getSnapshot().state?.expedition ?? null;
  }

  create() {
    const e = this.exp!;
    this.region = this.store.content.regions[e.regionId];
    this.nodeObjs.clear();
    this.groupObjs.clear();
    this.walking = false;
    const r = this.region;
    const { cols, rows } = regionSize(r);
    this.cameras.main.setBackgroundColor(0x1d2a1d);

    drawGround(this, {
      cols, rows,
      height: (c, y) => heightAt(r, c, y),
      tile: (c, y) => {
        const ch = tileAt(r, c, y);
        if (ch === '=' || ch === 'E') return 'tile.road';
        if (ch === 'w') return 'tile.water';
        const z = zoneAt(r, c, y);
        return z === 1 ? 'tile.darkgrass' : z === 2 ? 'tile.dirt' : 'tile.grass';
      },
      sideTint: () => 0x9a7a52,
    });
    this.drawDecor();
    this.syncNodes();
    this.syncGroups();
    this.createPlayer();

    const b = isoBounds(cols, rows);
    this.overlay = this.add.rectangle((b.left + b.right) / 2, (b.top + b.bottom) / 2, b.width * 3, b.height * 4, 0, 0).setDepth(9000);
    this.syncLight();

    this.cameras.main.setBounds(b.left - 200, b.top - 300, b.width + 400, b.height + 500);
    this.fit();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.scale.on('resize', this.fit, this);
    this.setupInput();

    this.unsubs.push(this.store.subscribe(() => {
      if (!this.exp || !this.sys.isActive()) return;
      this.syncNodes();
      this.syncGroups();
      this.syncLight();
      if (!this.walking) this.placePlayer();
    }));
    this.unsubs.push(this.store.onEvent((ev: GameEvent) => {
      if (ev.type === 'expMoved') this.walkPath(ev.path);
      if (ev.type === 'gathered') this.gatherFx(ev.nodeId);
    }));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fit, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private fit() {
    const { width, height } = this.scale.gameSize;
    const zoom = Phaser.Math.Clamp(Math.min(width / (12 * 64), height / (9 * 40)), 0.7, 2.2);
    this.cameras.main.setZoom(zoom);
  }

  private syncLight() {
    const s = this.store.getSnapshot().state;
    if (!s) return;
    const light = SLOT_LIGHT[slotName(s)];
    this.overlay.setFillStyle(light.color, light.alpha);
  }

  // ── Decorado ──

  private at(c: number, r: number) {
    return tilePos(c, r, heightAt(this.region, c, r));
  }

  private drawDecor() {
    const r = this.region;
    const { cols, rows } = regionSize(r);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ch = tileAt(r, x, y);
        const p = this.at(x, y);
        const d = standDepth(x, y, 5);
        if (ch === ',') this.add.image(p.x, p.y + 6, 'deco.tallgrass').setOrigin(0.5, 1).setDepth(d);
        if (ch === 'T') this.add.image(p.x, p.y + 12, 'prop.tree').setOrigin(0.5, 1).setScale(0.75).setDepth(d);
        if (ch === 'R') this.add.image(p.x, p.y + 10, 'prop.rock').setOrigin(0.5, 1).setDepth(d);
        if (ch === 'v') this.add.image(p.x, p.y + 10, 'prop.vein').setOrigin(0.5, 1).setDepth(d);
        if (ch === 't') this.add.image(p.x, p.y + 12, 'prop.tree').setOrigin(0.5, 1).setScale(0.8).setDepth(d);
        if (ch === 'B') this.add.image(p.x + 20, p.y + 4, 'prop.tent').setOrigin(0.5, 1).setDepth(d - 1);
        if (ch === 'E') this.add.image(p.x - 10, p.y + 6, 'prop.sign').setOrigin(0.5, 1).setDepth(d);
      }
    }
  }

  private syncNodes() {
    const e = this.exp;
    if (!e) return;
    const ids = new Set(e.nodes.map((n) => n.id));
    for (const [id, objs] of this.nodeObjs) {
      if (!ids.has(id)) {
        objs.forEach((o) => o.destroy());
        this.nodeObjs.delete(id);
      }
    }
    for (const n of e.nodes) {
      if (this.nodeObjs.has(n.id)) continue;
      const mat = this.store.content.materials[n.material];
      const p = this.at(n.x, n.y);
      const color = parseInt(mat.color.slice(1), 16);
      const sparkle = this.add.image(p.x, p.y - (n.kind === 'veta' ? 14 : 44), 'fx.ore').setTint(color).setDepth(standDepth(n.x, n.y, 6));
      this.tweens.add({ targets: sparkle, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 + (n.x * 37) % 400 });
      const label = this.add.text(p.x, p.y - (n.kind === 'veta' ? 26 : 60), mat.name, {
        fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#ffffff', stroke: '#1a1220', strokeThickness: 3,
      }).setOrigin(0.5, 1).setResolution(2).setDepth(8000).setAlpha(0.9);
      this.nodeObjs.set(n.id, [sparkle, label]);
    }
  }

  private syncGroups() {
    const e = this.exp;
    const s = this.store.getSnapshot().state;
    if (!e || !s) return;
    const ids = new Set(e.groups.map((g) => g.id));
    for (const [id, obj] of this.groupObjs) {
      if (!ids.has(id)) {
        this.tweens.add({ targets: obj, alpha: 0, duration: 300, onComplete: () => obj.destroy() });
        this.groupObjs.delete(id);
      }
    }
    for (const g of e.groups) {
      const p = this.at(g.x, g.y);
      let obj = this.groupObjs.get(g.id);
      if (!obj) {
        obj = this.makeGroup(s, e, g);
        this.groupObjs.set(g.id, obj);
      }
      if (obj.x !== p.x || obj.y !== p.y + 6) this.tweens.add({ targets: obj, x: p.x, y: p.y + 6, duration: 250 });
      obj.setDepth(standDepth(g.x, g.y, 8));
      obj.setAlpha(g.calm ? 0.5 : 1);
    }
  }

  private makeGroup(s: GameState, e: ExpeditionState, g: MonsterGroup) {
    const c = this.store.content;
    const lead = c.monsters[g.monsters[0]];
    const p = this.at(g.x, g.y);
    const box = this.add.container(p.x, p.y + 6);
    const danger = g.boss ? 'mortal' : dangerFor(c, s, g.threat, e.members);
    const ring = this.add.ellipse(0, 0, 44, 18, DANGER_COLOR[danger], 0.45).setStrokeStyle(2, DANGER_COLOR[danger]);
    const sprite = this.add.sprite(0, 2, lead.sprite.key).setOrigin(0.5, 1).setScale(1.8 * (lead.sprite.scale ?? 1));
    if (lead.sprite.tint !== undefined) sprite.setTint(lead.sprite.tint);
    sprite.play(`${lead.sprite.key}.walk`);
    const tag = `${g.boss ? '👑 ' : g.challenge ? '💀 ' : ''}×${g.monsters.length}`;
    const label = this.add.text(0, -sprite.displayHeight - 4, tag, {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#000000aa', padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 1).setResolution(2);
    box.add([ring, sprite, label]);
    this.tweens.add({ targets: sprite, y: -1, yoyo: true, repeat: -1, duration: 500 + (g.x * 53) % 300 });
    return box;
  }

  // ── Jugador ──

  private createPlayer() {
    const e = this.exp!;
    const s = this.store.getSnapshot().state!;
    const p = this.at(e.pos.x, e.pos.y);
    this.player = this.add.container(p.x, p.y + 6);
    this.player.add(this.add.image(0, -2, 'fx.shadow'));
    const members = e.members.filter((id) => s.characters[id]);
    // Compañeros un poco atrás del herrero.
    members.slice(1).forEach((id, i) => {
      const key = `char.npc.${id}`;
      this.player.add(this.add.sprite(i ? 12 : -12, -6, key).setOrigin(0.5, 1).setScale(1.6).setName(key));
    });
    this.player.add(this.add.sprite(0, 0, 'char.herrero').setOrigin(0.5, 1).setScale(2).setName('char.herrero'));
    this.placePlayer();
  }

  private placePlayer() {
    const e = this.exp;
    if (!e) return;
    const p = this.at(e.pos.x, e.pos.y);
    this.player.setPosition(p.x, p.y + 6).setDepth(standDepth(e.pos.x, e.pos.y, 9));
  }

  private walkPath(path: { x: number; y: number }[]) {
    if (!path.length) return;
    this.walking = true;
    const sprites = this.player.list.filter((o): o is Phaser.GameObjects.Sprite => o instanceof Phaser.GameObjects.Sprite);
    sprites.forEach((sp) => sp.play(`${sp.name}.walk`, true));
    const step = (i: number) => {
      if (i >= path.length || !this.sys.isActive()) {
        sprites.forEach((sp) => { sp.stop(); sp.setTexture(sp.name); });
        this.walking = false;
        this.placePlayer();
        return;
      }
      const t = path[i];
      const p = this.at(t.x, t.y);
      sprites.forEach((sp) => sp.setFlipX(p.x < this.player.x));
      this.player.setDepth(standDepth(t.x, t.y, 9));
      this.tweens.add({ targets: this.player, x: p.x, y: p.y + 6, duration: 150, onComplete: () => step(i + 1) });
    };
    step(0);
  }

  private gatherFx(nodeId: string) {
    const e = this.exp;
    const n = e?.nodes.find((x) => x.id === nodeId);
    const target = n ? this.at(n.x, n.y) : { x: this.player.x, y: this.player.y };
    for (let i = 0; i < 8; i++) {
      const sp = this.add.image(target.x, target.y - 16, 'fx.spark').setDepth(8600).setTint(0xffd04d);
      this.tweens.add({ targets: sp, x: target.x + Phaser.Math.Between(-30, 30), y: target.y - Phaser.Math.Between(20, 50), alpha: 0, duration: 400, onComplete: () => sp.destroy() });
    }
    this.cameras.main.shake(80, 0.003);
  }

  // ── Input: tocar para moverse o recolectar; arrastrar para mirar ──

  private setupInput() {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.drag = { down: true, dragging: false, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag.down) return;
      const dx = p.x - this.drag.x;
      const dy = p.y - this.drag.y;
      if (!this.drag.dragging && Math.hypot(dx, dy) > 12) {
        this.drag.dragging = true;
        this.cameras.main.stopFollow();
      }
      if (this.drag.dragging) {
        const cam = this.cameras.main;
        cam.scrollX -= dx / cam.zoom;
        cam.scrollY -= dy / cam.zoom;
        this.drag.x = p.x;
        this.drag.y = p.y;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const wasDrag = this.drag.dragging;
      this.drag.down = false;
      this.drag.dragging = false;
      if (!wasDrag) this.tap(p.worldX, p.worldY);
    });
  }

  private tap(wx: number, wy: number) {
    const e = this.exp;
    const ui = this.store.getSnapshot().ui;
    if (!e || e.combat || e.report || this.walking || ui.panel) return;
    const r = this.region;
    const { cols, rows } = regionSize(r);
    const tile = screenToIso(wx, wy, (c, y) => (c >= 0 && y >= 0 && c < cols && y < rows ? heightAt(r, c, y) : null), 3);
    if (!tile) return;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    const node = e.nodes.find((n) => n.x === tile.x && n.y === tile.y);
    if (node) {
      if (adjacent(node, e.pos)) this.store.run(gather, node.id);
      else this.moveNextTo(tile);
      return;
    }
    if (isWalkable(r, tile.x, tile.y) || e.groups.some((g) => g.x === tile.x && g.y === tile.y)) {
      this.store.run(expMove, tile.x, tile.y);
    } else {
      this.moveNextTo(tile);
    }
  }

  /** Se acerca a la casilla libre más cercana al lado de un recurso o de un obstáculo. */
  private moveNextTo(tile: { x: number; y: number }) {
    const e = this.exp!;
    const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: tile.x + dx, y: tile.y + dy }))
      .filter((p) => isWalkable(this.region, p.x, p.y))
      .sort((a, b) => Math.abs(a.x - e.pos.x) + Math.abs(a.y - e.pos.y) - (Math.abs(b.x - e.pos.x) + Math.abs(b.y - e.pos.y)));
    if (options[0] && !(options[0].x === e.pos.x && options[0].y === e.pos.y)) this.store.run(expMove, options[0].x, options[0].y);
  }
}
