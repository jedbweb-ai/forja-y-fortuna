import type { MercenaryDef } from '../core/party/types';
import type { Dialogue, Npc } from '../core/types';

// Mercenarios de la taberna. No tienen habilidades propias: pelean con lo que les forjes.
// La especialidad define sus atributos y lo que aportan fuera del combate.
export const MERCENARIES: MercenaryDef[] = [
  {
    id: 'brunilda', name: 'Brunilda Tresmanos', specialty: 'guerrero', level: 3,
    attributes: { fuerza: 9, agilidad: 5, resistencia: 8, voluntad: 3 },
    growth: { fuerza: 1, agilidad: 0.4, resistencia: 0.9, voluntad: 0.2 },
    wage: 12, hireCost: 24, look: { body: 0x8f3d4e, hair: 0xd9a441, accent: 0x6d757e },
    quote: 'Doy tres golpes por cada uno que recibo. Bueno, dos. Pero fuertes.',
    description: 'Ex soldado de la frontera. Aguanta armaduras pesadas y no le teme a nada, salvo a las arañas.',
  },
  {
    id: 'ciro', name: 'Ciro Plumanegra', specialty: 'arquero', level: 2,
    attributes: { fuerza: 4, agilidad: 9, resistencia: 5, voluntad: 5 },
    growth: { fuerza: 0.3, agilidad: 1, resistencia: 0.5, voluntad: 0.4 },
    wage: 10, hireCost: 20, look: { body: 0x2e7a72, hair: 0x1e1e1e, accent: 0xe8e2d0 },
    quote: 'Si lo veo, le pego. Si no lo veo, esperame que lo busco.',
    description: 'Cazador que se cansó de cazar ciervos. Necesita un buen arco y muchas flechas.',
  },
  {
    id: 'nayra', name: 'Nayra Senda', specialty: 'explorador', level: 2,
    attributes: { fuerza: 5, agilidad: 8, resistencia: 5, voluntad: 6 },
    growth: { fuerza: 0.4, agilidad: 0.9, resistencia: 0.5, voluntad: 0.5 },
    wage: 9, hireCost: 18, look: { body: 0x4f8a3d, hair: 0xb03a2e, accent: 0xc28a2e },
    quote: 'Conozco atajos que ni los goblins conocen. Y eso es decir mucho.',
    description: 'Exploradora del valle. Con ella en el grupo, las expediciones rinden más energía.',
  },
  {
    id: 'gualterio', name: 'Gualterio Mulo', specialty: 'porteador', level: 2,
    attributes: { fuerza: 9, agilidad: 3, resistencia: 8, voluntad: 3 },
    growth: { fuerza: 0.9, agilidad: 0.3, resistencia: 0.9, voluntad: 0.2 },
    wage: 7, hireCost: 14, look: { body: 0xa6573a, hair: 0x6b3a1e, accent: 0x8b5a2b },
    quote: 'Yo cargo. Vos pegás. Si hace falta, también pego.',
    description: 'Lleva más que una mula y se queja menos. Amplía mucho la carga de las expediciones.',
  },
];

export const MERCENARY_NPCS: Npc[] = MERCENARIES.map((m) => ({
  id: m.id, name: m.name, role: `Mercenari${m.id === 'ciro' || m.id === 'gualterio' ? 'o' : 'a'} · ${m.specialty}`, city: 'valdebrasa', location: 'taberna',
  personality: [],
  gifts: {},
  routine: { 'mañana': 'taberna', tarde: 'taberna', noche: 'taberna' },
  look: m.look,
  busyLines: ['Ya charlamos hoy. Si me querés contratar, hablalo con la billetera.'],
  description: m.description,
}));

const intro = (id: string, text: string, good: string, bad: string, goodReply: string, badReply: string): Dialogue => ({
  id: `${id}_intro`, npc: id, priority: 100, once: true, start: 'a',
  nodes: {
    a: {
      id: 'a', speaker: id, text,
      options: [
        { text: good, effects: [{ type: 'relation', npc: id, delta: 4 }], next: 'b' },
        { text: bad, effects: [{ type: 'relation', npc: id, delta: -2 }], next: 'c' },
      ],
    },
    b: { id: 'b', speaker: id, text: goodReply },
    c: { id: 'c', speaker: id, text: badReply },
  },
});

const chat = (id: string, text: string): Dialogue => ({
  id: `${id}_charla`, npc: id, priority: 10, start: 'a',
  nodes: { a: { id: 'a', speaker: id, text, options: [{ text: 'Buena charla.', effects: [{ type: 'relation', npc: id, delta: 2 }] }] } },
});

export const MERCENARY_DIALOGUES: Dialogue[] = [
  intro('brunilda', '¿Herrero? Perfecto. Mi última espada se partió en la cabeza de un ogro. Bueno, en el casco. Necesito acero y alguien que pague.',
    'Te forjo algo que no se parta.', '¿Y por qué te contrataría a vos?',
    'Eso quería escuchar. Forjame algo pesado y yo me ocupo del resto.', 'Porque los goblins no se van a correr solos, chiquito.'),
  intro('ciro', 'Shh. Estoy escuchando a los de la mesa de al lado. Dicen que en el bosque hay arañas del tamaño de un perro. ¿Querías algo?',
    '¿Sabés usar un arco?', 'Te estaba preguntando a vos, no a la mesa.',
    'Mejor que nadie en este pueblo. Pero sin flechas, soy un tipo con un palo curvo.', 'Qué carácter. Igual, si pagás, escucho.'),
  intro('nayra', 'Linde de Brezal, colinas Dientepartido, el arroyo seco... Me los conozco todos. ¿Pensás salir de expedición?',
    'Me vendría bien una guía.', 'Me arreglo solo.',
    'Conmigo vas a llegar más lejos y volver con más cosas. Te lo prometo.', 'Eso dicen todos antes de perderse en el bosque.'),
  intro('gualterio', '...', '¿Estás bien?', 'Ey, mulo, ¿cargás cosas?',
    'Sí. Estaba pensando. Cargo lo que me pongas. Hasta a vos, si te lastimás.', 'Me llamo Gualterio. Pero sí. Cargo.'),
  chat('brunilda', 'En la frontera aprendí algo: una buena armadura vale más que diez espadas. Bueno, depende de la espada.'),
  chat('ciro', 'Las flechas con punta de colmillo goblin perforan cualquier cosa. Te lo digo por si alguna vez juntás colmillos.'),
  chat('nayra', 'De noche en Brezal salen gelines de escarcha y, dicen, un lobo blanco. Yo no lo vi. Todavía.'),
  chat('gualterio', 'Una vez cargué un yunque hasta las colinas. No me acuerdo por qué.'),
];
