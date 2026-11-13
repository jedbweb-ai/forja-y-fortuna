import Phaser from 'phaser';
import { combatTap, combatHighlights } from '../../bridge/combatInput';
import type { GameStore } from '../../bridge/GameStore';
import { currentUnit } from '../../core/combat/engine';
import { arenaSize, heightAt, isObstacle, isVoid, terrainAt } from '../../core/combat/grid';
import type { ArenaDef, CombatFx, CombatState, CombatUnit, TerrainKind } from '../../core/combat/types';
import type { Affinity } from '../../core/types';
import { slotName } from '../../core/time';
import { sfx, type SfxId } from '../../audio/sfx';
import type { GameEvent } from '../../core/types';
import { combatView, type CameraRequest } from '../../bridge/combatView';
import { artScale, facing, installWalkBob, monsterLook } from '../render/assets';
import { LEVEL_H, TILE_H, TILE_W } from '../render/iso';
import { drawGround, type GroundPiece } from '../render/terrain';
import { IsoView } from '../render/view';
import { SLOT_LIGHT } from './lighting';

/** Algo fijo sobre una casilla (pasto, obstáculo, llama): se reubica al girar la vista. */
interface Prop {
  obj: Phaser.GameObjects.Image;
  x: number;
  y: number;
  /** Corrimiento vertical en píxeles desde el centro de la casilla. */
  oy: number;
  bias: number;
  /** Si tapa a una figura, se vuelve transparente. */
  occludes?: boolean;
}

/** Vector de la grilla de cada orientación del combate (+x, +y, -x, -y). */
const DIR_GRID: Record<0 | 1 | 2 | 3, [number, number]> = { 0: [1, 0], 1: [0, 1], 2: [-1, 0], 3: [0, -1] };
const ROTATE_MS = 420;
const MAX_ZOOM = 3;
/** Zoom cómodo para jugar en el celular: cada casilla mide unos 80 píxeles de ancho. */
const CLOSE_ZOOM = 80 / TILE_W;
/** Opacidad de lo que tapa a una figura. */
const SEE_THROUGH = 0.35;
/** Color de la silueta de una figura tapada por el terreno. */
const GHOST_TINT = { party: 0x9fd8ff, enemy: 0xff9a8a };
/** Profundidades fijas: siluetas, barras de vida, flecha del turno. */
const DEPTH = { ghost: 9200, overlay: 9300, marker: 9500 };

interface UnitView {
  box: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  /** Copia plana de la figura que se ve a través del terreno cuando una loma la tapa. */
  ghost: Phaser.GameObjects.Sprite;
  /** Barra de vida y estados: siempre arriba de todo, sigue a la figura. */
  overlay: Phaser.GameObjects.Container;
  hp: Phaser.GameObjects.Graphics;
  status: Phaser.GameObjects.Text;
  baseTint?: number;
  /** Dibujo de frente de la figura, y el que muestra ahora (frente o espalda). */
  key: string;
  face?: string;
}

const FLOOR: Record<string, string> = {
  pradera: 'tile.grass', bosque: 'tile.darkgrass', colinas: 'tile.dirt', campamento: 'tile.dirt', cripta: 'tile.cryptstone', cueva: 'tile.cave', jefe: 'tile.cryptstone',
  montana: 'tile.dirt', pantano: 'tile.darkgrass', ruinas: 'tile.stone', volcan: 'tile.ash',
};
const OBSTACLE: Record<string, string> = {
  pradera: 'prop.rock', bosque: 'prop.tree', colinas: 'prop.rock', campamento: 'prop.palisade', cripta: 'prop.pillar', cueva: 'prop.stalagmite', jefe: 'prop.pillar',
  montana: 'prop.rock', pantano: 'prop.tree', ruinas: 'prop.pillar', volcan: 'prop.basalt',
};
/** Obstáculos con tipo propio (los '#' usan el del bioma). */
const OBSTACLE_KIND: Record<string, string> = { T: 'prop.tree', R: 'prop.rock', C: 'prop.pillar', K: 'prop.tent', X: 'prop.crate' };
/** Superficies que no son el suelo del bioma. */
const SURFACE: Record<string, string> = { ':': 'tile.dirt', '=': 'tile.stone', w: 'tile.water', l: 'tile.lava' };
const STATUS_ICON: Record<string, string> = {
  sangrado: '🩸', veneno: '☠️', quemadura: '🔥', aturdido: '💫', ralentizado: '🐌', inmovilizado: '🕸️',
  cubierto: '🛡️', potenciado: '💪', mojado: '💧', corroido: '🧪',
  acelerado: '💨', regenerando: '💚', protegido: '🔰', resguardo: '✴️',
};
const STATUS_TEXT: Record<string, string> = {
  sangrado: 'Sangra', veneno: 'Envenenado', quemadura: 'Arde', aturdido: 'Aturdido', ralentizado: 'Lento', inmovilizado: 'Atrapado',
  cubierto: 'Cubierto', potenciado: 'Potenciado', mojado: 'Mojado', corroido: 'Corroído',
  acelerado: 'Acelerado', regenerando: 'Regenera', protegido: 'Protegido', resguardo: 'Resguardo',
};
/** Color y opacidad de cada efecto de terreno sobre la casilla. */
const TERRAIN_COLOR: Record<TerrainKind, [number, number]> = { hielo: [0xbfe8ff, 0.6], llamas: [0xff6a2d, 0.4], charco: [0x4a8ad8, 0.45] };
const ELEMENT_COLOR: Partial<Record<Affinity, number>> = {
  fuego: 0xff7a2d, hielo: 0x9ad8ff, rayo: 0xfff07a, agua: 0x4a8ad8, viento: 0xc8f0d8, tierra: 0xb08a52, sagrado: 0xfff4c8, oscuro: 0x9a6ad0,
};

