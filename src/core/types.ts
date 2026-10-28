// Tipos compartidos del núcleo del juego. Sin dependencias visuales.
import type { CombatFx } from './combat/types';
import type { Character, WeaponKind } from './party/types';
import type { ExpeditionState, MarketState } from './world/types';

export const AFFINITIES = ['fuego', 'hielo', 'rayo', 'agua', 'tierra', 'viento', 'sagrado', 'oscuro', 'veneno'] as const;
export type Affinity = (typeof AFFINITIES)[number];
export type Affinities = Partial<Record<Affinity, number>>;

export const STAT_KEYS = ['atk', 'def', 'spd', 'wgt', 'dur'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;
export type PartialStats = Partial<Stats>;

export const SLOTS = ['mañana', 'tarde', 'noche'] as const;
export type TimeSlot = (typeof SLOTS)[number];

export const RARITIES = ['común', 'poco común', 'raro', 'épico', 'legendario'] as const;
export type Rarity = (typeof RARITIES)[number];

export type MaterialType = 'metal' | 'madera' | 'cuero' | 'fibra' | 'gema' | 'monstruo' | 'especial';

export type ItemCategory =
  | 'arma'        // cuerpo a cuerpo
  | 'distancia'   // arcos, ballestas
  | 'municion'
  | 'arrojadizo'
  | 'escudo'
  | 'armadura'
  | 'joyeria'
  | 'herramienta'
  | 'pocion';

export type Station = 'yunque' | 'flecheria' | 'joyeria' | 'runas' | 'alquimia';

// ───────────────────────── Contenido (data-driven) ─────────────────────────

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  tier: number;
  stats: PartialStats;
  affinities?: Affinities;
  tags?: string[];
  price: number;
  /** Color placeholder para el aspecto visual del objeto. */
  color: string;
  description: string;
}

export interface BlueprintPart {
  slot: string;
  label: string;
  types: MaterialType[];
  /** Materiales puntuales permitidos además de los tipos (ej. colmillo como hoja). */
  extra?: string[];
  /** Peso relativo de la parte en los stats finales (las partes suman ~1). */
  weight: number;
  qty: number;
}

export interface Blueprint {
  id: string;
  name: string;
  category: ItemCategory;
  station: Station;
  /** Franjas de tiempo que consume fabricarlo. */
  slots: number;
  /** Unidades por lote (munición, arrojadizos). Sin definir = pieza única. */
  batch?: number;
  parts: BlueprintPart[];
  base: PartialStats;
  /** Cuánto pesa cada stat de los materiales en este tipo de objeto. */
  scale: PartialStats;
  quench: boolean;
  grip: boolean;
  engrave: boolean;
  /** Tags que hereda el objeto (cortante, contundente, perforante...). */
  tags: string[];
  /** Tipo de arma en combate (define sus acciones). */
  weaponKind?: WeaponKind;
  /** Ocupa las dos manos: no se puede usar con escudo. */
  twoHanded?: boolean;
  description: string;
}

export type SynergyCondition =
  | { kind: 'materials'; all: string[] }
  | { kind: 'anyMaterial'; any: string[] }
  | { kind: 'materialInSlot'; material: string | string[]; slot: string }
  | { kind: 'tags'; all: string[] }
  /** Al menos N materiales distintos comparten una afinidad. */
  | { kind: 'sameAffinity'; minParts: number }
  | { kind: 'opposedAffinities' }
  | { kind: 'category'; in: ItemCategory[] }
  | { kind: 'blueprint'; in: string[] }
  | { kind: 'pureMetal'; minParts: number };

export interface Effect {
  /** Multiplicadores porcentuales: { atk: 15 } = +15% de ataque. */
  statPct?: PartialStats;
  affinity?: Affinities;
  /** Rasgo garantizado. */
  trait?: string;
  /** Suma riesgo de defecto (y potencia). */
  instability?: number;
  valuePct?: number;
  /** Tags que se suman al objeto (los clientes los buscan). */
  addTags?: string[];
}

export interface Synergy {
  id: string;
  name: string;
  secret: boolean;
  when: SynergyCondition[];
  effect: Effect;
  /** Texto para el libro del herrero. */
  description: string;
  hint: string;
  /** Si es genérica, la afinidad potenciada se calcula en tiempo de ejecución. */
  dynamicAffinity?: boolean;
}

export interface Trait {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  categories: ItemCategory[];
  effect: Effect;
  /** Efecto de combate (se usa a partir de la Fase 2). */
  combat?: Record<string, number | string>;
  description: string;
  /** Solo se obtiene por sinergia, no al azar en el forjado. */
  synergyOnly?: boolean;
}

export interface QuenchMedium {
  id: string;
  name: string;
  cost: { gold?: number; material?: string; qty?: number };
  effect: Effect;
  /** Positivo = más dureza (ataque/defensa), negativo = más flexibilidad (durabilidad, velocidad). */
  hardness: number;
  description: string;
}

