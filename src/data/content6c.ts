import type { ArenaDef, CombatSkill, MonsterDef } from '../core/combat/types';
import type { PotionDef } from '../core/magic/types';
import type { QuestDef } from '../core/town/types';
import type { CityLocation, Dialogue, DialogueEffect, Material, Npc, QuenchMedium, Synergy } from '../core/types';
import type { RegionDef, ZoneDef } from '../core/world/types';

// Fase 6C: Montañas Grises y Pantano de Niebla, gigantes y elementales, y las tiendas especializadas.

const ALL = ['mañana', 'tarde', 'noche'] as ('mañana' | 'tarde' | 'noche')[];

// ───────────────────────── Materiales ─────────────────────────

export const MATERIALS_6C: Material[] = [
  { id: 'hueso_gigante', name: 'Hueso de gigante', type: 'monstruo', tier: 3, price: 30, color: '#d8ccb0', stats: { def: 10, dur: 25, wgt: 6 }, tags: ['gigante', 'hueso', 'trofeo'], alchemy: { proteccion: 2 }, description: 'Grueso como un tronco. Las placas hechas con él aguantan un hachazo de ogro.' },
  { id: 'piel_gruesa', name: 'Piel gruesa', type: 'cuero', tier: 3, price: 26, color: '#7a5a3a', stats: { def: 9, dur: 20, wgt: 3 }, tags: ['gigante', 'firme'], description: 'Piel de ogro curtida. Pesada, pero casi no se corta.' },
  { id: 'sangre_troll', name: 'Sangre de troll', type: 'monstruo', tier: 2, price: 22, color: '#3a7a3a', stats: {}, tags: ['gigante', 'liquido'], alchemy: { curacion: 3, vigor: 2 }, description: 'Verde y espesa. Las heridas que toca se cierran solas.' },
  { id: 'cristal_marea', name: 'Cristal de marea', type: 'gema', tier: 2, price: 36, color: '#3ab0d8', stats: { def: 2, dur: 5 }, affinities: { agua: 3 }, tags: ['gema', 'elemental'], alchemy: { proteccion: 1, curacion: 1 }, description: 'Lo que deja un elemental de agua al deshacerse. Siempre está húmedo.' },
  { id: 'cristal_magma', name: 'Cristal de magma', type: 'gema', tier: 2, price: 36, color: '#e8582a', stats: { atk: 3, dur: 5 }, affinities: { fuego: 3 }, tags: ['gema', 'elemental'], alchemy: { fuego: 3 }, description: 'Una piedra que late como brasa. Quema si la tenés mucho en la mano.' },
  { id: 'piedra_viva', name: 'Piedra viva', type: 'gema', tier: 2, price: 34, color: '#8a7a5a', stats: { def: 4, dur: 8 }, affinities: { tierra: 3 }, tags: ['gema', 'elemental'], alchemy: { proteccion: 2 }, description: 'El corazón de un elemental de tierra. Pesa el doble de lo que parece.' },
  { id: 'ojo_ciclope', name: 'Ojo de Rocamuda', type: 'gema', tier: 3, price: 120, color: '#f2e6a8', stats: { atk: 5, dur: 6 }, affinities: { rayo: 2, tierra: 2 }, tags: ['jefe', 'legendario', 'gema'], description: 'El único ojo del cíclope de las cumbres. Dicen que todavía ve lejos.' },
  { id: 'corazon_cienaga', name: 'Corazón de la Ciénaga', type: 'gema', tier: 3, price: 120, color: '#5a8a3a', stats: { def: 5, dur: 8 }, affinities: { veneno: 3, agua: 2 }, tags: ['jefe', 'legendario', 'gema'], description: 'Late despacio, como el pantano. El que lo lleva se cura de cualquier veneno.' },
];