/** Arena de combate táctico. Lee el estado del combate y anima lo que pasa. */
export class CombatScene extends Phaser.Scene {
  private arena!: ArenaDef;
  private units = new Map<string, UnitView>();
  /** Marcas sobre las casillas (cada una es una imagen con la profundidad de su casilla, así las tapa lo de adelante). */
  private highlightMarks: Phaser.GameObjects.Image[] = [];
  private terrainMarks: Phaser.GameObjects.Image[] = [];
  /** Altura de cada casilla (-1 si está vacía), para saber qué lomas tapan a quién. */
  private tileTop: number[][] = [];
  private flames = new Map<string, Prop>();
  private grass = new Map<string, Phaser.GameObjects.Image>();
  private view!: IsoView;
  private ground: GroundPiece[] = [];
  private props = new Set<Prop>();
  private rotating = false;
  /** Zoom que encuadra la arena entera; el mínimo se calcula a partir de él. */
  private fitZoom = 1;
  private drag = { down: false, dragging: false, x: 0, y: 0 };
  private pinch: { dist: number; zoom: number } | null = null;
  /** Unidad a la que se llevó la cámara por última vez (para seguir el turno). */
  private followed: string | null = null;
  /** Flecha del turno: el contenedor sigue a la unidad y la flecha rebota adentro. */
  private marker!: Phaser.GameObjects.Container;
  private markerArrow!: Phaser.GameObjects.Image;
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
    installWalkBob(this);
    const cs = this.cs!;
    const c = this.store.content;
    this.arena = c.arenas[cs.arenaId];
    this.units.clear();
    this.flames.clear();
    this.grass.clear();
    this.props.clear();
    this.queue = [];
    this.animating = false;
    this.rotating = false;
    this.followed = null;
    this.pinch = null;
    const a = this.arena;
    const { cols, rows } = arenaSize(a);
    this.view = new IsoView(cols, rows);
    this.view.angle = combatView.quarter * (Math.PI / 2);
    this.cameras.main.setBackgroundColor(0x141018);

