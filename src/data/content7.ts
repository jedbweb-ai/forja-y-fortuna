import type { ArenaDef, CombatSkill, MonsterDef } from '../core/combat/types';
import type { QuestDef } from '../core/town/types';
import type { Material, QuenchMedium, Synergy } from '../core/types';
import type { RegionDef, ZoneDef } from '../core/world/types';

// Regiones de nivel alto: Ruinas del Vigía (demonios) y Tierras del Dragón (dracónidos).

const ALL = ['mañana', 'tarde', 'noche'] as ('mañana' | 'tarde' | 'noche')[];

// ───────────────────────── Materiales ─────────────────────────

export const MATERIALS_7: Material[] = [
  { id: 'garra_demonio', name: 'Garra de demonio', type: 'monstruo', tier: 3, price: 40, color: '#5a2a3a', stats: { atk: 7, dur: 6, wgt: 1 }, affinities: { oscuro: 2 }, tags: ['demonio', 'filo'], description: 'Negra y curva. Las heridas que abre no paran de sangrar.' },
  { id: 'cuerno_demonio', name: 'Cuerno de demonio', type: 'monstruo', tier: 3, price: 44, color: '#3a2a2a', stats: { atk: 5, def: 3, dur: 10, wgt: 2 }, affinities: { oscuro: 2 }, tags: ['demonio', 'trofeo'], description: 'Retorcido y tibio. Dicen que todavía escucha a su dueño.' },
  { id: 'sangre_infernal', name: 'Sangre infernal', type: 'monstruo', tier: 3, price: 38, color: '#a8202a', stats: {}, tags: ['demonio', 'liquido'], alchemy: { fuego: 3, vigor: 1 }, description: 'Hierve sola dentro del frasco. Para templar es perfecta, si no te quema las manos.' },
  { id: 'corona_malgor', name: 'Corona de Malgor', type: 'gema', tier: 3, price: 150, color: '#7a1a3a', stats: { atk: 4, dur: 6 }, affinities: { oscuro: 3, fuego: 1 }, tags: ['jefe', 'legendario', 'gema'], description: 'Los cuernos del señor de la Grieta, fundidos en un aro. Pesa más de lo que debería.' },
  { id: 'escama_dragon', name: 'Escama de dragón', type: 'monstruo', tier: 3, price: 55, color: '#b8402a', stats: { def: 8, dur: 30, wgt: 2 }, affinities: { fuego: 2 }, tags: ['dragon', 'escama'], description: 'Dura como el acero y tibia como una brasa. El fuego no la marca.' },
  { id: 'colmillo_wyvern', name: 'Colmillo de wyvern', type: 'monstruo', tier: 3, price: 38, color: '#e8e0c0', stats: { atk: 8, dur: 8 }, affinities: { veneno: 2 }, tags: ['dragon', 'filo'], description: 'Hueco por dentro: por ahí corre el veneno.' },
  { id: 'cuero_wyvern', name: 'Cuero de wyvern', type: 'cuero', tier: 3, price: 36, color: '#5a7a4a', stats: { def: 7, dur: 18, wgt: 1, spd: 1 }, tags: ['dragon', 'liviano'], description: 'Fino como un ala y duro como una montura vieja.' },
  { id: 'corazon_dragon', name: 'Corazón de dragón', type: 'gema', tier: 3, price: 220, color: '#ff5a2a', stats: { atk: 6, def: 4, dur: 10 }, affinities: { fuego: 4 }, tags: ['jefe', 'legendario', 'gema'], description: 'Todavía late. Ilumina la herrería entera de noche.' },
];

