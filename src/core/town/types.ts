import type { Affinity, Condition, DialogueEffect, ItemCategory, ItemInstance, Rarity, StatKey } from '../types';

// Vida de la ciudad (Fase 4): relaciones con efectos, encargos, contratos, demanda,
// eventos, subasta y compañeros por lealtad. Todo se define en datos.

// ───────────────────────── Relaciones ─────────────────────────

/** Lo que da (o quita) un NPC al llegar a cierto nivel de relación. */
export type RelationPerk =
  /** Descuento al comprarle en su lugar. */
  | { kind: 'discount'; pct: number }
  /** Mercadería que solo te vende a vos. */
  | { kind: 'stock'; materials: string[] }
  /** Te enseña algo una sola vez al llegar al nivel. */
  | { kind: 'teach'; blueprint?: string; enchantment?: string; potion?: string; synergy?: string; grimoire?: string }
  /** Te cuenta rumores (aparecen en el tablón). */
  | { kind: 'rumors' }
  /** Mercenario o compañero: cobra menos. */
  | { kind: 'wageCut'; pct: number };

// ───────────────────────── Encargos ─────────────────────────

/** Qué tiene que tener una pieza para servir en un encargo o contrato. */
export interface CraftSpec {
  category?: ItemCategory;
  blueprints?: string[];
  minQuality?: number;
  minRarity?: Rarity;
  affinity?: Affinity;
  minAffinity?: number;
  stat?: { key: StatKey; min: number };
  trait?: string;
  tag?: string;
  /** Unidades (munición, arrojadizos, pociones) o piezas. */
  qty: number;
}

export type QuestObjective =
  | ({ kind: 'craft' } & CraftSpec)
  | { kind: 'materials'; material: string; qty: number }
  | { kind: 'hunt'; family?: string; monster?: string; region?: string; count: number }
  | { kind: 'boss'; region: string }
  /** Llegar a cierto piso de una mazmorra o, sin piso, vencer a su jefe. */
  | { kind: 'dungeon'; dungeon: string; floor?: number };

export interface QuestReward {
  gold?: number;
  reputation?: number;
  relation?: number;
  materials?: { id: string; qty: number }[];
  blueprint?: string;
  enchantment?: string;
  potion?: string;
  grimoire?: string;
  synergy?: string;
  /** Marca de historia que se activa al cumplirlo (para cadenas). */
  flag?: string;
}

/** Dónde se ofrece: tablero del gremio, tablón de la plaza o un NPC (por diálogo). */
export type QuestBoard = 'gremio' | 'tablon' | 'npc';

export interface QuestDef {
  id: string;
  /** Ciudad donde se ofrece (sin definir: Valdebrasa). */
  city?: string;
  title: string;
  board: QuestBoard;
  /** NPC que lo pide (relación que sube o baja). En el gremio puede ser el maestro. */
  giver?: string;
  /** Nombre visible de quien lo pide si no es un NPC con nombre. */
  client?: string;
  text: string;
  done: string;
  objective: QuestObjective;
  days: number;
  reward: QuestReward;
  penalty: { reputation?: number; relation?: number };
  minReputation?: number;
  conditions?: Condition[];
  repeatable?: boolean;
  weight?: number;
}

export interface QuestOffer {
  id: string;
  city: string;
  board: Exclude<QuestBoard, 'npc'>;
  /** Hasta qué día se puede aceptar. */
  until: number;
}

export interface ActiveQuest {
  uid: string;
  id: string;
  accepted: number;
  deadline: number;
  /** Para cacerías: presas contadas. */
  progress: number;
}

export interface QuestsState {
  offers: QuestOffer[];
  active: ActiveQuest[];
  /** Ids cumplidos (con repetición). */
  done: string[];
  failed: string[];
  lastRefresh: number;
}

// ───────────────────────── Contratos ─────────────────────────

export interface ContractDef {
  id: string;
  /** Ciudad donde se firma (sin definir: Valdebrasa). */
  city?: string;
  title: string;
  /** NPC mercader que firma el contrato. */
  merchant: string;
  text: string;
  item: CraftSpec;
  /** Entregas: cada `everyDays` días hay que haber entregado `item.qty` unidades más. */
  deliveries: number;
  everyDays: number;
  pricePerUnit: number;
  /** Premio al completarlo entero. */
  bonus: { gold?: number; reputation?: number; relation?: number };
  penalty: { reputation?: number; relation?: number };
  minReputation?: number;
  weight?: number;
}

export interface ActiveContract {
  uid: string;
  id: string;
  start: number;
  /** Unidades entregadas en total. */
  delivered: number;
  /** Entregas que ya vencieron y se cumplieron. */
  met: number;
}

