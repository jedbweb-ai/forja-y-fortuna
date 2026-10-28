import type { Blueprint } from '../core/types';

const JEWEL_SCALE = { def: 0.25, spd: 0.3, wgt: 0.1, dur: 0.6 };

// Fase 3: joyería (mesa de joyería), arrojadizos (banco de flechería) y hoz.
export const BLUEPRINTS_3: Blueprint[] = [
  // ── Joyería: dos anillos y un amuleto por personaje ──
  {
    id: 'anillo', name: 'Anillo', category: 'joyeria', station: 'joyeria', slots: 1, jewelSlot: 'anillo',
    parts: [
      { slot: 'aro', label: 'Aro', types: ['metal'], weight: 0.5, qty: 1 },
      { slot: 'engarce', label: 'Engarce', types: ['gema'], weight: 0.5, qty: 1 },
    ],
    base: { def: 1, dur: 6 }, scale: JEWEL_SCALE,
    quench: false, grip: false, engrave: true, tags: ['joya'],
    description: 'Aro con una gema engarzada. La gema define su afinidad y su poder.',
  },
  {
    id: 'sello', name: 'Anillo de sello', category: 'joyeria', station: 'joyeria', slots: 1, jewelSlot: 'anillo',
    parts: [
      { slot: 'aro', label: 'Aro', types: ['metal'], weight: 0.55, qty: 2 },
      { slot: 'engarce', label: 'Engarce', types: ['gema'], extra: ['colmillo_lobo', 'colmillo_jabali', 'totem_tallado'], weight: 0.45, qty: 1 },
    ],
    base: { def: 2, dur: 10 }, scale: JEWEL_SCALE,
    quench: false, grip: false, engrave: true, tags: ['joya', 'noble'],
    description: 'Anillo pesado con sello. Los nobles lo usan para firmar; vos, para encantar.',
  },
  {
    id: 'amuleto', name: 'Amuleto', category: 'joyeria', station: 'joyeria', slots: 1, jewelSlot: 'amuleto',
    parts: [
      { slot: 'cadena', label: 'Cadena', types: ['metal'], weight: 0.4, qty: 1 },
      { slot: 'colgante', label: 'Colgante', types: ['gema'], extra: ['nucleo_gelin', 'totem_tallado', 'colmillo_lobo', 'garra_oso'], weight: 0.6, qty: 1 },
    ],
    base: { def: 2, dur: 8 }, scale: JEWEL_SCALE,
    quench: false, grip: false, engrave: true, tags: ['joya'],
    description: 'Cadena con un colgante. Admite gemas o trofeos de monstruo.',
  },
  {
    id: 'talisman', name: 'Talismán', category: 'joyeria', station: 'joyeria', slots: 1, jewelSlot: 'amuleto',
    parts: [
      { slot: 'cordon', label: 'Cordón', types: ['fibra', 'cuero'], weight: 0.3, qty: 1 },
      { slot: 'dije', label: 'Dije', types: ['gema', 'madera'], extra: ['nucleo_gelin', 'totem_tallado', 'pelaje_albino'], weight: 0.7, qty: 1 },
    ],
    base: { def: 1, spd: 2, dur: 6 }, scale: JEWEL_SCALE,
    quench: false, grip: false, engrave: true, tags: ['joya', 'rustico'],
    description: 'Un dije atado con cordón. Humilde, liviano y sorprendentemente útil.',
  },

  // ── Arrojadizos (por lotes, se llevan en el cinturón) ──
  {
    id: 'cuchillos_arrojadizos', name: 'Cuchillos arrojadizos', category: 'arrojadizo', station: 'flecheria', slots: 1, batch: 10,
    parts: [
      { slot: 'hoja', label: 'Hoja', types: ['metal'], extra: ['colmillo_lobo', 'colmillo_goblin'], weight: 0.7, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera', 'cuero'], weight: 0.3, qty: 1 },
    ],
    base: { atk: 4, spd: 3, dur: 3 }, scale: { atk: 0.7, spd: 0.5, wgt: 0.2, dur: 0.3 },
    quench: true, grip: false, engrave: false, tags: ['perforante', 'consumible'], throwSkill: 'lanzar_cuchillo',
    description: 'Lote de cuchillos para lanzar desde el cinturón.',
  },
  {
    id: 'hachas_arrojadizas', name: 'Hachas arrojadizas', category: 'arrojadizo', station: 'flecheria', slots: 1, batch: 6,
    parts: [
      { slot: 'cabeza', label: 'Cabeza', types: ['metal'], weight: 0.7, qty: 2 },
      { slot: 'mango', label: 'Mango', types: ['madera'], weight: 0.3, qty: 1 },
    ],
    base: { atk: 7, dur: 4 }, scale: { atk: 0.9, spd: 0.2, wgt: 0.4, dur: 0.4 },
    quench: true, grip: false, engrave: false, tags: ['cortante', 'consumible'], throwSkill: 'lanzar_hacha',
    description: 'Pocas, pesadas y brutales. Corto alcance.',
  },
  {
    id: 'estrellas', name: 'Estrellas', category: 'arrojadizo', station: 'flecheria', slots: 1, batch: 12,
    parts: [{ slot: 'cuerpo', label: 'Cuerpo', types: ['metal'], extra: ['colmillo_goblin'], weight: 1, qty: 1 }],
    base: { atk: 3, spd: 5, dur: 2 }, scale: { atk: 0.6, spd: 0.6, wgt: 0.1, dur: 0.2 },
    quench: true, grip: false, engrave: false, tags: ['cortante', 'consumible'], throwSkill: 'lanzar_estrella',
    description: 'Livianas y filosas. Llegan lejos y hacen sangrar.',
  },
  {
    id: 'bombas', name: 'Bombas de metal', category: 'arrojadizo', station: 'flecheria', slots: 1, batch: 4,
    parts: [
      { slot: 'casco', label: 'Casco', types: ['metal'], weight: 0.4, qty: 1 },
      { slot: 'carga', label: 'Carga', types: ['monstruo', 'hierba', 'especial'], weight: 0.6, qty: 1 },
    ],
    base: { atk: 8, dur: 1 }, scale: { atk: 0.4, wgt: 0.3, dur: 0.1 },
    quench: false, grip: false, engrave: false, tags: ['contundente', 'consumible'], throwSkill: 'lanzar_bomba',
    description: 'Explotan en área. La carga define el elemento: ascua incendia, gel moja, escarcha congela, glándula envenena.',
  },

  // ── Herramienta ──
  {
    id: 'hoz', name: 'Hoz', category: 'herramienta', station: 'yunque', slots: 1,
    parts: [
      { slot: 'hoja', label: 'Hoja', types: ['metal'], weight: 0.7, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera'], weight: 0.3, qty: 1 },
    ],
    base: { atk: 3, dur: 10 }, scale: { atk: 0.8, spd: 0.3, wgt: 0.5, dur: 1.1 },
    quench: true, grip: true, engrave: false, tags: ['herramienta', 'siega', 'cortante'], weaponKind: 'herramienta',
    description: 'Para cortar hierbas sin arruinarlas. Su potencia define qué hierbas se pueden cosechar.',
  },
];