export const SYNERGIES_7: Synergy[] = [
  { id: 'hierro_demoniaco', name: 'Hierro demoníaco', secret: false, when: [{ kind: 'materials', all: ['hierro', 'garra_demonio'] }], effect: { affinity: { oscuro: 2 }, trait: 'sangrado' }, description: 'Hierro con garras de demonio: daño oscuro y heridas que sangran.', hint: 'El hierro de siempre, con algo que salió de la Grieta.' },
  { id: 'pomo_cornudo', name: 'Pomo cornudo', secret: false, when: [{ kind: 'materialInSlot', material: 'cuerno_demonio', slot: 'pomo' }], effect: { affinity: { oscuro: 1 }, trait: 'roba_vida' }, description: 'Un cuerno de demonio en el pomo: el arma se alimenta de lo que corta.', hint: 'Un cuerno que todavía escucha, en la mano de quien pelea.' },
  { id: 'peto_escamas', name: 'Peto de escamas', secret: false, when: [{ kind: 'materialInSlot', material: 'escama_dragon', slot: 'placas' }], effect: { statPct: { dur: 30 }, trait: 'ignifuga' }, description: 'Placas de escama de dragón: el fuego no entra y casi no se gasta.', hint: 'Lo que protegía a un dragón del fuego puede proteger a una persona.' },
  { id: 'escudo_escamas', name: 'Escudo de escamas', secret: false, when: [{ kind: 'materialInSlot', material: 'escama_dragon', slot: 'refuerzo' }], effect: { statPct: { dur: 30, def: 10 }, trait: 'ignifuga' }, description: 'Un escudo reforzado con escamas: aguanta el aliento de un dragón.', hint: 'Escamas sobre la madera, como en la espalda de un dragón.' },
  { id: 'hoja_escama', name: 'Hoja de escama', secret: false, when: [{ kind: 'materialInSlot', material: 'escama_dragon', slot: 'hoja' }], effect: { statPct: { dur: 25 }, affinity: { fuego: 1 } }, description: 'Una hoja con escama de dragón: resiste el fuego y dura muchísimo.', hint: 'Una escama también puede tener filo.' },
  { id: 'puntas_wyvern', name: 'Puntas de wyvern', secret: false, when: [{ kind: 'materialInSlot', material: 'colmillo_wyvern', slot: 'punta' }], effect: { trait: 'envenenada', affinity: { veneno: 1 } }, description: 'Flechas con colmillo de wyvern: cada una envenena.', hint: 'El colmillo ya trae el veneno adentro.' },
  { id: 'forro_wyvern', name: 'Forro de wyvern', secret: false, when: [{ kind: 'materialInSlot', material: 'cuero_wyvern', slot: 'forro' }], effect: { statPct: { spd: 8 }, trait: 'agil' }, description: 'Un forro de cuero de wyvern: protege sin frenar.', hint: 'Fino como un ala.' },
  { id: 'corona_grieta', name: 'La corona de la Grieta', secret: true, when: [{ kind: 'materialInSlot', material: 'corona_malgor', slot: 'engarce' }], effect: { trait: 'sombra_lunar', affinity: { oscuro: 3 }, valuePct: 45 }, description: 'Un anillo con la corona de Malgor: la oscuridad obedece a quien lo lleva.', hint: 'Lo que coronaba al señor de la Grieta cabe en un dedo.' },
  { id: 'corazon_caldera', name: 'El corazón de la caldera', secret: true, when: [{ kind: 'materialInSlot', material: 'corazon_dragon', slot: 'pomo' }], effect: { trait: 'alma_elemental', affinity: { fuego: 3 }, valuePct: 50 }, description: 'Una espada con el corazón de Cendralia en el pomo: arde con vida propia.', hint: 'Un corazón que todavía late, cerca del filo.' },
];

/** Partes donde entran los materiales nuevos (se suman a las opciones de cada plano). */
export const SLOT_EXTRAS_7: Record<string, string[]> = {
  'daga.hoja': ['garra_demonio', 'colmillo_wyvern'],
  'espada_larga.hoja': ['garra_demonio', 'escama_dragon'],
  'cimitarra.hoja': ['garra_demonio', 'escama_dragon'],
  'espada_larga.pomo': ['cuerno_demonio'],
  'mandoble.pomo': ['cuerno_demonio'],
  'maza.cabeza': ['cuerno_demonio'],
  'peto.placas': ['escama_dragon'],
  'escudo_mediano.refuerzo': ['escama_dragon'],
  'flechas.punta': ['colmillo_wyvern'],
};

export const QUENCH_7: QuenchMedium[] = [
  { id: 'sangre_infernal', name: 'Sangre infernal', cost: { material: 'sangre_infernal', qty: 1 }, hardness: 2, effect: { trait: 'quemadura', affinity: { oscuro: 1 } }, description: 'Templada en sangre que hierve: la hoja queda negra y quema al cortar.' },
];

// ───────────────────────── Acciones ─────────────────────────

