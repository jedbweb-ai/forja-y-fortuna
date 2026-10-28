import type { Dialogue, Npc } from '../core/types';

export const NPCS_3: Npc[] = [
  {
    id: 'teodora', name: 'Teodora Pliegue', role: 'Librera', city: 'valdebrasa', location: 'libreria',
    personality: ['curiosa', 'memoriosa', 'ama los libros raros', 'desconfía de los apurados'],
    gifts: { ama: ['joyeria', 'opalo_lunar'], gusta: ['agua_bendita'], disgusta: ['bombas'] },
    routine: { 'mañana': 'libreria', tarde: 'libreria', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te avisa cuando llega un grimorio raro.' },
      { level: 'amigo', description: 'Te da el cuaderno de tu maestro Odón.' },
    ],
    look: { body: 0x5a4a8a, hair: 0xe8e2d0, accent: 0xd9a441 },
    busyLines: ['Shh. Estoy catalogando. Mañana, si querés.', 'Volvé con más tiempo: los libros no se leen apurados.'],
    description: 'Compra bibliotecas enteras de gente que se muere o se muda. Sabe dónde está cada página.',
  },
  {
    id: 'bastian', name: 'Bastián Humo', role: 'Alquimista', city: 'valdebrasa', location: 'alquimista',
    personality: ['excéntrico', 'entusiasta', 'distraído', 'odia que le toquen los frascos'],
    gifts: { ama: ['lirio_nocturno', 'ambar'], gusta: ['hierba'], disgusta: ['chatarra_goblin'] },
    routine: { 'mañana': 'alquimista', tarde: 'alquimista' },
    unlocks: [
      { level: 'conocido', description: 'Te explica cómo combinar hierbas.' },
      { level: 'amigo', description: 'Te enseña una receta secreta.' },
    ],
    look: { body: 0x2e7a72, hair: 0x6b3a1e, accent: 0x9aff9a },
    busyLines: ['¡No ahora, que se me corta la emulsión!', 'Mañana. Hoy estoy esperando que algo explote... digo, hierva.'],
    description: 'Le faltan las cejas desde hace años. Dice que es por estética.',
  },
];

export const DIALOGUES_3: Dialogue[] = [
  {
    id: 'teodora_intro', npc: 'teodora', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'teodora',
        text: 'Un herrero en mi librería. Qué novedad. ¿Buscás planos? ¿Grimorios? No enseñan a lanzar bolas de fuego, aviso: enseñan a meterle el fuego a una espada.',
        options: [
          { text: 'Justo eso busco.', effects: [{ type: 'relation', npc: 'teodora', delta: 4 }], next: 'b' },
          { text: '¿Tenés algo barato?', effects: [{ type: 'relation', npc: 'teodora', delta: -1 }], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'teodora', text: 'Bien. Un grimorio se lee una vez y te queda para siempre. Después, cada encantamiento se paga con sus reactivos. Nada es gratis, ni siquiera la magia.' },
      c: { id: 'c', speaker: 'teodora', text: 'Lo barato sale caro. Pero tengo planos de arrojadizos que no te van a fundir.' },
    },
  },
  {
    id: 'teodora_odon', npc: 'teodora', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'teodora', value: 25 }],
    nodes: {
      a: {
        id: 'a', speaker: 'teodora',
        text: 'Tengo algo tuyo. Cuando murió Odón, sus cosas se vendieron. Esto llegó a mi estante. Creo que tiene que estar con vos.',
        effects: [{ type: 'giveGrimoire', id: 'cuaderno_odon' }],
        options: [{ text: 'Gracias, Teodora. De verdad.', effects: [{ type: 'relation', npc: 'teodora', delta: 3 }] }],
      },
    },
  },
  {
    id: 'teodora_charla', npc: 'teodora', priority: 10, start: 'a',
    nodes: { a: { id: 'a', speaker: 'teodora', text: 'Los cofres de las colinas a veces tienen libros. Los goblins no saben leer, pero les gusta robarlos. Ironías.', options: [{ text: 'Lo voy a tener en cuenta.', effects: [{ type: 'relation', npc: 'teodora', delta: 2 }] }] } },
  },
  {
    id: 'bastian_intro', npc: 'bastian', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'bastian',
        text: '¡Un cliente! ¡O una víctima! Digo, un voluntario. ¿Sabés hacer pociones? Es fácil: mezclás cosas y esperás que no exploten.',
        options: [
          { text: 'Enseñame.', effects: [{ type: 'relation', npc: 'bastian', delta: 4 }], next: 'b' },
          { text: 'Prefiero el yunque.', effects: [{ type: 'relation', npc: 'bastian', delta: 0 }], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'bastian', text: 'Cada ingrediente tiene propiedades: curación, vigor, protección, fuego... Juntá las que pide la receta. Y a fuego fuerte sale más potente, si no se te quema todo.' },
      c: { id: 'c', speaker: 'bastian', text: 'El aceite alquímico y el agua bendita también son míos, eh. Templás con mis cosas.' },
    },
  },
  {
    id: 'bastian_secreto', npc: 'bastian', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'bastian', value: 15 }],
    nodes: {
      a: {
        id: 'a', speaker: 'bastian',
        text: 'Te cuento una: dos hojas de alivio y algo con vigor, como garra de oso o sangre de bestia. Sale un ungüento que te cura solo, turno a turno. Probalo.',
        effects: [{ type: 'discoverPotion', id: 'unguento_regenerador' }],
        options: [{ text: '¡Gracias, Bastián!', effects: [{ type: 'relation', npc: 'bastian', delta: 2 }] }],
      },
    },
  },
  {
    id: 'bastian_charla', npc: 'bastian', priority: 10, start: 'a',
    nodes: { a: { id: 'a', speaker: 'bastian', text: 'El lirio nocturno solo se corta de noche. ¡Y con una hoz decente, no con los dientes!', options: [{ text: 'Anotado.', effects: [{ type: 'relation', npc: 'bastian', delta: 2 }] }] } },
  },
];
