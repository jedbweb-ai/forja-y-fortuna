import type { ArenaDef, CombatSkill, MonsterDef } from '../core/combat/types';

const ALL = ['mañana', 'tarde', 'noche'] as ('mañana' | 'tarde' | 'noche')[];

// Fase 5: familias de las mazmorras. No-muertos (débiles a lo sagrado y a los golpes contundentes)
// y constructos de piedra (resisten el filo; los rompe la maza y el rayo).

export const SKILLS_5: CombatSkill[] = [
  { id: 'flecha_hueso', name: 'Flecha de hueso', range: [2, 5], target: 'enemy', power: 1, damageType: 'perforante', cooldown: 0, description: 'Dispara astillas de hueso.' },
  { id: 'toque_espectral', name: 'Toque espectral', range: [1, 1], target: 'enemy', power: 1, element: 'oscuro', lifeStealPct: 30, cooldown: 0, description: 'Un frío que roba la vida.' },
  { id: 'tajo_caido', name: 'Tajo del caído', range: [1, 1], target: 'enemy', power: 1.2, damageType: 'cortante', cooldown: 0, description: 'Un tajo pesado de espada vieja.' },
  { id: 'rayo_sombrio', name: 'Rayo sombrío', range: [2, 4], target: 'enemy', power: 1, element: 'oscuro', cooldown: 0, description: 'Magia oscura a distancia.' },
  { id: 'curar_huesos', name: 'Recomponer huesos', range: [0, 3], target: 'ally', power: 0, healPct: 0.3, cooldown: 2, description: 'Vuelve a juntar los huesos de un aliado.' },
  { id: 'puno_piedra', name: 'Puño de piedra', range: [1, 1], target: 'enemy', power: 1.2, damageType: 'contundente', cooldown: 0, statuses: [{ id: 'aturdido', chance: 0.15, turns: 1 }], description: 'Un golpe de roca que puede aturdir.' },
  { id: 'garra_piedra', name: 'Garra de piedra', range: [1, 1], target: 'enemy', power: 1.1, damageType: 'cortante', cooldown: 0, description: 'Garras de granito.' },
  { id: 'lanza_centinela', name: 'Lanza del centinela', range: [1, 2], target: 'enemy', power: 1.1, damageType: 'perforante', cooldown: 0, description: 'Una lanza larga que llega a dos casillas.' },
  { id: 'rayo_runico', name: 'Rayo rúnico', range: [2, 5], target: 'enemy', power: 1, element: 'rayo', chain: true, cooldown: 1, description: 'Un rayo que salta por el agua.' },
  { id: 'mandoble_ulmar', name: 'Mandoble del Vigía', range: [1, 1], target: 'enemy', power: 1.3, damageType: 'cortante', cooldown: 0, description: 'El tajo de un guardián que no duerme.' },
  {
    id: 'juicio_vigia', name: 'Juicio del Vigía', range: [1, 4], target: 'tile', area: 'radius', size: 1, power: 1.6, element: 'oscuro',
    telegraph: true, cooldown: 2, description: 'Marca el suelo y al turno siguiente lo parte con una onda oscura.',
  },
  {
    id: 'eco_atronador', name: 'Eco atronador', range: [1, 5], target: 'tile', area: 'radius', size: 1, power: 1.5, element: 'rayo',
    telegraph: true, cooldown: 2, description: 'La cueva retumba: al turno siguiente, el techo cae sobre las casillas marcadas.',
  },
  {
    id: 'onda_eco', name: 'Onda del eco', range: [1, 1], target: 'tile', area: 'line', size: 4, power: 1.2, damageType: 'contundente', push: 1,
    telegraph: true, cooldown: 3, description: 'Una línea de piedra que empuja.',
  },
];