export const SKILLS_7: CombatSkill[] = [
  { id: 'chispa_infernal', name: 'Chispa infernal', range: [2, 4], target: 'enemy', power: 1, element: 'fuego', cooldown: 0, statuses: [{ id: 'quemadura', chance: 0.4, turns: 2 }], description: 'Una bola de fuego negro.' },
  { id: 'cornada', name: 'Cornada', range: [1, 1], target: 'enemy', power: 1.4, damageType: 'perforante', push: 1, cooldown: 0, statuses: [{ id: 'sangrado', chance: 0.4, turns: 2 }], description: 'Cuernos por delante.' },
  { id: 'maldicion_abismo', name: 'Maldición del abismo', range: [2, 4], target: 'enemy', power: 0.8, element: 'oscuro', cooldown: 1, statuses: [{ id: 'ralentizado', chance: 0.7, turns: 2 }], description: 'Una sombra que pesa en las piernas.' },
  { id: 'tajo_infernal', name: 'Tajo infernal', range: [1, 1], target: 'enemy', power: 1.4, element: 'fuego', cooldown: 0, statuses: [{ id: 'quemadura', chance: 0.5, turns: 3 }], description: 'Una espada de fuego negro.' },
  {
    id: 'lluvia_azufre', name: 'Lluvia de azufre', range: [1, 5], target: 'tile', area: 'radius', size: 1, power: 1.5, element: 'fuego',
    terrain: 'llamas', telegraph: true, cooldown: 2, description: 'Marca un círculo que empieza a humear y al turno siguiente llueve fuego.',
  },
  { id: 'lanzazo_kobold', name: 'Lanzazo', range: [1, 2], target: 'enemy', power: 1, damageType: 'perforante', cooldown: 0, description: 'Una lanza corta, desde atrás de un compañero.' },
  { id: 'brasa_kobold', name: 'Brasa', range: [2, 4], target: 'enemy', power: 0.9, element: 'fuego', cooldown: 0, statuses: [{ id: 'quemadura', chance: 0.3, turns: 2 }], description: 'Tira una brasa con la honda.' },
  { id: 'canto_escamas', name: 'Canto de escamas', range: [0, 3], target: 'ally', power: 0, healPct: 0.3, cooldown: 2, description: 'Un canto que cierra heridas.' },
  { id: 'picada_wyvern', name: 'Picada', range: [1, 1], target: 'enemy', power: 1.5, damageType: 'perforante', charge: 4, cooldown: 2, description: 'Baja en picada desde lejos.' },
  { id: 'aguijon_wyvern', name: 'Aguijón', range: [1, 1], target: 'enemy', power: 1.1, damageType: 'perforante', element: 'veneno', cooldown: 0, statuses: [{ id: 'veneno', chance: 0.6, turns: 3 }], description: 'La cola, con veneno.' },
  { id: 'zarpazo_draconico', name: 'Zarpazo dracónico', range: [1, 1], target: 'enemy', power: 1.4, damageType: 'cortante', cooldown: 0, statuses: [{ id: 'sangrado', chance: 0.4, turns: 2 }], description: 'Garras del largo de una espada.' },
  { id: 'aliento_menor', name: 'Aliento', range: [1, 1], target: 'tile', area: 'cone', size: 2, power: 1.2, element: 'fuego', terrain: 'llamas', cooldown: 2, statuses: [{ id: 'quemadura', chance: 0.5, turns: 2 }], description: 'Un cono de fuego corto.' },
  {
    id: 'aliento_caldera', name: 'Aliento de la caldera', range: [1, 1], target: 'tile', area: 'cone', size: 3, power: 1.8, element: 'fuego',
    terrain: 'llamas', telegraph: true, cooldown: 2, statuses: [{ id: 'quemadura', chance: 0.7, turns: 3 }], description: 'Respira hondo, se le ve el fuego en la garganta... y al turno siguiente lo suelta.',
  },
  { id: 'cola_barrida', name: 'Coletazo', range: [1, 1], target: 'enemy', area: 'adjacent', power: 1.1, damageType: 'contundente', push: 1, cooldown: 1, description: 'Barre con la cola a todos los que tiene al lado.' },
];

// ───────────────────────── Monstruos ─────────────────────────

