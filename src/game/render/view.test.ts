import { describe, expect, it } from 'vitest';
import { IsoView } from './view';

// Grilla de prueba rectangular (no cuadrada) con escalones de a un nivel: ninguna casilla queda tapada entera
// (si la de adelante fuera dos niveles más alta, tocar ahí elegiría con razón la de adelante).
const COLS = 10;
const ROWS = 7;
const height = (x: number, y: number) => Math.floor(x / 3) + (y > 3 && x < 3 ? 1 : 0);
const heightOf = (x: number, y: number) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? height(x, y) : null);

describe('IsoView', () => {
  it('tocar el centro de una casilla la elige, en los cuatro giros', () => {
    const v = new IsoView(COLS, ROWS);
    for (let q = 0; q < 4; q++) {
      v.angle = q * (Math.PI / 2);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          // Un poco arriba del centro: el centro exacto toca el vértice de la casilla de adelante si es más alta.
          const p = v.pos(x, y, height(x, y));
          expect(v.pick(p.x, p.y - 3, heightOf, 4)).toEqual({ x, y });
        }
      }
    }
  });

  it('en reposo las casillas caen en la grilla isométrica (vecinas a medio tile de distancia)', () => {
    const v = new IsoView(COLS, ROWS);
    for (let q = 0; q < 4; q++) {
      v.angle = q * (Math.PI / 2);
      const a = v.pos(3, 3);
      const b = v.pos(4, 3);
      expect(Math.abs(b.x - a.x)).toBeCloseTo(32);
      expect(Math.abs(b.y - a.y)).toBeCloseTo(16);
    }
  });

  it('girar un cuarto de vuelta lleva lo de adelante a un costado', () => {
    const v = new IsoView(COLS, ROWS);
    // Sin girar, la esquina (cols-1, rows-1) es la de más abajo en pantalla (la más cercana).
    const front = () => v.depth(COLS - 1, ROWS - 1);
    const d0 = front();
    v.angle = Math.PI;
    expect(front()).toBeLessThan(d0);
    expect(v.depth(0, 0)).toBeCloseTo(d0);
  });

  it('la dirección en pantalla gira con la vista', () => {
    const v = new IsoView(COLS, ROWS);
    expect(v.dirScreen(1, 0)).toEqual([1, 1]);
    v.angle = Math.PI / 2;
    const [sx, sy] = v.dirScreen(1, 0);
    expect(sx).toBeCloseTo(-1);
    expect(sy).toBeCloseTo(1);
  });
});