export const SYNERGIES_6C: Synergy[] = [
  { id: 'placas_gigantes', name: 'Placas de gigante', secret: false, when: [{ kind: 'materialInSlot', material: 'hueso_gigante', slot: 'placas' }], effect: { statPct: { def: 20 }, trait: 'bastion' }, description: 'Un peto con placas de hueso de gigante: una muralla con correas.', hint: 'Lo que protegía a un gigante puede proteger a una persona.' },
  { id: 'forro_grueso', name: 'Forro de piel gruesa', secret: false, when: [{ kind: 'materialInSlot', material: 'piel_gruesa', slot: 'forro' }], effect: { statPct: { def: 10 }, trait: 'piel_dura' }, description: 'Forro de piel de ogro: los golpes llegan amortiguados.', hint: 'La piel de un ogro no se corta fácil.' },
  { id: 'pomo_magma', name: 'Pomo de magma', secret: false, when: [{ kind: 'materialInSlot', material: 'cristal_magma', slot: 'pomo' }], effect: { affinity: { fuego: 2 }, trait: 'quemadura' }, description: 'Un cristal de magma en el pomo: la hoja arde al golpear.', hint: 'Una piedra que late como brasa quiere estar cerca de un filo.' },
  { id: 'engarce_marea', name: 'Engarce de marea', secret: false, when: [{ kind: 'materialInSlot', material: 'cristal_marea', slot: 'engarce' }], effect: { affinity: { agua: 2 }, valuePct: 15 }, description: 'Un anillo con cristal de marea: protege del agua y moja los golpes.', hint: 'Lo que deja un elemental de agua sigue húmedo en un anillo.' },
  { id: 'colgante_piedra_viva', name: 'Colgante de piedra viva', secret: true, when: [{ kind: 'materialInSlot', material: 'piedra_viva', slot: 'colgante' }], effect: { affinity: { tierra: 2 }, trait: 'resiliencia' }, description: 'Un amuleto con piedra viva: quien lo lleva no se deja doblegar.', hint: 'El corazón de la tierra, colgado del cuello.' },
  { id: 'ojo_del_ciclope', name: 'El ojo que ve lejos', secret: true, when: [{ kind: 'materialInSlot', material: 'ojo_ciclope', slot: 'engarce' }], effect: { trait: 'disparo_certero', affinity: { rayo: 2 }, valuePct: 40 }, description: 'Un anillo con el ojo de Rocamuda: cada disparo encuentra su blanco.', hint: 'El cíclope veía lejos. Su ojo todavía lo hace.' },
  { id: 'corazon_pantano', name: 'El corazón del pantano', secret: true, when: [{ kind: 'materialInSlot', material: 'corazon_cienaga', slot: 'colgante' }], effect: { trait: 'regenerativo', affinity: { veneno: 2 }, valuePct: 40 }, description: 'Un amuleto con el corazón de la Ciénaga: las heridas se cierran solas.', hint: 'El pantano se cura de todo. Su corazón también.' },
];

export const QUENCH_6C: QuenchMedium[] = [
  { id: 'sangre_troll', name: 'Sangre de troll', cost: { material: 'sangre_troll', qty: 1 }, hardness: -1, effect: { trait: 'regenerativo', statPct: { dur: 10 } }, description: 'Templada en sangre de troll: la pieza (y quien la usa) se recupera sola.' },
];

export const POTIONS_6C: PotionDef[] = [
  {
    id: 'brebaje_troll', name: 'Brebaje de troll', secret: true, requires: { curacion: 4, vigor: 2 }, priority: 4, main: 'curacion',
    output: { kind: 'pocion', effect: { type: 'estado', status: 'regenerando', turns: 6 } }, qty: 2, value: 34, color: '#3a7a3a',
    description: 'Regenera mucha vida durante seis turnos. Sabe a pantano.',
  },
];

// ───────────────────────── Monstruos ─────────────────────────

