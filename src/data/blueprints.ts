import type { Blueprint } from '../core/types';

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'daga', name: 'Daga', category: 'arma', station: 'yunque', slots: 1,
    parts: [
      { slot: 'hoja', label: 'Hoja', types: ['metal'], extra: ['colmillo_lobo'], weight: 0.6, qty: 1 },
      { slot: 'guarda', label: 'Guarda', types: ['metal'], weight: 0.15, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera', 'cuero'], weight: 0.25, qty: 1 },
    ],
    base: { atk: 3, spd: 6, dur: 5 },
    scale: { atk: 0.9, def: 0.05, spd: 1, wgt: 0.6, dur: 1 },
    quench: true, grip: true, engrave: true, tags: ['cortante', 'perforante', 'liviana'],
    description: 'Hoja corta y rápida. Barata de hacer, fácil de vender.',
  },
  {
    id: 'espada_larga', name: 'Espada larga', category: 'arma', station: 'yunque', slots: 2,
    parts: [
      { slot: 'hoja', label: 'Hoja', types: ['metal'], weight: 0.55, qty: 3 },
      { slot: 'guarda', label: 'Guarda', types: ['metal'], weight: 0.15, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera', 'cuero'], weight: 0.15, qty: 1 },
      { slot: 'pomo', label: 'Pomo', types: ['metal', 'gema'], weight: 0.15, qty: 1 },
    ],
    base: { atk: 6, spd: 2, dur: 10 },
    scale: { atk: 1.1, def: 0.1, spd: 0.5, wgt: 1, dur: 1.2 },
    quench: true, grip: true, engrave: true, tags: ['cortante'],
    description: 'La espada de todo aventurero que se precie. Pide buen metal.',
  },
  {
    id: 'maza', name: 'Maza', category: 'arma', station: 'yunque', slots: 1,
    parts: [
      { slot: 'cabeza', label: 'Cabeza', types: ['metal'], weight: 0.65, qty: 3 },
      { slot: 'mango', label: 'Mango', types: ['madera'], weight: 0.35, qty: 1 },
    ],
    base: { atk: 8, dur: 12 },
    scale: { atk: 1.2, spd: 0.3, wgt: 1.3, dur: 1.2 },
    quench: true, grip: true, engrave: true, tags: ['contundente'],
    description: 'Pesada y honesta. No corta: convence.',
  },
  {
    id: 'arco_corto', name: 'Arco corto', category: 'distancia', station: 'flecheria', slots: 1,
    parts: [
      { slot: 'cuerpo', label: 'Cuerpo', types: ['madera'], weight: 0.6, qty: 2 },
      { slot: 'cuerda', label: 'Cuerda', types: [], extra: ['cuerda_lino', 'tripa_trenzada'], weight: 0.3, qty: 1 },
      { slot: 'empunadura', label: 'Empuñadura', types: ['cuero'], weight: 0.1, qty: 1 },
    ],
    base: { atk: 5, spd: 4, dur: 6 },
    scale: { atk: 1, spd: 0.8, wgt: 0.5, dur: 1 },
    quench: false, grip: false, engrave: true, tags: ['perforante', 'distancia'],
    description: 'Arco ágil para cazadores y exploradores.',
  },
  {
    id: 'flechas', name: 'Flechas', category: 'municion', station: 'flecheria', slots: 1, batch: 20,
    parts: [
      { slot: 'punta', label: 'Punta', types: ['metal'], extra: ['colmillo_lobo'], weight: 0.5, qty: 1 },
      { slot: 'astil', label: 'Astil', types: ['madera'], weight: 0.3, qty: 1 },
      { slot: 'emplumado', label: 'Emplumado', types: [], extra: ['plumas_ganso'], weight: 0.2, qty: 1 },
    ],
    base: { atk: 2, spd: 2, dur: 2 },
    scale: { atk: 0.5, spd: 0.5, wgt: 0.2, dur: 0.3 },
    quench: true, grip: false, engrave: false, tags: ['perforante', 'consumible'],
    description: 'Lote de flechas. Se gastan, así que siempre hay quien compre.',
  },
  {
    id: 'escudo_mediano', name: 'Escudo mediano', category: 'escudo', station: 'yunque', slots: 1,
    parts: [
      { slot: 'tablas', label: 'Tablas', types: ['madera'], weight: 0.5, qty: 2 },
      { slot: 'refuerzo', label: 'Refuerzo', types: ['metal'], weight: 0.35, qty: 2 },
      { slot: 'correas', label: 'Correas', types: ['cuero'], weight: 0.15, qty: 1 },
    ],
    base: { def: 6, dur: 10 },
    scale: { atk: 0.1, def: 1.1, spd: 0.2, wgt: 1, dur: 1 },
    quench: true, grip: false, engrave: true, tags: ['bloqueo'],
    description: 'Madera con refuerzos de metal. Lo piden mucho los guardias.',
  },
  {
    id: 'peto', name: 'Peto', category: 'armadura', station: 'yunque', slots: 2,
    parts: [
      { slot: 'placas', label: 'Placas', types: ['metal', 'cuero'], weight: 0.7, qty: 3 },
      { slot: 'forro', label: 'Forro', types: ['cuero', 'fibra', 'monstruo'], weight: 0.3, qty: 1 },
    ],
    base: { def: 8, dur: 12 },
    scale: { def: 1.2, spd: 0.2, wgt: 1.2, dur: 1 },
    quench: true, grip: false, engrave: true, tags: ['pecho'],
    description: 'Protección de torso. Metal para aguantar, cuero para moverse.',
  },
  {
    id: 'pico', name: 'Pico de minero', category: 'herramienta', station: 'yunque', slots: 1,
    parts: [
      { slot: 'cabeza', label: 'Cabeza', types: ['metal'], weight: 0.7, qty: 2 },
      { slot: 'mango', label: 'Mango', types: ['madera'], weight: 0.3, qty: 1 },
    ],
    base: { atk: 4, dur: 14 },
    scale: { atk: 0.8, spd: 0.2, wgt: 0.8, dur: 1.4 },
    quench: true, grip: true, engrave: false, tags: ['herramienta', 'mineria'],
    description: 'Sin pico no hay mineral. Su potencia define qué vetas se pueden picar.',
  },
];