export const MONSTERS_7: MonsterDef[] = [
  // Demonios
  {
    id: 'diablillo', name: 'Diablillo', family: 'demonios', tier: 2,
    hp: 48, atk: 15, def: 4, spd: 8, move: 4, jump: 3, evasion: 0.2, damageType: 'perforante',
    resist: {}, elemental: { sagrado: 1.8, fuego: 0, oscuro: 0.5 }, affinities: { fuego: 1, oscuro: 1 }, immune: ['quemadura'],
    skills: ['chispa_infernal'], ai: 'tirador', threat: 6, slots: ALL,
    loot: [{ material: 'garra_demonio', chance: 0.4, qty: [1, 1] }, { material: 'sangre_infernal', chance: 0.3, qty: [1, 1] }],
    sprite: { key: 'mon.diablillo', tint: 0xd8483a }, description: 'Chiquito, rápido y molesto. Tira fuego desde donde no llegás.',
  },
  {
    id: 'demonio_cornudo', name: 'Demonio cornudo', family: 'demonios', tier: 3, aggressive: true,
    hp: 160, atk: 24, def: 10, spd: 5, move: 3, jump: 2, evasion: 0, damageType: 'perforante',
    resist: { contundente: 0.9 }, elemental: { sagrado: 1.7, fuego: 0.5, oscuro: 0 }, affinities: { oscuro: 2 },
    skills: ['cornada', 'embestida'], ai: 'embestidor', threat: 10, slots: ALL,
    loot: [{ material: 'cuerno_demonio', chance: 0.7, qty: [1, 1] }, { material: 'garra_demonio', chance: 0.4, qty: [1, 2] }, { material: 'sangre_infernal', chance: 0.4, qty: [1, 1] }],
    sprite: { key: 'mon.demonio', tint: 0xa83a3a }, description: 'Embiste en línea recta y te clava los cuernos. Lo sagrado le duele de verdad.',
  },
  {
    id: 'sombra_abisal', name: 'Sombra abisal', family: 'demonios', tier: 3,
    hp: 70, atk: 16, def: 5, spd: 6, move: 3, jump: 3, evasion: 0.15, damageType: 'contundente',
    resist: { cortante: 0.7, perforante: 0.7 }, elemental: { sagrado: 2, oscuro: 0 }, affinities: { oscuro: 2 }, immune: ['sangrado', 'veneno'],
    skills: ['maldicion_abismo', 'rayo_sombrio'], ai: 'tirador', threat: 8, slots: ALL,
    loot: [{ material: 'sangre_infernal', chance: 0.5, qty: [1, 1] }, { material: 'polvo_espectral', chance: 0.5, qty: [1, 2] }],
    sprite: { key: 'mon.diablillo', tint: 0x4a2a6a, scale: 1.2 }, description: 'Una sombra que salió de la Grieta. Te deja lento y te pega desde lejos.',
  },
  {
    id: 'malgor', name: 'Malgor, señor de la Grieta', family: 'demonios', tier: 3, boss: true,
    hp: 480, atk: 24, def: 12, spd: 5, move: 3, jump: 2, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.9 }, elemental: { sagrado: 1.6, fuego: 0, oscuro: 0 }, affinities: { oscuro: 2, fuego: 2 }, immune: ['aturdido', 'quemadura'],
    skills: ['tajo_infernal', 'lluvia_azufre'], ai: 'jefe', threat: 24, slots: ALL,
    halfHp: { text: 'Malgor abre la Grieta un poco más: ¡sale un diablillo!', summon: ['diablillo'], skills: ['tajo_infernal', 'lluvia_azufre', 'rugido'], atkPct: 20 },
    loot: [{ material: 'corona_malgor', chance: 1, qty: [1, 1] }, { material: 'cuerno_demonio', chance: 1, qty: [2, 3] }, { material: 'sangre_infernal', chance: 1, qty: [2, 3] }],
    sprite: { key: 'mon.demonio', tint: 0x6a1a2a, scale: 1.6 }, description: 'El señor demoníaco que cuida la Grieta. Anuncia su lluvia de azufre: hay que salir del círculo.',
  },
  // Dracónidos
  {
    id: 'kobold', name: 'Kobold', family: 'draconidos', tier: 2,
    hp: 62, atk: 18, def: 7, spd: 6, move: 3, jump: 2, evasion: 0.1, damageType: 'perforante',
    resist: {}, elemental: { hielo: 1.3, fuego: 0.5 }, affinities: { fuego: 1 },
    skills: ['lanzazo_kobold'], ai: 'manada', threat: 5, slots: ALL,
    loot: [{ material: 'brasalita', chance: 0.35, qty: [1, 2] }, { material: 'cuarzo_igneo', chance: 0.2, qty: [1, 1] }],
    sprite: { key: 'mon.kobold', tint: 0xc86a3a }, description: 'Mineros escamosos que sirven a la dragona. Pelean en grupo y se esconden atrás de otros.',
  },
  {
    id: 'kobold_chaman', name: 'Kobold chamán', family: 'draconidos', tier: 2,
    hp: 44, atk: 12, def: 4, spd: 5, move: 3, jump: 2, evasion: 0.1, damageType: 'contundente',
    resist: {}, elemental: { hielo: 1.3, fuego: 0.5 }, affinities: { fuego: 1 },
    skills: ['brasa_kobold', 'canto_escamas'], ai: 'sanador', threat: 6, slots: ALL,
    loot: [{ material: 'cuarzo_igneo', chance: 0.4, qty: [1, 1] }, { material: 'esencia_ignea', chance: 0.15, qty: [1, 1] }],
    sprite: { key: 'mon.kobold', tint: 0x8a5ac8 }, description: 'Cura a los suyos con cantos. Conviene callarlo primero.',
  },
  {
    id: 'wyvern', name: 'Wyvern', family: 'draconidos', tier: 3, aggressive: true,
    hp: 170, atk: 26, def: 10, spd: 7, move: 5, jump: 4, evasion: 0.1, damageType: 'perforante',
    resist: {}, elemental: { hielo: 1.5, rayo: 1.3, veneno: 0 }, affinities: { veneno: 2 }, immune: ['veneno'],
    skills: ['picada_wyvern', 'aguijon_wyvern'], ai: 'embestidor', threat: 12, slots: ALL,
    loot: [{ material: 'cuero_wyvern', chance: 0.7, qty: [1, 2], skin: true, spoiledBy: ['fuego'] }, { material: 'colmillo_wyvern', chance: 0.6, qty: [1, 1] }, { material: 'escama_dragon', chance: 0.15, qty: [1, 1] }],
    sprite: { key: 'mon.wyvern', tint: 0x6a9a5a }, description: 'Baja en picada y te clava la cola envenenada. El hielo y el rayo la tiran al piso.',
  },
  {
    id: 'draco_joven', name: 'Draco joven', family: 'draconidos', tier: 3, rare: true,
    hp: 220, atk: 26, def: 12, spd: 5, move: 3, jump: 3, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.9, perforante: 0.9 }, elemental: { fuego: 0, hielo: 1.5, agua: 1.3 }, affinities: { fuego: 2 }, immune: ['quemadura'],
    skills: ['zarpazo_draconico', 'aliento_menor'], ai: 'bruto', threat: 16, slots: ALL,
    loot: [{ material: 'escama_dragon', chance: 1, qty: [1, 2] }, { material: 'colmillo_wyvern', chance: 0.5, qty: [1, 1] }],
    sprite: { key: 'mon.dragon', tint: 0xd86a3a }, description: 'Un dragón chico, que igual es más grande que un ogro. Raro y peligroso.',
  },
  {
    id: 'cendralia', name: 'Cendralia, la dragona de la Caldera', family: 'draconidos', tier: 3, boss: true,
    hp: 800, atk: 30, def: 15, spd: 6, move: 3, jump: 3, evasion: 0, damageType: 'cortante',
    resist: { cortante: 0.85, perforante: 0.85 }, elemental: { fuego: 0, hielo: 1.5, agua: 1.3 }, affinities: { fuego: 3 }, immune: ['quemadura', 'aturdido', 'inmovilizado'],
    skills: ['zarpazo_draconico', 'aliento_caldera'], ai: 'jefe', threat: 30, slots: ALL,
    halfHp: { text: 'Cendralia ruge y llama a sus kobolds. Barre todo con la cola.', summon: ['kobold', 'kobold'], skills: ['zarpazo_draconico', 'aliento_caldera', 'cola_barrida'], atkPct: 20 },
    loot: [{ material: 'corazon_dragon', chance: 1, qty: [1, 1] }, { material: 'escama_dragon', chance: 1, qty: [3, 5] }, { material: 'colmillo_wyvern', chance: 1, qty: [1, 2] }],
    sprite: { key: 'mon.dragon', tint: 0xb8301a, scale: 1.5 }, description: 'La dragona más vieja del valle. Antes de soltar el aliento se le ve el fuego en la garganta: es el momento de salir de adelante.',
  },
];

