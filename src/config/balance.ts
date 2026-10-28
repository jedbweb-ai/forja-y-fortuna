// Todos los valores de balance del juego, en un solo lugar.

export const BALANCE = {
  MAX_PARTY_SIZE: 3,

  start: {
    gold: 120,
    city: 'valdebrasa',
    location: 'herreria',
    materials: {
      hierro: 7, cobre: 4, pino: 5, fresno: 2, cuero_curtido: 3, cuerda_lino: 2, plumas_ganso: 3,
    } as Record<string, number>,
    blueprints: ['daga', 'espada_larga', 'maza', 'arco_corto', 'flechas', 'escudo_mediano', 'peto', 'pico'],
    enchantments: ['runa_brasa', 'runa_vigor', 'runa_colmillo'],
  },

  time: {
    /** Salir a recorrer la ciudad (mercado, taberna) consume la franja en curso. */
    cityOutingSlots: 1,
    shopShiftSlots: 1,
  },

  forge: {
    startQuality: 12,
    maxQuality: 100,
    qualityPerHit: [5, 10] as [number, number],
    perfectChance: 0.12,
    perfectBonus: 7,
    defectBase: 0.03,
    defectPerHit: 0.035,
    defectMax: 0.8,
    /** Reducción del riesgo de defecto por nivel de Herrería. */
    defectReductionPerLevel: 0.006,
    defectQualityLoss: 5,
    defectStatPct: 7,
    maxDefects: 3,
    /** Golpes necesarios para habilitar rasgos de tier 1, 2 y 3. */
    traitTierHits: [3, 6, 9] as [number, number, number],
    traitChanceBase: 0.04,
    traitChancePerHit: 0.06,
    traitChanceMax: 0.85,
    traitChancePerLevel: 0.005,
    /** Chance de un segundo rasgo si se llegó al tier 3. */
    secondTraitChance: 0.3,
    /** Cada punto de peso resta esta velocidad. */
    weightSpeedPenalty: 0.25,
    /** La ganancia de calidad por golpe baja a medida que sube la calidad. */
    diminishingAt: 130,
    qualityStatMin: 0.7,
    qualityStatMax: 1.3,
    xpBase: 8,
    xpPerQuality: 0.15,
    xpRuined: 3,
  },

  rarity: {
    /** Puntaje mínimo para cada rareza (común, poco común, raro, épico, legendario). */
    thresholds: [0, 14, 24, 36, 50],
    materialTierWeight: 4,
    synergy: 4,
    secretSynergy: 6,
    qualityWeight: 0.12,
    traitPerTier: 3,
    enchantment: 5,
    defect: -3,
    enchantSlots: [1, 1, 2, 2, 3],
  },

  value: {
    materialMult: 1.5,
    laborPerSlot: 12,
    qualityBase: 0.6,
    rarityMult: [1, 1.15, 1.35, 1.7, 2.2],
    traitTierPct: [0, 12, 25, 45],
    enchantmentPct: 35,
    beautyPct: 6,
    defectPct: -10,
  },

  shop: {
    customersPerSlot: { 'mañana': 4, tarde: 5, noche: 2 } as Record<string, number>,
    /** Cada tantos puntos de reputación entra un cliente más. */
    reputationPerExtraCustomer: 20,
    displaySlots: 8,
    absurdPriceRatio: 1.7,
    happyPriceRatio: 0.85,
    repOnSale: 1,
    repOnHappy: 2,
    repOnAngry: -1,
    commerceBonusPerLevel: 0.015,
    xpPerSale: 6,
    maxPriceJitter: [0.9, 1.15] as [number, number],
    openingRatio: [0.6, 0.8] as [number, number],
  },

  market: {
    sellRatio: 0.45,
  },

  skills: {
    /** Nivel = 1 + floor(sqrt(xp / xpFactor)). */
    xpFactor: 30,
  },

  relations: {
    min: -100,
    max: 100,
    /** Umbral inferior de cada nivel: hostil, desconfiado, neutral, conocido, amigo, aliado. */
    levelThresholds: [-100, -50, -15, 15, 45, 75],
    dailyTalkLimit: 1,
  },

  reputation: {
    min: -50,
    max: 200,
  },
} as const;

export type Balance = typeof BALANCE;
