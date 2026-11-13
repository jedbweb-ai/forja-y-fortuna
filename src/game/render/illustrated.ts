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
  // La herrería se está volviendo a pedir en vista isométrica y con la calle de afuera: cuando llegue la imagen, se marca
  // acá (la primera prueba salió de frente y se descartó).
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
