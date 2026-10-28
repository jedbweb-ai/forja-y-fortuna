import type { Enchantment, FinishOption, QuenchMedium } from '../core/types';

// ── Etapa 3: temple ──
export const QUENCH_MEDIA: QuenchMedium[] = [
  {
    id: 'agua', name: 'Agua fría', cost: {}, hardness: 2,
    effect: { statPct: { atk: 6, def: 6, dur: -8 } },
    description: 'Temple brusco: más duro, pero más quebradizo.',
  },
  {
    id: 'aceite', name: 'Aceite', cost: { gold: 2 }, hardness: 0,
    effect: { statPct: { atk: 2, def: 2, dur: 6 } },
    description: 'Temple parejo y seguro. El clásico.',
  },
  {
    id: 'salmuera', name: 'Salmuera', cost: { gold: 4 }, hardness: -1,
    effect: { statPct: { dur: 15, spd: 4 } },
    description: 'Agua salada tibia: más flexible y resistente al desgaste.',
  },
  {
    id: 'gel', name: 'Baño de gel de slime', cost: { material: 'gel_slime', qty: 1 }, hardness: -2,
    effect: { statPct: { dur: 10, spd: 6 }, affinity: { agua: 1 } },
    description: 'El gel enfría lento y deja la pieza flexible. Suma afinidad de agua.',
  },
  {
    id: 'aceite_brasa', name: 'Aceite de brasa', cost: { material: 'ascua_salamandrilla', qty: 1 }, hardness: 1,
    effect: { statPct: { atk: 5 }, affinity: { fuego: 1 } },
    description: 'Aceite con ascua disuelta. Endurece y refuerza el fuego.',
  },
  {
    id: 'escarcha', name: 'Baño de escarcha', cost: { material: 'gel_escarcha', qty: 1 }, hardness: 1,
    effect: { statPct: { atk: 3 }, affinity: { hielo: 1 }, trait: 'escarcha' },
    description: 'Gel de escarcha en el temple: la hoja ralentiza a quien toca.',
  },
  {
    id: 'acido', name: 'Mordiente ácido', cost: { material: 'gel_acido', qty: 1 }, hardness: 2,
    effect: { trait: 'corrosiva' },
    description: 'Gel ácido en el temple: el filo come armaduras, pero se gasta más.',
  },
  {
    id: 'veneno', name: 'Temple venenoso', cost: { material: 'glandula_veneno', qty: 1 }, hardness: 0,
    effect: { affinity: { veneno: 1 }, trait: 'envenenada' },
    description: 'Glándula de araña disuelta en aceite: el filo envenena.',
  },
];