export const MONSTERS_6C: MonsterDef[] = [
  // Gigantes
  {
    id: 'ogro', name: 'Ogro', family: 'gigantes', tier: 2, aggressive: true,
    hp: 110, atk: 20, def: 6, spd: 3, move: 3, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.8 }, elemental: { fuego: 1.2 }, skills: ['garrotazo'], ai: 'bruto', threat: 7, slots: ALL,
    loot: [{ material: 'piel_gruesa', chance: 0.7, qty: [1, 2], skin: true, spoiledBy: ['fuego'] }, { material: 'hueso_gigante', chance: 0.5, qty: [1, 1] }],
    sprite: { key: 'mon.ogro', tint: 0xb8a078 }, description: 'Grande, lento y con un garrote del tamaño de una persona. Empuja a quien golpea.',
  },
  {
    id: 'troll', name: 'Troll de ciénaga', family: 'gigantes', tier: 2, regen: 6,
    hp: 120, atk: 18, def: 7, spd: 3, move: 3, jump: 1, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.9 }, elemental: { fuego: 1.8, veneno: 0.5 }, skills: ['zarpazo'], ai: 'tanque', threat: 8, slots: ALL,
    loot: [{ material: 'sangre_troll', chance: 0.8, qty: [1, 2], spoiledBy: ['fuego'] }, { material: 'piel_gruesa', chance: 0.4, qty: [1, 1], skin: true }],
    sprite: { key: 'mon.ogro', tint: 0x6a9a5a }, description: 'Se cura solo cada turno. El fuego es lo único que le cierra las heridas para siempre.',
  },
  {
    id: 'ciclope', name: 'Cíclope', family: 'gigantes', tier: 3, rare: true,
    hp: 160, atk: 22, def: 8, spd: 4, move: 3, jump: 2, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.8 }, elemental: { rayo: 1.3 }, skills: ['garrotazo', 'roca_lanzada'], ai: 'bruto', threat: 11, slots: ALL,
    loot: [{ material: 'hueso_gigante', chance: 1, qty: [1, 2] }, { material: 'piedra_viva', chance: 0.4, qty: [1, 1] }],
    sprite: { key: 'mon.ciclope', tint: 0xc8b8a0 }, description: 'Tira rocas desde lejos y pega con todo de cerca. Raro de ver, y mejor así.',
  },
  // Elementales
  {
    id: 'elemental_agua', name: 'Elemental de agua', family: 'elementales', tier: 2,
    hp: 55, atk: 14, def: 4, spd: 5, move: 3, jump: 2, evasion: 0.1, damageType: 'contundente',
    resist: { cortante: 0.7, perforante: 0.6 }, elemental: { rayo: 1.8, agua: 0, fuego: 0.6, veneno: 0 }, affinities: { agua: 2 },
    immune: ['sangrado', 'veneno', 'quemadura'], skills: ['chorro'], ai: 'tirador', threat: 5, slots: ALL,
    loot: [{ material: 'cristal_marea', chance: 0.6, qty: [1, 1] }],
    sprite: { key: 'mon.elemental', tint: 0x4ab0e8 }, description: 'Moja todo a su alrededor. El rayo lo parte en gotas.',
  },
  {
    id: 'elemental_fuego', name: 'Elemental de fuego', family: 'elementales', tier: 2,
    hp: 50, atk: 15, def: 3, spd: 6, move: 3, jump: 2, evasion: 0.1, damageType: 'contundente',
    resist: { cortante: 0.7, perforante: 0.6 }, elemental: { agua: 1.8, hielo: 1.6, fuego: 0, veneno: 0 }, affinities: { fuego: 2 },
    immune: ['sangrado', 'veneno', 'quemadura'], skills: ['golpe_igneo'], ai: 'bruto', threat: 5, slots: ALL,
    loot: [{ material: 'cristal_magma', chance: 0.6, qty: [1, 1], spoiledBy: ['agua', 'hielo'] }, { material: 'esencia_ignea', chance: 0.2, qty: [1, 1] }],
    sprite: { key: 'mon.elemental', tint: 0xff7a3a }, description: 'Prende la hierba por donde pasa. Agua y hielo lo apagan (y arruinan su cristal).',
  },
  {
    id: 'elemental_viento', name: 'Elemental de viento', family: 'elementales', tier: 2,
    hp: 42, atk: 13, def: 2, spd: 9, move: 5, jump: 4, evasion: 0.25, damageType: 'cortante',
    resist: { contundente: 0.6 }, elemental: { tierra: 1.6, viento: 0, veneno: 0 }, affinities: { viento: 2 },
    immune: ['sangrado', 'veneno', 'inmovilizado'], skills: ['rafaga'], ai: 'tirador', threat: 5, slots: ALL,
    loot: [{ material: 'cristal_viento', chance: 0.6, qty: [1, 1] }],
    sprite: { key: 'mon.elemental', tint: 0xc8f0e0 }, description: 'Rápido y difícil de acertar. Empuja con ráfagas de viento.',
  },
  {
    id: 'elemental_tierra', name: 'Elemental de tierra', family: 'elementales', tier: 2,
    hp: 80, atk: 16, def: 10, spd: 2, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { cortante: 0.6, perforante: 0.5 }, elemental: { viento: 1.6, agua: 1.3, tierra: 0, veneno: 0 }, affinities: { tierra: 2 },
    immune: ['sangrado', 'veneno', 'aturdido'], skills: ['golpe_tectonico'], ai: 'tanque', threat: 6, slots: ALL,
    loot: [{ material: 'piedra_viva', chance: 0.6, qty: [1, 1] }],
    sprite: { key: 'mon.elemental', tint: 0x8a7a5a }, description: 'Una roca con ganas de aplastar. El viento lo erosiona.',
  },
  // Jefes
  {
    id: 'rocamuda', name: 'Rocamuda, el cíclope de las cumbres', family: 'gigantes', tier: 3, boss: true,
    hp: 360, atk: 22, def: 10, spd: 4, move: 3, jump: 2, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.8 }, elemental: { rayo: 1.4 }, immune: ['aturdido'],
    skills: ['garrotazo', 'avalancha'], ai: 'jefe', threat: 18, slots: ALL,
    halfHp: { text: 'Rocamuda ruge y arranca un pedazo de montaña.', skills: ['garrotazo', 'avalancha', 'roca_lanzada'], atkPct: 20, summon: ['ogro'] },
    loot: [{ material: 'ojo_ciclope', chance: 1, qty: [1, 1] }, { material: 'hueso_gigante', chance: 1, qty: [2, 4] }, { material: 'piedra_viva', chance: 1, qty: [1, 2] }],
    sprite: { key: 'mon.ciclope', tint: 0xa89878, scale: 1.5 }, description: 'El cíclope más viejo de las cumbres. Anuncia sus avalanchas: hay que salir de abajo.',
  },
  {
    id: 'madre_cienaga', name: 'Madre Ciénaga', family: 'gigantes', tier: 3, boss: true, regen: 8,
    hp: 360, atk: 21, def: 9, spd: 3, move: 3, jump: 1, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.9 }, elemental: { fuego: 1.7, veneno: 0 }, immune: ['veneno', 'aturdido'],
    skills: ['zarpazo', 'marea_cienaga'], ai: 'jefe', threat: 18, slots: ALL,
    halfHp: { text: 'Madre Ciénaga se hunde en el barro y llama al pantano.', summon: ['elemental_agua'], skills: ['zarpazo', 'marea_cienaga', 'nube_toxica'], atkPct: 15 },
    loot: [{ material: 'corazon_cienaga', chance: 1, qty: [1, 1] }, { material: 'sangre_troll', chance: 1, qty: [2, 4] }, { material: 'cristal_marea', chance: 1, qty: [1, 2] }],
    sprite: { key: 'mon.ogro', tint: 0x4a7a3a, scale: 1.55 }, description: 'La troll más vieja del pantano. Se cura sola cada turno: hay que quemarla o pegarle muy fuerte.',
  },
];

