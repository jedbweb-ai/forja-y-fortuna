import type { DungeonDef, RiddleDef, RoomPiece, TrapDef, TrapKind } from '../core/dungeon/types';

// Mazmorras. Las salas de 7×7 se dibujan a mano y el generador las combina en cada piso.
// Leyenda en core/dungeon/types.ts (RoomPiece). Las puertas se abren solas en el medio de cada lado.

export const ROOM_PIECES: RoomPiece[] = [
  // ── Salas comunes ──
  { id: 'sala_simple', kind: 'sala', rows: ['#######', '#.....#', '#..m..#', '#.....#', '#..c..#', '#.....#', '#######'] },
  { id: 'sala_columnas', kind: 'sala', rows: ['#######', '#.....#', '#.R.R.#', '#..m..#', '#.R.R.#', '#.....#', '#######'] },
  { id: 'sala_escombros', kind: 'sala', rows: ['#######', '#,,...#', '#,.m..#', '#.....#', '#..R,,#', '#.c.,,#', '#######'] },
  { id: 'sala_cruz', kind: 'sala', rows: ['#######', '##...##', '#..m..#', '#.....#', '#.....#', '##...##', '#######'] },
  { id: 'sala_vacia', kind: 'sala', rows: ['#######', '#.....#', '#.,...#', '#.....#', '#...,.#', '#.....#', '#######'] },
  { id: 'cripta_sarcofagos', kind: 'sala', dungeons: ['cripta_vigia'], rows: ['#######', '#.....#', '#RR.RR#', '#..m..#', '#RR.RR#', '#..c..#', '#######'] },
  { id: 'cripta_canal', kind: 'sala', dungeons: ['cripta_vigia'], rows: ['#######', '#.....#', '#.ww..#', '#.ww.m#', '#.....#', '#..,,.#', '#######'] },
  { id: 'cripta_osario', kind: 'sala', dungeons: ['cripta_vigia'], rows: ['#######', '#.,,,.#', '#,...,#', '#..m..#', '#,...,#', '#.,c,.#', '#######'] },
  { id: 'cueva_vetas', kind: 'sala', dungeons: ['cuevas_eco'], rows: ['#######', '#v...v#', '#..m..#', '#.....#', '#.,,.g#', '#v.c..#', '#######'] },
  { id: 'cueva_hongos', kind: 'sala', dungeons: ['cuevas_eco'], rows: ['#######', '#h...h#', '#.R...#', '#..m..#', '#...R.#', '#h..c.#', '#######'] },
  { id: 'cueva_lago', kind: 'sala', dungeons: ['cuevas_eco'], rows: ['#######', '#..ww.#', '#..ww.#', '#.....#', '#.m..g#', '#v....#', '#######'] },
  { id: 'cueva_grieta', kind: 'sala', dungeons: ['cuevas_eco'], rows: ['#######', '#.R...#', '#.R.m.#', '#.....#', '#..RR.#', '#g...v#', '#######'] },
  // ── Salas del jefe ──
  { id: 'jefe_cripta', kind: 'jefe', dungeons: ['cripta_vigia'], rows: ['#######', '#R...R#', '#.....#', '#..B..#', '#.....#', '#R...R#', '#######'] },
  { id: 'jefe_cueva', kind: 'jefe', dungeons: ['cuevas_eco'], rows: ['#######', '#.,,,.#', '#,...,#', '#..B..#', '#,...,#', '#.,,,.#', '#######'] },
  // ── Salas de tesoro (detrás de paredes falsas, rejas o puertas cerradas) ──
  { id: 'tesoro_altar', kind: 'tesoro', rows: ['#######', '#.....#', '#.R.R.#', '#..c..#', '#.R.R.#', '#.....#', '#######'] },
  { id: 'tesoro_guardado', kind: 'tesoro', rows: ['#######', '#c..m.#', '#.....#', '#.....#', '#.....#', '#.....#', '#######'] },
  { id: 'tesoro_rincon', kind: 'tesoro', rows: ['#######', '#.....#', '#.,,..#', '#.....#', '#..,,.#', '#....c#', '#######'] },
];

export const RIDDLES: RiddleDef[] = [
  {
    id: 'r_yunque', text: '«Me golpean todo el día y nunca me quejo. De mí salen espadas, pero yo no corto. ¿Qué soy?»',
    options: ['Un yunque', 'Un martillo', 'Una fragua'], answer: 0, reward: { gold: 40, materials: [{ id: 'hueso_denso', qty: 2 }] },
  },
  {
    id: 'r_sombra', text: '«Te sigo a todas partes. De tarde me estiro, a mediodía me encojo y en la oscuridad desaparezco.»',
    options: ['El eco', 'La sombra', 'El cansancio'], answer: 1, reward: { gold: 35, synergy: 'forro_espectral' },
  },
  {
    id: 'r_fuego', text: '«Si me das de comer, crezco. Si me das de beber, me muero.»',
    options: ['Un gelín', 'Una planta', 'El fuego'], answer: 2, reward: { gold: 50 },
  },
  {
    id: 'r_llave', text: '«Abro sin fuerza, cierro sin ruido, y si me perdés, te quedás afuera.»',
    options: ['Una puerta', 'Una llave', 'Un candado'], answer: 1, reward: { gold: 40, materials: [{ id: 'piedra_encantada', qty: 2 }] },
  },
  {
    id: 'r_eco', text: '«Hablo sin boca y oigo sin orejas. En las cuevas repito lo último que dijiste.»',
    options: ['El eco', 'El viento', 'Un loro'], answer: 0, reward: { gold: 45, synergy: 'pomo_runico' },
  },
  {
    id: 'r_tiempo', text: '«Nadie me ve pasar, pero gasto el acero, la piedra y la memoria de los reyes.»',
    options: ['El agua', 'El tiempo', 'El óxido'], answer: 1, reward: { gold: 60, materials: [{ id: 'gema_antigua', qty: 1 }] },
  },
];

