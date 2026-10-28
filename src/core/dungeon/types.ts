import type { Biome } from '../combat/types';
import type { ChestLoot, ZoneDef } from '../world/types';

// Mazmorras (Fase 5): pisos armados con piezas hechas a mano y combinadas al azar,
// niebla, secretos, trampas, jefes y descansos entre pisos.

/**
 * Sala de 7×7 dibujada a mano. Caracteres:
 * '#' pared, '.' piso, ',' escombros (como hierba alta), 'R' columna o roca (bloquea), 'w' agua (bloquea),
 * 'm' lugar de monstruos, 'c' cofre, 'v' veta, 'g' depósito de gemas, 'h' hongos u hierbas,
 * 'B' guarida del jefe. Las puertas se abren solas en el medio de cada lado.
 */
export interface RoomPiece {
  id: string;
  /** 'sala' normal, 'jefe' para el último piso, 'tesoro' para salas secretas o cerradas. */
  kind: 'sala' | 'jefe' | 'tesoro';
  /** Mazmorras donde se usa (sin definir = todas). */
  dungeons?: string[];
  rows: string[];
}

/** Acertijo de una inscripción: tres respuestas, una correcta. */
export interface RiddleDef {
  id: string;
  text: string;
  options: string[];
  answer: number;
  /** Lo que da acertar (además de oro): revela una combinación o deja materiales. */
  reward: { gold?: number; synergy?: string; materials?: { id: string; qty: number }[] };
}

export type TrapKind = 'dardos' | 'alarma';

export interface TrapDef {
  kind: TrapKind;
  name: string;
  /** Dardos: fracción de la vida de cada miembro (nunca mata). */
  damagePct?: number;
  text: string;
}

/** Tesoro único: sale una sola vez por partida (plano, grimorio, combinación o material legendario). */
export interface DungeonUnique {
  id: string;
  kind: 'blueprint' | 'grimoire' | 'synergy' | 'material';
  ref: string;
  qty?: number;
  /** Piso desde el que puede salir (1 = el primero). */
  minFloor: number;
}

export interface DungeonDef {
  id: string;
  name: string;
  description: string;
  danger: number;
  floors: number;
  travelSlots: number;
  world: { x: number; y: number };
  /** Cómo se descubre: una marca de historia o reputación mínima. */
  unlock: { flag?: string; reputationMin?: number; hint: string };
  /** Región donde está escondida su entrada (casilla 'P'); pisarla activa la marca de `unlock`. */
  entrance?: string;
  /** Arenas de combate que usa, y la arena del jefe (por id). */
  biome: Biome;
  bossArena: string;
  /** Salas por piso: columnas × filas de la grilla de salas. */
  grid: [number, number];
  /** Monstruos, vetas y gemas por piso (índice 0 = primer piso; si faltan, se repite el último). */
  depth: ZoneDef[];
  /** Cofres normales y de salas secretas, por piso. */
  loot: ChestLoot[];
  secretLoot: ChestLoot;
  uniques: DungeonUnique[];
  boss: { monsters: string[]; respawnDays: number; name: string };
  riddles: string[];
  /** Trampas por piso (pocas). */
  traps: [number, number];
  look: { floor: string; wall: string; tint: number };
}

/** Piso generado: se guarda tal cual en la partida (las puertas abiertas y secretos hallados lo modifican). */
export interface DungeonFloor {
  terrain: string[];
  heights: string[];
  /** Sala de cada casilla (letra) o '-' si es pasillo o pared. */
  rooms: string[];
  /** Casillas vistas: '1' sí, '0' no. */
  seen: string[];
  /** Palanca → reja que abre. */
  levers: { x: number; y: number; gate: { x: number; y: number }; pulled: boolean }[];
  riddles: { x: number; y: number; id: string; solved: boolean }[];
  traps: { x: number; y: number; kind: TrapKind }[];
}

/** Recorrida en curso por una mazmorra (vive dentro de la expedición). */
export interface DungeonRun {
  id: string;
  /** Piso actual (1 = el primero). */
  floor: number;
  map: DungeonFloor;
  keys: number;
  /** Parado en la escalera: elegir entre bajar o volver. */
  landing: boolean;
  /** El jefe de esta recorrida ya cayó. */
  bossDown: boolean;
  /** Acertijo abierto en pantalla. */
  riddle: string | null;
}

/** Lo que la partida recuerda de cada mazmorra. */
export interface DungeonProgress {
  /** Día en que cayó el jefe por última vez (0 = nunca). */
  bossDay: number;
  clears: number;
  deepest: number;
}

export interface DungeonsState {
  progress: Record<string, DungeonProgress>;
  /** Tesoros únicos que ya salieron. */
  uniques: string[];
}