export interface ContractsState {
  offers: { id: string; until: number; city: string }[];
  active: ActiveContract[];
  done: string[];
  /** Contratos que se llevó Ruperto (noticia del tablón). */
  lostToRival: string[];
  lastRefresh: number;
}

// ───────────────────────── Demanda y eventos ─────────────────────────

/** Índice de demanda por categoría: 1 = normal. Vender mucho lo baja; se recupera solo. */
export type DemandState = Partial<Record<ItemCategory, number>>;

export interface CityEventChoice {
  text: string;
  /** Si no se cumplen, la opción aparece deshabilitada. */
  conditions?: Condition[];
  effects: DialogueEffect[];
  result: string;
}

export interface CityEventDef {
  id: string;
  /** Ciudad donde pasa (sin definir: Valdebrasa). */
  city?: string;
  name: string;
  /** Texto del aviso en el tablón. */
  text: string;
  weight: number;
  duration: [number, number];
  minDay?: number;
  minReputation?: number;
  /** Demanda objetivo por categoría mientras dura (1.3 = +30%). */
  demand?: Partial<Record<ItemCategory, number>>;
  /** Multiplica cuánto aparece cada tipo de cliente. */
  customers?: Record<string, number>;
  /** Precio de materiales (por id o tag; sin listas, afecta a todos). */
  prices?: { materials?: string[]; tags?: string[]; types?: string[]; mult: number };
  /** Decisión opcional: tomar partido. */
  choice?: { prompt: string; options: CityEventChoice[] };
  /** Efectos al empezar (reputación, relaciones...). */
  onStart?: DialogueEffect[];
}

export interface ActiveCityEvent {
  id: string;
  city: string;
  start: number;
  until: number;
  /** Índice de la opción elegida, si la había. */
  chosen?: number;
}

export interface CityEventsState {
  active: ActiveCityEvent[];
  /** Historial corto para no repetir enseguida. */
  recent: string[];
  /** Rumores del día (de NPCs con buena relación o enojados). */
  rumors: { npc: string; text: string }[];
}

// ───────────────────────── Subasta ─────────────────────────

export type AuctionLotSource =
  | { kind: 'material'; id: string; qty: number }
  | { kind: 'grimoire'; id: string }
  | { kind: 'blueprint'; id: string }
  | {
    kind: 'item'; name: string; blueprint: string; materials: Record<string, string>; quality: number;
    traits?: string[]; enchantments?: string[]; finish?: string[];
  };

export interface AuctionLotDef {
  id: string;
  name: string;
  source: AuctionLotSource;
  /** Precio de salida. */
  base: number;
  weight: number;
  minDay?: number;
  /** Solo sale una vez por partida. */
  unique?: boolean;
  description: string;
}

export type BidderStyle = 'caprichoso' | 'paciente' | 'impulsivo' | 'cauto' | 'rival';

export interface BidderDef {
  id: string;
  name: string;
  /** NPC con nombre (su relación con vos cambia cómo puja). */
  npc?: string;
  style: BidderStyle;
  /** Qué le interesa: categorías de objeto o tipos de lote. */
  likes: (ItemCategory | 'material' | 'grimoire' | 'blueprint')[];
  /** Cuánto llega a pagar sobre el precio de salida (o el valor del objeto). */
  valuation: [number, number];
  budget: [number, number];
  lines: { bid: string[]; quit: string[]; win: string[] };
}

export interface AuctionLot {
  lotId: string;
  /** Si lo consignaste vos: el objeto y tu precio de reserva. */
  consigned?: Consignment;
  base: number;
  name: string;
}

export interface Consignment {
  item: ItemInstance;
  reserve: number;
}

export interface AuctionBidder {
  id: string;
  max: number;
  out: boolean;
}

export interface AuctionSession {
  index: number;
  price: number;
  leader: string | null;
  bidders: AuctionBidder[];
  log: string[];
  status: 'bidding' | 'sold' | 'unsold' | 'finished';
  results: { name: string; winner: string; price: number; mine: 'compra' | 'venta' | null }[];
}

export interface AuctionState {
  /** Día de la próxima subasta. */
  day: number;
  lots: AuctionLot[];
  /** Objetos tuyos en consignación para la próxima (salen del inventario hasta que se venden o los retirás). */
  consigned: Consignment[];
  session: AuctionSession | null;
  /** Lotes únicos que ya salieron. */
  seenUnique: string[];
  /** Día de la última a la que asististe. */
  attended: number;
}

// ───────────────────────── Compañeros (mercado de esclavos) ─────────────────────────

export interface ServantMarketState {
  /** Candidatos en venta esta semana. */
  offer: string[];
  lastRefresh: number;
}
