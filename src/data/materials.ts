import type { Material } from '../core/types';

// Stats por material: cuánto aporta a cada stat del objeto (escalado luego por parte y plano).
export const MATERIALS: Material[] = [
  // ── Metales ──
  {
    id: 'cobre', name: 'Cobre', type: 'metal', tier: 1, price: 4, color: '#c87533',
    stats: { atk: 8, def: 6, wgt: 6, dur: 10 }, affinities: { rayo: 1 }, tags: ['conductor'],
    description: 'Blando y barato. Conduce bien la chispa del rayo.',
  },
  {
    id: 'bronce', name: 'Bronce', type: 'metal', tier: 1, price: 7, color: '#b08d57',
    stats: { atk: 11, def: 9, wgt: 7, dur: 16 }, tags: ['aleacion'],
    description: 'Aleación confiable de los talleres de pueblo.',
  },
  {
    id: 'hierro', name: 'Hierro', type: 'metal', tier: 1, price: 9, color: '#8a8f98',
    stats: { atk: 14, def: 12, wgt: 8, dur: 22 },
    description: 'El pan de cada día del herrero.',
  },
  {
    id: 'acero', name: 'Acero', type: 'metal', tier: 2, price: 20, color: '#c3ccd6',
    stats: { atk: 20, def: 17, wgt: 8, dur: 32 }, tags: ['aleacion'],
    description: 'Hierro domado con carbón y paciencia. Filo que dura.',
  },
  {
    id: 'plata', name: 'Plata', type: 'metal', tier: 2, price: 26, color: '#e4e8ef',
    stats: { atk: 12, def: 8, wgt: 7, dur: 14 }, affinities: { sagrado: 2 }, tags: ['noble'],
    description: 'Brillante y pura. Los espíritus inquietos la detestan.',
  },
  {
    id: 'brasalita', name: 'Brasalita', type: 'metal', tier: 2, price: 30, color: '#d9542b',
    stats: { atk: 18, def: 12, wgt: 8, dur: 20 }, affinities: { fuego: 2 }, tags: ['volcanico'],
    description: 'Mineral rojizo de las forjas antiguas de Valdebrasa. Nunca se enfría del todo.',
  },

  // ── Maderas ──
  {
    id: 'pino', name: 'Pino', type: 'madera', tier: 1, price: 2, color: '#d8b07a',
    stats: { atk: 4, def: 5, spd: 3, wgt: 2, dur: 8 }, tags: ['liviano'],
    description: 'Liviano y abundante. No aguanta mucho castigo.',
  },
  {
    id: 'fresno', name: 'Fresno', type: 'madera', tier: 1, price: 4, color: '#c9a36b',
    stats: { atk: 7, def: 6, spd: 4, wgt: 3, dur: 14 }, tags: ['flexible'],
    description: 'Flexible y nervudo, el favorito de los arqueros.',
  },
  {
    id: 'roble', name: 'Roble', type: 'madera', tier: 1, price: 6, color: '#8b5a2b',
    stats: { atk: 9, def: 10, spd: -1, wgt: 5, dur: 20 }, tags: ['denso'],
    description: 'Denso y terco. Ideal para mangos y escudos.',
  },
  {
    id: 'sauceluna', name: 'Sauceluna', type: 'madera', tier: 2, price: 18, color: '#b9c7e6',
    stats: { atk: 10, def: 6, spd: 5, wgt: 2, dur: 14 }, affinities: { sagrado: 1, viento: 1 }, tags: ['flexible', 'liviano'],
    description: 'Sauce de corteza pálida que, dicen, crece solo donde da la luna llena.',
  },

  // ── Cueros ──
  {
    id: 'cuero_curtido', name: 'Cuero curtido', type: 'cuero', tier: 1, price: 3, color: '#9c6b3f',
    stats: { atk: 1, def: 6, spd: 3, wgt: 2, dur: 10 },
    description: 'Cuero básico de curtiembre.',
  },
  {
    id: 'cuero_endurecido', name: 'Cuero endurecido', type: 'cuero', tier: 1, price: 6, color: '#6e4a2a',
    stats: { atk: 2, def: 10, spd: 1, wgt: 3, dur: 14 }, tags: ['firme'],
    description: 'Hervido en cera: rígido y protector.',
  },
  {
    id: 'piel_jabali', name: 'Piel de jabalí', type: 'cuero', tier: 1, price: 8, color: '#5b4636',
    stats: { atk: 2, def: 9, spd: 2, wgt: 3, dur: 16 }, affinities: { tierra: 1 }, tags: ['bestia', 'trofeo'],
    description: 'Gruesa y erizada. Huele a bosque aunque la laves.',
  },

  // ── Fibras ──
  {
    id: 'cuerda_lino', name: 'Cuerda de lino', type: 'fibra', tier: 1, price: 2, color: '#e8dfc8',
    stats: { atk: 5, spd: 3, dur: 8 },
    description: 'Cuerda trenzada común.',
  },
  {
    id: 'tripa_trenzada', name: 'Tripa trenzada', type: 'fibra', tier: 1, price: 6, color: '#d3b48c',
    stats: { atk: 8, spd: 4, dur: 12 }, tags: ['tensa'],
    description: 'Cuerda de tripa seca. Tensa como un rumor en la taberna.',
  },
  {
    id: 'plumas_ganso', name: 'Plumas de ganso', type: 'fibra', tier: 1, price: 2, color: '#f4f1ea',
    stats: { atk: 2, spd: 5, dur: 4 }, tags: ['pluma'],
    description: 'Plumas parejas para emplumar flechas.',
  },

  // ── Gemas ──
  {
    id: 'cuarzo_igneo', name: 'Cuarzo ígneo', type: 'gema', tier: 2, price: 22, color: '#ff7a3d',
    stats: { atk: 3, dur: 4 }, affinities: { fuego: 2 }, tags: ['gema'],
    description: 'Cristal que guarda calor adentro, como una brasa dormida.',
  },
  {
    id: 'cuarzo_glacial', name: 'Cuarzo glacial', type: 'gema', tier: 2, price: 22, color: '#7fd6ff',
    stats: { atk: 3, dur: 4 }, affinities: { hielo: 2 }, tags: ['gema'],
    description: 'Frío al tacto incluso en pleno verano.',
  },

  // ── Partes de monstruo (compradas en el mercado en la Fase 1) ──
  {
    id: 'gel_slime', name: 'Gel de slime verdoso', type: 'monstruo', tier: 1, price: 5, color: '#7ccf6a',
    stats: { def: 2, dur: 2 }, affinities: { agua: 1 }, tags: ['gel', 'slime'],
    description: 'Viscoso y fresco. Sirve para templar y para acolchar.',
  },
  {
    id: 'colmillo_lobo', name: 'Colmillo de lobo gris', type: 'monstruo', tier: 1, price: 9, color: '#efe6d2',
    stats: { atk: 12, wgt: 1, dur: 10 }, tags: ['colmillo', 'bestia', 'trofeo'],
    description: 'Curvo y afilado. Abre heridas que no cierran.',
  },
  {
    id: 'ascua_salamandrilla', name: 'Ascua de salamandrilla', type: 'monstruo', tier: 2, price: 14, color: '#ff4e1f',
    stats: { atk: 2 }, affinities: { fuego: 3 }, tags: ['ascua', 'esencia'],
    description: 'Glándula de una lagartija de fuego. Sigue tibia semanas después.',
  },

  // ── Especiales (runas) ──
  {
    id: 'piedra_runica', name: 'Piedra rúnica tosca', type: 'especial', tier: 1, price: 15, color: '#6f6a8f',
    stats: {}, tags: ['runa'],
    description: 'Piedra porosa donde se graban runas. Sola no hace nada.',
  },

  // ── Partes de monstruo de Linde de Brezal (Fase 2) ──
  {
    id: 'gel_acido', name: 'Gel ácido', type: 'monstruo', tier: 1, price: 7, color: '#c7e04a',
    stats: { atk: 2 }, affinities: { veneno: 1 }, tags: ['gel', 'slime', 'acido'],
    description: 'Burbujea solo. Templar con esto deja un filo que muerde las armaduras.',
  },
  {
    id: 'gel_escarcha', name: 'Gel de escarcha', type: 'monstruo', tier: 2, price: 12, color: '#a8e6ff',
    stats: { def: 2, dur: 2 }, affinities: { hielo: 2 }, tags: ['gel', 'slime', 'frio'],
    description: 'De los gelines que salen de noche. Enfría todo lo que toca.',
  },
  {
    id: 'nucleo_gelin', name: 'Núcleo de gelín', type: 'monstruo', tier: 2, price: 30, color: '#4fd18b',
    stats: { def: 3, dur: 6 }, affinities: { agua: 2 }, tags: ['slime', 'nucleo', 'esencia'],
    description: 'El corazón de un gelín rey. Late despacio, como si todavía quisiera dividirse.',
  },
  {
    id: 'chatarra_goblin', name: 'Chatarra goblin', type: 'metal', tier: 1, price: 3, color: '#7a6a58',
    stats: { atk: 10, def: 9, wgt: 9, dur: 12 }, tags: ['goblin', 'chatarra'],
    description: 'Metal robado, fundido mal y vuelto a robar. Pesado y poco confiable, pero barato.',
  },
  {
    id: 'colmillo_goblin', name: 'Colmillo goblin', type: 'monstruo', tier: 1, price: 6, color: '#e8dcb0',
    stats: { atk: 9, dur: 6 }, tags: ['goblin', 'colmillo'],
    description: 'Amarillento y puntiagudo. Los goblins se los liman para asustar.',
  },
  {
    id: 'totem_tallado', name: 'Tótem tallado', type: 'monstruo', tier: 2, price: 18, color: '#9a6b3c',
    stats: { def: 2 }, affinities: { tierra: 1 }, tags: ['goblin', 'totem', 'runa'],
    description: 'Fetiche de los chamanes goblin. Sirve para grabar runas menores.',
  },
  {
    id: 'corona_colmillos', name: 'Corona de colmillos', type: 'monstruo', tier: 3, price: 120, color: '#f2e6c9',
    stats: { atk: 8, dur: 10 }, tags: ['goblin', 'trofeo', 'jefe'],
    description: 'La corona de Gruñaz Dientepartido. Huele a victoria y a goblin.',
  },
  {
    id: 'cuero_lobo', name: 'Cuero de lobo', type: 'cuero', tier: 1, price: 7, color: '#8d8a84',
    stats: { atk: 1, def: 7, spd: 4, wgt: 2, dur: 12 }, tags: ['bestia', 'lobo'],
    description: 'Liviano y flexible. Moverse con él es casi como no llevar nada.',
  },
  {
    id: 'colmillo_jabali', name: 'Colmillo de jabalí', type: 'monstruo', tier: 1, price: 8, color: '#f0e3c4',
    stats: { atk: 13, wgt: 3, dur: 12 }, tags: ['bestia', 'colmillo', 'trofeo'],
    description: 'Curvo y macizo. Un jabalí cornilargo lo usa para levantar carretas.',
  },
  {
    id: 'seda_arana', name: 'Seda de araña tejedora', type: 'fibra', tier: 2, price: 14, color: '#f5f5ff',
    stats: { atk: 9, spd: 5, dur: 14 }, tags: ['bestia', 'seda'],
    description: 'Más fuerte que el acero si se la estira bien. Pegajosa si no.',
  },
  {
    id: 'glandula_veneno', name: 'Glándula de veneno', type: 'monstruo', tier: 1, price: 9, color: '#8fd14f',
    stats: {}, affinities: { veneno: 2 }, tags: ['bestia', 'veneno'],
    description: 'De las arañas tejedoras. Disuelta en el temple, envenena el filo.',
  },
  {
    id: 'garra_oso', name: 'Garra de oso musgoso', type: 'monstruo', tier: 2, price: 16, color: '#3d3a33',
    stats: { atk: 15, wgt: 2, dur: 14 }, affinities: { tierra: 1 }, tags: ['bestia', 'garra', 'trofeo'],
    description: 'Negra y curva, con musgo entre las uñas. Desgarra más de lo que corta.',
  },
  {
    id: 'pelaje_albino', name: 'Pelaje albino', type: 'cuero', tier: 2, price: 40, color: '#f4f4f0',
    stats: { def: 8, spd: 6, wgt: 1, dur: 14 }, affinities: { sagrado: 1 }, tags: ['bestia', 'lobo', 'trofeo', 'raro'],
    description: 'Del lobo blanco que solo sale de noche. Brilla apenas bajo la luna.',
  },
];