export const SKILLS_6C: CombatSkill[] = [
  { id: 'garrotazo', name: 'Garrotazo', range: [1, 1] as [number, number], target: 'enemy' as const, power: 1.3, damageType: 'contundente' as const, push: 1, cooldown: 0, description: 'Un golpe que empuja.' },
  { id: 'roca_lanzada', name: 'Roca lanzada', range: [2, 4] as [number, number], target: 'enemy' as const, power: 1.2, damageType: 'contundente' as const, cooldown: 1, description: 'Una roca que vuela lejos.' },
  {
    id: 'avalancha', name: 'Avalancha', range: [1, 5] as [number, number], target: 'tile' as const, area: 'radius' as const, size: 1, power: 1.6, element: 'tierra' as const,
    telegraph: true, cooldown: 2, description: 'Marca un círculo de piedras y al turno siguiente se viene abajo.',
  },
  {
    id: 'marea_cienaga', name: 'Marea de la ciénaga', range: [1, 4] as [number, number], target: 'tile' as const, area: 'radius' as const, size: 1, power: 1.4, element: 'agua' as const,
    terrain: 'charco' as const, telegraph: true, cooldown: 2, description: 'El barro sube en las casillas marcadas y al turno siguiente las inunda.',
  },
];

// ───────────────────────── Arenas ─────────────────────────

const PARTY = [{ x: 0, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 2 }, { x: 1, y: 5 }];
const ENEMY = [{ x: 9, y: 1 }, { x: 8, y: 2 }, { x: 9, y: 3 }, { x: 8, y: 4 }, { x: 9, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 7 }];
export const ARENAS_6C: ArenaDef[] = [
  { id: 'montana_cornisa', biome: 'montana', terrain: ['..........', '...##.....', '..........', '.....#....', '..........', '..##......', '.......#..', '..........'], heights: ['0011122233', '0011122233', '0011122233', '0011122233', '0011122233', '0011122233', '0011122233', '0011122233'], partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'montana_paso', biome: 'montana', terrain: ['##........', '#.........', '...,,..#..', '..........', '..........', '...#..,,..', '#.........', '##........'], heights: ['0000111000', '0001221000', '0012332100', '0012332100', '0012332100', '0012332100', '0001221000', '0000111000'], partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'pantano_charcos', biome: 'pantano', terrain: ['...ww.....', '.,,ww..,,.', '.......ww.', '..ww......', '..ww..,,..', '......ww..', '.,,...ww..', '..........'], heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000'], partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'pantano_islotes', biome: 'pantano', terrain: ['..w.......', '..w..ww...', '.....ww.,,', 'ww........', '....,,..ww', '..ww......', '..ww..w...', '......w...'], heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000110000', '0000000000', '0000000000', '0000000000'], partySpawns: PARTY, enemySpawns: ENEMY },
];

// ───────────────────────── Regiones ─────────────────────────