// ───────────────────────── Arenas ─────────────────────────

const PARTY = [{ x: 0, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 2 }, { x: 1, y: 5 }];
const ENEMY = [{ x: 9, y: 1 }, { x: 8, y: 2 }, { x: 9, y: 3 }, { x: 8, y: 4 }, { x: 9, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 7 }];
const FLAT = Array(8).fill('0000000000');
export const ARENAS_7: ArenaDef[] = [
  { id: 'ruinas_patio', biome: 'ruinas', terrain: ['..........', '..#....#..', '..........', '....,,....', '....,,....', '..........', '..#....#..', '..........'], heights: FLAT, partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'ruinas_derrumbe', biome: 'ruinas', terrain: ['##........', '#...#.....', '..........', '...##..#..', '......,,..', '..#.......', '.....#....', '........#.'], heights: ['0000001111', '0000001111', '0000001111', '0000001111', '0000001111', '0000001111', '0000001111', '0000001111'], partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'ruinas_grieta', biome: 'jefe', look: 'ruinas', terrain: ['..........', '..#....#..', '..........', '....ll....', '....ll....', '..........', '..#....#..', '..........'], heights: FLAT, partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'volcan_llanos', biome: 'volcan', terrain: ['..........', '...#......', '......ll..', '..........', '..ll......', '.......#..', '...l......', '..........'], heights: FLAT, partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'volcan_nidos', biome: 'volcan', terrain: ['#.........', '..........', '...#..#...', '..........', '..........', '...#..#...', '..........', '#.........'], heights: ['0001221000', '0012332100', '0012332100', '0012332100', '0012332100', '0012332100', '0012332100', '0001221000'], partySpawns: PARTY, enemySpawns: ENEMY },
  { id: 'volcan_caldera', biome: 'jefe', look: 'volcan', terrain: ['ll......ll', 'l........l', '..........', '..........', '..........', '..........', 'l........l', 'll......ll'], heights: FLAT, partySpawns: PARTY, enemySpawns: ENEMY },
];

