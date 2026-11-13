// Interiores ilustrados: el lugar entero es una sola imagen (interior.<lugar>.png, 1280×720) y la grilla del piso
// de siempre se proyecta sobre el piso dibujado. Así los caminos, las rutinas de los NPCs, los clientes y los lugares
// tocables siguen funcionando igual, pero sobre la ilustración. Lo que se marca a mano para cada imagen:
// - floor: dónde caen en la imagen las 4 esquinas del piso (la de arriba, la derecha, la de abajo y la izquierda), contando
//   la calle de afuera, que es parte de la grilla (sus últimas filas);
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
  // La herrería en isométrica: columnas a lo largo de la pared derecha, filas a lo largo de la izquierda; las filas 9 a 11
  // son la calle de afuera (la 9 es la vereda, donde están los postes de la entrada y un barril).
  herreria: {
    image: 'interior.herreria',
    floor: [{ x: 683, y: 195 }, { x: 1268, y: 416 }, { x: 575, y: 760 }, { x: -101, y: 450 }],
    charScale: 1.45,
    blocked: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], // fragua, tina, sacos, mesa de joyero y armeros
      [0, 1], [1, 1], [2, 1], [6, 1], [7, 1], [8, 1], // fragua, yunque y mesa de runas
      [0, 2], [2, 2], [7, 2], [8, 2], // piedra de afilar, yunque y mesa de runas
      [0, 3], [6, 3], [7, 3], [8, 3], // barriles y arcón
      [0, 4], [5, 4], [7, 4], // barriles, farol del mostrador y alambique
      [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], // mesa del libro, mostrador y mesa de alquimia
      [0, 6], [1, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6],
      [1, 7], [3, 7], [4, 7], [7, 7], [8, 7], // postes de la entrada y mesa de alquimia
      [0, 8], [4, 8], [5, 8], [7, 8], [8, 8], // barrilito, postes y barril (la entrada es la casilla 6,8)
      [5, 9], [8, 9], [9, 9], // en la vereda: los postes y el barril
      [9, 11], // fuera de la imagen
    ],
    labels: {
      yunque: { x: 690, y: 215 }, mostrador: { x: 615, y: 385 }, libro: { x: 320, y: 265 }, arcon: { x: 920, y: 395 },
      mesa_runas: { x: 1015, y: 345 }, mesa_joyeria: { x: 930, y: 195 }, mesa_alquimia: { x: 815, y: 470 },
    },
    spots: {
      npc: {
        oriol: [5, 3], marcia: [2, 8],
        // Los que atienden la tienda, detrás del mostrador.
        brunilda: [4, 4], ciro: [4, 4], nayra: [4, 4], gualterio: [4, 4],
      },
      customer: [5, 7], // el cliente, delante del mostrador
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

/**
 * Ciudades ilustradas (ciudad.<id>.png, 1280×720): la ciudad entera es una sola imagen y encima van los nombres y las
 * zonas tocables de cada lugar. Por defecto van donde dice el mapa del lugar (map.x, map.y, como en el plano que se
 * adjunta al pedido); si en la ilustración un edificio quedó corrido, acá se marca dónde está (el centro del edificio).
 */
export const CITY_PLACES: Record<string, Record<string, Pt>> = {};