const MONTE_TERRAIN = [
  'RRRRRRRRRRRRRRRRRRRRRRRR',
  'R..t...h..v...R...g...RR',
  'R.m...,,....m.....m...gR',
  'R...v..,,.........v..B.R',
  'E=====....t...R.....c..R',
  'R....====.....R...R....R',
  'R..c.....===..m.....m..R',
  'R.m..t.....===....R....R',
  'R......v.....====...g..R',
  'R..h..R.......m.=......R',
  'R.......,,..v...=...m..R',
  'R..m...,,,.......=.....R',
  'R...t.......c.....v..h.R',
  'R.v....m..R.......m....R',
  'R....h........R.....c..R',
  'RRRRRRRRRRRRRRRRRRRRRRRR',
];
// Va subiendo de oeste a este, de a un nivel por vez.
const MONTE_COLS = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4];
const MONTE_HEIGHTS = MONTE_TERRAIN.map(() => MONTE_COLS.join(''));

const PANTANO_TERRAIN = [
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'T..,,..h..ww...,,.ww..hT',
  'T.m.,,....ww.m.....w.m.T',
  'T...h...t..w....h..ww..T',
  'E====..,,...==...m....BT',
  'T...===...v...===.....,T',
  'T.c...==..ww....==..c..T',
  'T..m....=.ww..m...==...T',
  'T,,...,,=.....h.....=.mT',
  'T,,.h...==..ww....t..=.T',
  'T..ww...m=...ww.,,....hT',
  'T..ww.....=.....,,m.w..T',
  'T.h...t...==..c...ww...T',
  'T..m..,,...h..m.....h..T',
  'T...c....ww....,,..t..cT',
  'TTTTTTTTTTTTTTTTTTTTTTTT',
];
const zones3 = (t: string[]) => t.map(() => '1'.repeat(8) + '2'.repeat(8) + '3'.repeat(8));