export const TRAPS: Record<TrapKind, TrapDef> = {
  dardos: { kind: 'dardos', name: 'Una trampa de dardos', damagePct: 0.12, text: 'Salen dardos de las paredes y lastiman a todo el grupo.' },
  alarma: { kind: 'alarma', name: 'Una campana de alarma', text: 'Suena una campana oxidada: algo se despertó y viene hacia acá.' },
};

const CRIPTA_LOOT = (gold: [number, number], extra: { material: string; chance: number; qty: [number, number] }[]) => ({
  gold, grimoires: [],
  materials: [
    { material: 'hueso_denso', chance: 0.6, qty: [1, 2] as [number, number] },
    { material: 'polvo_espectral', chance: 0.4, qty: [1, 1] as [number, number] },
    { material: 'agua_bendita', chance: 0.3, qty: [1, 1] as [number, number] },
    ...extra,
  ],
});

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'cripta_vigia', name: 'Cripta del Vigía', danger: 4, floors: 3, travelSlots: 1, world: { x: 1060, y: 420 },
    description: 'Bajo las colinas de Brezal duerme la guardia de un rey olvidado. Sus vigías no saben que el reino ya no existe.',
    unlock: { flag: 'cripta_hallada', hint: 'Todavía no sabés dónde está la entrada. Dicen que está en las colinas de Brezal.' },
    entrance: 'linde_brezal',
    biome: 'cripta', bossArena: 'jefe_cripta', grid: [3, 2],
    depth: [
      { id: 'p1', name: 'Pasillos de la guardia', danger: 3, biome: 'cripta', budget: [6, 9], groups: [3, 4], families: { no_muertos: 1 }, vetas: [], arboles: [] },
      { id: 'p2', name: 'Osario', danger: 4, biome: 'cripta', budget: [9, 13], groups: [3, 4], families: { no_muertos: 1 }, vetas: [], arboles: [] },
      { id: 'p3', name: 'Sala del juramento', danger: 5, biome: 'cripta', budget: [12, 16], groups: [2, 3], families: { no_muertos: 1 }, vetas: [], arboles: [] },
    ],
    loot: [
      CRIPTA_LOOT([20, 50], [{ material: 'plata', chance: 0.3, qty: [1, 2] }]),
      CRIPTA_LOOT([40, 80], [{ material: 'opalo_lunar', chance: 0.1, qty: [1, 1] }]),
      CRIPTA_LOOT([60, 110], [{ material: 'gema_antigua', chance: 0.15, qty: [1, 1] }]),
    ],
    secretLoot: CRIPTA_LOOT([80, 150], [{ material: 'gema_antigua', chance: 0.4, qty: [1, 1] }, { material: 'opalo_lunar', chance: 0.25, qty: [1, 1] }]),
    uniques: [
      { id: 'u_cimitarra', kind: 'blueprint', ref: 'cimitarra', minFloor: 1 },
      { id: 'u_liturgia', kind: 'grimoire', ref: 'liturgia_ceniza', minFloor: 2 },
      { id: 'u_juramento', kind: 'synergy', ref: 'acero_juramento', minFloor: 3 },
      { id: 'u_gemas_cripta', kind: 'material', ref: 'gema_antigua', qty: 2, minFloor: 1 },
    ],
    boss: { monsters: ['ulmar', 'esqueleto', 'esqueleto_arquero'], respawnDays: 7, name: 'Ulmar, el Vigía Caído' },
    riddles: ['r_yunque', 'r_sombra', 'r_fuego', 'r_tiempo'],
    traps: [0, 2],
    look: { floor: 'tile.cryptstone', wall: 'prop.cryptwall', tint: 0x2a2436 },
  },
  {
    id: 'cuevas_eco', name: 'Cuevas del Eco', danger: 6, floors: 5, travelSlots: 2, world: { x: 600, y: 120 },
    description: 'Cuevas profundas donde cualquier ruido vuelve multiplicado. Gólems de piedra cuidan vetas que nadie pisó.',
    unlock: { reputationMin: 35, hint: 'Los mineros no dejan bajar a cualquiera: hace falta reputación respetada en Valdebrasa.' },
    biome: 'cueva', bossArena: 'jefe_cueva', grid: [3, 3],
    depth: [
      {
        id: 'p1', name: 'Boca de la cueva', danger: 4, biome: 'cueva', budget: [9, 12], groups: [3, 4], families: { constructos: 3, no_muertos: 1 },
        vetas: [{ material: 'hierro', weight: 3, tier: 1, qty: [2, 4] }, { material: 'plata', weight: 2, tier: 2, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'zafiro', weight: 2, tier: 2, qty: [1, 1] }, { material: 'ambar', weight: 2, tier: 2, qty: [1, 1] }],
        hierbas: [{ material: 'hongo_niebla', weight: 3, tier: 1, qty: [1, 2] }],
      },
      {
        id: 'p2', name: 'Galerías', danger: 5, biome: 'cueva', budget: [11, 15], groups: [3, 4], families: { constructos: 3, no_muertos: 1 },
        vetas: [{ material: 'plata', weight: 2, tier: 2, qty: [1, 2] }, { material: 'brasalita', weight: 2, tier: 2, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'rubi', weight: 2, tier: 2, qty: [1, 1] }, { material: 'esmeralda', weight: 2, tier: 2, qty: [1, 1] }, { material: 'gema_antigua', weight: 1, tier: 3, qty: [1, 1] }],
        hierbas: [{ material: 'hongo_niebla', weight: 3, tier: 1, qty: [1, 2] }],
      },
      {
        id: 'p3', name: 'Lago subterráneo', danger: 6, biome: 'cueva', budget: [13, 18], groups: [3, 4], families: { constructos: 2, no_muertos: 1 },
        vetas: [{ material: 'brasalita', weight: 2, tier: 2, qty: [1, 2] }, { material: 'acero', weight: 1, tier: 2, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'amatista', weight: 2, tier: 2, qty: [1, 1] }, { material: 'gema_antigua', weight: 1, tier: 3, qty: [1, 1] }],
      },
      {
        id: 'p4', name: 'Cámara de los centinelas', danger: 7, biome: 'cueva', budget: [15, 20], groups: [3, 4], families: { constructos: 3 },
        vetas: [{ material: 'acero', weight: 2, tier: 2, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'opalo_lunar', weight: 1, tier: 3, qty: [1, 1] }, { material: 'gema_antigua', weight: 2, tier: 3, qty: [1, 1] }],
      },
      {
        id: 'p5', name: 'El corazón del eco', danger: 8, biome: 'cueva', budget: [17, 22], groups: [2, 3], families: { constructos: 3, no_muertos: 1 },
        vetas: [], arboles: [], gemas: [{ material: 'gema_antigua', weight: 2, tier: 3, qty: [1, 1] }],
      },
    ],
    loot: [
      { gold: [30, 60], grimoires: [], materials: [{ material: 'piedra_encantada', chance: 0.6, qty: [1, 2] }, { material: 'nucleo_runico', chance: 0.2, qty: [1, 1] }] },
      { gold: [50, 90], grimoires: [], materials: [{ material: 'piedra_encantada', chance: 0.6, qty: [1, 2] }, { material: 'nucleo_runico', chance: 0.3, qty: [1, 1] }, { material: 'esencia_tormenta', chance: 0.2, qty: [1, 1] }] },
      { gold: [70, 120], grimoires: [{ id: 'libro_tormentas', chance: 0.1 }], materials: [{ material: 'nucleo_runico', chance: 0.4, qty: [1, 1] }, { material: 'gema_antigua', chance: 0.2, qty: [1, 1] }] },
    ],
    secretLoot: {
      gold: [100, 180], grimoires: [{ id: 'libro_tormentas', chance: 0.2 }],
      materials: [{ material: 'nucleo_runico', chance: 0.6, qty: [1, 2] }, { material: 'gema_antigua', chance: 0.5, qty: [1, 1] }, { material: 'opalo_lunar', chance: 0.3, qty: [1, 1] }],
    },
    uniques: [
      { id: 'u_arco_largo', kind: 'blueprint', ref: 'arco_largo', minFloor: 1 },
      { id: 'u_escudo_torre', kind: 'blueprint', ref: 'escudo_torre', minFloor: 2 },
      { id: 'u_pomo_runico', kind: 'synergy', ref: 'pomo_runico', minFloor: 3 },
      { id: 'u_corazon_atronador', kind: 'synergy', ref: 'corazon_atronador', minFloor: 5 },
      { id: 'u_nucleos', kind: 'material', ref: 'nucleo_runico', qty: 3, minFloor: 2 },
    ],
    boss: { monsters: ['golem_eco', 'cristal_eco', 'cristal_eco', 'cristal_eco', 'vigia_runico'], respawnDays: 7, name: 'El Gólem del Eco' },
    riddles: ['r_eco', 'r_llave', 'r_tiempo', 'r_fuego'],
    traps: [1, 2],
    look: { floor: 'tile.cave', wall: 'prop.cavewall', tint: 0x1e2a30 },
  },
];