    this.highlightMarks = [];
    this.terrainMarks = [];
    this.makeMarkTextures();
    this.tileTop = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => (isVoid(a, x, y) ? -1 : heightAt(a, x, y))));
    this.ground = drawGround(this, {
      cols, rows,
      height: (x, y) => heightAt(a, x, y),
      tile: (x, y) => SURFACE[terrainAt(a, x, y)] ?? FLOOR[a.look ?? a.biome],
      sideTint: () => (a.biome === 'colinas' ? 0x9a8a72 : a.look === 'cueva' || a.biome === 'cueva' ? 0x5e5246 : a.biome === 'cripta' || a.look === 'cripta' ? 0x5a5466 : 0x8a6e48),
      skip: (x, y) => isVoid(a, x, y),
    });
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = terrainAt(a, x, y);
        if (t === ',') {
          // Bajo tierra, la cobertura son escombros en vez de pasto.
          const img = this.add.image(0, 0, 'deco.tallgrass').setOrigin(0.5, 1);
          if (['cripta', 'cueva', 'jefe'].includes(a.look ?? a.biome)) img.setTint(0x8a8494);
          this.grass.set(`${x},${y}`, img);
          this.props.add({ obj: img, x, y, oy: 6, bias: 3 });
        }
        if (isObstacle(a, x, y)) {
          const key = OBSTACLE_KIND[t] ?? OBSTACLE[a.look ?? a.biome];
          const img = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(artScale(key, key === 'prop.tree' ? 0.75 : 1));
          this.props.add({ obj: img, x, y, oy: 12, bias: 5, occludes: true });
        }
      }
    }

    this.markerArrow = this.add.image(0, 0, 'fx.arrow');
    this.marker = this.add.container(0, 0, [this.markerArrow]).setDepth(DEPTH.marker);
    this.tweens.add({ targets: this.markerArrow, y: -6, yoyo: true, repeat: -1, duration: 400 });

    // Luz de la franja del día: un velo que cubre la arena en cualquier giro.
    const s = this.store.state;
    const light = SLOT_LIGHT[slotName(s)];
    const reach = (cols + rows) * TILE_W;
    this.add.rectangle(0, 0, reach * 4, reach * 4, light.color, light.alpha * 0.7).setDepth(9000);

    for (const u of cs.units) this.makeUnit(u);
    this.layout();
    this.setupCamera();
    this.fit();
    this.closeUp(currentUnit(cs));
    // La primera vista muestra la arena entera: no se corre hacia quien empieza.
    this.followed = currentUnit(cs)?.id ?? null;
    this.syncAll();
    this.scale.on('resize', this.refit, this);
    this.setupInput();

    this.unsubs.push(combatView.listen((r) => this.onCameraRequest(r)));
    this.unsubs.push(this.store.subscribe(() => {
      // Se espera un cuadro: si llega un evento con animaciones, la sincronización la hace la cola.
      this.time.delayedCall(0, () => { if (!this.animating && !this.rotating && this.sys.isActive() && this.cs) this.syncAll(); });
    }));
    this.unsubs.push(this.store.onEvent((ev: GameEvent) => {
      if (ev.type === 'combatFx' && ev.fx.length) {
        this.queue.push(...ev.fx);
        if (!this.animating && !this.rotating) this.runQueue();
      }
    }));
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.refit, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  update() {
    if (!this.sys.isActive() || !this.view) return;
    this.followOverlays();
    this.seeThrough();
  }

  // ── Vista: giro, cámara y transparencias ──

  /**
   * Ubica todo lo fijo de la arena según el ángulo de la vista (suelo, pasto, obstáculos, llamas).
   * El suelo comparte la escala de profundidad con las figuras: una loma de adelante tapa a quien está detrás.
   * Por casilla: paredes −1, tapa 0, marcas 1-2, pasto 3, llamas 4, obstáculos 5, figuras 8 (la siguiente fila suma 10).
   */
  private layout() {
    const v = this.view;
    // A mitad de un giro las baldosas (que no cambian de forma) dejan huecos: se agrandan lo justo para taparlos.
    const off = v.angle % (Math.PI / 2);
    const k = Math.abs(Math.cos(off)) + Math.abs(Math.sin(off));
    for (const g of this.ground) {
      if (g.lvl === undefined) {
        const p = v.pos(g.c, g.r, g.h);
        g.img.setPosition(p.x, p.y).setDepth(v.depth(g.c, g.r)).setScale(k);
      } else {
        const p = v.pos(g.c, g.r, g.lvl + 1);
        g.img.setOrigin(0.5, 0).setPosition(p.x, p.y).setDepth(v.depth(g.c, g.r, -1)).setScale(k, 1);
      }
    }
    for (const pr of this.props) {
      const p = v.pos(pr.x, pr.y, heightAt(this.arena, pr.x, pr.y));
      pr.obj.setPosition(p.x, p.y + pr.oy).setDepth(v.depth(pr.x, pr.y, pr.bias));
    }
  }

  /** Lleva figuras y flecha del turno a su lugar en la vista actual (sin animar). */
  private placeUnits() {
    const cs = this.cs;
    if (!cs) return;
    for (const u of cs.units) {
      const v = this.units.get(u.id);
      if (!v) continue;
      const p = this.unitPos(u);
      v.box.setPosition(p.x, p.y).setDepth(this.view.depth(u.x, u.y, 8));
      this.face(v, u, ...this.view.dirScreen(...DIR_GRID[u.facing]));
    }
    const cur = !cs.outcome ? currentUnit(cs) : undefined;
    const cv = cur && this.units.get(cur.id);
    if (cur && cv) {
      const p = this.unitPos(cur);
      this.marker.setPosition(p.x, p.y - cv.sprite.displayHeight - 30);
    }
  }

  private onCameraRequest(r: CameraRequest) {
    if (r.kind === 'fit') return this.toggleOverview();
    this.rotate(r.dir);
  }

  /** Gira la arena un cuarto de vuelta (1 = horario), manteniendo en el centro lo que se estaba mirando. */
  private rotate(dir: 1 | -1) {
    if (this.rotating || !this.sys.isActive()) return;
    this.rotating = true;
    const cam = this.cameras.main;
    const focus = this.unproject(cam.midPoint.x, cam.midPoint.y);
    const from = this.view.angle;
    const to = (Math.round(from / (Math.PI / 2)) + dir) * (Math.PI / 2);
    this.clearMarks(this.highlightMarks);
    this.clearMarks(this.terrainMarks);
    const t = { a: from };
    this.tweens.add({
      targets: t, a: to, duration: ROTATE_MS, ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.view.angle = t.a;
        this.layout();
        this.placeUnits();
        const f = this.view.pos(focus.x, focus.y);
        cam.centerOn(f.x, f.y);
      },
      onComplete: () => {
        // Se normaliza el ángulo para que no crezca sin fin.
        const q = ((Math.round(to / (Math.PI / 2)) % 4) + 4) % 4;
        this.view.angle = q * (Math.PI / 2);
        combatView.quarter = q;
        this.layout();
        this.rotating = false;
        this.syncAll();
        if (this.queue.length && !this.animating) this.runQueue();
      },
    });
  }

  /** Punto de la grilla (fraccionario, a altura 0) bajo un punto del mundo. */
  private unproject(wx: number, wy: number) {
    const dx = (wx / (TILE_W / 2) + wy / (TILE_H / 2)) / 2;
    const dy = (wy / (TILE_H / 2) - wx / (TILE_W / 2)) / 2;
    const cos = Math.cos(-this.view.angle);
    const sin = Math.sin(-this.view.angle);
    const { cols, rows } = this.view;
    return { x: dx * cos - dy * sin + (cols - 1) / 2, y: dx * sin + dy * cos + (rows - 1) / 2 };
  }

  /** Límites de la cámara: un cuadrado que contiene la arena en cualquier giro, con margen para alturas. */
  private setupCamera() {
    const { cols, rows } = this.view;
    const half = Math.hypot(cols, rows) / 2 + 1;
    const w = half * TILE_W * 1.05;
    const top = half * TILE_H + 8 * LEVEL_H + 120;
    const bottom = half * TILE_H + 140;
    this.cameras.main.setBounds(-w, -top, w * 2, top + bottom);
  }

  private maxHeight() {
    return Math.max(0, ...this.arena.heights.flatMap((r) => [...r].map(Number)));
  }

  /** Encuadra la arena entera, dejando lugar para el orden de turnos arriba y las acciones abajo. */
  private fit() {
    const b = this.view.bounds();
    const { width, height } = this.scale.gameSize;
    const top = b.top - this.maxHeight() * LEVEL_H - 40;
    const zoom = Phaser.Math.Clamp(Math.min(width / (b.width + 10), (height - 96) / (b.bottom - top)), 0.4, MAX_ZOOM);
    this.fitZoom = zoom;
    const cam = this.cameras.main;
    cam.setZoom(zoom);
    cam.centerOn((b.left + b.right) / 2, (top + b.bottom) / 2 + 20 / zoom);
  }

  /**
   * Si la arena entera se ve chica (en el celular), se acerca a un zoom cómodo, centrado entre la figura que
   * juega y el medio de la arena. Con pantallas grandes se queda el encuadre completo.
   */
  private closeUp(u?: CombatUnit) {
    if (this.fitZoom >= CLOSE_ZOOM) return this.fit();
    const cam = this.cameras.main;
    cam.setZoom(CLOSE_ZOOM);
    const mid = this.view.pos((this.view.cols - 1) / 2, (this.view.rows - 1) / 2);
    const at = u ? this.unitPos(u) : mid;
    cam.centerOn((at.x + mid.x) / 2, (at.y + mid.y) / 2 - 20);
  }

  /** Al cambiar el tamaño de la pantalla se recalcula el encuadre. */
  private refit() {
    const cs = this.cs;
    this.fit();
    this.closeUp(cs && !cs.outcome ? currentUnit(cs) : undefined);
  }

  /** Botón de encuadre: alterna entre la arena entera y la vista cercana sobre quien juega. */
  private toggleOverview() {
    const cs = this.cs;
    const cam = this.cameras.main;
    if (Math.abs(cam.zoom - this.fitZoom) < 0.01 && cs) this.closeUp(!cs.outcome ? currentUnit(cs) : undefined);
    else this.fit();
  }

  /** Zoom alrededor de un punto de la pantalla (para que lo que está bajo el dedo quede quieto). */
  private zoomAt(zoom: number, sx: number, sy: number) {
    const cam = this.cameras.main;
    const z = Phaser.Math.Clamp(zoom, this.fitZoom * 0.8, MAX_ZOOM);
    const before = cam.getWorldPoint(sx, sy);
    cam.setZoom(z);
    cam.preRender();
    const after = cam.getWorldPoint(sx, sy);
    cam.scrollX += before.x - after.x;
    cam.scrollY += before.y - after.y;
  }

  /** Tocar elige casilla; arrastrar mueve la vista; dos dedos o la rueda acercan. */
  private setupInput() {
    const a = this.arena;
    const { cols, rows } = this.view;
    const maxH = this.maxHeight();
    const pointers = () => [this.input.pointer1, this.input.pointer2].filter((p) => p?.isDown);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const down = pointers();
      if (down.length >= 2) {
        this.pinch = { dist: Phaser.Math.Distance.Between(down[0].x, down[0].y, down[1].x, down[1].y), zoom: this.cameras.main.zoom };
        this.drag.dragging = true;
        return;
      }
      this.drag = { down: true, dragging: false, x: p.x, y: p.y };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const down = pointers();
      if (this.pinch && down.length >= 2) {
        const d = Phaser.Math.Distance.Between(down[0].x, down[0].y, down[1].x, down[1].y);
        this.zoomAt(this.pinch.zoom * (d / Math.max(1, this.pinch.dist)), (down[0].x + down[1].x) / 2, (down[0].y + down[1].y) / 2);
        return;
      }
      if (!this.drag.down || !p.isDown) return;
      const dx = p.x - this.drag.x;
      const dy = p.y - this.drag.y;
      if (!this.drag.dragging && Math.hypot(dx, dy) > 10) this.drag.dragging = true;
      if (this.drag.dragging) {
        const cam = this.cameras.main;
        cam.scrollX -= dx / cam.zoom;
        cam.scrollY -= dy / cam.zoom;
        this.drag.x = p.x;
        this.drag.y = p.y;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.pinch) {
        // Al levantar los dos dedos termina el pellizco; no cuenta como toque.
        if (!pointers().length) this.pinch = null;
        this.drag.down = false;
        return;
      }
      const wasDrag = this.drag.dragging;
      this.drag.down = false;
      this.drag.dragging = false;
      if (wasDrag || this.animating || this.rotating) return;
      const tile = this.view.pick(p.worldX, p.worldY, (x, y) => (x >= 0 && y >= 0 && x < cols && y < rows && !isVoid(a, x, y) ? heightAt(a, x, y) : null), maxH);
      if (tile) combatTap(this.store, tile.x, tile.y);
    });
    this.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.zoomAt(this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1), p.x, p.y);
    });
  }

  /** Al empezar un turno, si la figura queda fuera del centro de la pantalla, la cámara va hacia ella. */
  private follow(u: CombatUnit) {
    if (this.followed === u.id) return;
    this.followed = u.id;
    const v = this.units.get(u.id);
    if (!v) return;
    const cam = this.cameras.main;
    const view = cam.worldView;
    const x = v.box.x;
    const y = v.box.y - v.sprite.displayHeight / 2;
    // Abajo se deja más margen porque ahí está la barra de acciones.
    const inside = x > view.x + view.width * 0.12 && x < view.right - view.width * 0.12 && y > view.y + view.height * 0.15 && y < view.bottom - view.height * 0.28;
    if (!inside) cam.pan(x, y, 350, 'Sine.easeInOut');
  }

  /** Lo que queda adelante de una figura y la tapa (obstáculos u otras figuras) se vuelve transparente. */
  private seeThrough() {
    const cs = this.cs;
    if (!cs) return;
    const figures = cs.units.filter((u) => u.alive).map((u) => ({ u, v: this.units.get(u.id) })).filter((f) => f.v && f.v.box.visible);
    const boxes = figures.map((f) => ({ depth: f.v!.box.depth, rect: f.v!.sprite.getBounds() }));
    const covers = (depth: number, rect: Phaser.Geom.Rectangle) =>
      boxes.some((b) => b.depth < depth && Phaser.Geom.Rectangle.Overlaps(rect, Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(b.rect), -6, -6)));
    for (const pr of this.props) {
      if (!pr.occludes) continue;
      pr.obj.setAlpha(covers(pr.obj.depth, pr.obj.getBounds()) ? SEE_THROUGH : 1);
    }
    for (const f of figures) {
      f.v!.sprite.setAlpha(covers(f.v!.box.depth, f.v!.sprite.getBounds()) ? 0.55 : 1);
      this.updateGhost(f.u, f.v!);
    }
    for (const v of this.units.values()) if (!v.box.visible) v.ghost.setVisible(false);
  }

  /** La barra de vida y los estados siguen a cada figura (que se mueve con tweens). */
  private followOverlays() {
    for (const v of this.units.values()) {
      v.overlay.setPosition(v.box.x, v.box.y).setVisible(v.box.visible).setAlpha(v.box.alpha).setScale(v.box.scale);
    }
  }

  /**
   * ¿Una loma de adelante tapa buena parte de la figura? Se mira la línea vertical del medio de la figura: el borde
   * de arriba de la casilla más alta que la cruza (adelante y más alta que el piso de la figura) marca hasta dónde
   * queda tapada. Si es más de un tercio, se dibuja su silueta encima.
   */
  private hiddenByTerrain(u: CombatUnit, v: UnitView): boolean {
    const rect = v.sprite.getBounds();
    if (!rect.height) return false;
    const floor = heightAt(this.arena, u.x, u.y);
    const sx = rect.centerX;
    let edge = rect.bottom;
    for (let y = u.y - 4; y <= u.y + 4; y++) {
      for (let x = u.x - 4; x <= u.x + 4; x++) {
        const top = this.tileTop[y]?.[x];
        if (top === undefined || top <= floor || this.view.depth(x, y) <= v.box.depth) continue;
        const t = this.view.pos(x, y, top);
        const dx = Math.abs(t.x - sx);
        if (dx >= TILE_W / 2) continue;
        // Borde superior del rombo de la tapa a esa altura de x (la pendiente del rombo es 1/2).
        edge = Math.min(edge, t.y - TILE_H / 2 + dx / 2);
      }
    }
    return (rect.bottom - edge) / rect.height > 0.35;
  }

  private updateGhost(u: CombatUnit, v: UnitView) {
    const show = this.hiddenByTerrain(u, v);
    const g = v.ghost.setVisible(show);
    if (!show) return;
    const s = v.sprite;
    g.setTexture(s.texture.key, s.frame.name).setFlipX(s.flipX).setRotation(s.rotation)
      .setScale(s.scaleX * v.box.scale, s.scaleY * v.box.scale)
      .setPosition(v.box.x + s.x * v.box.scale, v.box.y + s.y * v.box.scale);
  }

  // ── Unidades ──

  private unitPos(u: { x: number; y: number }) {
    const p = this.view.pos(u.x, u.y, heightAt(this.arena, u.x, u.y));
    return { x: p.x, y: p.y + 6 };
  }

  private makeUnit(u: CombatUnit) {
    if (this.units.has(u.id)) return;
    const p = this.unitPos(u);
    const box = this.add.container(p.x, p.y);
    const shadow = this.add.image(0, -2, 'fx.shadow');
    const look = u.side === 'enemy'
      ? monsterLook(u.sprite, u.monsterId, 1.8)
      : { key: u.sprite.key, scale: artScale(u.sprite.key, 2 * (u.sprite.scale ?? 1)), tint: u.sprite.tint };
    const sprite = this.add.sprite(0, 0, look.key).setOrigin(0.5, 1).setScale(look.scale);
    if (look.tint !== undefined) sprite.setTint(look.tint);
    if (this.anims.exists(`${look.key}.walk`) && u.side === 'enemy') sprite.play(`${look.key}.walk`);
    box.add([shadow, sprite]);
    const hp = this.add.graphics();
    const status = this.add.text(0, -sprite.displayHeight - 22, '', { fontSize: '13px' }).setOrigin(0.5, 1).setResolution(2);
    const overlay = this.add.container(p.x, p.y, [hp, status]).setDepth(DEPTH.overlay);
    const ghost = this.add.sprite(p.x, p.y, look.key).setOrigin(0.5, 1).setDepth(DEPTH.ghost).setVisible(false)
      .setTint(GHOST_TINT[u.side]).setTintMode(Phaser.TintModes.FILL).setAlpha(0.45);
    this.units.set(u.id, { box, sprite, ghost, overlay, hp, status, baseTint: look.tint, key: look.key });
  }

  /** Orienta la figura hacia (dx, dy): frente o espalda, y espejo. Los enemigos y quien camina se animan. */
  private face(v: UnitView, u: CombatUnit, dx: number, dy: number, walking = false) {
    const f = facing(v.key, dx, dy);
    v.face = f.key;
    v.sprite.setFlipX(f.flip);
    const anim = `${f.key}.walk`;
    if ((walking || u.side === 'enemy') && this.anims.exists(anim)) v.sprite.play(anim, true);
    else if (v.sprite.texture.key !== f.key) v.sprite.stop().setTexture(f.key);
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
      v.box.setPosition(p.x, p.y).setDepth(this.view.depth(u.x, u.y, 8)).setVisible(u.alive).setAlpha(1);
      this.face(v, u, ...this.view.dirScreen(...DIR_GRID[u.facing]));
      this.drawHp(v, u);
    }
    const cur = !cs.outcome ? currentUnit(cs) : undefined;
    if (cur) {
      const p = this.unitPos(cur);
      const v = this.units.get(cur.id)!;
      this.marker.setVisible(true).setPosition(p.x, p.y - v.sprite.displayHeight - 30);
      this.markerArrow.setTint(cur.side === 'party' ? 0xffd04d : 0xff6b5a);
      this.follow(cur);
    } else {
      this.marker.setVisible(false);
    }
    this.drawTerrain();
    this.drawHighlights();
  }

  /** Rombos blancos (relleno y borde) que se tiñen para marcar casillas. */
  private makeMarkTextures() {
    if (this.textures.exists('mark.fill')) return;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillPoints([new Phaser.Math.Vector2(30, 0), new Phaser.Math.Vector2(60, 15), new Phaser.Math.Vector2(30, 30), new Phaser.Math.Vector2(0, 15)], true);
    g.generateTexture('mark.fill', 60, 30);
    g.clear();
    g.lineStyle(3, 0xffffff, 1).strokePoints([new Phaser.Math.Vector2(32, 2), new Phaser.Math.Vector2(62, 17), new Phaser.Math.Vector2(32, 32), new Phaser.Math.Vector2(2, 17)], true);
    g.generateTexture('mark.line', 64, 34);
    g.destroy();
  }

  /** Marca una casilla con un rombo de color. Va justo encima de su tapa: lo que está adelante lo tapa. */
  private mark(list: Phaser.GameObjects.Image[], x: number, y: number, color: number, alpha: number, stroke = false) {
    const p = this.view.pos(x, y, heightAt(this.arena, x, y));
    list.push(this.add.image(p.x, p.y, stroke ? 'mark.line' : 'mark.fill').setTint(color).setAlpha(stroke ? 1 : alpha).setDepth(this.view.depth(x, y, stroke ? 2 : 1)));
  }

  private clearMarks(list: Phaser.GameObjects.Image[]) {
    list.forEach((m) => m.destroy());
    list.length = 0;
  }

  /** Hielo, llamas y charcos sobre las casillas; la hierba quemada se oscurece. */
  private drawTerrain() {
    const cs = this.cs;
    if (!cs) return;
    const g = this.terrainMarks;
    this.clearMarks(g);
    const burning = new Set<string>();
    for (const [k, fx] of Object.entries(cs.terrainFx)) {
      const [x, y] = k.split(',').map(Number);
      const [color, alpha] = TERRAIN_COLOR[fx.kind];
      this.mark(g, x, y, color, alpha);
      if (fx.kind !== 'llamas') continue;
      burning.add(k);
      if (this.flames.has(k)) continue;
      const p = this.view.pos(x, y, heightAt(this.arena, x, y));
      const flame = this.add.image(p.x, p.y + 4, 'fx.flame').setOrigin(0.5, 1).setScale(1.4).setDepth(this.view.depth(x, y, 4));
      this.tweens.add({ targets: flame, scaleY: 1.7, alpha: 0.75, yoyo: true, repeat: -1, duration: 260 + ((x * 31 + y * 17) % 140) });
      const prop: Prop = { obj: flame, x, y, oy: 4, bias: 4 };
      this.props.add(prop);
      this.flames.set(k, prop);
    }
    for (const [k, flame] of this.flames) {
      if (burning.has(k)) continue;
      flame.obj.destroy();
      this.props.delete(flame);
      this.flames.delete(k);
    }
    for (const k of cs.burnt) this.grass.get(k)?.setTint(0x3a2a20).setAlpha(0.6);
    // Golpes anunciados: casillas marcadas en rojo hasta que caen.
    for (const p of cs.pending ?? []) for (const t of p.tiles) {
      this.mark(g, t.x, t.y, 0xff2a2a, 0.35);
      this.mark(g, t.x, t.y, 0xff2a2a, 1, true);
    }
  }

  private drawHighlights() {
    const g = this.highlightMarks;
    this.clearMarks(g);
    const h = combatHighlights(this.store);
    const diamond = (x: number, y: number, color: number, alpha: number, stroke = false) => this.mark(g, x, y, color, alpha, stroke);
    h.move.forEach((t) => diamond(t.x, t.y, 0x5aa9ff, 0.38));
    h.range.forEach((t) => diamond(t.x, t.y, 0xff8a3d, 0.22));
    h.targets.forEach((t) => diamond(t.x, t.y, 0xff4a3a, 1, true));
    h.area.forEach((t) => diamond(t.x, t.y, 0xffd04d, 0.35));
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
    this.clearMarks(this.highlightMarks);
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
    // Sonido de cada efecto, en el momento de su animación (los golpes suenan al impactar).
    const elementSfx = (e?: Affinity): SfxId => (e === 'fuego' || e === 'hielo' || e === 'rayo' ? e : 'magia');
    const cs = this.cs;
    const view = (id: string) => this.units.get(id);
    switch (fx.kind) {
      case 'move': {
        const v = view(fx.unit);
        if (!v) return done();
        const unit = cs?.units.find((u) => u.id === fx.unit);
        const step = (i: number) => {
          if (i >= fx.path.length) {
            if (unit?.side === 'party') { v.sprite.stop(); v.sprite.setTexture(v.face ?? v.key); }
            return done();
          }
          const p = this.unitPos(fx.path[i]);
          if (unit) this.face(v, unit, p.x - v.box.x, p.y - v.box.y, true);
          v.box.setDepth(this.view.depth(fx.path[i].x, fx.path[i].y, 8));
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
        const ranged = !!skill && (skill.ammo || skill.throw || skill.range[1] > 1) && !skill.area;
        const impact = () => {
          sfx(fx.kind === 'miss' ? 'falla' : fx.crit ? 'critico' : 'golpe');
          if (fx.kind === 'hit' && fx.element) sfx(elementSfx(fx.element));
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
          sfx('flecha');
          const shot = this.add.image(a.box.x, a.box.y - 30, 'fx.spark').setDepth(9700).setScale(2).setTint(0xffe9a8);
          this.tweens.add({ targets: shot, x: t.box.x, y: t.box.y - 30, duration: 220, onComplete: () => { shot.destroy(); impact(); } });
        } else {
          this.tweens.add({ targets: a.box, x: a.box.x + (t.box.x - a.box.x) * 0.35, y: a.box.y + (t.box.y - a.box.y) * 0.35, yoyo: true, duration: 110, onYoyo: impact });
        }
        return;
      }
      case 'heal': {
        sfx('curar');
        const t = view(fx.to);
        if (t) {
          this.flash(t, 0x9aff9a);
          this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `+${fx.amount}`, '#6fcf6a');
        }
        return void this.time.delayedCall(300, done);
      }
      case 'tick': {
        sfx('estado');
        const t = view(fx.unit);
        if (t) this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `${fx.damage} ${STATUS_ICON[fx.status] ?? ''}`, '#d8b7ff');
        return void this.time.delayedCall(300, done);
      }
      case 'status': {
        sfx('estado');
        const t = view(fx.unit);
        if (t) this.float(t.box.x, t.box.y - t.sprite.displayHeight - 30, `${STATUS_ICON[fx.status] ?? ''} ${STATUS_TEXT[fx.status] ?? fx.status}`, '#9fd3ff');
        return void this.time.delayedCall(200, done);
      }
      case 'buff': {
        sfx('refuerzo');
        const t = view(fx.unit);
        if (t) {
          const ring = this.add.image(t.box.x, t.box.y - 4, 'fx.ring').setDepth(9600).setTint(0xffd04d);
          this.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
        }
        return void this.time.delayedCall(300, done);
      }
      case 'push': {
        sfx('empuje');
        const t = view(fx.unit);
        if (!t) return done();
        const p = this.unitPos(fx.to);
        if (fx.damage) this.float(t.box.x, t.box.y - t.sprite.displayHeight - 10, `${fx.damage}`, '#ff8a3d');
        this.tweens.add({ targets: t.box, x: p.x, y: p.y, duration: 220, ease: 'Quad.in', onComplete: done });
        return;
      }
      case 'death': {
        sfx('muerte');
        const t = view(fx.unit);
        if (!t) return done();
        this.tweens.add({ targets: t.box, alpha: 0, y: t.box.y + 8, duration: 350, onComplete: () => { t.box.setVisible(false); done(); } });
        return;
      }
      case 'area': {
        sfx(elementSfx(fx.element));
        // Destello del área de la acción (cono, línea, radio).
        const flash: Phaser.GameObjects.Image[] = [];
        const color = (fx.element && ELEMENT_COLOR[fx.element]) ?? 0xffe9a8;
        fx.tiles.forEach((t) => this.mark(flash, t.x, t.y, color, 0.7));
        const a = view(fx.from);
        if (a) this.tweens.add({ targets: a.box, scale: 1.08, yoyo: true, duration: 120 });
        this.tweens.add({ targets: flash, alpha: 0, duration: 420, onComplete: () => this.clearMarks(flash) });
        return void this.time.delayedCall(260, done);
      }
      case 'telegraph':
        sfx('aviso');
        this.drawTerrain();
        this.cameras.main.shake(120, 0.004);
        return void this.time.delayedCall(450, done);
      case 'terrain':
        this.drawTerrain();
        return void this.time.delayedCall(fx.terrain ? 220 : 60, done);
      case 'chain': {
        sfx('rayo');
        // El rayo corre por el agua de casilla en casilla.
        const g = this.add.graphics().setDepth(9650);
        g.lineStyle(3, 0xfff07a, 1);
        const pts = fx.tiles.map((t) => this.view.pos(t.x, t.y, heightAt(this.arena, t.x, t.y)));
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const mx = (a.x + b.x) / 2 + Phaser.Math.Between(-6, 6);
          const my = (a.y + b.y) / 2 + Phaser.Math.Between(-6, 6);
          g.lineBetween(a.x, a.y - 4, mx, my - 4);
          g.lineBetween(mx, my - 4, b.x, b.y - 4);
        }
        this.cameras.main.flash(80, 255, 250, 200);
        this.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
        return void this.time.delayedCall(300, done);
      }
      case 'spawn': {
        sfx('aparece');
        const u = cs?.units.find((x) => x.id === fx.unit);
        if (u) {
          this.makeUnit(u);
          const v = view(u.id)!;
          const p = this.unitPos(u);
          v.box.setPosition(p.x, p.y).setDepth(this.view.depth(u.x, u.y, 8)).setScale(0.2);
          this.drawHp(v, u);
          this.tweens.add({ targets: v.box, scale: 1, duration: 300, ease: 'Back.out' });
        }
        return void this.time.delayedCall(350, done);
      }
    }
  }
}