const zone = (z: ZoneDef) => z;
export const REGIONS_6C: RegionDef[] = [
  {
    id: 'montanas_grises', name: 'Montañas Grises', danger: 5, available: true, travelSlots: 2, world: { x: 980, y: 140 },
    description: 'Laderas de piedra y nieve. Minerales buenos, gigantes peores y, en la cumbre, un cíclope que no deja pasar a nadie.',
    terrain: MONTE_TERRAIN, heights: MONTE_HEIGHTS, zones: zones3(MONTE_TERRAIN), zoneTiles: ['tile.dirt', 'tile.stone', 'tile.stone'], bossArena: 'montana_paso',
    zoneDefs: [
      zone({
        id: 'faldas', name: 'Faldas', danger: 3, biome: 'colinas', budget: [8, 11], groups: [2, 3], families: { bestias: 2, goblins: 1 },
        vetas: [{ material: 'hierro', weight: 3, tier: 1, qty: [2, 4] }, { material: 'plata', weight: 2, tier: 2, qty: [1, 2] }, { material: 'cobre', weight: 2, tier: 1, qty: [2, 3] }],
        arboles: [{ material: 'roble', weight: 2, tier: 1, qty: [1, 2] }, { material: 'pino', weight: 2, tier: 1, qty: [2, 3] }],
        hierbas: [{ material: 'cardo_hierro', weight: 2, tier: 2, qty: [1, 2] }, { material: 'flor_brasa', weight: 2, tier: 1, qty: [1, 2] }],
        gemas: [{ material: 'rubi', weight: 2, tier: 2, qty: [1, 1] }, { material: 'amatista', weight: 2, tier: 2, qty: [1, 1] }],
        cofres: { gold: [40, 80], materials: [{ material: 'plata', chance: 0.4, qty: [1, 2] }], grimoires: [] },
      }),
      zone({
        id: 'riscos', name: 'Riscos', danger: 4, biome: 'montana', budget: [11, 15], groups: [2, 3], families: { gigantes: 3, bestias: 1 },
        vetas: [{ material: 'plata', weight: 2, tier: 2, qty: [1, 2] }, { material: 'brasalita', weight: 2, tier: 2, qty: [1, 2] }],
        arboles: [{ material: 'sauceluna', weight: 1, tier: 2, qty: [1, 2] }],
        gemas: [{ material: 'zafiro', weight: 2, tier: 2, qty: [1, 1] }, { material: 'cristal_viento', weight: 1, tier: 2, qty: [1, 1] }, { material: 'piedra_viva', weight: 1, tier: 2, qty: [1, 1] }],
        cofres: { gold: [60, 110], materials: [{ material: 'hueso_gigante', chance: 0.3, qty: [1, 1] }, { material: 'brasalita', chance: 0.4, qty: [1, 2] }], grimoires: [{ id: 'manual_guardian', chance: 0.08 }] },
      }),
      zone({
        id: 'cumbre', name: 'Cumbre', danger: 5, biome: 'montana', budget: [14, 19], groups: [2, 3], families: { gigantes: 2, elementales: 2 },
        vetas: [{ material: 'brasalita', weight: 2, tier: 2, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'opalo_lunar', weight: 1, tier: 3, qty: [1, 1] }, { material: 'cristal_viento', weight: 2, tier: 2, qty: [1, 1] }, { material: 'piedra_viva', weight: 2, tier: 2, qty: [1, 1] }],
        cofres: { gold: [80, 150], materials: [{ material: 'opalo_lunar', chance: 0.2, qty: [1, 1] }, { material: 'hueso_gigante', chance: 0.4, qty: [1, 2] }], grimoires: [{ id: 'libro_tormentas', chance: 0.1 }] },
      }),
    ],
    boss: { monsters: ['rocamuda', 'ogro'], zone: 3 },
  },
  {
    id: 'pantano_niebla', name: 'Pantano de Niebla', danger: 5, available: true, travelSlots: 2, world: { x: 330, y: 380 },
    description: 'Agua quieta, niebla espesa y hongos que brillan. Trolls que se curan solos y elementales que salen del barro.',
    terrain: PANTANO_TERRAIN, heights: PANTANO_TERRAIN.map((r) => '0'.repeat(r.length)), zones: zones3(PANTANO_TERRAIN),
    zoneTiles: ['tile.grass', 'tile.darkgrass', 'tile.darkgrass'], bossArena: 'pantano_islotes',
    zoneDefs: [
      zone({
        id: 'orilla', name: 'Orilla', danger: 3, biome: 'pantano', budget: [8, 11], groups: [2, 3], families: { gelines: 2, bestias: 1 },
        vetas: [], arboles: [{ material: 'sauceluna', weight: 2, tier: 2, qty: [1, 2] }, { material: 'fresno', weight: 2, tier: 1, qty: [1, 2] }],
        hierbas: [{ material: 'hoja_alivio', weight: 3, tier: 1, qty: [1, 2] }, { material: 'raiz_amarga', weight: 2, tier: 1, qty: [1, 2] }, { material: 'hongo_niebla', weight: 3, tier: 1, qty: [1, 3] }],
        cofres: { gold: [40, 80], materials: [{ material: 'esmeralda', chance: 0.2, qty: [1, 1] }], grimoires: [] },
      }),
      zone({
        id: 'cienaga', name: 'Ciénaga', danger: 4, biome: 'pantano', budget: [11, 15], groups: [2, 3], families: { elementales: 2, gigantes: 1 },
        vetas: [], arboles: [{ material: 'sauceluna', weight: 1, tier: 2, qty: [1, 2] }],
        hierbas: [{ material: 'hongo_niebla', weight: 2, tier: 1, qty: [1, 3] }, { material: 'musgo_frio', weight: 2, tier: 1, qty: [1, 2] }, { material: 'lirio_nocturno', weight: 2, tier: 2, qty: [1, 2], night: true }],
        gemas: [{ material: 'esmeralda', weight: 2, tier: 2, qty: [1, 1] }, { material: 'cristal_marea', weight: 1, tier: 2, qty: [1, 1] }],
        cofres: { gold: [60, 110], materials: [{ material: 'sangre_troll', chance: 0.4, qty: [1, 1] }, { material: 'cristal_marea', chance: 0.3, qty: [1, 1] }], grimoires: [{ id: 'cantos_marea', chance: 0.1 }] },
      }),
      zone({
        id: 'corazon', name: 'Corazón del pantano', danger: 5, biome: 'pantano', budget: [14, 19], groups: [2, 3], families: { gigantes: 2, elementales: 2 },
        vetas: [], arboles: [],
        hierbas: [{ material: 'lirio_nocturno', weight: 2, tier: 2, qty: [1, 2], night: true }, { material: 'hongo_niebla', weight: 2, tier: 1, qty: [2, 3] }],
        gemas: [{ material: 'cristal_marea', weight: 2, tier: 2, qty: [1, 1] }, { material: 'jade', weight: 1, tier: 2, qty: [1, 1] }],
        cofres: { gold: [80, 150], materials: [{ material: 'sangre_troll', chance: 0.5, qty: [1, 2] }, { material: 'esencia_vital', chance: 0.3, qty: [1, 1] }], grimoires: [] },
      }),
    ],
    boss: { monsters: ['madre_cienaga', 'elemental_agua'], zone: 3 },
  },
];

// ───────────────────────── Tiendas especializadas de Valdebrasa ─────────────────────────

