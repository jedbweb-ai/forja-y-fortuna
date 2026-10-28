import type { City, LiveSceneDef, ScenePropDef } from '../core/types';

// Fase 6B: dos ciudades más. La herrería queda en Valdebrasa; acá se compra, se vende en el mercado
// (venta rápida o puesto ambulante), se aceptan encargos y contratos, y se duerme en la posada.

const AMBIENT_DAY = { 'mañana': 6, tarde: 8, noche: 2 };

/** Escena chica de interior o plaza, para no repetir el mismo armado en cada lugar. */
function scene(
  floor: string, cols: number, rows: number, props: ScenePropDef[], hotspots: LiveSceneDef['hotspots'],
  npcSpots: LiveSceneDef['npcSpots'], opts: Partial<LiveSceneDef> = {},
): LiveSceneDef {
  return {
    cols, rows, floor, props, hotspots, npcSpots,
    spawn: { x: Math.floor(cols / 2), y: rows - 2 }, doors: [{ x: Math.floor(cols / 2), y: rows - 1 }],
    ambient: AMBIENT_DAY, carts: false, animals: [], ...opts,
  };
}

export const CITIES_6: City[] = [
  {
    id: 'puertoseco', name: 'Puertoseco',
    description: 'Puerto de pescadores y contrabandistas. Lo que llega por barco no se consigue en ningún otro lado.',
    world: { x: 240, y: 560 }, arrival: 'ps_muelle', ground: 'puerto',
    routes: [
      { to: 'valdebrasa', slots: 3, chance: 0.3, families: { bestias: 2, gelines: 1 }, budget: [6, 9] },
      { to: 'fuerte_ceniza', slots: 5, chance: 0.5, families: { goblins: 1, bestias: 1, gelines: 1 }, budget: [9, 13] },
    ],
    demand: { arrojadizo: 1.4, herramienta: 1.3, arma: 1.1, armadura: 0.8, joyeria: 1.2 },
    customers: { marinero: 3, mercader: 2, noble: 0.6, guardia: 0.5 },
    locations: [
      {
        id: 'ps_muelle', name: 'El muelle', kind: 'muelle', available: true, owner: 'ondina',
        map: { x: 640, y: 560, w: 200, h: 90, roof: '#4a6a8a' },
        stock: ['ebano', 'coral_rojo', 'perla_negra', 'seda_arana', 'ambar', 'sauceluna', 'cuerda_lino', 'tripa_trenzada', 'agua_bendita'],
        description: 'Barcos que llegan de la costa sur con ébano, coral y perlas negras.',
        scene: scene('tile.wood', 12, 9, [
          { key: 'prop.crate', x: 1, y: 1, blocks: true }, { key: 'prop.crate', x: 2, y: 1, blocks: true }, { key: 'prop.barrel', x: 1, y: 2, blocks: true },
          { key: 'prop.stall_blue', x: 5, y: 1, blocks: true }, { key: 'prop.barrel', x: 9, y: 1, blocks: true }, { key: 'prop.barrel', x: 10, y: 1, blocks: true },
          { key: 'prop.crate', x: 10, y: 4, blocks: true }, { key: 'prop.lamp', x: 0, y: 6, blocks: true }, { key: 'prop.lamp', x: 11, y: 6, blocks: true },
        ], [{ id: 'mercaderia', label: 'Mercadería del barco', x: 5, y: 1, action: 'market' }],
        { ondina: { x: 6, y: 2 }, jazmin: { x: 3, y: 4 } }, { animals: ['gato', 'gallina'] }),
      },
      {
        id: 'ps_mercado', name: 'Mercado de la Rambla', kind: 'mercado', available: true, owner: 'jazmin',
        map: { x: 400, y: 330, w: 170, h: 110, roof: '#c87533' },
        stock: ['cobre', 'bronce', 'hierro', 'plata', 'pino', 'fresno', 'cuero_curtido', 'gel_slime', 'glandula_veneno', 'plumas_ganso', 'hoja_alivio', 'raiz_amarga'],
        description: 'Puestos bajo toldos, olor a sal y pescado. Se puede armar un puesto ambulante.',
        scene: scene('tile.stone', 12, 10, [
          { key: 'prop.stall_red', x: 2, y: 2, blocks: true }, { key: 'prop.stall_green', x: 6, y: 2, blocks: true }, { key: 'prop.stall_blue', x: 10, y: 2, blocks: true },
          { key: 'prop.well', x: 6, y: 6, blocks: true }, { key: 'prop.crate', x: 0, y: 4, blocks: true }, { key: 'prop.lamp', x: 11, y: 8, blocks: true },
        ], [{ id: 'puestos', label: 'Puestos', x: 6, y: 2, action: 'market' }],
        { jazmin: { x: 6, y: 3 } }, { carts: true, roadRow: 9, animals: ['perro'] }),
      },
      {
        id: 'ps_taberna', name: 'Taberna La Ballena Seca', kind: 'taberna', available: true, owner: 'bruno',
        map: { x: 900, y: 330, w: 160, h: 100, roof: '#5a4a3a' },
        description: 'Marineros, cantos y rumores de todos los puertos.',
        scene: scene('tile.wood_dark', 11, 9, [
          { key: 'prop.bar', x: 2, y: 1, blocks: true }, { key: 'prop.bar', x: 3, y: 1, blocks: true }, { key: 'prop.barrel', x: 0, y: 0, blocks: true },
          { key: 'prop.table', x: 3, y: 5, blocks: true }, { key: 'prop.table', x: 7, y: 4, blocks: true }, { key: 'prop.bench', x: 7, y: 5, blocks: true },
          { key: 'prop.fireplace', x: 9, y: 0, blocks: true },
        ], [], { bruno: { x: 2, y: 2 }, ondina: { x: 8, y: 6 }, rolo: { x: 5, y: 6 } }, { ambient: { 'mañana': 2, tarde: 5, noche: 9 }, animals: ['gato'] }),
      },
      {
        id: 'ps_gremio', name: 'Casa de los Navegantes', kind: 'gremio', available: true, owner: 'rolo',
        map: { x: 1050, y: 180, w: 140, h: 100, roof: '#2a4a6a' },
        description: 'Encargos, contratos y avisos de la ciudad. La lleva un viejo capitán retirado.',
        scene: scene('tile.wood', 10, 9, [
          { key: 'prop.counter', x: 4, y: 2, blocks: true }, { key: 'prop.counter', x: 5, y: 2, blocks: true }, { key: 'prop.board', x: 8, y: 1, blocks: true },
          { key: 'prop.banner', x: 1, y: 0, blocks: true }, { key: 'prop.table', x: 2, y: 5, blocks: true }, { key: 'prop.lamp', x: 9, y: 8, blocks: true },
        ], [{ id: 'tablero', label: 'Encargos y avisos', x: 8, y: 1, action: 'gremio' }], { rolo: { x: 5, y: 3 } }),
      },
      {
        id: 'ps_posada', name: 'Posada del Faro', kind: 'posada', available: true, owner: 'bruno',
        map: { x: 220, y: 200, w: 130, h: 95, roof: '#8a3a3a' },
        description: 'Camas limpias y una ventana al mar. Se descansa y se duerme (la noche se paga).',
        scene: scene('tile.wood', 9, 8, [
          { key: 'prop.counter', x: 3, y: 1, blocks: true }, { key: 'prop.bench', x: 6, y: 4, blocks: true }, { key: 'prop.table', x: 1, y: 4, blocks: true },
          { key: 'prop.lamp', x: 8, y: 7, blocks: true },
        ], [], {}, { ambient: { 'mañana': 1, tarde: 2, noche: 3 } }),
      },
    ],
  },
  {
    id: 'fuerte_ceniza', name: 'Fuerte Ceniza',
    description: 'La última fortaleza antes de la frontera. Soldados, contratos militares y acero negro.',
    world: { x: 300, y: 170 }, arrival: 'fc_plaza', ground: 'fortaleza',
    routes: [
      { to: 'valdebrasa', slots: 3, chance: 0.4, families: { goblins: 2, bestias: 1 }, budget: [8, 12] },
      { to: 'puertoseco', slots: 5, chance: 0.5, families: { goblins: 1, bestias: 1, gelines: 1 }, budget: [9, 13] },
    ],
    demand: { armadura: 1.4, escudo: 1.35, municion: 1.5, arma: 1.2, pocion: 1.2, joyeria: 0.7 },
    customers: { soldado: 3, guardia: 1.5, aventurero: 1, noble: 0.3, coleccionista: 0.3 },
    locations: [
      {
        id: 'fc_plaza', name: 'Plaza de armas', kind: 'tablon', available: true,
        map: { x: 640, y: 380, w: 180, h: 110, roof: '#6a5a4a' },
        description: 'Donde forma la tropa. El tablón tiene los avisos de la ciudad.',
        scene: scene('tile.stone', 12, 10, [
          { key: 'prop.board', x: 5, y: 1, blocks: true }, { key: 'prop.banner', x: 2, y: 0, blocks: true }, { key: 'prop.banner', x: 9, y: 0, blocks: true },
          { key: 'prop.rack', x: 0, y: 3, blocks: true }, { key: 'prop.rack', x: 11, y: 3, blocks: true }, { key: 'prop.lamp', x: 1, y: 8, blocks: true },
        ], [{ id: 'tablon_fc', label: 'Tablón', x: 5, y: 1, action: 'tablon' }], { bocanegra: { x: 6, y: 3 } }, { carts: true, roadRow: 9, animals: ['perro'] }),
      },
      {
        id: 'fc_intendencia', name: 'Intendencia', kind: 'gremio', available: true, owner: 'ilda',
        map: { x: 1000, y: 230, w: 150, h: 100, roof: '#3a3a4a' },
        description: 'Encargos y contratos del ejército. Pagan puntual, exigen más.',
        scene: scene('tile.wood_dark', 10, 9, [
          { key: 'prop.counter', x: 4, y: 2, blocks: true }, { key: 'prop.counter', x: 5, y: 2, blocks: true }, { key: 'prop.board', x: 8, y: 1, blocks: true },
          { key: 'prop.rack', x: 0, y: 1, blocks: true }, { key: 'prop.chest', x: 1, y: 5, blocks: true }, { key: 'prop.lamp', x: 9, y: 8, blocks: true },
        ], [{ id: 'encargos_fc', label: 'Encargos y contratos', x: 8, y: 1, action: 'gremio' }], { ilda: { x: 5, y: 3 } }),
      },
      {
        id: 'fc_mercado', name: 'Mercado de la guarnición', kind: 'mercado', available: true, owner: 'pim',
        map: { x: 300, y: 300, w: 170, h: 110, roof: '#7a6a4a' },
        stock: ['hierro', 'acero', 'acero_negro', 'cuero_endurecido', 'piel_jabali', 'roble', 'plumas_ganso', 'cuerda_lino', 'colmillo_lobo', 'cuero_lobo', 'garra_oso'],
        description: 'Acero de la frontera y cueros para armaduras. Se puede armar un puesto ambulante.',
        scene: scene('tile.stone', 12, 10, [
          { key: 'prop.stall_red', x: 2, y: 2, blocks: true }, { key: 'prop.stall_red', x: 9, y: 2, blocks: true }, { key: 'prop.anvil', x: 6, y: 2, blocks: true },
          { key: 'prop.crate', x: 0, y: 5, blocks: true }, { key: 'prop.barrel', x: 11, y: 5, blocks: true }, { key: 'prop.lamp', x: 6, y: 8, blocks: true },
        ], [{ id: 'puestos_fc', label: 'Puestos', x: 2, y: 2, action: 'market' }], { pim: { x: 3, y: 3 } }, { carts: true, roadRow: 9 }),
      },
      {
        id: 'fc_cantina', name: 'Cantina El Escudo Roto', kind: 'taberna', available: true, owner: 'bocanegra',
        map: { x: 980, y: 520, w: 150, h: 100, roof: '#4a2a2a' },
        description: 'Cerveza amarga y soldados que cuentan la misma batalla todas las noches.',
        scene: scene('tile.wood_dark', 11, 9, [
          { key: 'prop.bar', x: 2, y: 1, blocks: true }, { key: 'prop.bar', x: 3, y: 1, blocks: true }, { key: 'prop.table', x: 6, y: 4, blocks: true },
          { key: 'prop.bench', x: 6, y: 5, blocks: true }, { key: 'prop.barrel', x: 10, y: 0, blocks: true }, { key: 'prop.fireplace', x: 8, y: 0, blocks: true },
        ], [], { bocanegra: { x: 2, y: 2 }, ilda: { x: 8, y: 6 }, pim: { x: 4, y: 6 } }, { ambient: { 'mañana': 2, tarde: 5, noche: 10 } }),
      },
      {
        id: 'fc_posada', name: 'Cuartel de huéspedes', kind: 'posada', available: true, owner: 'bocanegra',
        map: { x: 640, y: 150, w: 140, h: 95, roof: '#5a5a6a' },
        description: 'Catres duros y mantas de lana. Se descansa y se duerme (la noche se paga).',
        scene: scene('tile.wood', 9, 8, [
          { key: 'prop.counter', x: 3, y: 1, blocks: true }, { key: 'prop.bench', x: 1, y: 4, blocks: true }, { key: 'prop.bench', x: 6, y: 4, blocks: true },
          { key: 'prop.lamp', x: 8, y: 7, blocks: true },
        ], [], {}, { ambient: { 'mañana': 1, tarde: 2, noche: 3 } }),
      },
    ],
  },
];