export const MONSTERS_5: MonsterDef[] = [
  // ── No-muertos ──
  {
    id: 'esqueleto', name: 'Esqueleto', family: 'no_muertos', tier: 1,
    hp: 42, atk: 13, def: 5, spd: 5, move: 3, jump: 1, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.7, perforante: 0.5, contundente: 1.4 }, elemental: { sagrado: 1.8, veneno: 0.2, oscuro: 0.5 },
    immune: ['sangrado', 'veneno'], skills: ['tajo_goblin'], ai: 'bruto', threat: 3, slots: ALL, aggressive: true,
    loot: [{ material: 'hueso_denso', chance: 0.8, qty: [1, 2] }],
    sprite: { key: 'mon.esqueleto', tint: 0xf2ecd8 }, description: 'Huesos que todavía montan guardia. Las flechas les pasan entre las costillas.',
  },
  {
    id: 'esqueleto_arquero', name: 'Esqueleto arquero', family: 'no_muertos', tier: 1,
    hp: 34, atk: 12, def: 3, spd: 6, move: 3, jump: 1, evasion: 0.05, damageType: 'perforante',
    resist: { cortante: 0.7, perforante: 0.5, contundente: 1.4 }, elemental: { sagrado: 1.8, veneno: 0.2, oscuro: 0.5 },
    immune: ['sangrado', 'veneno'], skills: ['flecha_hueso'], ai: 'tirador', threat: 3, slots: ALL,
    loot: [{ material: 'hueso_denso', chance: 0.6, qty: [1, 1] }],
    sprite: { key: 'mon.esqueleto', tint: 0xd8c8a0 }, description: 'Dispara astillas de sus propios huesos.',
  },
  {
    id: 'espectro', name: 'Espectro', family: 'no_muertos', tier: 2,
    hp: 30, atk: 12, def: 2, spd: 7, move: 4, jump: 3, evasion: 0.2, damageType: 'contundente',
    resist: { cortante: 0.5, perforante: 0.5, contundente: 0.5 }, elemental: { sagrado: 2, fuego: 1.2, oscuro: 0.3, veneno: 0 },
    immune: ['sangrado', 'veneno', 'inmovilizado'], skills: ['toque_espectral'], ai: 'bruto', threat: 4, slots: ALL, aggressive: true,
    loot: [{ material: 'polvo_espectral', chance: 0.8, qty: [1, 2], spoiledBy: ['fuego'] }],
    sprite: { key: 'mon.espectro', tint: 0xb8c8ff }, description: 'Casi no se lo puede tocar con acero. La luz sagrada lo deshace.',
  },
  {
    id: 'caballero_caido', name: 'Caballero caído', family: 'no_muertos', tier: 2,
    hp: 80, atk: 17, def: 9, spd: 4, move: 3, jump: 1, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.8, perforante: 0.7, contundente: 1.2 }, elemental: { sagrado: 1.6, oscuro: 0.4 },
    immune: ['sangrado', 'veneno'], skills: ['tajo_caido', 'guardia_goblin'], ai: 'tanque', threat: 6, slots: ALL,
    loot: [{ material: 'hueso_denso', chance: 1, qty: [1, 2] }, { material: 'polvo_espectral', chance: 0.4, qty: [1, 1] }],
    sprite: { key: 'mon.caballero', tint: 0x8a92a8 }, description: 'Una armadura vacía que sigue cumpliendo órdenes de un rey muerto.',
  },
  {
    id: 'nigromante', name: 'Nigromante', family: 'no_muertos', tier: 2,
    hp: 40, atk: 10, def: 3, spd: 5, move: 3, jump: 1, evasion: 0.05, damageType: 'contundente',
    resist: {}, elemental: { sagrado: 1.6, oscuro: 0.4 },
    skills: ['rayo_sombrio', 'curar_huesos'], ai: 'sanador', threat: 5, slots: ALL,
    loot: [{ material: 'polvo_espectral', chance: 0.7, qty: [1, 2] }, { material: 'gema_antigua', chance: 0.08, qty: [1, 1] }],
    sprite: { key: 'mon.esqueleto', tint: 0x7a5aa8 }, description: 'Recompone a los suyos. Primero él.',
  },
  // ── Constructos de piedra ──
  {
    id: 'golem_menor', name: 'Gólem menor', family: 'constructos', tier: 2,
    hp: 90, atk: 16, def: 12, spd: 2, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { cortante: 0.5, perforante: 0.4, contundente: 1.3 }, elemental: { rayo: 1.6, agua: 1.2, fuego: 0.6, veneno: 0 },
    immune: ['sangrado', 'veneno'], skills: ['puno_piedra'], ai: 'tanque', threat: 6, slots: ALL,
    loot: [{ material: 'piedra_encantada', chance: 0.9, qty: [1, 2] }, { material: 'nucleo_runico', chance: 0.25, qty: [1, 1], spoiledBy: ['rayo'] }],
    sprite: { key: 'mon.golem', tint: 0x9a9488 }, description: 'Lento como una montaña y igual de duro. Una maza lo agrieta; el rayo lo desarma.',
  },
  {
    id: 'gargola', name: 'Gárgola', family: 'constructos', tier: 1,
    hp: 50, atk: 14, def: 8, spd: 6, move: 4, jump: 4, evasion: 0.1, damageType: 'cortante',
    resist: { cortante: 0.6, perforante: 0.6, contundente: 1.2 }, elemental: { rayo: 1.4, veneno: 0 },
    immune: ['sangrado', 'veneno'], skills: ['garra_piedra'], ai: 'bruto', threat: 4, slots: ALL, aggressive: true,
    loot: [{ material: 'piedra_encantada', chance: 0.7, qty: [1, 1] }, { material: 'gema_antigua', chance: 0.06, qty: [1, 1] }],
    sprite: { key: 'mon.gargola', tint: 0x7d7a8a }, description: 'Salta desde las alturas. Nunca está donde la dejaste de mirar.',
  },
  {
    id: 'centinela', name: 'Centinela de ruinas', family: 'constructos', tier: 2,
    hp: 60, atk: 15, def: 10, spd: 3, move: 2, jump: 1, evasion: 0, damageType: 'perforante',
    resist: { cortante: 0.6, perforante: 0.5, contundente: 1.2 }, elemental: { rayo: 1.4, veneno: 0 },
    immune: ['sangrado', 'veneno'], skills: ['lanza_centinela'], ai: 'tanque', threat: 5, slots: ALL,
    loot: [{ material: 'nucleo_runico', chance: 0.4, qty: [1, 1], spoiledBy: ['rayo'] }, { material: 'piedra_encantada', chance: 0.6, qty: [1, 1] }],
    sprite: { key: 'mon.golem', tint: 0x6a7a8a, scale: 0.9 }, description: 'Sigue custodiando una puerta que ya no existe.',
  },
  {
    id: 'vigia_runico', name: 'Vigía rúnico', family: 'constructos', tier: 2,
    hp: 38, atk: 13, def: 6, spd: 5, move: 3, jump: 2, evasion: 0.05, damageType: 'contundente',
    resist: { cortante: 0.7, perforante: 0.7 }, elemental: { rayo: 0.5, agua: 1.3, veneno: 0 },
    immune: ['sangrado', 'veneno'], skills: ['rayo_runico'], ai: 'tirador', threat: 4, slots: ALL,
    loot: [{ material: 'nucleo_runico', chance: 0.5, qty: [1, 1] }, { material: 'gema_antigua', chance: 0.12, qty: [1, 1] }],
    sprite: { key: 'mon.gargola', tint: 0x5ad1ff, scale: 0.85 }, description: 'Un ojo de piedra que dispara rayos. Si hay agua en el suelo, cuidado.',
  },
  {
    id: 'cristal_eco', name: 'Cristal de resonancia', family: 'reliquias', tier: 2,
    hp: 45, atk: 0, def: 4, spd: 1, move: 0, jump: 0, evasion: 0, damageType: 'contundente',
    resist: { contundente: 1.5, cortante: 0.8 }, elemental: { rayo: 0.5, veneno: 0 },
    immune: ['sangrado', 'veneno', 'aturdido', 'ralentizado', 'inmovilizado'], skills: [], ai: 'inmovil', threat: 0, slots: ALL,
    loot: [{ material: 'gema_antigua', chance: 0.3, qty: [1, 1] }],
    sprite: { key: 'mon.cristal', tint: 0x7af0ff }, description: 'Mientras resuene, el Gólem del Eco no siente ningún golpe.',
  },
  // ── Jefes (y las reliquias que los protegen: familia propia para que nunca salgan en grupos comunes) ──
  {
    id: 'ulmar', name: 'Ulmar, el Vigía Caído', family: 'no_muertos', tier: 3, boss: true,
    hp: 320, atk: 20, def: 10, spd: 5, move: 3, jump: 2, evasion: 0.05, damageType: 'cortante',
    resist: { cortante: 0.8, perforante: 0.6, contundente: 1.2 }, elemental: { sagrado: 1.5, oscuro: 0.3, veneno: 0 },
    immune: ['sangrado', 'veneno', 'aturdido'], skills: ['mandoble_ulmar', 'juicio_vigia'], ai: 'jefe', threat: 16, slots: ALL,
    halfHp: {
      summon: ['esqueleto', 'esqueleto_arquero'], text: 'Ulmar clava la espada en el suelo: «¡Guardia, a mí!». Los muertos se levantan.',
      skills: ['mandoble_ulmar', 'juicio_vigia', 'grito_guerra'], atkPct: 20,
    },
    loot: [
      { material: 'acero_juramentado', chance: 1, qty: [2, 3] },
      { material: 'hueso_denso', chance: 1, qty: [2, 4] },
      { material: 'polvo_espectral', chance: 0.6, qty: [1, 2] },
    ],
    sprite: { key: 'mon.caballero', tint: 0x5a6aa8, scale: 1.45 },
    description: 'El último vigía de la cripta. Juró no dejar pasar a nadie, y la muerte no lo liberó del juramento.',
  },
  {
    id: 'golem_eco', name: 'El Gólem del Eco', family: 'constructos', tier: 3, boss: true,
    hp: 420, atk: 22, def: 14, spd: 3, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { cortante: 0.5, perforante: 0.4, contundente: 1.2 }, elemental: { rayo: 1.4, agua: 1.2, veneno: 0 },
    immune: ['sangrado', 'veneno', 'aturdido', 'inmovilizado'], skills: ['puno_piedra', 'eco_atronador'], ai: 'jefe', threat: 18, slots: ALL,
    shieldedBy: ['cristal_eco'],
    halfHp: {
      summon: ['gargola'], text: 'El Gólem del Eco ruge y toda la cueva tiembla. Una gárgola se desprende del techo.',
      skills: ['puno_piedra', 'eco_atronador', 'onda_eco'], atkPct: 25,
    },
    loot: [
      { material: 'corazon_eco', chance: 1, qty: [1, 1] },
      { material: 'nucleo_runico', chance: 1, qty: [1, 2] },
      { material: 'piedra_encantada', chance: 1, qty: [2, 4] },
    ],
    sprite: { key: 'mon.golem', tint: 0x6ab0c8, scale: 1.6 },
    description: 'Un gólem del tamaño de una casa. Los cristales de la cueva lo protegen: hay que romperlos primero.',
  },
];

