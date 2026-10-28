import Phaser from 'phaser';
import { combatTap, combatHighlights } from '../../bridge/combatInput';
import type { GameStore } from '../../bridge/GameStore';
import { currentUnit } from '../../core/combat/engine';
import { arenaSize, heightAt, terrainAt } from '../../core/combat/grid';
import type { ArenaDef, CombatFx, CombatState, CombatUnit } from '../../core/combat/types';
import { slotName } from '../../core/time';
import type { GameEvent } from '../../core/types';
import { isoBounds, screenToIso } from '../render/iso';
import { drawGround, standDepth, tilePos } from '../render/terrain';
import { SLOT_LIGHT } from './lighting';

interface UnitView {
  box: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  hp: Phaser.GameObjects.Graphics;
  status: Phaser.GameObjects.Text;
  baseTint?: number;
}

const FLOOR: Record<string, string> = { pradera: 'tile.grass', bosque: 'tile.darkgrass', colinas: 'tile.dirt', campamento: 'tile.dirt' };
const OBSTACLE: Record<string, string> = { pradera: 'prop.rock', bosque: 'prop.tree', colinas: 'prop.rock', campamento: 'prop.palisade' };
const STATUS_ICON: Record<string, string> = {
  sangrado: '🩸', veneno: '☠️', quemadura: '🔥', aturdido: '💫', ralentizado: '🐌', inmovilizado: '🕸️',
  cubierto: '🛡️', potenciado: '💪', mojado: '💧', corroido: '🧪',
};
const STATUS_TEXT: Record<string, string> = {
  sangrado: 'Sangra', veneno: 'Envenenado', quemadura: 'Arde', aturdido: 'Aturdido', ralentizado: 'Lento', inmovilizado: 'Atrapado',
  cubierto: 'Cubierto', potenciado: 'Potenciado', mojado: 'Mojado', corroido: 'Corroído',
};

/** Arena de combate táctico. Lee el estado del combate y anima lo que pasa. */
export class CombatScene extends Phaser.Scene {
  private arena!: ArenaDef;
  private units = new Map<string, UnitView>();
  private highlight!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Image;
  private queue: CombatFx[] = [];
  private animating = false;
  private unsubs: (() => void)[] = [];

  constructor(private store: GameStore) {
    super('Combat');
  }

  private get cs(): CombatState | null {
    return this.store.getSnapshot().state?.expedition?.combat ?? null;
  }