const shopScene = (prop: string, npc: string, label: string): CityLocation['scene'] => ({
  cols: 9, rows: 8, floor: 'tile.wood',
  props: [
    { key: 'prop.counter', x: 3, y: 2, blocks: true }, { key: 'prop.counter', x: 4, y: 2, blocks: true },
    { key: prop, x: 1, y: 0, blocks: true }, { key: prop, x: 6, y: 0, blocks: true },
    { key: 'prop.crate', x: 0, y: 5, blocks: true }, { key: 'prop.lamp', x: 8, y: 7, blocks: true },
  ],
  spawn: { x: 4, y: 5 }, doors: [{ x: 4, y: 7 }],
  hotspots: [{ id: 'mostrador', label, x: 3, y: 2, action: 'market' }],
  npcSpots: { [npc]: { x: 4, y: 1 } },
  ambient: { 'mañana': 1, tarde: 2, noche: 0 }, carts: false, animals: [],
});

/** Reemplazos para los lugares que estaban cerrados en Valdebrasa. */
export const SHOPS_6C: Record<string, Partial<CityLocation>> = {
  curtidor: {
    name: 'Curtiembre de Tanino', available: true, owner: 'tanino', description: 'Cueros de todo tipo, incluida la piel gruesa de los ogros.',
    stock: ['cuero_curtido', 'cuero_endurecido', 'piel_jabali', 'cuero_lobo', 'piel_gruesa', 'tripa_trenzada', 'cuerda_lino'],
    scene: shopScene('prop.rack', 'tanino', 'Cueros'),
  },
  maderero: {
    name: 'Aserradero Duela', available: true, owner: 'fabiola', description: 'Maderas del valle y, a veces, ébano que trae algún barco.',
    stock: ['pino', 'fresno', 'roble', 'sauceluna', 'ebano'],
    scene: shopScene('prop.crate', 'fabiola', 'Maderas'),
  },
  joyero: {
    name: 'Joyería Engaste', available: true, owner: 'silvestre', description: 'Gemas talladas y metales finos para la joyería.',
    stock: ['plata', 'rubi', 'zafiro', 'esmeralda', 'ambar', 'amatista', 'jade', 'coral_rojo'],
    scene: shopScene('prop.shelf', 'silvestre', 'Gemas'),
  },
};

const rel = (npc: string, delta: number): DialogueEffect => ({ type: 'relation', npc, delta });

export const NPCS_6C: Npc[] = [
  {
    id: 'tanino', name: 'Tanino Correa', role: 'Curtidor', city: 'valdebrasa', location: 'curtidor',
    personality: ['meticuloso', 'olor fuerte', 'buen corazón', 'odia el desperdicio'],
    gifts: { ama: ['cuchillo_desuello', 'piel_gruesa'], gusta: ['cuero_lobo', 'herramienta'], disgusta: ['joyeria'] },
    routine: { 'mañana': 'curtidor', tarde: 'curtidor', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Precio de cliente fijo (10%).', perks: [{ kind: 'discount', pct: 10 }] },
      { level: 'amigo', description: 'Te guarda pelajes de lobo albino.', perks: [{ kind: 'stock', materials: ['pelaje_albino'] }] },
    ],
    look: { body: 0x7a5a3a, hair: 0x3a2418, accent: 0xc8a050 }, busyLines: ['Tengo cueros en remojo. Mañana.'],
    description: 'Curte cueros desde chico. Dice que se puede leer la vida de un animal en su piel.',
  },
  {
    id: 'fabiola', name: 'Fabiola Duela', role: 'Maderera', city: 'valdebrasa', location: 'maderero',
    personality: ['fuerte', 'directa', 'ama los árboles viejos', 'detesta la tala salvaje'],
    gifts: { ama: ['hacha_tala', 'ebano'], gusta: ['herramienta', 'sauceluna'], disgusta: ['fuego'] },
    routine: { 'mañana': 'maderero', tarde: 'maderero', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Precio de cliente fijo (10%).', perks: [{ kind: 'discount', pct: 10 }] },
      { level: 'amigo', description: 'Te enseña a elegir la madera para los arcos.', perks: [{ kind: 'teach', synergy: 'arco_ebano' }] },
    ],
    look: { body: 0x4a6a3a, hair: 0x8a4a2a, accent: 0xd9a441 }, busyLines: ['Estoy aserrando. Mañana.'],
    description: 'Hereda el aserradero de su abuela. Planta dos árboles por cada uno que corta.',
  },
  {
    id: 'silvestre', name: 'Silvestre Engaste', role: 'Joyero', city: 'valdebrasa', location: 'joyero',
    personality: ['delicado', 'perfeccionista', 'chismoso con los nobles', 'le teme a los ladrones'],
    gifts: { ama: ['joyeria', 'perla_negra'], gusta: ['plata', 'gema'], disgusta: ['chatarra_goblin', 'municion'] },
    routine: { 'mañana': 'joyero', tarde: 'joyero' },
    unlocks: [
      { level: 'conocido', description: 'Te cuenta qué gemas buscan los nobles.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Precio de colega (15%) y ópalos lunares.', perks: [{ kind: 'discount', pct: 15 }, { kind: 'stock', materials: ['opalo_lunar'] }] },
    ],
    rumors: ['Silvestre: "Doña Violante quiere esmeraldas para el invierno. Lo sé de muy buena fuente."'],
    look: { body: 0x5a3a7a, hair: 0xe8e2d0, accent: 0x7af0ff }, busyLines: ['Estoy engarzando. Shh.'],
    description: 'Talla gemas con una lupa en cada ojo. No deja entrar a nadie con las manos sucias.',
  },
];