// Arenas de mazmorra (10×8). 'l' es lava: arde todo el combate y quema a quien empiece el turno encima.
const PARTY = [{ x: 0, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 2 }, { x: 1, y: 5 }];
export const ARENAS_5: ArenaDef[] = [
  {
    id: 'cripta_columnas', biome: 'cripta',
    terrain: ['..........', '..#....#..', '..........', '....,,....', '....,,....', '..........', '..#....#..', '..........'],
    heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 9, y: 2 }, { x: 8, y: 3 }, { x: 9, y: 4 }, { x: 8, y: 5 }, { x: 9, y: 6 }, { x: 8, y: 1 }, { x: 9, y: 0 }],
  },
  {
    id: 'cripta_sarcofagos', biome: 'cripta',
    terrain: ['..........', '.##..##...', '..........', '..........', '...##..##.', '..........', '.##.......', '..........'],
    heights: ['0000000000', '0110011000', '0000000000', '0000000000', '0001100110', '0000000000', '0110000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 9, y: 1 }, { x: 8, y: 2 }, { x: 9, y: 3 }, { x: 8, y: 5 }, { x: 9, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 0 }],
  },
  {
    id: 'cripta_canal', biome: 'cripta',
    terrain: ['....ww....', '....ww....', '..........', '....ww....', '....ww....', '..........', '....ww....', '....ww....'],
    heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 9, y: 2 }, { x: 8, y: 3 }, { x: 9, y: 4 }, { x: 8, y: 5 }, { x: 9, y: 6 }, { x: 8, y: 1 }, { x: 7, y: 2 }],
  },
  {
    id: 'cueva_lava', biome: 'cueva',
    terrain: ['..........', '...ll.....', '...ll..#..', '..........', '..........', '..#..ll...', '.....ll...', '..........'],
    heights: ['0000001100', '0000001100', '0000000000', '0000000000', '0000000000', '0000000000', '0110000000', '0110000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 9, y: 2 }, { x: 8, y: 3 }, { x: 9, y: 4 }, { x: 8, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 0 }, { x: 9, y: 7 }],
  },
  {
    id: 'cueva_estalagmitas', biome: 'cueva',
    terrain: ['..........', '..#...#...', '.....,,...', '.#..ww..#.', '....ww....', '..,,......', '...#...#..', '..........'],
    heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 9, y: 1 }, { x: 8, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 7 }, { x: 8, y: 4 }],
  },
  {
    id: 'jefe_cripta', biome: 'jefe', look: 'cripta',
    terrain: ['..........', '.#......#.', '..........', '...,,,,...', '...,,,,...', '..........', '.#......#.', '..........'],
    heights: ['0000000000', '0000000000', '0000001100', '0000001110', '0000001110', '0000001100', '0000000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 7, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 5 }, { x: 9, y: 1 }, { x: 9, y: 6 }, { x: 9, y: 3 }, { x: 9, y: 4 }],
  },
  {
    id: 'jefe_cueva', biome: 'jefe', look: 'cueva',
    terrain: ['..........', '..ll......', '..ll...#..', '..........', '..........', '.......#..', '..ll......', '..ll......'],
    heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 8, y: 3 }, { x: 6, y: 1 }, { x: 6, y: 6 }, { x: 9, y: 4 }, { x: 9, y: 0 }, { x: 9, y: 7 }, { x: 8, y: 5 }],
  },
];
