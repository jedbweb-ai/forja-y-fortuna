import type { Content } from '../content';
import type { ArenaDef } from './types';

// Escenarios fijos para los tests de reglas de combate: copias de dos arenas viejas (10×8), así los tests
// no dependen de la forma de las arenas del juego, que se pueden rediseñar. No son contenido del juego.

const PARTY = [{ x: 0, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 2 }, { x: 1, y: 5 }];

export const TEST_ARENAS: ArenaDef[] = [
  {
    // Loma de 2 en el medio, hierba alta y agua baja.
    id: 'prueba_loma', biome: 'pradera',
    terrain: ['..........', '..,,......', '.,,,......', '..........', '..........', '......,,..', '....ww,,,.', '...www....'],
    heights: ['0000000000', '0000000000', '0000110000', '0001221000', '0001221000', '0000110000', '0000000000', '0000000000'],
    partySpawns: PARTY,
    enemySpawns: [{ x: 9, y: 1 }, { x: 8, y: 2 }, { x: 9, y: 3 }, { x: 8, y: 4 }, { x: 9, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 7 }],
  },
  {
    // Llano con obstáculos sueltos.
    id: 'prueba_bosque', biome: 'bosque',
    terrain: ['#..,,..#..', '..#....,,.', '..,,.#....', '.........#', '...#..,,..', '.,,....#..', '..#..,,...', '#....#...#'],
    heights: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000', '0000000000'],
    partySpawns: [{ x: 0, y: 2 }, { x: 1, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 5 }],
    enemySpawns: [{ x: 9, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 9, y: 4 }, { x: 8, y: 5 }, { x: 9, y: 6 }, { x: 8, y: 6 }],
  },
];

/** Suma los escenarios de prueba al contenido (solo en tests). */
export function useTestArenas(c: Content) {
  for (const a of TEST_ARENAS) c.arenas[a.id] = a;
}
