// Interiores ilustrados: el lugar entero es una sola imagen (interior.<lugar>.png, 1280×720) y la grilla del piso
// de siempre se proyecta sobre el piso dibujado. Así los caminos, las rutinas de los NPCs, los clientes y los lugares
// tocables siguen funcionando igual, pero sobre la ilustración. Lo que se marca a mano para cada imagen:
// - floor: dónde caen en la imagen las 4 esquinas del piso (la de arriba, la derecha, la de abajo y la izquierda);
// - charScale: cuánto se agrandan o achican las figuras para que tengan el tamaño de los muebles dibujados;
// - blocked: las casillas que tapan los muebles dibujados (nadie camina por ahí);
// - labels: dónde va el nombre de cada lugar tocable, si no queda bien sobre su casilla;
// - spots: dónde aparecen el herrero, cada NPC y el cliente, si no sirven los del lugar (por ejemplo en una vista de
//   frente, "detrás del mostrador" es arriba del mueble y no al costado).
// Quién se dibuja delante se decide por la altura en pantalla: sirve para ilustraciones isométricas y de frente.

type Pt = { x: number; y: number };

export interface IllustratedInterior {
  image: string;
  /**
   * Esquinas del piso en la imagen, en este orden: la de la casilla (0,0), la de (cols,0), la de (cols,rows) y la de (0,rows).
   * En una ilustración isométrica son la de arriba, la derecha, la de abajo y la izquierda; en una de frente, fondo a la
   * izquierda, fondo a la derecha, adelante a la derecha y adelante a la izquierda.
   */
  floor: [Pt, Pt, Pt, Pt];
  charScale: number;
  blocked: [number, number][];
  labels?: Record<string, Pt>;
  spots?: { spawn?: [number, number]; npc?: Record<string, [number, number]>; customer?: [number, number] };
}

/** Medida en la que se muestra la ilustración (la misma del mapa de la ciudad). */
export const ILLUSTRATION = { w: 1280, h: 720 };

/** Interiores que tienen ilustración (se usan solo si la imagen existe; si no, el lugar se arma como siempre). */
export const ILLUSTRATED: Record<string, IllustratedInterior> = {
  // La herrería, en vista de frente desde arriba: las columnas van de izquierda a derecha y las filas de atrás hacia
  // adelante (la fila 9 es la calle, del otro lado de la baranda).
  herreria: {
    image: 'interior.herreria',
    floor: [{ x: 175, y: 190 }, { x: 1110, y: 190 }, { x: 1260, y: 715 }, { x: 20, y: 715 }],
    charScale: 1.6,
    blocked: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], // fragua, leña, sacos, mesa de joyero y armeros
      [0, 1], [1, 1], [7, 1], [8, 1], [9, 1], // leña, barriles y mesa de runas
      [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [8, 2], [9, 2], // barriles, yunque, tina, mesa de runas y arcón
      [0, 3], [1, 3], [8, 3], [9, 3], // piedra de afilar y arcón
      [0, 4],
      [0, 5], [1, 5], [8, 5], [9, 5], // mesa del libro y mesa de alquimia
      [0, 6], [1, 6], [3, 6], [4, 6], [5, 6], [6, 6], [8, 6], [9, 6], // mostrador
      [1, 7], [3, 7], [4, 7], [5, 7], [6, 7], [8, 7], [9, 7],
      [0, 8], [1, 8], [2, 8], [7, 8], [8, 8], [9, 8], // baranda (la puerta queda en el medio)
    ],
    labels: {
      yunque: { x: 440, y: 215 }, mostrador: { x: 610, y: 440 }, libro: { x: 150, y: 420 }, arcon: { x: 1040, y: 280 },
      mesa_runas: { x: 985, y: 200 }, mesa_joyeria: { x: 715, y: 95 }, mesa_alquimia: { x: 1090, y: 380 },
    },
    spots: {
      npc: { marcia: [6, 5], brunilda: [5, 5], ciro: [5, 5], nayra: [5, 5], gualterio: [5, 5] }, // los que atienden la tienda, detrás del mostrador
      customer: [5, 8], // el cliente, delante del mostrador
    },
  },
};

/**
 * Posición en la imagen de un punto de la grilla (columna c, fila r, pueden tener decimales y salirse del piso):
 * interpolación entre las 4 esquinas marcadas.
 */
export function projectOnFloor(def: IllustratedInterior, cols: number, rows: number, c: number, r: number): Pt {
  const u = c / cols;
  const v = r / rows;
  const [a, b, cc, d] = def.floor;
  return {
    x: (1 - u) * (1 - v) * a.x + u * (1 - v) * b.x + u * v * cc.x + (1 - u) * v * d.x,
    y: (1 - u) * (1 - v) * a.y + u * (1 - v) * b.y + u * v * cc.y + (1 - u) * v * d.y,
  };
}
