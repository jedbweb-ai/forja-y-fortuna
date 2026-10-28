import type { PotionDef } from '../core/magic/types';

// Recetas de alquimia: la mezcla de ingredientes suma propiedades y gana la receta de mayor prioridad
// cuyos mínimos se cumplen. Las secretas se descubren experimentando.
export const POTIONS: PotionDef[] = [
  // ── Pociones ──
  { id: 'pocion_curacion', name: 'Poción de curación', secret: false, requires: { curacion: 2 }, priority: 1, main: 'curacion', output: { kind: 'pocion', effect: { type: 'curar', pct: 0.3 } }, qty: 3, value: 12, color: '#e04a5a', description: 'Cura el 30% de la vida (más con más potencia).' },
  { id: 'pocion_curacion_mayor', name: 'Poción de curación mayor', secret: true, requires: { curacion: 5 }, priority: 3, main: 'curacion', output: { kind: 'pocion', effect: { type: 'curar', pct: 0.6 } }, qty: 2, value: 35, color: '#ff2a4a', description: 'Cura el 60% de la vida.' },
  { id: 'antidoto', name: 'Antídoto', secret: false, requires: { antidoto: 2 }, priority: 2, main: 'antidoto', output: { kind: 'pocion', effect: { type: 'limpiar' } }, qty: 3, value: 10, color: '#8ad16a', description: 'Quita veneno, sangrado, quemaduras y lentitud.' },
  { id: 'tonico_fuerza', name: 'Tónico de fuerza', secret: false, requires: { vigor: 3 }, priority: 2, main: 'vigor', output: { kind: 'pocion', effect: { type: 'estado', status: 'potenciado', turns: 3 } }, qty: 2, value: 18, color: '#c0392b', description: 'Más daño por unos turnos.' },
  { id: 'elixir_piel_hierro', name: 'Elixir de piel de hierro', secret: false, requires: { proteccion: 3 }, priority: 2, main: 'proteccion', output: { kind: 'pocion', effect: { type: 'estado', status: 'protegido', turns: 3 } }, qty: 2, value: 18, color: '#8a8f98', description: 'Menos daño recibido por unos turnos.' },
  { id: 'brebaje_celeridad', name: 'Brebaje de celeridad', secret: true, requires: { celeridad: 3 }, priority: 2, main: 'celeridad', output: { kind: 'pocion', effect: { type: 'estado', status: 'acelerado', turns: 3 } }, qty: 2, value: 22, color: '#c9f1ee', description: 'Más movimiento y velocidad.' },
  { id: 'unguento_regenerador', name: 'Ungüento regenerador', secret: true, requires: { curacion: 2, vigor: 2 }, priority: 3, main: 'curacion', output: { kind: 'pocion', effect: { type: 'estado', status: 'regenerando', turns: 4 } }, qty: 2, value: 24, color: '#9aff9a', description: 'Recupera vida cada turno.' },
  { id: 'resguardo_igneo', name: 'Resguardo ígneo', secret: true, requires: { fuego: 2, proteccion: 1 }, priority: 3, main: 'proteccion', output: { kind: 'pocion', effect: { type: 'resguardo', element: 'fuego', turns: 4 } }, qty: 2, value: 20, color: '#ff8a3d', description: 'Protege del fuego.' },
  { id: 'resguardo_glacial', name: 'Resguardo glacial', secret: true, requires: { hielo: 2, proteccion: 2 }, priority: 3, main: 'proteccion', output: { kind: 'pocion', effect: { type: 'resguardo', element: 'hielo', turns: 4 } }, qty: 2, value: 20, color: '#7fd6ff', description: 'Protege del hielo.' },
  { id: 'bomba_humo', name: 'Bomba de humo', secret: false, requires: { humo: 2 }, priority: 2, main: 'humo', output: { kind: 'pocion', effect: { type: 'huida' } }, qty: 2, value: 15, color: '#b8a8c8', description: 'Asegura la huida (salvo contra jefes, donde es probable).' },

  // ── Materiales alquímicos (temples y reactivos de grimorio) ──
  { id: 'r_agua_bendita', name: 'Agua bendita', secret: false, requires: { sagrado: 3 }, priority: 3, main: 'sagrado', output: { kind: 'material', material: 'agua_bendita' }, qty: 2, value: 0, color: '#d9f2ff', description: 'Temple sagrado y reactivo de grimorios de luz.' },
  { id: 'r_aceite_alquimico', name: 'Aceite alquímico', secret: false, requires: { proteccion: 2, celeridad: 1 }, priority: 3, main: 'proteccion', output: { kind: 'material', material: 'aceite_alquimico' }, qty: 2, value: 0, color: '#d9b84a', description: 'Temple que deja el metal flexible y duradero.' },
  { id: 'r_esencia_ignea', name: 'Esencia ígnea', secret: true, requires: { fuego: 4 }, priority: 4, main: 'fuego', output: { kind: 'material', material: 'esencia_ignea' }, qty: 1, value: 0, color: '#ff5a1f', description: 'Reactivo de los grimorios de fuego.' },
  { id: 'r_esencia_glacial', name: 'Esencia glacial', secret: true, requires: { hielo: 4 }, priority: 4, main: 'hielo', output: { kind: 'material', material: 'esencia_glacial' }, qty: 1, value: 0, color: '#7fd6ff', description: 'Reactivo de los grimorios de escarcha.' },
  { id: 'r_esencia_tormenta', name: 'Esencia de tormenta', secret: true, requires: { rayo: 3 }, priority: 4, main: 'rayo', output: { kind: 'material', material: 'esencia_tormenta' }, qty: 1, value: 0, color: '#ffe14a', description: 'Reactivo de los grimorios de rayo.' },
  { id: 'r_esencia_vital', name: 'Esencia vital', secret: true, requires: { curacion: 3, sagrado: 2 }, priority: 5, main: 'curacion', output: { kind: 'material', material: 'esencia_vital' }, qty: 1, value: 0, color: '#9aff9a', description: 'Reactivo de los grimorios de vida.' },
];