// ───────────────────────── Regiones ─────────────────────────

const RUINAS_TERRAIN = [
  'RRRRRRRRRRRRRRRRRRRRRRRR',
  'R...m..R..v...R...m...RR',
  'R.c....R....m.....,,..gR',
  'R..m.......R.....m....BR',
  'E=====..h....R..m......R',
  'R....===..m.....c....m.R',
  'R..v....==..R..........R',
  'R.......m.===....R..m..R',
  'R..h..R.......==.......R',
  'R.......c..m....=..R...R',
  'R..m.......R.....=..m..R',
  'R....R..v.....m...=....R',
  'R.g.....m..h..R.....c..R',
  'R..m..c.....R....m.....R',
  'R.......m.......R...g..R',
  'RRRRRRRRRRRRRRRRRRRRRRRR',
];
const DRAGON_TERRAIN = [
  'RRRRRRRRRRRRRRRRRRRRRRRR',
  'R..m...v..R...m...v..BRR',
  'R.....,,......R.......gR',
  'R.v..m....m.......m....R',
  'E=====......R..v.......R',
  'R....===..c.....m..R...R',
  'R..m....===.R.......m..R',
  'R.....v....===....g....R',
  'R..R.....m....==.......R',
  'R......c......m.=..v...R',
  'R.m..R....v......=...m.R',
  'R.......m....R....=....R',
  'R..v.......g.....m.c...R',
  'R....m..R.....v.......mR',
  'R..c........m....R.....R',
  'RRRRRRRRRRRRRRRRRRRRRRRR',
];
const zones3 = (t: string[]) => t.map(() => '1'.repeat(8) + '2'.repeat(8) + '3'.repeat(8));
// Las tierras del dragón suben hacia la caldera.
const DRAGON_HEIGHTS = DRAGON_TERRAIN.map(() => [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3].join(''));

