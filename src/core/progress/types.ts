import type { SkillId } from '../types';

// Progresión (Fase 6): talentos por habilidad y mejoras de la herrería.
// Los dos suman "bonos" con nombre; cada sistema del juego lee el bono que le toca.

export const BONUS_KEYS = [
  // Forja
  'forjaCalidadInicial', 'forjaDefecto', 'forjaPerfecto', 'forjaRasgo', 'forjaIntuicion',
  'armaAtaque', 'armaduraDefensa', 'loteExtra', 'joyaCalidad', 'runaCalidad',
  // Alquimia
  'alquimiaFalla', 'alquimiaExtra',
  // Recolección (chance de una unidad más)
  'mineriaExtra', 'talaExtra', 'siegaExtra', 'desuelloExtra',
  // Comercio
  'regateo', 'ventaRapida',
  // Combate y expediciones (del herrero)
  'combateAtaque', 'combateDefensa', 'carga', 'energia',
  // Herrería
  'exhibicion', 'atractivo', 'grupo',
] as const;
export type BonusKey = (typeof BONUS_KEYS)[number];
export type Bonuses = Partial<Record<BonusKey, number>>;

/** Talento de una habilidad. Cada rango suma su `effect`; cuesta un punto de esa habilidad. */
export interface TalentDef {
  id: string;
  skill: SkillId;
  name: string;
  maxRank: number;
  /** Nivel de la habilidad desde el que se puede aprender. */
  minLevel: number;
  /** Talento que hay que tener antes (al menos un rango). */
  requires?: string;
  effect: Bonuses;
  description: string;
}

export interface UpgradeLevel {
  cost: { gold: number; materials: { id: string; qty: number }[] };
  effect: Bonuses;
  /** Reputación mínima en la ciudad para construirlo. */
  reputationMin?: number;
  description: string;
}

/** Mejora de la herrería con niveles (estaciones, vitrinas, decoración, cuarto). */
export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  levels: UpgradeLevel[];
  description: string;
}
