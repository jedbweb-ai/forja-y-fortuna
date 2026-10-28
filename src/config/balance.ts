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
    blueprints: [
      'daga', 'espada_larga', 'maza', 'arco_corto', 'flechas', 'escudo_mediano', 'peto', 'pico', 'hacha_tala', 'cuchillo_desuello',
      'anillo', 'amuleto', 'talisman', 'cuchillos_arrojadizos', 'hoz',
    ],
    /** Las recetas de runas se conocen desde el principio; los encantamientos de grimorio se aprenden leyendo. */
    enchantments: [
      'runa_brasa', 'runa_vigor', 'runa_colmillo', 'runa_totem', 'runa_nucleo',
      'runa_llama', 'runa_escarcha', 'runa_chispa', 'runa_marea', 'runa_vendaval', 'runa_roca', 'runa_alivio', 'runa_paso',
    ],
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
    /** Ruperto con mala relación te saca clientes por franja hablando mal de vos. */
    rivalCustomerLoss: 1,
    openingRatio: [0.6, 0.8] as [number, number],
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
    // ── Fase 4 ──
    dailyGiftLimit: 1,
    /** Relación que da un regalo según el gusto del NPC. */
    giftPoints: { ama: 8, gusta: 4, indiferente: 1, disgusta: -5 } as Record<string, number>,
    /** Los materiales sueltos cuentan menos que un objeto. */
    materialGiftMult: 0.5,
    /** Una pieza forjada por vos (que no le disgusta) vale más, y suma por calidad. */
    forgedGiftMult: 1.5,
    forgedGiftPerQuality: 1 / 30,
    /** Precio en el lugar de un NPC según tu relación con él (los descuentos de "amigo" van por NPC). */
    ownerPriceMult: { hostil: 1.3, desconfiado: 1.15, neutral: 1, conocido: 1, amigo: 1, aliado: 1 } as Record<string, number>,
    /** Desde este nivel hacia abajo el dueño no te atiende. */
    refuseTradeAt: 'hostil',
    /** Un NPC hostil corre rumores que bajan la reputación. */
    hostileRumorChance: 0.3,
    hostileRumorReputation: -2,
    /** Chance diaria de que un NPC con el desbloqueo de rumores cuente uno. */
    rumorChance: 0.6,
  },

  reputation: {
    min: -50,
    max: 200,
    /** Niveles de reputación en la ciudad: umbral inferior y nombre. */
    levels: [
      { min: -50, name: 'mal vista' },
      { min: -10, name: 'desconocida' },
      { min: 10, name: 'conocida' },
      { min: 35, name: 'respetada' },
      { min: 70, name: 'renombrada' },
      { min: 120, name: 'famosa' },
      { min: 170, name: 'legendaria' },
    ],
  },

  // ───────────── Fase 2 ─────────────

  herrero: {
    name: 'Vos',
    attributes: { fuerza: 6, agilidad: 5, resistencia: 6, voluntad: 4 },
    growth: { fuerza: 0.8, agilidad: 0.5, resistencia: 0.8, voluntad: 0.4 },
    look: { body: 0x8a5a3a, hair: 0x3a2418, accent: 0xc0392b },
  },

  character: {
    baseHp: 20,
    hpPerResistencia: 4,
    hpPerLevel: 3,
    /** Experiencia para pasar del nivel n al n+1: xpPerLevel * n. */
    xpPerLevel: 50,
    maxLevel: 30,
    baseMove: 3,
    baseJump: 1,
    baseSpd: 4,
    baseCrit: 0.05,
    /** Daño sin arma: fuerza × este valor. */
    unarmedPerFuerza: 0.6,
    meleePerFuerza: 0.5,
    rangedPerAgilidad: 0.5,
    armorDefFactor: 0.5,
    shieldDefFactor: 0.3,
    defPerResistencia: 0.5,
    spdPerAgilidad: 0.6,
    weaponSpdFactor: 0.4,
    weightSpdPenalty: 0.15,
    evasionPerAgilidad: 0.01,
    critPerAgilidad: 0.005,
    /** Peso de armadura desde el cual se pierde una casilla de movimiento. */
    heavyArmorWeight: 8,
    /** Fuerza requerida por punto de peso del objeto. */
    strengthPerWeight: 0.8,
    /** Voluntad requerida por encantamiento. */
    willPerEnchantment: 3,
    unmetPenalty: 0.8,
    brokenPenalty: 0.5,
  },

  mercenaries: {
    /** Relación que se pierde por cada día sin cobrar. */
    unpaidRelation: -8,
    paidRelation: 1,
    /** Días sin cobrar hasta que se va. */
    unpaidDaysToLeave: 2,
    leaveRelation: -50,
    /** Con buena relación cobran menos (porcentaje) y no se van por una mala racha. */
    wageCutByLevel: { amigo: 15, aliado: 30 } as Record<string, number>,
    loyalFrom: 'amigo',
    porteadorCapacity: 15,
    exploradorEnergy: 10,
  },

  injury: {
    days: 2,
  },

  expedition: {
    baseEnergy: 20,
    /** Cada tantos puntos de energía gastada pasa una franja. */
    energyPerSlot: 10,
    /** Casillas que se recorren por punto de energía. */
    tilesPerEnergy: 2,
    gatherEnergy: 2,
    combatEnergy: 3,
    baseCapacity: 20,
    capacityPerFuerza: 1,
    /** Fracción de lugares que tienen recurso en cada salida. */
    nodeFill: 0.65,
    nodeUses: [1, 3] as [number, number],
    nightBudgetMult: 1.3,
    nightExtraGroups: 2,
    challengeBudgetMult: 1.7,
    challengeChance: 0.5,
    aggroRange: 3,
    defeatLoss: 0.5,
    fleeLoss: 0.25,
  },

  tools: {
    /** Potencia mínima de la herramienta para cada nivel de recurso (1, 2, 3). */
    tierPower: [0, 14, 22],
    wearPerUse: 1,
    gatherBonusPerLevel: 0.1,
  },

  combat: {
    /** Parte del daño de la flecha que se suma al del arco. */
    arrowAtkFactor: 0.5,
    heightDamagePerLevel: 0.1,
    heightDamageMin: -0.2,
    heightDamageMax: 0.3,
    sideBonus: 0.15,
    backBonus: 0.35,
    defFactor: 0.35,
    elementPerPoint: 1.5,
    critMult: 1.5,
    variance: [0.9, 1.1] as [number, number],
    baseHit: 0.92,
    sideHit: 0.04,
    backHit: 0.08,
    tallGrassEvasion: 0.15,
    minHit: 0.25,
    maxHit: 0.99,
    coverMult: 0.6,
    /** Alcance extra a distancia por cada 2 niveles de altura de ventaja. */
    rangePerHeight: 0.5,
    fallDamagePerLevel: 6,
    collisionDamage: 5,
    waterMoveCost: 2,
    traitStatusChance: 0.35,
    dotPower: { sangrado: 3, quemadura: 4, veneno: 0.05 } as Record<string, number>,
    xpPerThreat: 6,
    wearPerCombat: 2,
    fleeBase: 0.45,
    fleePerSpd: 0.04,
    fleeBoss: 0.2,
  },

  // ───────────── Fase 3 ─────────────

  magic: {
    /** Usos extra de las habilidades activas por índice de rareza (común..legendario). */
    usesByRarity: [0, 0, 1, 1, 2],
    /** Calidad del objeto desde la que la habilidad recarga un turno antes. */
    fastCooldownQuality: 70,
    /** Potencia de la habilidad según la calidad de la runa: base + calidad × factor. */
    runePowerBase: 0.8,
    runePowerPerQuality: 0.004,
    /** Calidad de runa desde la que da un uso extra. */
    runeExtraUseQuality: 85,
    /** Potencia extra si el elemento de la habilidad coincide con la afinidad del objeto (≥2). */
    affinityPowerBonus: 0.15,
    /** Potencia extra por punto de afinidad en joyas del mismo elemento (tope). */
    jewelPowerPerPoint: 0.08,
    jewelPowerMax: 0.5,
    runeSlots: 1,
  },

  terrain: {
    hieloTurns: 3,
    llamasTurns: 2,
    charcoTurns: 3,
    /** Daño que reciben los que encadena el rayo por el agua (fracción del golpe). */
    chainFraction: 0.5,
    /** Multiplicador del rayo sobre mojados o parados en agua. */
    wetShock: 1.5,
    burnStatusTurns: 2,
  },

  alchemy: {
    beltSize: 6,
    /** Fuego de la destilación: potencia extra y chance de arruinar la tanda. */
    heat: {
      suave: { potency: 0, fail: 0 },
      medio: { potency: 1, fail: 0.1 },
      fuerte: { potency: 2, fail: 0.3 },
    } as Record<string, { potency: number; fail: number }>,
    failReductionPerLevel: 0.02,
    healPerPotency: 0.15,
    xpPerBrew: 6,
  },

  chests: {
    fill: 0.6,
  },

  market: {
    sellRatio: 0.45,
    /** Las partes de monstruo salen más caras para incentivar salir a cazarlas. */
    monsterPriceMult: 1.6,
    monsterStock: [0, 6] as [number, number],
    priceJitter: [0.85, 1.2] as [number, number],
    eventsPerDay: [1, 2] as [number, number],
  },

  // ───────────── Fase 4 ─────────────

  quests: {
    offersPerBoard: 3,
    /** Cada tantos días se renuevan los avisos del gremio y del tablón. */
    refreshDays: 2,
    /** Días que un aviso queda disponible para aceptarlo. */
    offerDays: 4,
    maxActive: 5,
  },

  contracts: {
    offers: 2,
    refreshDays: 5,
    offerDays: 5,
    maxActive: 2,
    /** Si Ruperto te tiene bronca, a veces se queda con un contrato antes que vos. */
    rivalStealChance: 0.35,
    rivalMaxRelation: -15,
    rivalNpc: 'ruperto',
  },

  demand: {
    min: 0.5,
    max: 1.6,
    /** Cuánto baja la demanda de una categoría por pieza vendida (y por unidad de lote). */
    dropPerSale: 0.04,
    dropPerBatchUnit: 0.003,
    /** Parte de la distancia al valor normal que se recupera cada día. */
    recovery: 0.25,
    /** Peso extra de clientes que buscan lo que está en alta demanda. */
    customerWeight: 1,
  },

  cityEvents: {
    dailyChance: 0.4,
    maxActive: 2,
    /** Eventos recientes que no se repiten enseguida. */
    recentMemory: 4,
  },

  auction: {
    firstDay: 7,
    everyDays: 7,
    announceDays: 3,
    lots: [4, 5] as [number, number],
    maxConsign: 3,
    commission: 0.1,
    stepPct: 0.1,
    minStep: 5,
    bidders: [2, 4] as [number, number],
    /** Ruperto con mala relación puja más fuerte contra vos. */
    rivalAggression: 1.35,
    rivalMaxRelation: -15,
    attendSlots: 1,
    reputationPerSale: 2,
  },

  dungeon: {
    /** Casillas que se ven alrededor del grupo (además de la sala entera en la que está). */
    sight: 2,
    examineRadius: 2,
    examineEnergy: 1,
    /** Al bajar desde un descanso se recupera esta parte de la energía y de la vida máximas. */
    restEnergy: 0.5,
    restHp: 0.3,
    /** Agotado: ataque y defensa multiplicados por esto hasta el próximo descanso. */
    exhaustedMult: 0.85,
    /** Chance de que un cofre de sala de tesoro guarde un tesoro único. */
    secretUniqueChance: 0.4,
  },

  servants: {
    offerSize: 2,
    refreshDays: 7,
    /** Bonus o penalización de ataque y defensa en combate según la lealtad. */
    combatMult: { hostil: -0.15, desconfiado: -0.07, neutral: 0, conocido: 0, amigo: 0.05, aliado: 0.1 } as Record<string, number>,
    /** Chance por turno de que actúe por su cuenta (la IA juega su turno). */
    disobey: { hostil: 0.2 } as Record<string, number>,
    /** Puede escaparse al final de una expedición con derrota o huida. */
    escapeChance: 0.35,
    escapeAt: 'hostil',
    dailyEquipped: 1,
    dailyUnarmed: -1,
    victory: 1,
    injured: -4,
    freedRelation: 100,
  },
} as const;

export type Balance = typeof BALANCE;
