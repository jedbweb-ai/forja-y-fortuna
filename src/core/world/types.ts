import type { Biome, CombatReport, CombatState } from '../combat/types';

// ───────────────────────── Datos de regiones ─────────────────────────

export interface NodeOption {
  material: string;
  weight: number;
  /** Nivel de herramienta necesario. */
  tier: number;
  qty: [number, number];
  /** Solo se puede recolectar de noche. */
  night?: boolean;
}

export interface ZoneDef {
  id: string;
  name: string;
  danger: number;
  biome: Biome;
  /** Presupuesto de amenaza de los grupos (de día). */
  budget: [number, number];
  groups: [number, number];
  /** Peso de cada familia de monstruos en la zona. */
  families: Record<string, number>;
  vetas: NodeOption[];
  arboles: NodeOption[];
  /** Se cortan con hoz. */
  hierbas?: NodeOption[];
  /** Depósitos de gemas (pico). */
  gemas?: NodeOption[];
  /** Qué puede haber en los cofres de la zona. */
  cofres?: ChestLoot;
}

export interface ChestLoot {
  gold: [number, number];
  materials: { material: string; chance: number; qty: [number, number] }[];
  grimoires: { id: string; chance: number }[];
}

/**
 * Región explorable. `terrain` es una grilla de texto:
 * '.' pasto, ',' pasto alto, '=' camino, 'T' árbol (bloquea), 'R' roca (bloquea), 'w' agua (bloquea),
 * 'v' lugar de veta, 't' árbol talable, 'h' hierbas, 'g' depósito de gemas, 'c' cofre,
 * 'm' lugar de monstruos, 'B' guarida del jefe, 'E' entrada.
 * `heights`: un dígito de altura por casilla. `zones`: un dígito por casilla que indica la zona (índice + 1).
 */
export interface RegionDef {
  id: string;
  name: string;
  description: string;
  danger: number;
  available: boolean;
  travelSlots: number;
  world: { x: number; y: number };
  terrain: string[];
  heights: string[];
  zones: string[];
  zoneDefs: ZoneDef[];
  boss?: { monsters: string[]; zone: number };
}

// ───────────────────────── Estado de expedición ─────────────────────────

export interface ResourceNode {
  id: string;
  x: number;
  y: number;
  kind: 'veta' | 'arbol' | 'hierba' | 'gema' | 'cofre';
  material: string;
  tier: number;
  qty: [number, number];
  uses: number;
  night?: boolean;
}

export interface MonsterGroup {
  id: string;
  x: number;
  y: number;
  zone: number;
  monsters: string[];
  threat: number;
  boss?: boolean;
  /** Supera el presupuesto de la zona a propósito: desafío opcional. */
  challenge?: boolean;
  /** Persigue al grupo si está cerca. */
  aggressive: boolean;
  /** Pasos durante los que no ataca (después de una huida). */
  calm?: number;
}

export interface ExpeditionState {
  regionId: string;
  pos: { x: number; y: number };
  energy: number;
  maxEnergy: number;
  /** Energía gastada desde la última franja. */
  spent: number;
  bag: Record<string, number>;
  capacity: number;
  nodes: ResourceNode[];
  groups: MonsterGroup[];
  /** Personajes que participan (los heridos se quedan en la ciudad). */
  members: string[];
  combat: CombatState | null;
  report: CombatReport | null;
  nightSpawned: boolean;
  nextId: number;
}

/** Noticia del día que mueve stock y precios de ciertas partes de monstruo. */
export interface MarketEventDef {
  id: string;
  text: string;
  weight: number;
  /** Materiales afectados (ids) o familias de monstruo (tags del material). */
  materials?: string[];
  tags?: string[];
  priceMult: number;
  stockMult: number;
}

/** Estado del mercado de partes de monstruo: cambia cada día. */
export interface MarketState {
  day: number;
  stock: Record<string, number>;
  priceMult: Record<string, number>;
  news: string[];
}
