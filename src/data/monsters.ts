import type { MonsterDef } from '../core/combat/types';

const ALL = ['mañana', 'tarde', 'noche'] as ('mañana' | 'tarde' | 'noche')[];

// Bestiario de Linde de Brezal. Familias: gelines, goblins, bestias.
export const MONSTERS: MonsterDef[] = [
  // ── Gelines ──
  {
    id: 'gelin_verde', name: 'Gelín verde', family: 'gelines', tier: 1,
    hp: 33, atk: 10, def: 2, spd: 3, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.6, cortante: 1.2, perforante: 0.8 }, elemental: { fuego: 1.5, hielo: 0.8 },
    immune: ['sangrado'], skills: ['golpe_gel'], ai: 'gelatina', threat: 2, slots: ALL,
    loot: [{ material: 'gel_slime', chance: 0.9, qty: [1, 2], spoiledBy: ['fuego'] }],
    sprite: { key: 'mon.gelin', tint: 0x7ccf6a }, description: 'Una gota de gelatina con ganas de pelear. Los golpes contundentes le rebotan.',
  },
  {
    id: 'gelin_acido', name: 'Gelín ácido', family: 'gelines', tier: 1,
    hp: 36, atk: 11, def: 2, spd: 3, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.6, cortante: 1.2, perforante: 0.8 }, elemental: { fuego: 1.4, veneno: 0.3 },
    immune: ['sangrado', 'veneno'], skills: ['golpe_gel', 'escupitajo_acido'], ai: 'gelatina', threat: 3, slots: ALL,
    loot: [{ material: 'gel_acido', chance: 0.85, qty: [1, 2], spoiledBy: ['fuego'] }],
    sprite: { key: 'mon.gelin', tint: 0xc7e04a }, description: 'Escupe un ácido que se come las armaduras.',
  },
  {
    id: 'gelin_escarcha', name: 'Gelín de escarcha', family: 'gelines', tier: 2,
    hp: 39, atk: 12, def: 3, spd: 3, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.6, cortante: 1.1, perforante: 0.8 }, elemental: { fuego: 1.8, hielo: 0.3 }, affinities: { hielo: 1 },
    immune: ['sangrado', 'ralentizado'], skills: ['toque_escarcha'], ai: 'gelatina', threat: 3, slots: ['noche'],
    loot: [{ material: 'gel_escarcha', chance: 0.8, qty: [1, 2], spoiledBy: ['fuego'] }],
    sprite: { key: 'mon.gelin', tint: 0xa8e6ff }, description: 'Solo sale de noche. Deja escarcha en el pasto por donde pasa.',
  },
  {
    id: 'gelin_rey', name: 'Gelín rey', family: 'gelines', tier: 2, rare: true,
    hp: 105, atk: 15, def: 4, spd: 2, move: 2, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { contundente: 0.5, cortante: 1.1, perforante: 0.8 }, elemental: { fuego: 1.5 },
    immune: ['sangrado', 'aturdido'], skills: ['golpe_gel'], ai: 'gelatina', threat: 7, slots: ALL,
    halfHp: { summon: ['gelin_verde', 'gelin_verde'], text: '¡El gelín rey se divide!' },
    loot: [{ material: 'nucleo_gelin', chance: 1, qty: [1, 1] }, { material: 'gel_slime', chance: 1, qty: [2, 4], spoiledBy: ['fuego'] }],
    sprite: { key: 'mon.gelin', tint: 0x3fbf7f, scale: 1.6 }, description: 'Raro y enorme. A la mitad de su vida se parte en gelines chicos.',
  },

  // ── Goblins ──
  {
    id: 'goblin_rasposo', name: 'Goblin rasposo', family: 'goblins', tier: 1, aggressive: true,
    hp: 45, atk: 13, def: 4, spd: 6, move: 4, jump: 2, evasion: 0.05, damageType: 'cortante',
    resist: {}, elemental: { fuego: 1.2 }, skills: ['tajo_goblin'], ai: 'bruto', threat: 3, slots: ALL,
    loot: [{ material: 'chatarra_goblin', chance: 0.6, qty: [1, 2] }, { material: 'colmillo_goblin', chance: 0.4, qty: [1, 1] }],
    sprite: { key: 'mon.goblin', tint: 0x7aa84a }, description: 'Un goblin con una espada oxidada y mucha confianza.',
  },
  {
    id: 'goblin_hondero', name: 'Goblin hondero', family: 'goblins', tier: 1, aggressive: true,
    hp: 36, atk: 11, def: 3, spd: 7, move: 4, jump: 2, evasion: 0.08, damageType: 'contundente',
    resist: {}, elemental: { fuego: 1.2 }, skills: ['honda'], ai: 'tirador', threat: 3, slots: ALL,
    loot: [{ material: 'colmillo_goblin', chance: 0.5, qty: [1, 1] }, { material: 'chatarra_goblin', chance: 0.3, qty: [1, 1] }],
    sprite: { key: 'mon.goblin', tint: 0x9ab85a }, description: 'Tira piedras desde lejos y se esconde atrás de los demás.',
  },
  {
    id: 'chaman_totem', name: 'Chamán del tótem', family: 'goblins', tier: 2, aggressive: true,
    hp: 39, atk: 9, def: 3, spd: 5, move: 3, jump: 2, evasion: 0.05, damageType: 'contundente',
    resist: {}, elemental: { fuego: 1.2, sagrado: 1.3 }, skills: ['curar_totem', 'furia_totem', 'tajo_goblin'], ai: 'sanador', threat: 4, slots: ALL,
    loot: [{ material: 'totem_tallado', chance: 0.6, qty: [1, 1] }, { material: 'colmillo_goblin', chance: 0.3, qty: [1, 1] }],
    sprite: { key: 'mon.goblin', tint: 0xb06ad0 }, description: 'Cura a los suyos con cantos horribles. Conviene ir primero por él.',
  },
  {
    id: 'goblin_escudero', name: 'Goblin escudero', family: 'goblins', tier: 2, aggressive: true,
    hp: 60, atk: 11, def: 9, spd: 4, move: 3, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { perforante: 0.7 }, elemental: { fuego: 1.2 }, skills: ['escudazo', 'guardia_goblin'], ai: 'tanque', threat: 4, slots: ALL,
    loot: [{ material: 'chatarra_goblin', chance: 0.8, qty: [1, 3] }],
    sprite: { key: 'mon.goblin', tint: 0x6a7a8a }, description: 'Una puerta con patas. Las flechas le rebotan.',
  },
  {
    id: 'grunaz', name: 'Gruñaz Dientepartido', family: 'goblins', tier: 3, boss: true,
    hp: 270, atk: 18, def: 8, spd: 6, move: 3, jump: 2, evasion: 0.05, damageType: 'cortante',
    resist: { perforante: 0.9 }, elemental: { fuego: 1.1 }, immune: ['aturdido'],
    skills: ['hachazo_jefe', 'grito_guerra'], ai: 'jefe', threat: 14, slots: ALL,
    halfHp: { summon: ['goblin_rasposo', 'goblin_rasposo'], text: 'Gruñaz silba con los dedos: ¡llegan refuerzos!' },
    loot: [
      { material: 'corona_colmillos', chance: 1, qty: [1, 1] },
      { material: 'chatarra_goblin', chance: 1, qty: [3, 5] },
      { material: 'totem_tallado', chance: 0.5, qty: [1, 1] },
    ],
    sprite: { key: 'mon.jefe', tint: 0x5f8f3a, scale: 1.4 }, description: 'Jefe de la banda de las colinas. Le falta medio colmillo y le sobra mal humor.',
  },

  // ── Bestias ──
  {
    id: 'lobo_gris', name: 'Lobo gris', family: 'bestias', tier: 1, aggressive: true,
    hp: 39, atk: 13, def: 3, spd: 9, move: 5, jump: 2, evasion: 0.1, damageType: 'cortante',
    resist: { contundente: 1.1 }, elemental: { fuego: 1.2 }, skills: ['mordisco'], ai: 'manada', threat: 3, slots: ALL,
    loot: [
      { material: 'cuero_lobo', chance: 0.8, qty: [1, 1], skin: true, spoiledBy: ['fuego'] },
      { material: 'colmillo_lobo', chance: 0.6, qty: [1, 2] },
    ],
    sprite: { key: 'mon.lobo', tint: 0x8d8a84 }, description: 'Caza en manada y siempre busca la espalda.',
  },
  {
    id: 'jabali', name: 'Jabalí cornilargo', family: 'bestias', tier: 1, aggressive: true,
    hp: 69, atk: 15, def: 6, spd: 5, move: 4, jump: 1, evasion: 0, damageType: 'contundente',
    resist: { cortante: 0.85 }, elemental: { fuego: 1.2 }, skills: ['mordisco', 'embestida'], ai: 'embestidor', threat: 5, slots: ALL,
    loot: [
      { material: 'piel_jabali', chance: 0.8, qty: [1, 1], skin: true, spoiledBy: ['fuego'] },
      { material: 'colmillo_jabali', chance: 0.7, qty: [1, 2] },
    ],
    sprite: { key: 'mon.jabali', tint: 0x6b4a32 }, description: 'Embiste en línea recta. Mejor no quedar al borde de una loma.',
  },
  {
    id: 'arana', name: 'Araña tejedora', family: 'bestias', tier: 2, aggressive: true,
    hp: 45, atk: 12, def: 3, spd: 7, move: 4, jump: 3, evasion: 0.08, damageType: 'perforante',
    resist: { contundente: 1.2 }, elemental: { fuego: 1.5 }, immune: ['veneno', 'inmovilizado'],
    skills: ['picadura', 'telarana'], ai: 'tirador', threat: 4, slots: ALL,
    loot: [
      { material: 'seda_arana', chance: 0.7, qty: [1, 2], spoiledBy: ['fuego'] },
      { material: 'glandula_veneno', chance: 0.5, qty: [1, 1], spoiledBy: ['contundente'] },
    ],
    sprite: { key: 'mon.arana', tint: 0x4a3f5a }, description: 'Teje desde lejos. Si la aplastás, la glándula de veneno revienta.',
  },
  {
    id: 'oso_musgoso', name: 'Oso musgoso', family: 'bestias', tier: 2, rare: true, aggressive: true,
    hp: 135, atk: 20, def: 8, spd: 4, move: 3, jump: 1, evasion: 0, damageType: 'cortante',
    resist: { contundente: 0.8 }, elemental: { fuego: 1.3 }, skills: ['zarpazo', 'rugido'], ai: 'bruto', threat: 8, slots: ['mañana', 'tarde'],
    loot: [{ material: 'garra_oso', chance: 0.9, qty: [1, 2] }, { material: 'piel_jabali', chance: 0.5, qty: [1, 2], skin: true, spoiledBy: ['fuego'] }],
    sprite: { key: 'mon.oso', tint: 0x4f5a3a, scale: 1.3 }, description: 'Tiene musgo en el lomo de tanto dormir. Despierto, es otra cosa.',
  },
  {
    id: 'lobo_albino', name: 'Lobo albino', family: 'bestias', tier: 2, rare: true, aggressive: true,
    hp: 60, atk: 17, def: 5, spd: 11, move: 5, jump: 2, evasion: 0.15, damageType: 'cortante',
    resist: { contundente: 1.1 }, elemental: { fuego: 1.2, sagrado: 0.7 }, skills: ['mordisco'], ai: 'manada', threat: 7, slots: ['noche'],
    loot: [
      { material: 'pelaje_albino', chance: 0.9, qty: [1, 1], skin: true, spoiledBy: ['fuego'] },
      { material: 'colmillo_lobo', chance: 0.8, qty: [1, 2] },
    ],
    sprite: { key: 'mon.lobo', tint: 0xf4f4f0 }, description: 'Una leyenda de los cazadores del valle. Solo se lo ve bajo la luna.',
  },
];
