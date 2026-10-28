import type { ItemCategory, Trait } from '../core/types';

const JEWEL: ItemCategory[] = ['joyeria'];
const THROW: ItemCategory[] = ['arrojadizo'];
const MELEE: ItemCategory[] = ['arma'];
const GUARD: ItemCategory[] = ['escudo', 'armadura'];
const GEAR: ItemCategory[] = ['arma', 'distancia', 'escudo', 'armadura', 'herramienta'];

// Fase 3: rasgos de joyería, arrojadizos y más rasgos de equipo.
// Efectos de combate nuevos: regen, cooldownReduce, abilityUses, abilityPower, statusResist, lastStand, lootPct.
export const TRAITS_3: Trait[] = [
  // ── Joyería ──
  { id: 'vigoroso', name: 'Vigoroso', tier: 1, categories: JEWEL, effect: { valuePct: 8 }, combat: { hpBonus: 8 }, description: 'Vida máxima +8 en combate.' },
  { id: 'agil', name: 'Ágil', tier: 1, categories: JEWEL, effect: { statPct: { spd: 10 } }, combat: { evasionPct: 4 }, description: 'Evasión +4%.' },
  { id: 'brillante', name: 'Brillante', tier: 1, categories: JEWEL, effect: { valuePct: 20 }, description: 'Una joya que encandila: vale mucho más.' },
  { id: 'fortuna', name: 'De la fortuna', tier: 1, categories: JEWEL, effect: { valuePct: 10 }, combat: { lootPct: 10 }, description: 'Más chance de botín al ganar un combate.' },
  { id: 'concentracion', name: 'Concentración', tier: 2, categories: JEWEL, effect: { valuePct: 15 }, combat: { cooldownReduce: 1 }, description: 'Las habilidades activas recargan un turno antes.' },
  { id: 'resiliencia', name: 'Resiliencia', tier: 2, categories: [...JEWEL, ...GUARD], effect: { valuePct: 12 }, combat: { statusResist: 25 }, description: '25% de chance de resistir estados negativos.' },
  { id: 'regenerativo', name: 'Regenerativo', tier: 2, categories: [...JEWEL, 'armadura'], effect: { valuePct: 15 }, combat: { regen: 2 }, description: 'Recupera 2 de vida por turno.' },
  { id: 'reflejos', name: 'Reflejos', tier: 2, categories: JEWEL, effect: { valuePct: 12 }, combat: { evasionPct: 8 }, description: 'Evasión +8%.' },
  { id: 'reserva', name: 'Reserva arcana', tier: 3, categories: JEWEL, effect: { valuePct: 30 }, combat: { abilityUses: 1 }, description: 'Un uso más por combate para cada habilidad activa.' },
  { id: 'alma_elemental', name: 'Alma elemental', tier: 3, categories: JEWEL, effect: { valuePct: 30 }, combat: { abilityPower: 25 }, description: 'Las habilidades activas pegan un 25% más.' },
  { id: 'ultimo_aliento', name: 'Último aliento', tier: 3, categories: [...JEWEL, 'armadura'], effect: { valuePct: 30 }, combat: { lastStand: 1 }, description: 'Una vez por combate, sobrevive a un golpe mortal con 1 de vida.' },

  // ── Arrojadizos ──
  { id: 'afilados', name: 'Afilados', tier: 1, categories: THROW, effect: { statPct: { atk: 10 } }, description: 'Daño +10%.' },
  { id: 'equilibrados', name: 'Equilibrados', tier: 1, categories: THROW, effect: { valuePct: 8 }, combat: { critPct: 8 }, description: 'Vuelan derecho: crítico +8%.' },
  { id: 'dentados', name: 'Dentados', tier: 2, categories: THROW, effect: { valuePct: 12 }, combat: { bleed: 3 }, description: 'Dejan heridas que sangran.' },
  { id: 'boomerang', name: 'De vuelta', tier: 2, categories: THROW, effect: { valuePct: 15 }, combat: { recoverPct: 50 }, description: 'La mitad vuelve al cinturón después del combate.' },
  { id: 'certeros', name: 'Certeros', tier: 3, categories: THROW, effect: { valuePct: 25 }, combat: { critPct: 20 }, description: 'Crítico +20%.' },

  // ── Equipo ──
  { id: 'pesada', name: 'Pesada', tier: 1, categories: MELEE, effect: { statPct: { atk: 12, spd: -8 } }, description: 'Daño +12%, pero más lenta.' },
  { id: 'templada', name: 'Bien templada', tier: 1, categories: GEAR, effect: { statPct: { dur: 10, def: 3 } }, description: 'Durabilidad +10% y defensa +3%.' },
  { id: 'ignifuga', name: 'Ignífuga', tier: 2, categories: GUARD, effect: { affinity: { fuego: 2 }, valuePct: 10 }, description: 'Protege del fuego.' },
  { id: 'aislante', name: 'Aislante', tier: 2, categories: GUARD, effect: { affinity: { rayo: 2 }, valuePct: 10 }, description: 'Protege del rayo.' },
  { id: 'abrigada', name: 'Abrigada', tier: 2, categories: GUARD, effect: { affinity: { hielo: 2 }, valuePct: 10 }, description: 'Protege del hielo.' },
  { id: 'guardia_firme', name: 'Guardia firme', tier: 2, categories: ['escudo'], effect: { valuePct: 12 }, combat: { blockPct: 25 }, description: 'Al cubrirse, 25% de chance de parar la mitad del golpe.' },
  { id: 'canalizadora', name: 'Canalizadora', tier: 2, categories: [...MELEE, 'distancia'], effect: { valuePct: 15 }, combat: { abilityPower: 15 }, description: 'Las habilidades activas de esta pieza pegan un 15% más.' },
  { id: 'inagotable', name: 'Inagotable', tier: 3, categories: [...MELEE, 'distancia', 'escudo'], effect: { valuePct: 30 }, combat: { abilityUses: 1 }, description: 'Un uso más por combate para sus habilidades activas.' },
];
