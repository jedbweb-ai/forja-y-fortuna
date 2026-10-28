import type { DamageType, Look, WeaponKind } from '../party/types';
import type { Affinities, Affinity, TimeSlot } from '../types';

// ───────────────────────── Datos ─────────────────────────

export type StatusId =
  | 'sangrado' | 'veneno' | 'quemadura' | 'aturdido' | 'ralentizado' | 'inmovilizado'
  | 'cubierto' | 'potenciado' | 'mojado' | 'corroido';

export type AiRole = 'bruto' | 'tirador' | 'sanador' | 'tanque' | 'manada' | 'embestidor' | 'gelatina' | 'jefe';

export interface SkillStatus {
  id: StatusId;
  chance: number;
  turns: number;
  power?: number;
}

/** Acción de combate. Las del grupo salen del tipo de arma o del escudo; las de monstruos, de sus datos. */
export interface CombatSkill {
  id: string;
  name: string;
  /** Distancia mínima y máxima (casillas, sin diagonales). 0 = uno mismo. */
  range: [number, number];
  target: 'enemy' | 'ally' | 'self';
  area?: 'single' | 'adjacent';
  /** Multiplicador sobre el ataque. 0 = no hace daño. */
  power: number;
  damageType?: DamageType;
  element?: Affinity;
  cooldown: number;
  /** Consume munición (flechas). */
  ammo?: boolean;
  critBonus?: number;
  /** Multiplicador extra si se ataca de costado o por la espalda. */
  flankPower?: number;
  statuses?: SkillStatus[];
  /** Empuja al objetivo N casillas. */
  push?: number;
  /** Cura un % de la vida máxima del objetivo. */
  healPct?: number;
  /** Embiste en línea recta hasta N casillas antes de golpear. */
  charge?: number;
  /** Desgasta la durabilidad de la armadura del objetivo. */
  wear?: number;
  description: string;
}

export interface LootEntry {
  material: string;
  chance: number;
  qty: [number, number];
  /** Se obtiene desollando: hace falta un cuchillo de desuello. */
  skin?: boolean;
  /** Si el monstruo muere por alguno de estos elementos o tipos de daño, el material se arruina. */
  spoiledBy?: (Affinity | DamageType)[];
}

export interface MonsterDef {
  id: string;
  name: string;
  family: string;
  tier: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  move: number;
  jump: number;
  evasion: number;
  damageType: DamageType;
  /** Multiplicador de daño recibido por tipo (1 = normal, <1 resiste, >1 débil). */
  resist: Partial<Record<DamageType, number>>;
  /** Multiplicador de daño elemental recibido. */
  elemental: Partial<Record<Affinity, number>>;
  affinities?: Affinities;
  immune?: StatusId[];
  skills: string[];
  ai: AiRole;
  threat: number;
  /** Franjas en las que aparece. */
  slots: TimeSlot[];
  rare?: boolean;
  boss?: boolean;
  /** Al bajar a la mitad de vida (una sola vez): invoca monstruos. */
  halfHp?: { summon: string[]; text: string };
  /** Persigue al grupo en el mapa de exploración. */
  aggressive?: boolean;
  loot: LootEntry[];
  sprite: { key: string; tint?: number; scale?: number };
  description: string;
}

export type Biome = 'pradera' | 'bosque' | 'colinas' | 'campamento';

/** Arena chica de combate. `terrain`: '.' suelo, ',' hierba alta, 'w' agua baja, '#' bloqueo. */
export interface ArenaDef {
  id: string;
  biome: Biome;
  terrain: string[];
  heights: string[];
  partySpawns: { x: number; y: number }[];
  enemySpawns: { x: number; y: number }[];
}

// ───────────────────────── Estado ─────────────────────────

export interface StatusEffect {
  id: StatusId;
  turns: number;
  power: number;
}

export type Dir = 0 | 1 | 2 | 3; // +x, +y, -x, -y

export interface CombatUnit {
  id: string;
  side: 'party' | 'enemy';
  name: string;
  charId?: string;
  monsterId?: string;
  sprite: { key: string; tint?: number; scale?: number };
  look?: Look;
  x: number;
  y: number;
  facing: Dir;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  move: number;
  jump: number;
  evasion: number;
  crit: number;
  damageType: DamageType;
  weaponKind?: WeaponKind;
  affinities: Affinities;
  resist: Partial<Record<DamageType, number>>;
  elemental: Partial<Record<Affinity, number>>;
  immune: StatusId[];
  /** Efectos de combate de rasgos y runas del equipo. */
  combat: Record<string, number>;
  skills: string[];
  cooldowns: Record<string, number>;
  statuses: StatusEffect[];
  ai?: AiRole;
  boss?: boolean;
  /** Lote de flechas que usa (uid del objeto). */
  ammoUid?: string;
  moved: boolean;
  acted: boolean;
  alive: boolean;
  killedBy?: { element?: Affinity; damageType?: DamageType };
}

export interface CombatState {
  arenaId: string;
  groupId: string;
  boss: boolean;
  units: CombatUnit[];
  round: number;
  order: string[];
  turnIndex: number;
  log: string[];
  outcome: 'victory' | 'defeat' | 'fled' | null;
  flags: Record<string, boolean>;
  /** Flechas usadas por lote, para recuperar parte al final. */
  ammoUsed: Record<string, number>;
  nextUnitId: number;
}

/** Resultado que se muestra al terminar un combate. */
export interface CombatReport {
  outcome: 'victory' | 'defeat' | 'fled';
  loot: Record<string, number>;
  lost: Record<string, number>;
  notes: string[];
  xp: number;
  levelUps: string[];
  injured: string[];
}

/** Lo que pasó en una acción, para animarlo en la escena. */
export type CombatFx =
  | { kind: 'move'; unit: string; path: { x: number; y: number }[] }
  | { kind: 'hit'; from: string; to: string; damage: number; crit: boolean; skill: string; element?: Affinity }
  | { kind: 'miss'; from: string; to: string; skill: string }
  | { kind: 'heal'; from: string; to: string; amount: number }
  | { kind: 'status'; unit: string; status: StatusId }
  | { kind: 'tick'; unit: string; damage: number; status: StatusId }
  | { kind: 'push'; unit: string; to: { x: number; y: number }; damage: number }
  | { kind: 'death'; unit: string }
  | { kind: 'spawn'; unit: string }
  | { kind: 'buff'; unit: string; skill: string };