  create() {
    const cs = this.cs!;
    const c = this.store.content;
    this.arena = c.arenas[cs.arenaId];
    this.units.clear();
    this.queue = [];
    this.animating = false;
    const a = this.arena;
    const { cols, rows } = arenaSize(a);
    this.cameras.main.setBackgroundColor(0x141018);

    drawGround(this, {
      cols, rows,
      height: (x, y) => heightAt(a, x, y),
      tile: (x, y) => (terrainAt(a, x, y) === 'w' ? 'tile.water' : FLOOR[a.biome]),
      sideTint: () => (a.biome === 'colinas' ? 0x9a8a72 : 0x8a6e48),
    });
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = terrainAt(a, x, y);
        const p = tilePos(x, y, heightAt(a, x, y));
        if (t === ',') this.add.image(p.x, p.y + 6, 'deco.tallgrass').setOrigin(0.5, 1).setDepth(standDepth(x, y, 3));
        if (t === '#') this.add.image(p.x, p.y + 12, OBSTACLE[a.biome]).setOrigin(0.5, 1).setScale(a.biome === 'bosque' ? 0.75 : 1).setDepth(standDepth(x, y, 5));
      }
    }

    this.highlight = this.add.graphics().setDepth(-5000);
    this.marker = this.add.image(0, 0, 'fx.arrow').setDepth(9500);
    this.tweens.add({ targets: this.marker, y: '-=6', yoyo: true, repeat: -1, duration: 400 });

    const s = this.store.state;
    const light = SLOT_LIGHT[slotName(s)];
    const b = isoBounds(cols, rows);
    this.add.rectangle((b.left + b.right) / 2, (b.top + b.bottom) / 2, b.width * 3, b.height * 4, light.color, light.alpha * 0.7).setDepth(9000);

    for (const u of cs.units) this.makeUnit(u);
    this.syncAll();
    this.fit();
    this.scale.on('resize', this.fit, this);

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.animating) return;
      const tile = screenToIso(p.worldX, p.worldY, (x, y) => (x >= 0 && y >= 0 && x < cols && y < rows ? heightAt(a, x, y) : null), 3);
      if (tile) combatTap(this.store, tile.x, tile.y);
    });

    this.unsubs.push(this.store.subscribe(() => {
      // Se espera un cuadro: si llega un evento con animaciones, la sincronización la hace la cola.
      this.time.delayedCall(0, () => { if (!this.animating && this.sys.isActive() && this.cs) this.syncAll(); });
    }));
    this.unsubs.push(this.store.onEvent((ev: GameEvent) => {
      if (ev.type === 'combatFx' && ev.fx.length) {
        this.queue.push(...ev.fx);
        if (!this.animating) this.runQueue();
      }
    }));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fit, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private fit() {
    const { cols, rows } = arenaSize(this.arena);
    const b = isoBounds(cols, rows);
    const { width, height } = this.scale.gameSize;
    const top = b.top - 50;
    // Se deja lugar arriba para el orden de turnos y abajo para las acciones.
    const zoom = Phaser.Math.Clamp(Math.min(width / (b.width + 20), (height - 130) / (b.bottom - top)), 0.5, 2.4);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn((b.left + b.right) / 2, (top + b.bottom) / 2 + 30 / zoom);
  }

  // ── Unidades ──

  private unitPos(u: { x: number; y: number }) {
    const p = tilePos(u.x, u.y, heightAt(this.arena, u.x, u.y));
    return { x: p.x, y: p.y + 6 };
  }

  private makeUnit(u: CombatUnit) {
    if (this.units.has(u.id)) return;
    const p = this.unitPos(u);
    const box = this.add.container(p.x, p.y);
    const shadow = this.add.image(0, -2, 'fx.shadow');
    const scale = (u.side === 'party' ? 2 : 1.8) * (u.sprite.scale ?? 1);
    const sprite = this.add.sprite(0, 0, u.sprite.key).setOrigin(0.5, 1).setScale(scale);
    if (u.sprite.tint !== undefined) sprite.setTint(u.sprite.tint);
    if (this.anims.exists(`${u.sprite.key}.walk`) && u.side === 'enemy') sprite.play(`${u.sprite.key}.walk`);
    const hp = this.add.graphics();
    const status = this.add.text(0, -sprite.displayHeight - 22, '', { fontSize: '13px' }).setOrigin(0.5, 1).setResolution(2);
    box.add([shadow, sprite, hp, status]);
    this.units.set(u.id, { box, sprite, hp, status, baseTint: u.sprite.tint });
  }

  private drawHp(view: UnitView, u: CombatUnit) {
    const w = 34;
    const y = -view.sprite.displayHeight - 8;
    view.hp.clear();
    view.hp.fillStyle(0x000000, 0.7).fillRect(-w / 2 - 1, y - 1, w + 2, 6);
    const pct = Math.max(0, u.hp / u.maxHp);
    view.hp.fillStyle(u.side === 'party' ? 0x6fcf6a : 0xff6b5a, 1).fillRect(-w / 2, y, w * pct, 4);
    view.status.setText(u.statuses.map((s) => STATUS_ICON[s.id] ?? '').join(''));
  }

  private syncAll() {
    const cs = this.cs;
    if (!cs) return;
    for (const u of cs.units) {
      this.makeUnit(u);
      const v = this.units.get(u.id)!;
      const p = this.unitPos(u);
      v.box.setPosition(p.x, p.y).setDepth(standDepth(u.x, u.y, 8)).setVisible(u.alive).setAlpha(1);
      if (u.side === 'enemy') v.sprite.setFlipX(u.facing === 1 || u.facing === 2);
      this.drawHp(v, u);
    }
    const cur = !cs.outcome ? currentUnit(cs) : undefined;
    if (cur) {
      const p = this.unitPos(cur);
      const v = this.units.get(cur.id)!;
      this.marker.setVisible(true).setPosition(p.x, p.y - v.sprite.displayHeight - 30).setTint(cur.side === 'party' ? 0xffd04d : 0xff6b5a);
    } else {
      this.marker.setVisible(false);
    }
    this.drawHighlights();
  }

  private drawHighlights() {
    const g = this.highlight;
    g.clear();
    const h = combatHighlights(this.store);
    const diamond = (x: number, y: number, color: number, alpha: number, stroke = false) => {
      const p = tilePos(x, y, heightAt(this.arena, x, y));
      const pts = [new Phaser.Math.Vector2(p.x - 30, p.y), new Phaser.Math.Vector2(p.x, p.y - 15), new Phaser.Math.Vector2(p.x + 30, p.y), new Phaser.Math.Vector2(p.x, p.y + 15)];
      if (stroke) {
        g.lineStyle(3, color, 1);
        g.strokePoints(pts, true);
      } else {
        g.fillStyle(color, alpha);
        g.fillPoints(pts, true);
      }
    };
    h.move.forEach((t) => diamond(t.x, t.y, 0x5aa9ff, 0.38));
    h.range.forEach((t) => diamond(t.x, t.y, 0xff8a3d, 0.22));
    h.targets.forEach((t) => diamond(t.x, t.y, 0xff4a3a, 1, true));
    if (h.selected) diamond(h.selected.x, h.selected.y, 0xffd04d, 1, true);
  }

  // ── Animaciones ──

  private runQueue() {
    const fx = this.queue.shift();
    if (!fx || !this.sys.isActive()) {
      this.animating = false;
      if (this.sys.isActive()) this.syncAll();
      return;
    }
    this.animating = true;
    this.highlight.clear();
    this.marker.setVisible(false);
    this.play(fx, () => this.runQueue());
  }

  private float(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontStyle: 'bold', color, stroke: '#1a1220', strokeThickness: 4,
    }).setOrigin(0.5, 1).setResolution(2).setDepth(9800);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => t.destroy() });
  }

  private flash(v: UnitView, color: number) {
    v.sprite.setTint(color);
    this.time.delayedCall(140, () => (v.baseTint !== undefined ? v.sprite.setTint(v.baseTint) : v.sprite.clearTint()));
  }

  private play(fx: CombatFx, done: () => void) {
    const cs = this.cs;
    const view = (id: string) => this.units.get(id);
    switch (fx.kind) {
      case 'move': {
        const v = view(fx.unit);
        if (!v) return done();
        const unit = cs?.units.find((u) => u.id === fx.unit);
        if (unit && this.anims.exists(`${unit.sprite.key}.walk`)) v.sprite.play(`${unit.sprite.key}.walk`, true);
        const step = (i: number) => {
          if (i >= fx.path.length) {
            if (unit?.side === 'party') { v.sprite.stop(); v.sprite.setTexture(unit.sprite.key); }
            return done();
          }
          const p = this.unitPos(fx.path[i]);
          if (unit?.side === 'enemy') v.sprite.setFlipX(p.x < v.box.x);
          v.box.setDepth(standDepth(fx.path[i].x, fx.path[i].y, 8));
          this.tweens.add({ targets: v.box, x: p.x, y: p.y, duration: 160, onComplete: () => step(i + 1) });
        };
        return step(0);
      }
      case 'hit':
      case 'miss': {
        const a = view(fx.from);
        const t = view(fx.to);
        if (!a || !t) return done();
        const skill = this.store.content.skills[fx.skill];
        const ranged = !!skill && (skill.ammo || skill.range[1] > 1);
        const impact = () => {
          if (fx.kind === 'hit') {
            this.flash(t, 0xffffff);
            this.tweens.add({ targets: t.box, x: t.box.x + 4, yoyo: true, repeat: 2, duration: 40 });
            this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `${fx.damage}${fx.crit ? '!' : ''}`, fx.crit ? '#ffd04d' : '#ffffff');
            if (fx.crit) this.cameras.main.shake(120, 0.004);
          } else {
            this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, 'Falla', '#bfae9c');
          }
          this.time.delayedCall(260, done);
        };
        if (ranged) {
          const shot = this.add.image(a.box.x, a.box.y - 30, 'fx.spark').setDepth(9700).setScale(2).setTint(0xffe9a8);
          this.tweens.add({ targets: shot, x: t.box.x, y: t.box.y - 30, duration: 220, onComplete: () => { shot.destroy(); impact(); } });
        } else {
          this.tweens.add({ targets: a.box, x: a.box.x + (t.box.x - a.box.x) * 0.35, y: a.box.y + (t.box.y - a.box.y) * 0.35, yoyo: true, duration: 110, onYoyo: impact });
        }
        return;
      }
      case 'heal': {
        const t = view(fx.to);
        if (t) {
          this.flash(t, 0x9aff9a);
          this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `+${fx.amount}`, '#6fcf6a');
        }
        return void this.time.delayedCall(300, done);
      }
      case 'tick': {
        const t = view(fx.unit);
        if (t) this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `${fx.damage} ${STATUS_ICON[fx.status] ?? ''}`, '#d8b7ff');
        return void this.time.delayedCall(300, done);
      }
      case 'status': {
        const t = view(fx.unit);
        if (t) this.float(t.box.x, t.box.y - t.sprite.displayHeight - 30, `${STATUS_ICON[fx.status] ?? ''} ${STATUS_TEXT[fx.status] ?? fx.status}`, '#9fd3ff');
        return void this.time.delayedCall(200, done);
      }
      case 'buff': {
        const t = view(fx.unit);
        if (t) {
          const ring = this.add.image(t.box.x, t.box.y - 4, 'fx.ring').setDepth(9600).setTint(0xffd04d);
          this.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
        }
        return void this.time.delayedCall(300, done);
      }
      case 'push': {
        const t = view(fx.unit);
        if (!t) return done();
        const p = this.unitPos(fx.to);
        if (fx.damage) this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `${fx.damage}`, '#ff8a3d');
        this.tweens.add({ targets: t.box, x: p.x, y: p.y, duration: 220, ease: 'Quad.in', onComplete: done });
        return;
      }
      case 'death': {
        const t = view(fx.unit);
        if (!t) return done();
        this.tweens.add({ targets: t.box, alpha: 0, y: t.box.y + 8, duration: 350, onComplete: () => { t.box.setVisible(false); done(); } });
        return;
      }
      case 'spawn': {
        const u = cs?.units.find((x) => x.id === fx.unit);
        if (u) {
          this.makeUnit(u);
          const v = view(u.id)!;
          const p = this.unitPos(u);
          v.box.setPosition(p.x, p.y).setDepth(standDepth(u.x, u.y, 8)).setScale(0.2);
          this.drawHp(v, u);
          this.tweens.add({ targets: v.box, scale: 1, duration: 300, ease: 'Back.out' });
        }
        return void this.time.delayedCall(350, done);
      }
    }
  }
}