export interface FinishOption {
  id: string;
  name: string;
  kind: 'grip' | 'polish' | 'engraving';
  cost: { gold?: number; material?: string; qty?: number };
  effect: Effect;
  /** Calidad final que suma (pulido). */
  quality?: number;
  /** Valoración estética: nobles y coleccionistas la aprecian. */
  beauty?: number;
  description: string;
}

export interface Enchantment {
  id: string;
  name: string;
  source: 'runa' | 'grimorio';
  kind: 'pasiva' | 'activa';
  categories: ItemCategory[];
  cost: { material: string; qty: number }[];
  effect: Effect;
  combat?: Record<string, number | string>;
  description: string;
}

export interface CustomerType {
  id: string;
  name: string;
  /** Peso de aparición por franja. */
  appearance: Record<TimeSlot, number>;
  minReputation: number;
  budget: [number, number];
  wants: Partial<Record<ItemCategory, number>>;
  prefStats: PartialStats;
  likesTags?: string[];
  likesAffinities?: Affinity[];
  minQuality: number;
  /** Cuánto valoran grabados y belleza (0..1). */
  beautyLove: number;
  /** Rondas de regateo que aguantan. */
  patience: number;
  /** Multiplicador sobre el valor del objeto que están dispuestos a pagar. */
  generosity: number;
  /** Si compran consumibles, rango de unidades. */
  bulk?: [number, number];
  lines: { greet: string[]; noItem: string[]; happy: string[]; angry: string[] };
}

// ───────────────────────── Diálogos y NPCs ─────────────────────────

export type Condition =
  | { type: 'gold'; min: number }
  | { type: 'flag'; flag: string; equals?: boolean | number | string; not?: boolean }
  | { type: 'relationMin'; npc: string; value: number }
  | { type: 'relationMax'; npc: string; value: number }
  | { type: 'slot'; in: TimeSlot[] }
  | { type: 'hasMaterial'; id: string; qty: number }
  | { type: 'discovered'; synergy: string; not?: boolean }
  | { type: 'dayMin'; value: number }
  | { type: 'itemsForgedMin'; value: number };

export type DialogueEffect =
  | { type: 'relation'; npc: string; delta: number }
  | { type: 'gold'; delta: number }
  | { type: 'flag'; flag: string; value: boolean | number | string }
  | { type: 'giveMaterial'; id: string; qty: number }
  | { type: 'takeMaterial'; id: string; qty: number }
  | { type: 'discoverSynergy'; id: string }
  | { type: 'reputation'; delta: number };

export interface DialogueOption {
  text: string;
  conditions?: Condition[];
  effects?: DialogueEffect[];
  /** Nodo siguiente. Sin definir = termina la conversación. */
  next?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string; // id de NPC o 'player'
  text: string;
  effects?: DialogueEffect[];
  options?: DialogueOption[];
  next?: string;
}

