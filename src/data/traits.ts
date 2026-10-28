import type { ItemCategory, Trait } from '../core/types';

const MELEE: ItemCategory[] = ['arma'];
const RANGED: ItemCategory[] = ['distancia'];
const AMMO: ItemCategory[] = ['municion'];
const GUARD: ItemCategory[] = ['escudo', 'armadura'];
const TOOLS: ItemCategory[] = ['herramienta'];
const ALL_GEAR: ItemCategory[] = ['arma', 'distancia', 'escudo', 'armadura', 'herramienta'];

// Rasgos pasivos que pueden salir en el forjado (y algunos solo por sinergia).
// `combat` describe el efecto que se usará en el combate táctico (Fase 2).
export const TRAITS: Trait[] = [
  // ── Generales ──
  { id: 'robusta', name: 'Robusta', tier: 1, categories: ALL_GEAR, effect: { statPct: { dur: 15 } }, description: 'Durabilidad +15%.' },
  { id: 'bien_balanceada', name: 'Bien balanceada', tier: 1, categories: [...MELEE, ...RANGED, ...TOOLS], effect: { statPct: { spd: 10 } }, description: 'Velocidad +10%.' },
  { id: 'liviana', name: 'Liviana', tier: 2, categories: ALL_GEAR, effect: { statPct: { wgt: -25, spd: 8 } }, description: 'Peso −25% y velocidad +8%.' },
  { id: 'irrompible', name: 'Irrompible', tier: 3, categories: ALL_GEAR, effect: { statPct: { dur: 100 }, valuePct: 20 }, combat: { noWear: 1 }, description: 'No pierde durabilidad en combate.' },

  // ── Armas cuerpo a cuerpo ──
  { id: 'filo_agudo', name: 'Filo agudo', tier: 1, categories: MELEE, effect: { statPct: { atk: 8 } }, description: 'Ataque +8%.' },
  { id: 'critico', name: 'Ojo del verdugo', tier: 2, categories: MELEE, effect: { valuePct: 10 }, combat: { critPct: 10 }, description: 'Crítico +10%.' },
  { id: 'sangrado', name: 'Sangrado', tier: 2, categories: [...MELEE, ...AMMO], effect: { valuePct: 10 }, combat: { bleed: 3 }, description: 'Los golpes abren heridas que sangran unos turnos.' },
  { id: 'aturdidora', name: 'Aturdidora', tier: 2, categories: MELEE, effect: { valuePct: 12 }, combat: { stunPct: 15 }, description: '15% de chance de aturdir al golpear.' },
  { id: 'roba_vida', name: 'Sed de vida', tier: 3, categories: MELEE, effect: { valuePct: 25 }, combat: { lifeStealPct: 15 }, description: 'Recupera el 15% del daño causado.' },
  { id: 'golpe_doble', name: 'Golpe doble', tier: 3, categories: MELEE, effect: { valuePct: 25 }, combat: { doubleHitPct: 20 }, description: '20% de chance de golpear dos veces.' },

  // ── A distancia ──
  { id: 'tensa', name: 'Tensa', tier: 1, categories: RANGED, effect: { statPct: { atk: 8 } }, description: 'Ataque +8%.' },
  { id: 'disparo_certero', name: 'Disparo certero', tier: 2, categories: RANGED, effect: { valuePct: 10 }, combat: { critPct: 12 }, description: 'Crítico +12% a distancia.' },
  { id: 'largo_alcance', name: 'Largo alcance', tier: 2, categories: RANGED, effect: { valuePct: 10 }, combat: { range: 1 }, description: 'Alcance +1 casilla.' },
  { id: 'disparo_doble', name: 'Disparo doble', tier: 3, categories: RANGED, effect: { valuePct: 25 }, combat: { doubleShotPct: 25 }, description: '25% de chance de disparar dos flechas.' },

  // ── Munición ──
  { id: 'bien_emplumadas', name: 'Bien emplumadas', tier: 1, categories: AMMO, effect: { statPct: { spd: 12 } }, description: 'Vuelan más rectas: velocidad +12%.' },
  { id: 'perforantes', name: 'Perforantes', tier: 2, categories: AMMO, effect: { valuePct: 15 }, combat: { armorPiercePct: 30 }, description: 'Ignoran el 30% de la defensa.' },
  { id: 'recuperables', name: 'Recuperables', tier: 3, categories: AMMO, effect: { valuePct: 25 }, combat: { recoverPct: 50 }, description: 'La mitad se recupera después del combate.' },

  // ── Escudos y armaduras ──
  { id: 'reforzada', name: 'Reforzada', tier: 1, categories: GUARD, effect: { statPct: { def: 8 } }, description: 'Defensa +8%.' },
  { id: 'ajustada', name: 'Ajustada', tier: 1, categories: GUARD, effect: { statPct: { spd: 10 } }, description: 'Calza perfecto: velocidad +10%.' },
  { id: 'piel_dura', name: 'Piel dura', tier: 2, categories: GUARD, effect: { valuePct: 12 }, combat: { flatReduction: 2 }, description: 'Reduce en 2 todo el daño recibido.' },
  { id: 'espinas', name: 'Espinas', tier: 3, categories: GUARD, effect: { valuePct: 25 }, combat: { thornsPct: 20 }, description: 'Devuelve el 20% del daño cuerpo a cuerpo.' },
  { id: 'bastion', name: 'Bastión', tier: 3, categories: ['escudo'], effect: { statPct: { def: 25 }, valuePct: 15 }, combat: { blockPct: 15 }, description: 'Defensa +25% y bloqueo extra.' },

  // ── Herramientas ──
  { id: 'buen_agarre', name: 'Buen agarre', tier: 1, categories: TOOLS, effect: { statPct: { atk: 10 } }, description: 'Potencia +10%.' },
  { id: 'veta_certera', name: 'Veta certera', tier: 2, categories: TOOLS, effect: { valuePct: 15 }, combat: { gatherBonusPct: 25 }, description: '25% de chance de extraer de más.' },
  { id: 'incansable', name: 'Incansable', tier: 3, categories: TOOLS, effect: { valuePct: 25 }, combat: { energySavePct: 30 }, description: 'Recolectar gasta 30% menos energía.' },

  // ── Solo por sinergia ──
  { id: 'quemadura', name: 'Quemadura', tier: 2, categories: [...MELEE, ...RANGED, ...AMMO], synergyOnly: true, effect: { valuePct: 15 }, combat: { burn: 3 }, description: 'Prende fuego al enemigo unos turnos.' },
  { id: 'escarcha', name: 'Escarcha', tier: 2, categories: [...MELEE, ...RANGED, ...AMMO], synergyOnly: true, effect: { valuePct: 15 }, combat: { slowPct: 30 }, description: 'Ralentiza al enemigo golpeado.' },
  { id: 'chispa', name: 'Chispa', tier: 2, categories: [...MELEE, ...AMMO], synergyOnly: true, effect: { valuePct: 15 }, combat: { shockPct: 20 }, description: 'Descarga eléctrica: más daño a enemigos mojados.' },
  { id: 'azote_no_muertos', name: 'Azote de no-muertos', tier: 2, categories: ALL_GEAR, synergyOnly: true, effect: { valuePct: 20 }, combat: { vsUndeadPct: 50 }, description: '+50% de daño contra no-muertos.' },
  { id: 'acolchado', name: 'Acolchado', tier: 1, categories: GUARD, synergyOnly: true, effect: { statPct: { def: 6 } }, combat: { bluntResistPct: 20 }, description: 'Absorbe golpes contundentes.' },
  { id: 'silbante', name: 'Silbante', tier: 2, categories: AMMO, synergyOnly: true, effect: { statPct: { spd: 15 } }, combat: { firstStrike: 1 }, description: 'Silba en el aire: el enemigo duda.' },
];
