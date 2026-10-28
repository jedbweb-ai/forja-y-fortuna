import type { RegionDef } from '../core/world/types';

// 24×16. Ver la leyenda en core/world/types.ts (RegionDef).
const LINDE_TERRAIN = [
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'T.....,,..T.t..T..RRRRRT',
  'T..m..,,,....TT.m.R..vRT',
  'T.......t..T.t....=..B.T',
  'T..v.......m..T..==...RT',
  'T......,,.....t.==..m..T',
  'E=====....t..T.==...v..T',
  'T....===========..R....T',
  'T..,,....m...t...=..m..T',
  'T..,,,.......T..t=.....T',
  'T.m....v...t....m=.RR..T',
  'T.....RR....TT...=..v..T',
  'T..t..Rv...m.....==....T',
  'T.......t...t.....=..m.T',
  'T...,,.....T....t.v....T',
  'TTTTTTTTTTTTTTTTTTTTTTTT',
];

// Las colinas (al este) van subiendo de a un nivel.
const LINDE_HEIGHTS = LINDE_TERRAIN.map(() => '00000000000000111122222'.padEnd(24, '2'));
const LINDE_ZONES = LINDE_TERRAIN.map(() => '1'.repeat(8) + '2'.repeat(8) + '3'.repeat(8));

export const REGIONS: RegionDef[] = [
  {
    id: 'linde_brezal',
    name: 'Linde de Brezal',
    description: 'Praderas, bosque y colinas al noreste de Valdebrasa. Gelines en los pastos, bestias en el bosque y una banda goblin en las colinas.',
    danger: 3,
    available: true,
    travelSlots: 1,
    world: { x: 820, y: 250 },
    terrain: LINDE_TERRAIN,
    heights: LINDE_HEIGHTS,
    zones: LINDE_ZONES,
    zoneDefs: [
      {
        id: 'pradera', name: 'Pradera de Brezal', danger: 1, biome: 'pradera', budget: [4, 6], groups: [2, 3],
        families: { gelines: 3, bestias: 1 },
        vetas: [
          { material: 'cobre', weight: 5, tier: 1, qty: [2, 4] },
          { material: 'hierro', weight: 3, tier: 1, qty: [1, 3] },
        ],
        arboles: [
          { material: 'pino', weight: 5, tier: 1, qty: [2, 4] },
          { material: 'fresno', weight: 3, tier: 1, qty: [1, 3] },
        ],
      },
      {
        id: 'bosque', name: 'Bosque de Brezal', danger: 2, biome: 'bosque', budget: [7, 10], groups: [3, 4],
        families: { bestias: 3, goblins: 2, gelines: 1 },
        vetas: [
          { material: 'hierro', weight: 5, tier: 1, qty: [2, 3] },
          { material: 'cuarzo_igneo', weight: 1, tier: 2, qty: [1, 1] },
        ],
        arboles: [
          { material: 'fresno', weight: 3, tier: 1, qty: [2, 3] },
          { material: 'roble', weight: 4, tier: 1, qty: [1, 3] },
          { material: 'sauceluna', weight: 1, tier: 2, qty: [1, 1] },
        ],
      },
      {
        id: 'colinas', name: 'Colinas Dientepartido', danger: 3, biome: 'colinas', budget: [11, 15], groups: [2, 3],
        families: { goblins: 3, bestias: 2 },
        vetas: [
          { material: 'hierro', weight: 3, tier: 1, qty: [2, 4] },
          { material: 'plata', weight: 2, tier: 2, qty: [1, 2] },
          { material: 'brasalita', weight: 1, tier: 2, qty: [1, 1] },
          { material: 'cuarzo_glacial', weight: 1, tier: 2, qty: [1, 1] },
        ],
        arboles: [
          { material: 'roble', weight: 2, tier: 1, qty: [1, 2] },
          { material: 'sauceluna', weight: 1, tier: 2, qty: [1, 2] },
        ],
      },
    ],
    boss: { monsters: ['grunaz', 'goblin_escudero', 'goblin_escudero', 'chaman_totem', 'goblin_hondero'], zone: 3 },
  },
  // Regiones que se abren en fases siguientes (se ven en el mapa del mundo con su peligro).
  ...([
    ['montanas_grises', 'Montañas Grises', 4, 980, 140],
    ['cuevas_eco', 'Cuevas del Eco', 4, 600, 120],
    ['pantano_niebla', 'Pantano de Niebla', 5, 360, 420],
    ['ruinas_vigia', 'Ruinas del Vigía', 6, 1040, 470],
    ['tierras_dragon', 'Tierras del Dragón', 9, 1160, 90],
  ] as const).map(([id, name, danger, x, y]): RegionDef => ({
    id, name, danger, description: 'Todavía no se puede llegar.', available: false, travelSlots: 2,
    world: { x, y }, terrain: [], heights: [], zones: [], zoneDefs: [],
  })),
];