// ── Etapa 4: acabado ──
export const FINISHES: FinishOption[] = [
  // Empuñadura / forro
  { id: 'grip_ninguno', name: 'Sin forro', kind: 'grip', cost: {}, effect: {}, description: 'Mango desnudo.' },
  { id: 'grip_cordel', name: 'Cordel', kind: 'grip', categories: ['arma', 'herramienta', 'distancia'], cost: { material: 'cuerda_lino', qty: 1 }, effect: { statPct: { spd: 4 } }, description: 'Cordel enrollado: mejor agarre. Velocidad +4%.' },
  { id: 'grip_cuero', name: 'Empuñadura de cuero', kind: 'grip', categories: ['arma', 'herramienta', 'distancia'], cost: { material: 'cuero_curtido', qty: 1 }, effect: { statPct: { spd: 7 }, valuePct: 4 }, beauty: 1, description: 'Cuero cosido a mano. Velocidad +7%.' },

  // Pulido
  { id: 'pulido_basico', name: 'Pulido básico', kind: 'polish', cost: {}, effect: {}, quality: 0, description: 'Limpio y presentable.' },
  { id: 'pulido_fino', name: 'Pulido fino', kind: 'polish', cost: { gold: 4 }, effect: { valuePct: 6 }, quality: 4, beauty: 1, description: 'Calidad +4 y mejor precio.' },
  { id: 'pulido_espejo', name: 'Pulido espejo', kind: 'polish', cost: { gold: 10 }, effect: { valuePct: 12 }, quality: 8, beauty: 2, description: 'Brilla como un lago quieto. Calidad +8.' },

  // Grabados
  { id: 'grabado_ninguno', name: 'Sin grabado', kind: 'engraving', cost: {}, effect: {}, description: 'Sobrio.' },
  { id: 'grabado_hojas', name: 'Motivo de hojas', kind: 'engraving', cost: { gold: 5 }, effect: { valuePct: 5 }, beauty: 2, description: 'Hojas entrelazadas. Gusta a casi todos.' },
  { id: 'grabado_runico', name: 'Runas decorativas', kind: 'engraving', cost: { gold: 8 }, effect: { valuePct: 6, statPct: { dur: 4 } }, beauty: 2, description: 'Runas sin poder, pero con estilo. Durabilidad +4%.' },
  { id: 'grabado_blason', name: 'Blasón señorial', kind: 'engraving', cost: { gold: 12 }, effect: { valuePct: 8, addTags: ['noble'] }, beauty: 4, description: 'Un escudo de armas. Nobles y coleccionistas lo adoran.' },
];

// ── Etapa 5: encantamiento ──
export const ENCHANTMENTS: Enchantment[] = [
  {
    id: 'runa_brasa', name: 'Runa de Brasa', source: 'runa', kind: 'pasiva',
    categories: ['arma', 'distancia', 'municion'],
    cost: [{ material: 'piedra_runica', qty: 1 }, { material: 'ascua_salamandrilla', qty: 1 }],
    effect: { affinity: { fuego: 2 }, valuePct: 10 }, combat: { fireDamage: 3 },
    description: 'Calor residual en cada golpe: +3 de daño de fuego.',
  },
  {
    id: 'runa_vigor', name: 'Runa de Vigor', source: 'runa', kind: 'pasiva',
    categories: ['arma', 'distancia', 'escudo', 'armadura', 'herramienta'],
    cost: [{ material: 'piedra_runica', qty: 1 }, { material: 'gel_slime', qty: 2 }],
    effect: { statPct: { dur: 30, def: 5 } }, combat: { selfRepair: 1 },
    description: 'La pieza se recompone sola: durabilidad +30%.',
  },
  {
    id: 'runa_colmillo', name: 'Runa del Colmillo', source: 'runa', kind: 'pasiva',
    categories: ['arma', 'distancia', 'municion'],
    cost: [{ material: 'piedra_runica', qty: 1 }, { material: 'colmillo_lobo', qty: 1 }],
    effect: { statPct: { atk: 8 } }, combat: { critPct: 5 },
    description: 'El instinto del lobo: ataque +8% y crítico +5%.',
  },
  {
    id: 'runa_totem', name: 'Runa del Tótem', source: 'runa', kind: 'pasiva',
    categories: ['escudo', 'armadura'],
    cost: [{ material: 'piedra_runica', qty: 1 }, { material: 'totem_tallado', qty: 1 }],
    effect: { statPct: { def: 10 }, affinity: { tierra: 1 } }, combat: { flatReduction: 1 },
    description: 'Una runa menor goblin: defensa +10% y reduce el daño recibido en 1.',
  },
  {
    id: 'runa_nucleo', name: 'Runa del Núcleo', source: 'runa', kind: 'pasiva',
    categories: ['arma', 'escudo', 'armadura'],
    cost: [{ material: 'piedra_runica', qty: 1 }, { material: 'nucleo_gelin', qty: 1 }],
    effect: { statPct: { dur: 20 }, affinity: { agua: 1 } }, combat: { hpBonus: 10 },
    description: 'El núcleo de un gelín rey grabado en piedra: vida máxima +10 en combate.',
  },
];