export interface Dialogue {
  id: string;
  npc: string;
  /** Mayor prioridad se elige primero si sus condiciones se cumplen. */
  priority: number;
  conditions?: Condition[];
  /** Solo se puede ver una vez. */
  once?: boolean;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export type GiftTaste = 'ama' | 'gusta' | 'indiferente' | 'disgusta';

export interface Npc {
  id: string;
  name: string;
  role: string;
  city: string;
  location: string;
  personality: string[];
  /** Gustos por id de material, categoría de objeto o tag. */
  gifts: Partial<Record<GiftTaste, string[]>>;
  routine: Partial<Record<TimeSlot, string>>;
  /** Desbloqueos por nivel de relación (sistema completo en Fase 4). */
  unlocks?: { level: RelationLevel; description: string }[];
  look: { body: number; hair: number; accent: number };
  /** Frases cuando ya se habló con el NPC hoy (límite diario de interacciones). */
  busyLines: string[];
  description: string;
}

export const RELATION_LEVELS = ['hostil', 'desconfiado', 'neutral', 'conocido', 'amigo', 'aliado'] as const;
export type RelationLevel = (typeof RELATION_LEVELS)[number];

// ───────────────────────── Ciudad ─────────────────────────

export type LocationKind =
  | 'herreria' | 'mercado' | 'taberna' | 'alquimista' | 'curtidor' | 'maderero'
  | 'joyero' | 'libreria' | 'gremio' | 'tablon' | 'subastas' | 'esclavos';

export interface ScenePropDef {
  key: string;
  x: number;
  y: number;
  blocks?: boolean;
}

export interface HotspotDef {
  id: string;
  label: string;
  x: number;
  y: number;
  action: 'forge' | 'shop' | 'market' | 'npc' | 'inventory' | 'book';
  npc?: string;
}

export interface LiveSceneDef {
  cols: number;
  rows: number;
  floor: string;
  /** Filas de calle (pasan carretas). */
  roadRow?: number;
  props: ScenePropDef[];
  spawn: { x: number; y: number };
  doors: { x: number; y: number }[];
  hotspots: HotspotDef[];
  /** Dónde se para cada NPC con nombre cuando su rutina lo trae a este lugar. */
  npcSpots: Record<string, { x: number; y: number }>;
  ambient: Record<TimeSlot, number>;
  carts: boolean;
  animals: string[];
}

export interface CityLocation {
  id: string;
  name: string;
  kind: LocationKind;
  available: boolean;
  map: { x: number; y: number; w: number; h: number; roof: string };
  scene?: LiveSceneDef;
  /** Materiales que se venden en este lugar. */
  stock?: string[];
  description: string;
}

export interface City {
  id: string;
  name: string;
  description: string;
  locations: CityLocation[];
}

// ───────────────────────── Estado de partida ─────────────────────────

export interface ItemInstance {
  uid: string;
  blueprintId: string;
  name: string;
  category: ItemCategory;
  materials: Record<string, string>; // slot -> materialId
  stats: Stats;
  affinities: Affinities;
  quality: number;
  defects: number;
  traits: string[];
  synergies: string[];
  quench?: string;
  finish: string[];
  enchantments: string[];
  rarity: Rarity;
  tags: string[];
  beauty: number;
  durability: number;
  maxDurability: number;
  /** Valor base por unidad. */
  value: number;
  quantity: number;
  exhibited: boolean;
  createdDay: number;
  color: string;
  /** Personaje que lo tiene equipado (no se puede vender ni exhibir). */
  equippedBy?: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  blueprintId: string;
  materials: Record<string, string>;
}

export interface ForgeSession {
  blueprintId: string;
  materials: Record<string, string>;
  stage: 'forging' | 'quench' | 'finish' | 'enchant';
  hits: number;
  quality: number;
  defects: number;
  lastHit?: 'bueno' | 'perfecto' | 'defecto';
  traits: string[];
  quench?: string;
  finish: string[];
  /** Instabilidad aportada por sinergias (riesgo extra). */
  instability: number;
}

export interface ShopCustomer {
  id: string;
  typeId: string;
  name: string;
  budget: number;
  look: { body: number; hair: number; accent: number };
}

export interface ShopNegotiation {
  itemUid: string;
  qty: number;
  maxPrice: number;
  opening: number;
  patience: number;
  rounds: number;
  lastOffer: number;
  asked?: number;
}

export interface ShopSession {
  customers: ShopCustomer[];
  index: number;
  negotiation: ShopNegotiation | null;
  /** Mensaje actual del cliente. */
  line: string;
  status: 'greeting' | 'negotiating' | 'resolved';
  sold: { itemName: string; qty: number; price: number; customer: string }[];
  earned: number;
}

export interface NpcState {
  relation: number;
  lastTalkDay: number;
  seenDialogues: string[];
}

export type SkillId =
  | 'herreria' | 'armeria' | 'flecheria' | 'comercio' | 'runas'
  | 'combate' | 'mineria' | 'tala' | 'desuello';

export interface GameSettings {
  skipItemCard: boolean;
  fullscreenOnStart: boolean;
}

export interface GameState {
  rngState: number;
  day: number;
  slot: number; // índice en SLOTS
  /** El herrero salió a recorrer la ciudad durante la franja actual. */
  outing: boolean;
  location: string;
  gold: number;
  reputation: Record<string, number>;
  materials: Record<string, number>;
  items: ItemInstance[];
  discoveredSynergies: string[];
  designs: SavedDesign[];
  knownBlueprints: string[];
  knownEnchantments: string[];
  skills: Record<SkillId, number>; // xp
  npcs: Record<string, NpcState>;
  flags: Record<string, boolean | number | string>;
  forge: ForgeSession | null;
  shop: ShopSession | null;
  /** Todos los personajes conocidos (herrero y mercenarios contratados alguna vez). */
  characters: Record<string, Character>;
  /** Grupo actual: el herrero primero. Máximo BALANCE.MAX_PARTY_SIZE. */
  party: string[];
  expedition: ExpeditionState | null;
  market: MarketState | null;
  stats: { itemsForged: number; itemsRuined: number; goldEarned: number; itemsSold: number };
  settings: GameSettings;
  nextUid: number;
}

/** Eventos que emiten los comandos para que la UI y las escenas reaccionen. */
export type GameEvent =
  | { type: 'toast'; text: string; tone?: 'info' | 'good' | 'bad' }
  | { type: 'itemCreated'; item: ItemInstance; newSynergies: string[] }
  | { type: 'forgeHit'; result: 'bueno' | 'perfecto' | 'defecto' }
  | { type: 'forgeRuined'; name: string }
  | { type: 'timeAdvanced'; day: number; slot: number; newDay: boolean }
  | { type: 'locationChanged'; location: string }
  | { type: 'shopClosed'; earned: number; sold: number }
  | { type: 'synergyDiscovered'; id: string }
  | { type: 'gameLoaded' }
  | { type: 'expeditionStarted' }
  | { type: 'expeditionEnded'; outcome: 'return' | 'defeat' }
  | { type: 'expMoved'; path: { x: number; y: number }[] }
  | { type: 'gathered'; nodeId: string; material: string; qty: number }
  | { type: 'combatStarted' }
  | { type: 'combatFx'; fx: CombatFx[] }
  | { type: 'combatEnded'; outcome: 'victory' | 'defeat' | 'fled' };