export const DIALOGUES_6C: Dialogue[] = [
  {
    id: 'tanino_intro', npc: 'tanino', priority: 100, once: true, start: 'a',
    nodes: { a: { id: 'a', speaker: 'tanino', text: '¡Bienvenido! Perdón el olor. Cueros curtidos, endurecidos, de lobo... y si me traés piel de ogro, te la dejo como seda.', options: [{ text: 'Vengo a comprar.', effects: [rel('tanino', 4)] }] } },
  },
  {
    id: 'fabiola_intro', npc: 'fabiola', priority: 100, once: true, start: 'a',
    nodes: { a: { id: 'a', speaker: 'fabiola', text: 'Madera buena, cortada con respeto. Si venís a pedir que tale el roble viejo de la plaza, ya te podés ir.', options: [{ text: 'Solo busco madera para mangos y arcos.', effects: [rel('fabiola', 4)] }, { text: 'Ese roble estaría lindo para un escudo...', effects: [rel('fabiola', -5)] }] } },
  },
  {
    id: 'silvestre_intro', npc: 'silvestre', priority: 100, once: true, start: 'a',
    nodes: { a: { id: 'a', speaker: 'silvestre', text: 'Las manos, por favor. ...Limpias. Bien. Gemas talladas, plata fina. Un herrero que hace joyas, qué curioso.', options: [{ text: 'Me interesan las gemas.', effects: [rel('silvestre', 4)] }] } },
  },
];

export const QUESTS_6C: QuestDef[] = [
  {
    id: 'g_ogros', title: 'Ogros en el camino de las minas', board: 'gremio', giver: 'aldana', repeatable: true, weight: 1.5, minReputation: 15,
    text: 'Los ogros de las Montañas Grises bajan a robar mulas. El gremio paga por cada uno.', done: 'Los mineros respiran tranquilos.',
    objective: { kind: 'hunt', family: 'gigantes', count: 4 }, days: 8, reward: { gold: 260, reputation: 5, relation: 3 }, penalty: { reputation: 3, relation: 3 },
  },
  {
    id: 'g_elementales', title: 'Lo que sale del barro', board: 'gremio', client: 'Academia de magos', repeatable: true, weight: 1.2, minReputation: 15,
    text: 'La Academia paga por estudiar elementales. Bueno, por estudiar lo que queda de ellos.', done: 'Un mago anota todo en un cuaderno, fascinado.',
    objective: { kind: 'hunt', family: 'elementales', count: 5 }, days: 8, reward: { gold: 240, reputation: 4, materials: [{ id: 'esencia_tormenta', qty: 1 }] }, penalty: { reputation: 2 },
  },
  {
    id: 't_piel_gruesa', title: 'Piel de ogro', board: 'tablon', giver: 'tanino', repeatable: true, weight: 1,
    text: 'Tanino busca tres piezas de piel gruesa para un cliente exigente.', done: 'Tanino huele la piel y sonríe. "Excelente."',
    objective: { kind: 'materials', material: 'piel_gruesa', qty: 3 }, days: 8, reward: { gold: 120, relation: 6, reputation: 2 }, penalty: { relation: 3 },
  },
  {
    id: 'g_rocamuda', title: 'El cíclope de las cumbres', board: 'gremio', giver: 'aldana', repeatable: true, weight: 0.6, minReputation: 35,
    text: 'Rocamuda no deja pasar a nadie por las cumbres. El gremio paga una fortuna.', done: 'El gremio te pone en la pared de los grandes.',
    objective: { kind: 'boss', region: 'montanas_grises' }, days: 10, reward: { gold: 450, reputation: 12, relation: 6 }, penalty: { reputation: 4, relation: 4 },
  },
  {
    id: 'g_madre', title: 'La madre del pantano', board: 'gremio', giver: 'aldana', repeatable: true, weight: 0.6, minReputation: 35,
    text: 'Madre Ciénaga se come a los recolectores de hongos. Hay que quemarla.', done: 'Los recolectores vuelven al pantano, con cuidado.',
    objective: { kind: 'boss', region: 'pantano_niebla' }, days: 10, reward: { gold: 450, reputation: 12, relation: 6 }, penalty: { reputation: 4, relation: 4 },
  },
];
