import type { AlchemyProps } from '../core/magic/types';
import type { Material } from '../core/types';

// Fase 3: gemas para joyería, hierbas para alquimia y productos alquímicos.
export const MATERIALS_3: Material[] = [
  // ── Gemas (engarces de joyería y pomos) ──
  { id: 'rubi', name: 'Rubí', type: 'gema', tier: 2, price: 40, color: '#d1232a', stats: { atk: 4, dur: 5 }, affinities: { fuego: 3 }, tags: ['gema'], alchemy: { fuego: 2, vigor: 1 }, description: 'Rojo como una brasa que no se apaga. Potencia todo lo ígneo.' },
  { id: 'zafiro', name: 'Zafiro', type: 'gema', tier: 2, price: 40, color: '#2a5bd1', stats: { def: 3, dur: 5 }, affinities: { hielo: 2, agua: 1 }, tags: ['gema'], alchemy: { hielo: 2, proteccion: 1 }, description: 'Azul profundo. Dicen que adentro siempre es invierno.' },
  { id: 'esmeralda', name: 'Esmeralda', type: 'gema', tier: 2, price: 38, color: '#1f9e5a', stats: { def: 2, dur: 6 }, affinities: { tierra: 2, veneno: 1 }, tags: ['gema'], alchemy: { curacion: 2 }, description: 'Verde de bosque viejo. Calma el pulso.' },
  { id: 'ambar', name: 'Ámbar', type: 'gema', tier: 2, price: 35, color: '#e8a12a', stats: { spd: 2, dur: 4 }, affinities: { rayo: 3 }, tags: ['gema'], alchemy: { rayo: 2, celeridad: 1 }, description: 'Resina antigua que guarda chispas. Si la frotás, chisporrotea.' },
  { id: 'amatista', name: 'Amatista', type: 'gema', tier: 2, price: 36, color: '#8a4fc7', stats: { atk: 2, dur: 4 }, affinities: { oscuro: 3 }, tags: ['gema'], alchemy: { antidoto: 2 }, description: 'Violeta y fría. Bebe la luz de alrededor.' },
  { id: 'jade', name: 'Jade', type: 'gema', tier: 2, price: 34, color: '#5fae7a', stats: { def: 4, dur: 8 }, affinities: { tierra: 3 }, tags: ['gema'], alchemy: { proteccion: 2 }, description: 'Pesado y terco. Los guardias lo llevan de amuleto.' },
  { id: 'cristal_viento', name: 'Cristal de viento', type: 'gema', tier: 2, price: 42, color: '#c9f1ee', stats: { spd: 4, dur: 3 }, affinities: { viento: 3 }, tags: ['gema'], alchemy: { celeridad: 2 }, description: 'Casi transparente. Silba cuando sopla el viento.' },
  { id: 'opalo_lunar', name: 'Ópalo lunar', type: 'gema', tier: 3, price: 80, color: '#e9e4ff', stats: { def: 3, dur: 6 }, affinities: { sagrado: 3 }, tags: ['gema', 'raro'], alchemy: { sagrado: 2, curacion: 1 }, description: 'Cambia de color con la luna. Muy buscado por los coleccionistas.' },

  // ── Hierbas (se cortan con hoz) ──
  { id: 'hoja_alivio', name: 'Hoja de alivio', type: 'hierba', tier: 1, price: 3, color: '#8fd16a', stats: {}, tags: ['hierba'], alchemy: { curacion: 2 }, description: 'La primera hierba que aprende a reconocer todo aprendiz de alquimista.' },
  { id: 'raiz_amarga', name: 'Raíz amarga', type: 'hierba', tier: 1, price: 4, color: '#a07a4a', stats: {}, tags: ['hierba'], alchemy: { antidoto: 2 }, description: 'Horrible al gusto, buenísima contra el veneno.' },
  { id: 'flor_brasa', name: 'Flor de brasa', type: 'hierba', tier: 1, price: 5, color: '#ff7a3d', stats: {}, affinities: { fuego: 1 }, tags: ['hierba'], alchemy: { fuego: 2, vigor: 1 }, description: 'Pétalos tibios. Crece donde hubo un incendio.' },
  { id: 'musgo_frio', name: 'Musgo frío', type: 'hierba', tier: 1, price: 5, color: '#9fd8e8', stats: {}, affinities: { hielo: 1 }, tags: ['hierba'], alchemy: { hielo: 2, proteccion: 1 }, description: 'Siempre húmedo, siempre helado.' },
  { id: 'hongo_niebla', name: 'Hongo de niebla', type: 'hierba', tier: 1, price: 4, color: '#b8a8c8', stats: {}, tags: ['hierba'], alchemy: { humo: 2, veneno: 1 }, description: 'Si lo pisás suelta una nube gris. Útil para escaparse.' },
  { id: 'cardo_hierro', name: 'Cardo de hierro', type: 'hierba', tier: 2, price: 9, color: '#6d7a8a', stats: {}, tags: ['hierba'], alchemy: { proteccion: 2, vigor: 1 }, description: 'Espinoso y duro. Hace falta una buena hoz.' },
  { id: 'lirio_nocturno', name: 'Lirio nocturno', type: 'hierba', tier: 2, price: 12, color: '#d8c8ff', stats: {}, affinities: { sagrado: 1 }, tags: ['hierba'], alchemy: { sagrado: 2, curacion: 1 }, description: 'Solo abre de noche. Brilla apenas.' },

  // ── Productos de alquimia y partes nuevas ──
  { id: 'sangre_bestia', name: 'Sangre de bestia', type: 'monstruo', tier: 1, price: 8, color: '#8a1a1a', stats: {}, affinities: { oscuro: 1 }, tags: ['bestia', 'sangre'], alchemy: { vigor: 2 }, description: 'Espesa y caliente. Para templar o para tónicos.' },
  { id: 'agua_bendita', name: 'Agua bendita', type: 'especial', tier: 2, price: 22, color: '#d9f2ff', stats: {}, affinities: { sagrado: 2 }, tags: ['alquimia'], description: 'Destilada con lirio nocturno. Templa y purifica.' },
  { id: 'aceite_alquimico', name: 'Aceite alquímico', type: 'especial', tier: 2, price: 18, color: '#d9b84a', stats: {}, tags: ['alquimia'], description: 'Un temple que deja el metal flexible y duradero.' },
  { id: 'esencia_ignea', name: 'Esencia ígnea', type: 'especial', tier: 2, price: 30, color: '#ff5a1f', stats: {}, affinities: { fuego: 3 }, tags: ['alquimia', 'esencia'], description: 'Fuego líquido. Reactivo de los grimorios de llama.' },
  { id: 'esencia_glacial', name: 'Esencia glacial', type: 'especial', tier: 2, price: 30, color: '#7fd6ff', stats: {}, affinities: { hielo: 3 }, tags: ['alquimia', 'esencia'], description: 'No se derrite. Reactivo de los grimorios de escarcha.' },
  { id: 'esencia_tormenta', name: 'Esencia de tormenta', type: 'especial', tier: 2, price: 34, color: '#ffe14a', stats: {}, affinities: { rayo: 3 }, tags: ['alquimia', 'esencia'], description: 'Zumba dentro del frasco. Reactivo de los grimorios de rayo.' },
  { id: 'esencia_vital', name: 'Esencia vital', type: 'especial', tier: 2, price: 34, color: '#9aff9a', stats: {}, affinities: { sagrado: 1 }, tags: ['alquimia', 'esencia'], description: 'Huele a pasto recién cortado. Reactivo de los grimorios de luz.' },
];

/** Propiedades alquímicas de materiales que ya existían (se agregan al cargar el contenido). */
export const ALCHEMY_OF_EXISTING: Record<string, AlchemyProps> = {
  gel_slime: { curacion: 1 },
  gel_acido: { veneno: 1 },
  gel_escarcha: { hielo: 2 },
  ascua_salamandrilla: { fuego: 3 },
  glandula_veneno: { veneno: 2 },
  colmillo_lobo: { vigor: 1 },
  nucleo_gelin: { curacion: 3 },
  totem_tallado: { proteccion: 1, sagrado: 1 },
  seda_arana: { celeridad: 1 },
  garra_oso: { vigor: 2 },
  cuarzo_igneo: { fuego: 1 },
  cuarzo_glacial: { hielo: 1 },
  plumas_ganso: { celeridad: 1 },
};
