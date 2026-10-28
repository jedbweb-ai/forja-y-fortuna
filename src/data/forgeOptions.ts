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
];

// ── Etapa 4: acabado ──
export const FINISHES: FinishOption[] = [
  // Empuñadura / forro
  { id: 'grip_ninguno', name: 'Sin forro', kind: 'grip', cost: {}, effect: {}, description: 'Mango desnudo.' },
  { id: 'grip_cordel', name: 'Cordel', kind: 'grip', cost: { material: 'cuerda_lino', qty: 1 }, effect: { statPct: { spd: 4 } }, description: 'Cordel enrollado: mejor agarre. Velocidad +4%.' },
  { id: 'grip_cuero', name: 'Forro de cuero', kind: 'grip', cost: { material: 'cuero_curtido', qty: 1 }, effect: { statPct: { spd: 7 }, valuePct: 4 }, beauty: 1, description: 'Cuero cosido a mano. Velocidad +7%.' },

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
];
