import type { Look } from '../party/types';
import type { ItemCategory } from '../types';

// Personal de la herrería: la gente que trabaja sola mientras el herrero no está.
// Pueden trabajar los esclavos (comprados o liberados) y los empleados que se contratan en el tablón de cada ciudad.
// Los mercenarios solo pelean.

/** Oficios: cada persona tiene un nivel en cada uno, que sube trabajando. */
export const OFICIOS = ['ventas', 'criterio', 'forja'] as const;
export type Oficio = (typeof OFICIOS)[number];
export const OFICIO_NAMES: Record<Oficio, string> = { ventas: 'Ventas', criterio: 'Criterio', forja: 'Forja' };

/** Puestos de trabajo. Cada persona ocupa uno. */
export const STAFF_ROLES = ['vendedor', 'encargado', 'aprendiz'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export const ROLE_NAMES: Record<StaffRole, string> = { vendedor: 'Vendedor', encargado: 'Encargado', aprendiz: 'Aprendiz de forja' };
/** El oficio que usa (y entrena) cada puesto. */
export const ROLE_OFICIO: Record<StaffRole, Oficio> = { vendedor: 'ventas', encargado: 'criterio', aprendiz: 'forja' };

/** Lo que cambia un rasgo de trabajo. Los porcentajes van en puntos (6 = +6%). */
export interface WorkEffect {
  /** Vendedor: cobra este % más de lo que pagaría el cliente. */
  precio?: number;
  /** Vendedor: clientes de más por franja. */
  clientes?: number;
  /** Aprendiz: calidad inicial de más en todas las piezas, o solo en algunas categorías. */
  calidad?: number;
  calidadEn?: { categories: ItemCategory[]; value: number };
  /** Aprendiz: % más de unidades por lote (flechas, arrojadizos). */
  lote?: number;
  /** Aprendiz: chance de defecto por golpe (positivo = más defectos). */
  defecto?: number;
  /** Aprendiz: chance de que una pieza no gaste sus materiales. */
  ahorro?: number;
  /** Encargado: niveles de criterio de más al elegir qué exhibir. */
  vidriera?: number;
  /** Rinde este % más (o menos) en una franja, o en todas. */
  manana?: number;
  tarde?: number;
  rinde?: number;
  /** Trabaja también de noche (a la mitad). */
  noche?: boolean;
  /** % más de experiencia en todos los oficios. */
  aprende?: number;
}

/** Rasgo de trabajo: de nacimiento (los empleados traen 1 o 2) o aprendido al subir de nivel en un oficio. */
export interface WorkTraitDef {
  id: string;
  name: string;
  description: string;
  /** Oficio al que pertenece (se aprende al subir en ese oficio); 'general' solo viene de nacimiento. */
  oficio: Oficio | 'general';
  /** Defecto: nunca se ofrece para aprender. */
  negative?: boolean;
  effect: WorkEffect;
}

/** Empleado que se contrata en el tablón (datos). Su id coincide con el de su NPC. */
export interface WorkerDef {
  id: string;
  name: string;
  /** Cómo se lo presenta ("Vendedora de mercado"). */
  title: string;
  look: Look;
  quote: string;
  description: string;
  /** Sueldo por día y lo que cuesta contratarlo (el primer pago). */
  wage: number;
  hireCost: number;
  /** Nivel con el que llega a cada oficio. */
  oficios: Record<Oficio, number>;
  /** Rasgos de nacimiento. */
  traits: string[];
}

/** Progreso de alguien que trabaja (empleado o esclavo): experiencia por oficio, rasgos y elecciones pendientes. */
export interface WorkerProgress {
  xp: Record<Oficio, number>;
  traits: string[];
  /** Rasgos para elegir (uno de cada grupo), ganados al subir de nivel. */
  picks: string[][];
  /** Empleados: días seguidos sin cobrar. */
  unpaidDays?: number;
}

/** Alguien trabajando en una herrería. */
export interface StaffMember {
  id: string;
  role: StaffRole;
  /** Aprendiz: la pieza en curso (de qué pedido) y cuánto trabajo lleva, en franjas. */
  piece?: { order: string; work: number; free?: boolean };
}

/** Pedido de trabajo para el aprendiz: repetir una pieza (plano y materiales) hasta hacer `qty`. */
export interface WorkOrder {
  id: string;
  name: string;
  blueprintId: string;
  materials: Record<string, string>;
  qty: number;
  done: number;
}

/** Lo que pasó en la herrería mientras el herrero no estuvo. */
export interface StaffReport {
  sold: number;
  earned: number;
  made: Record<string, number>;
  ruined: number;
  exhibited: number;
  notes: string[];
}

export interface ShopStaff {
  staff: StaffMember[];
  orders: WorkOrder[];
  report: StaffReport;
}

export interface StaffState {
  /** Personal de cada tienda, por id de lugar: la herrería y las sucursales. */
  shops: Record<string, ShopStaff>;
  /** Progreso de todos los que trabajaron alguna vez. */
  workers: Record<string, WorkerProgress>;
  /** Empleados contratados (siguen contratados aunque cambien de puesto). */
  hired: string[];
  /** Candidatos del tablón de cada ciudad. */
  market: Record<string, { offer: string[]; lastRefresh: number }>;
  /** Planos que el herrero ya forjó alguna vez (el aprendiz solo repite esos). */
  forged: string[];
  /** Sucursales compradas (ids de lugar). */
  branches: string[];
}