const zone = (z: ZoneDef) => z;
export const REGIONS_7: RegionDef[] = [
  {
    id: 'ruinas_vigia', name: 'Ruinas del Vigía', danger: 6, available: true, travelSlots: 2, world: { x: 920, y: 470 },
    description: 'Lo que queda de la torre del Vigía, arriba de su cripta. Gólems que todavía hacen guardia, muertos que no descansan y, en el fondo, una grieta de la que salen demonios.',
    terrain: RUINAS_TERRAIN, heights: RUINAS_TERRAIN.map((r) => '0'.repeat(r.length)), zones: zones3(RUINAS_TERRAIN),
    zoneTiles: ['tile.stone', 'tile.cryptstone', 'tile.cryptstone'], wallProp: 'prop.pillar', bossArena: 'ruinas_grieta',
    unlock: { reputationMin: 70, hint: 'se abre con reputación renombrada (70) en Valdebrasa.' },
    zoneDefs: [
      zone({
        id: 'patio', name: 'Patio derrumbado', danger: 5, biome: 'ruinas', budget: [15, 20], groups: [2, 3], minTier: 2, families: { constructos: 2, no_muertos: 2 },
        vetas: [{ material: 'plata', weight: 2, tier: 2, qty: [1, 2] }, { material: 'hierro', weight: 2, tier: 1, qty: [2, 4] }], arboles: [],
        hierbas: [{ material: 'lirio_nocturno', weight: 2, tier: 2, qty: [1, 2], night: true }, { material: 'cardo_hierro', weight: 2, tier: 2, qty: [1, 2] }],
        gemas: [{ material: 'amatista', weight: 2, tier: 2, qty: [1, 1] }, { material: 'gema_antigua', weight: 1, tier: 3, qty: [1, 1] }],
        cofres: { gold: [90, 160], materials: [{ material: 'piedra_encantada', chance: 0.4, qty: [1, 2] }, { material: 'nucleo_runico', chance: 0.2, qty: [1, 1] }], grimoires: [{ id: 'liturgia_ceniza', chance: 0.08 }] },
      }),
      zone({
        id: 'galerias', name: 'Galerías rotas', danger: 6, biome: 'ruinas', budget: [19, 25], groups: [2, 3], minTier: 2, families: { no_muertos: 2, constructos: 1, demonios: 1 },
        vetas: [{ material: 'plata', weight: 2, tier: 2, qty: [1, 2] }, { material: 'acero_negro', weight: 1, tier: 3, qty: [1, 1] }], arboles: [],
        hierbas: [{ material: 'lirio_nocturno', weight: 2, tier: 2, qty: [1, 2], night: true }],
        gemas: [{ material: 'gema_antigua', weight: 1, tier: 3, qty: [1, 1] }, { material: 'amatista', weight: 2, tier: 2, qty: [1, 1] }],
        cofres: { gold: [110, 190], materials: [{ material: 'nucleo_runico', chance: 0.3, qty: [1, 1] }, { material: 'garra_demonio', chance: 0.3, qty: [1, 1] }], grimoires: [] },
      }),
      zone({
        id: 'grieta', name: 'La Grieta', danger: 7, biome: 'ruinas', budget: [23, 30], groups: [2, 3], minTier: 2, families: { demonios: 3, no_muertos: 1 },
        vetas: [{ material: 'acero_negro', weight: 2, tier: 3, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'gema_antigua', weight: 2, tier: 3, qty: [1, 1] }, { material: 'rubi', weight: 1, tier: 2, qty: [1, 1] }],
        cofres: { gold: [140, 240], materials: [{ material: 'sangre_infernal', chance: 0.5, qty: [1, 2] }, { material: 'cuerno_demonio', chance: 0.3, qty: [1, 1] }], grimoires: [] },
      }),
    ],
    boss: { monsters: ['malgor', 'sombra_abisal'], zone: 3 },
  },
  {
    id: 'tierras_dragon', name: 'Tierras del Dragón', danger: 9, available: true, travelSlots: 3, world: { x: 1040, y: 140 },
    description: 'Llanos de ceniza, nidos de wyverns y, en lo más alto, la caldera donde duerme Cendralia sobre un montón de oro y huesos.',
    terrain: DRAGON_TERRAIN, heights: DRAGON_HEIGHTS, zones: zones3(DRAGON_TERRAIN),
    zoneTiles: ['tile.ash', 'tile.ash', 'tile.cave'], bossArena: 'volcan_caldera',
    unlock: { bossOf: 'ruinas_vigia', hint: 'se abre al vencer a Malgor en las Ruinas del Vigía.' },
    zoneDefs: [
      zone({
        id: 'llanos', name: 'Llanos de ceniza', danger: 7, biome: 'volcan', budget: [22, 28], groups: [2, 3], families: { draconidos: 2, elementales: 1 },
        vetas: [{ material: 'brasalita', weight: 3, tier: 2, qty: [2, 3] }, { material: 'acero_negro', weight: 1, tier: 3, qty: [1, 1] }], arboles: [],
        hierbas: [{ material: 'flor_brasa', weight: 3, tier: 1, qty: [2, 3] }],
        gemas: [{ material: 'cristal_magma', weight: 2, tier: 2, qty: [1, 1] }, { material: 'rubi', weight: 2, tier: 2, qty: [1, 1] }],
        cofres: { gold: [120, 220], materials: [{ material: 'cristal_magma', chance: 0.4, qty: [1, 2] }, { material: 'esencia_ignea', chance: 0.3, qty: [1, 1] }], grimoires: [] },
      }),
      zone({
        id: 'nidos', name: 'Nidos de wyvern', danger: 8, biome: 'volcan', budget: [26, 34], groups: [2, 3], minTier: 3, families: { draconidos: 3 },
        vetas: [{ material: 'acero_negro', weight: 2, tier: 3, qty: [1, 2] }], arboles: [],
        gemas: [{ material: 'cristal_magma', weight: 2, tier: 2, qty: [1, 1] }, { material: 'opalo_lunar', weight: 1, tier: 3, qty: [1, 1] }],
        cofres: { gold: [160, 280], materials: [{ material: 'colmillo_wyvern', chance: 0.4, qty: [1, 1] }, { material: 'escama_dragon', chance: 0.2, qty: [1, 1] }], grimoires: [{ id: 'libro_tormentas', chance: 0.08 }] },
      }),
      zone({
        id: 'caldera', name: 'La Caldera', danger: 9, biome: 'volcan', budget: [30, 38], groups: [2, 3], minTier: 3, families: { draconidos: 3, demonios: 1 },
        vetas: [{ material: 'acero_negro', weight: 2, tier: 3, qty: [1, 2] }, { material: 'brasalita', weight: 2, tier: 2, qty: [2, 3] }], arboles: [],
        gemas: [{ material: 'gema_antigua', weight: 1, tier: 3, qty: [1, 1] }, { material: 'cristal_magma', weight: 2, tier: 2, qty: [1, 2] }],
        cofres: { gold: [220, 380], materials: [{ material: 'escama_dragon', chance: 0.4, qty: [1, 2] }, { material: 'gema_antigua', chance: 0.3, qty: [1, 1] }], grimoires: [] },
      }),
    ],
    boss: { monsters: ['cendralia', 'wyvern'], zone: 3 },
  },
];

