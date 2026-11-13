import { LEVEL_H, TILE_H, TILE_W } from './iso';

/**
 * Vista isométrica que gira alrededor del centro de la grilla.
 * El ángulo es continuo para poder animar el giro; en reposo siempre es un múltiplo de 90°.
 * Todo lo que se dibuja en la arena pasa por acá: casilla (x, y, altura) → pantalla y profundidad.
 */
export class IsoView {
  /** Ángulo actual en radianes (0, π/2, π, 3π/2 en reposo). */
  angle = 0;

  constructor(public cols: number, public rows: number) {}

  /** Cuartos de vuelta (0 a 3) del ángulo en reposo más cercano. */
  get quarter(): number {
    return ((Math.round(this.angle / (Math.PI / 2)) % 4) + 4) % 4;
  }

  /** Coordenadas de la casilla relativas al centro, ya giradas. */
  rel(x: number, y: number): { dx: number; dy: number } {
    const ox = x - (this.cols - 1) / 2;
    const oy = y - (this.rows - 1) / 2;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return { dx: ox * cos - oy * sin, dy: ox * sin + oy * cos };
  }

  /** Centro de la casilla en pantalla, a `h` niveles de altura. */
  pos(x: number, y: number, h = 0): { x: number; y: number } {
    const { dx, dy } = this.rel(x, y);
    return { x: (dx - dy) * (TILE_W / 2), y: (dx + dy) * (TILE_H / 2) - h * LEVEL_H };
  }

  /** Profundidad de dibujo: más abajo en pantalla = adelante. */
  depth(x: number, y: number, bias = 0): number {
    const { dx, dy } = this.rel(x, y);
    return (dx + dy) * 10 + bias;
  }

  /** Dirección en pantalla de un vector de la grilla (para orientar figuras). */
  dirScreen(vx: number, vy: number): [number, number] {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const rx = vx * cos - vy * sin;
    const ry = vx * sin + vy * cos;
    return [rx - ry, rx + ry];
  }

  /**
   * Casilla bajo un punto de pantalla, considerando alturas: prueba de la más alta a la más baja
   * y se queda con la primera cuya altura coincide.
   */
  pick(wx: number, wy: number, heightOf: (x: number, y: number) => number | null, maxH = 8): { x: number; y: number } | null {
    const cos = Math.cos(-this.angle);
    const sin = Math.sin(-this.angle);
    for (let h = maxH; h >= 0; h--) {
      const sy = wy + h * LEVEL_H;
      const dx = (wx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2;
      const dy = (sy / (TILE_H / 2) - wx / (TILE_W / 2)) / 2;
      // `|| 0` evita el -0 que deja el redondeo.
      const x = Math.round(dx * cos - dy * sin + (this.cols - 1) / 2) || 0;
      const y = Math.round(dx * sin + dy * cos + (this.rows - 1) / 2) || 0;
      if (heightOf(x, y) === h) return { x, y };
    }
    return null;
  }

  /** Rectángulo en pantalla que ocupa la grilla (sin alturas), en la vista actual. */
  bounds() {
    const pts = [[0, 0], [this.cols - 1, 0], [0, this.rows - 1], [this.cols - 1, this.rows - 1]].map(([x, y]) => this.pos(x, y));
    const left = Math.min(...pts.map((p) => p.x)) - TILE_W / 2;
    const right = Math.max(...pts.map((p) => p.x)) + TILE_W / 2;
    const top = Math.min(...pts.map((p) => p.y)) - TILE_H / 2;
    const bottom = Math.max(...pts.map((p) => p.y)) + TILE_H / 2;
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  }
}
