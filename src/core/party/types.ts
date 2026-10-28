// Personajes del grupo: el herrero y sus compañeros.

export const ATTRIBUTES = ['fuerza', 'agilidad', 'resistencia', 'voluntad'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Attributes = Record<Attribute, number>;

export const EQUIP_SLOTS = ['arma', 'escudo', 'cuerpo', 'anillo1', 'anillo2', 'amuleto', 'cinturon'] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export type Specialty = 'herrero' | 'guerrero' | 'arquero' | 'explorador' | 'porteador';

/** Tipo de arma: define las acciones básicas de combate que da el equipo. */
export type WeaponKind = 'punos' | 'daga' | 'espada' | 'maza' | 'arco' | 'herramienta';
export type DamageType = 'cortante' | 'contundente' | 'perforante';

export interface Look {
  body: number;
  hair: number;
  accent: number;
}

export interface Character {
  id: string;
  name: string;
  specialty: Specialty;
  level: number;
  xp: number;
  /** Atributos base (pueden tener decimales por el crecimiento; se muestran redondeados). */
  attributes: Attributes;
  equipment: Partial<Record<EquipSlot, string>>;
  /** Vida actual. La máxima se calcula con atributos y nivel. */
  hp: number;
  /** Día desde el que vuelve a estar sano (0 = sano). */
  injuredUntilDay: number;
  look: Look;
  /** Sueldo diario (solo mercenarios). */
  wage?: number;
  unpaidDays?: number;
}

/** Mercenario contratable en la taberna (datos). Su id coincide con el de su NPC. */
export interface MercenaryDef {
  id: string;
  name: string;
  specialty: Exclude<Specialty, 'herrero'>;
  level: number;
  attributes: Attributes;
  /** Atributos que gana por nivel. */
  growth: Attributes;
  wage: number;
  hireCost: number;
  look: Look;
  quote: string;
  description: string;
}
