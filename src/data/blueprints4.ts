import type { Blueprint } from '../core/types';

// Planos de la Fase 4: se consiguen en la gran subasta o por la relación con un NPC.
export const BLUEPRINTS_4: Blueprint[] = [
  {
    id: 'mandoble', name: 'Mandoble', category: 'arma', station: 'yunque', slots: 3, twoHanded: true,
    parts: [
      { slot: 'hoja', label: 'Hoja', types: ['metal'], weight: 0.6, qty: 4 },
      { slot: 'guarda', label: 'Guarda', types: ['metal'], weight: 0.15, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera', 'cuero'], weight: 0.15, qty: 1 },
      { slot: 'pomo', label: 'Pomo', types: ['metal', 'gema'], extra: ['corona_colmillos', 'nucleo_gelin'], weight: 0.1, qty: 1 },
    ],
    base: { atk: 10, dur: 12 },
    scale: { atk: 1.35, def: 0.15, spd: 0.3, wgt: 1.4, dur: 1.2 },
    quench: true, grip: true, engrave: true, tags: ['cortante', 'pesada'], weaponKind: 'espada',
    description: 'Espada de dos manos. Lenta, pero cada golpe parte escudos. Pide mucho metal y mucha fuerza.',
  },
  {
    id: 'lucero_alba', name: 'Lucero del alba', category: 'arma', station: 'yunque', slots: 2,
    parts: [
      { slot: 'cabeza', label: 'Cabeza', types: ['metal'], extra: ['colmillo_jabali', 'garra_oso'], weight: 0.6, qty: 3 },
      { slot: 'puas', label: 'Púas', types: ['metal'], extra: ['colmillo_lobo', 'colmillo_goblin'], weight: 0.15, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera'], weight: 0.25, qty: 1 },
    ],
    base: { atk: 9, dur: 12 },
    scale: { atk: 1.25, spd: 0.3, wgt: 1.3, dur: 1.1 },
    quench: true, grip: true, engrave: true, tags: ['contundente', 'perforante'], weaponKind: 'maza',
    description: 'Maza con púas: aplasta y perfora a la vez. La usaban los vigías de la vieja muralla.',
  },
  {
    id: 'cota_malla', name: 'Cota de malla', category: 'armadura', station: 'yunque', slots: 3,
    parts: [
      { slot: 'anillas', label: 'Anillas', types: ['metal'], weight: 0.75, qty: 4 },
      { slot: 'forro', label: 'Forro', types: ['cuero', 'fibra', 'monstruo'], weight: 0.25, qty: 1 },
    ],
    base: { def: 9, spd: 1, dur: 14 },
    scale: { def: 1.1, spd: 0.5, wgt: 0.9, dur: 1.1 },
    quench: true, grip: true, engrave: false, tags: ['pecho', 'malla'],
    description: 'Miles de anillas remachadas. Protege casi como un peto y pesa bastante menos.',
  },
];