// ───────────────────────── Encargos ─────────────────────────

export const QUESTS_7: QuestDef[] = [
  {
    id: 'g_demonios', title: 'Lo que sale de la Grieta', board: 'gremio', giver: 'aldana', repeatable: true, weight: 1.2, minReputation: 70,
    text: 'Algo salió de las Ruinas del Vigía y anda por los caminos. El gremio paga por cada demonio.', done: 'El gremio cuelga un cuerno tuyo en la pared.',
    objective: { kind: 'hunt', family: 'demonios', count: 4 }, days: 10, reward: { gold: 420, reputation: 6, relation: 4 }, penalty: { reputation: 3, relation: 3 },
  },
  {
    id: 'g_malgor', title: 'El señor de la Grieta', board: 'gremio', giver: 'aldana', repeatable: true, weight: 0.6, minReputation: 70,
    text: 'Malgor abre la Grieta un poco más cada luna. Si no se lo para, va a llegar al valle.', done: 'Esa noche se festeja en todo Valdebrasa.',
    objective: { kind: 'boss', region: 'ruinas_vigia' }, days: 12, reward: { gold: 800, reputation: 18, relation: 8 }, penalty: { reputation: 5, relation: 4 },
  },
  {
    id: 'g_wyverns', title: 'Wyverns sobre los rebaños', board: 'gremio', giver: 'aldana', repeatable: true, weight: 1, minReputation: 100,
    text: 'Las wyverns bajan de los nidos a llevarse ovejas. Los pastores juntaron una buena bolsa.', done: 'Los pastores te mandan un queso enorme.',
    objective: { kind: 'hunt', monster: 'wyvern', count: 3 }, days: 10, reward: { gold: 520, reputation: 7, relation: 4 }, penalty: { reputation: 3, relation: 3 },
  },
  {
    id: 'g_cendralia', title: 'La dragona de la Caldera', board: 'gremio', giver: 'aldana', repeatable: true, weight: 0.5, minReputation: 100,
    text: 'Nadie volvió de la Caldera en cien años. El gremio ofrece lo que tiene, y un poco más.', done: 'Tu nombre va a quedar en las canciones.',
    objective: { kind: 'boss', region: 'tierras_dragon' }, days: 14, reward: { gold: 1400, reputation: 25, relation: 10 }, penalty: { reputation: 6, relation: 5 },
  },
  {
    id: 't_escamas', title: 'Escamas para una armadura', board: 'tablon', giver: 'tanino', repeatable: true, weight: 0.8, minReputation: 100,
    text: 'Tanino tiene un cliente que quiere una armadura de escamas de verdad. Necesita tres.', done: 'Tanino las mira contra la luz, sin poder creerlo.',
    objective: { kind: 'materials', material: 'escama_dragon', qty: 3 }, days: 12, reward: { gold: 360, relation: 8, reputation: 3 }, penalty: { relation: 3 },
  },
];
