import type { StatusId } from '../combat/types';
import type { Affinity } from '../types';

// Magia de los objetos: habilidades activas, grimorios y alquimia. Todo se define en datos.

/** Habilidad activa que lleva un objeto. Sus usos y enfriamiento dependen de cómo se fabricó. */
export interface ItemAbility {
  /** Acción de combate (id en `skills`). */
  skill: string;
  /** Encantamiento que la dio. */
  source: string;
  /** Usos por combate. */
  uses: number;
  /** Turnos de enfriamiento entre usos. */
  cooldown: number;
  /** Multiplicador de potencia (runa bien grabada, afinidad del arma...). */
  power: number;
}

/** Libro que enseña encantamientos para siempre y puede revelar combinaciones secretas. */
export interface GrimoireDef {
  id: string;
  name: string;
  tier: number;
  teaches: string[];
  reveals?: string[];
  price: number;
  description: string;
}

// ───────────────────────── Alquimia ─────────────────────────

export const ALCHEMY_PROPS = [
  'curacion', 'antidoto', 'vigor', 'proteccion', 'celeridad', 'humo',
  'fuego', 'hielo', 'rayo', 'sagrado', 'veneno',
] as const;
export type AlchemyProp = (typeof ALCHEMY_PROPS)[number];
export type AlchemyProps = Partial<Record<AlchemyProp, number>>;

export type PotionEffect =
  | { type: 'curar'; pct: number }
  | { type: 'limpiar' }
  | { type: 'estado'; status: StatusId; turns: number }
  | { type: 'resguardo'; element: Affinity; turns: number }
  | { type: 'huida' };

/**
 * Receta de alquimia. La mezcla de ingredientes suma propiedades; la receta encaja si cumple sus mínimos.
 * Puede dar una poción o un material (líquidos de temple, esencias para grimorios).
 */
export interface PotionDef {
  id: string;
  name: string;
  secret: boolean;
  requires: AlchemyProps;
  /** Si varias recetas encajan, gana la de mayor prioridad. */
  priority: number;
  /** Propiedad principal: define la potencia. */
  main: AlchemyProp;
  output: { kind: 'pocion'; effect: PotionEffect } | { kind: 'material'; material: string };
  /** Unidades por tanda. */
  qty: number;
  value: number;
  color: string;
  description: string;
}

/** Datos de una poción en el inventario. */
export interface PotionData {
  recipe: string;
  potency: number;
}
