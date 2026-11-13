import type { Biome, CombatReport, CombatState } from '../combat/types';
import type { DungeonRun } from '../dungeon/types';
import type { SkillId } from '../types';

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
  /** Nivel mínimo de los monstruos que salen (en las zonas profundas no aparecen los más débiles de la familia). */
  minTier?: number;
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
 * 'm' lugar de monstruos, 'B' guarida del jefe, 'E' entrada, 'P' entrada escondida a una mazmorra.
 * En los pisos de mazmorra además: 'S' escalera, 'F' pared falsa, 'G' reja, 'L' palanca, 'D' puerta cerrada,
 * 'k' llave, 'I' inscripción, 'R' columna. Etapa 3: 'q' lugar de evento, 'a' campamento.
 * `heights`: un dígito de altura por casilla. `zones`: un dígito por casilla que indica la zona (índice + 1).
 */
export interface RegionDef {
  id: string;
  /** No aparece en el mapa del mundo (el camino entre ciudades). */
  hidden?: boolean;
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
  /** Suelo de cada zona en el mapa de exploración (si no, el del valle). */
  zoneTiles?: string[];
  /** Qué se dibuja en las casillas de roca ('R') del mapa de exploración (si no, rocas). */
  wallProp?: string;
  /** Arena donde se pelea contra el jefe (si no, la del campamento). */
  bossArena?: string;
  boss?: { monsters: string[]; zone: number };
  /** Regiones de nivel alto: se ven en el mapa pero se abren con reputación en la ciudad de la herrería o al vencer a un jefe. */
  unlock?: { reputationMin?: number; bossOf?: string; hint: string };
}

// ───────────────────────── Estado de expedición ─────────────────────────

export interface ResourceNode {
  id: string;
  x: number;
  y: number;
  kind: 'veta' | 'arbol' | 'hierba' | 'gema' | 'cofre' | 'llave' | 'evento' | 'campamento';
  /** En los lugares de evento: cuál es (id de ExpEventDef). */
  event?: string;
  material: string;
  tier: number;
  qty: [number, number];
  uses: number;
  night?: boolean;
  /** Cofre de una sala de tesoro de mazmorra (botín secreto). */
  secret?: boolean;
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
  /** Hubo al menos una huida en esta salida (los compañeros hostiles pueden aprovecharla). */
  fled?: boolean;
  /** Recorrida por una mazmorra (si la expedición es en una). */
  dungeon?: DungeonRun;
  /** Lugar al que se vuelve al terminar (la herrería o la posada de otra ciudad). */
  home?: string;
  /** Encuentro en el camino entre ciudades: al terminar el combate se sigue viaje. */
  travel?: { to: string; slotsLeft: number };
  nextId: number;
  /** Evento abierto: se espera la elección (y después se muestra el resultado). */
  event?: ActiveEvent | null;
  /** Formato A: el recorrido por paradas (si no está, se camina por el mapa: formato B). */
  route?: RouteState;
  /** Formato B: casillas ya vistas del mapa de la región, una fila de '0'/'1' por fila del mapa. */
  fog?: string[];
}

// ───────────────────────── Eventos de expedición ─────────────────────────

/** Lo que puede pasar al elegir una opción de un evento. */
export type ExpEffect =
  | { kind: 'gold'; amount: [number, number] }
  | { kind: 'material'; material: string; qty: [number, number] }
  /** Un material de la zona: de sus vetas, árboles, hierbas, gemas o de lo que guardan sus cofres. */
  | { kind: 'zoneMaterial'; pool: 'vetas' | 'arboles' | 'hierbas' | 'gemas' | 'cofre'; qty: [number, number] }
  | { kind: 'energy'; amount: number }
  /** Cura (o lastima, si es negativo) a todo el grupo: fracción de la vida máxima. */
  | { kind: 'health'; pct: number }
  /** Sale una pelea con un grupo de la zona (presupuesto × mult). */
  | { kind: 'fight'; budgetMult: number }
  /** Uno de los grimorios que guardan los cofres de la zona, si queda alguno por conseguir. */
  | { kind: 'grimoire' }
  | { kind: 'xp'; skill: SkillId; amount: number }
  | { kind: 'time'; slots: number };

export interface ExpEventOutcome {
  weight: number;
  text: string;
  effects: ExpEffect[];
}

export interface ExpEventOption {
  text: string;
  /** Lo que cuesta elegirla (se paga) o lo que pide saber (oficio a cierto nivel). */
  requires?: { gold?: number; material?: { id: string; qty: number }; skill?: { id: SkillId; level: number } };
  outcomes: ExpEventOutcome[];
}

export interface ExpEventDef {
  id: string;
  title: string;
  text: string;
  /** Biomas donde puede salir (si no, en todos). */
  biomes?: Biome[];
  /** Peligro mínimo de la zona. */
  minDanger?: number;
  weight: number;
  options: ExpEventOption[];
}

export interface ActiveEvent {
  id: string;
  /** Lugar del evento (se saca del mapa al resolverlo). */
  nodeId: string;
  zone: number;
  /** Texto del resultado, cuando ya se eligió. */
  result?: string;
}

// ───────────────────────── Formato A: rutas ─────────────────────────

export type RouteStopKind = 'entrada' | 'recurso' | 'monstruos' | 'desafio' | 'evento' | 'cofre' | 'campamento' | 'hallazgo' | 'jefe';

/** Una parada del recorrido. `ref`: el lugar (ResourceNode) o el grupo de monstruos que hay ahí. */
export interface RouteStop {
  id: string;
  col: number;
  row: number;
  kind: RouteStopKind;
  zone: number;
  /** Paradas de la columna siguiente a las que se puede seguir. */
  links: string[];
  ref?: string;
  visited?: boolean;
}

export interface RouteState {
  stops: RouteStop[];
  /** Parada donde está el grupo. */
  at: string;
  cols: number;
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
