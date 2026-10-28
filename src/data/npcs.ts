import type { Dialogue, Npc } from '../core/types';

export const NPCS: Npc[] = [
  {
    id: 'rulfa', name: 'Mamá Rulfa', role: 'Tabernera de El Fuelle Roto', city: 'valdebrasa', location: 'taberna',
    personality: ['cálida', 'chismosa', 'protectora', 'odia la soberbia'],
    gifts: { ama: ['herramienta', 'grabado_hojas'], gusta: ['gel_slime', 'cuero_curtido'], disgusta: ['arma'] },
    routine: { 'mañana': 'taberna', tarde: 'taberna', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Cuenta rumores sobre materiales y zonas.' },
      { level: 'amigo', description: 'Comparte combinaciones que escuchó de viejos herreros.' },
    ],
    look: { body: 0xb5543c, hair: 0x6b3a2a, accent: 0xf2d16b },
    busyLines: ['¡Hoy no paro, tesoro! Volvé mañana y charlamos.', 'Si te quedás ahí parado, al menos pedí algo.'],
    description: 'Lleva la taberna hace treinta años. Sabe todo de todos y no se lo cuenta a cualquiera.',
  },
  {
    id: 'ilse', name: 'Ilse Cobreluna', role: 'Comerciante de materiales', city: 'valdebrasa', location: 'mercado',
    personality: ['astuta', 'práctica', 'disfruta regatear', 'detesta el derroche'],
    gifts: { ama: ['acero', 'plata'], gusta: ['herramienta', 'aleacion'], disgusta: ['municion'] },
    routine: { 'mañana': 'mercado', tarde: 'mercado', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Avisa cuándo llegan materiales raros.' },
      { level: 'amigo', description: 'Descuentos y mercadería exclusiva.' },
    ],
    look: { body: 0x3d6e8f, hair: 0xd9a441, accent: 0xc87533 },
    busyLines: ['Hoy ya regateamos lo suficiente, ¿no?', 'Tengo clientes esperando. Mañana, sin falta.'],
    description: 'Compra barato en las caravanas y vende caro en el valle. Respeta a quien sabe negociar.',
  },
  {
    id: 'ruperto', name: 'Ruperto Malvesta', role: 'Herrero rival', city: 'valdebrasa', location: 'mercado',
    personality: ['orgulloso', 'competitivo', 'respeta la confianza', 'desprecia la adulación'],
    gifts: { ama: ['brasalita'], gusta: ['acero', 'arma'], disgusta: ['cobre', 'pino'] },
    routine: { tarde: 'mercado', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Deja de sabotearte con los clientes.' },
      { level: 'amigo', description: 'Te enseña secretos del temple.' },
    ],
    look: { body: 0x4a4a4a, hair: 0x1e1e1e, accent: 0xd9542b },
    busyLines: ['Ya te dije todo lo que tenía que decirte hoy.', 'Andá a forjar, que hablando no se templa nada.'],
    description: 'Dueño de la otra herrería del pueblo. Fue aprendiz del mismo maestro que vos, y nunca te lo perdonó.',
  },
];

export const DIALOGUES: Dialogue[] = [
  // ───────────── Mamá Rulfa ─────────────
  {
    id: 'rulfa_intro', npc: 'rulfa', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'rulfa',
        text: '¡Pero mirá quién entró! Vos sos el aprendiz del viejo Odón, ¿no? Que la fragua lo tenga en su gloria. Dejó el taller en tus manos, dicen.',
        options: [
          { text: 'Sí. Voy a hacer que se sienta orgulloso.', effects: [{ type: 'relation', npc: 'rulfa', delta: 4 }], next: 'b' },
          { text: 'Algo así. ¿Hay algo de comer?', effects: [{ type: 'relation', npc: 'rulfa', delta: 1 }], next: 'c' },
          { text: 'No vine a hablar del viejo.', effects: [{ type: 'relation', npc: 'rulfa', delta: -3 }], next: 'd' },
        ],
      },
      b: { id: 'b', speaker: 'rulfa', text: 'Así me gusta. Odón decía que tenías buenas manos y mala paciencia. Arreglá lo segundo y te va a ir bien.' },
      c: { id: 'c', speaker: 'rulfa', text: 'Guiso de lentejas, como siempre. Y un consejo gratis: la gente de Valdebrasa compra donde la tratan bien.' },
      d: { id: 'd', speaker: 'rulfa', text: 'Uy, qué genio. Igualito a él cuando era joven. Bueno, la puerta está abierta cuando se te pase.' },
    },
  },
  {
    id: 'rulfa_secreto', npc: 'rulfa', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'rulfa', value: 15 }, { type: 'discovered', synergy: 'forro_viscoso', not: true }],
    nodes: {
      a: {
        id: 'a', speaker: 'rulfa',
        text: 'Te cuento algo que me dijo Odón una noche, con tres cervezas encima: él forraba los petos con gel de slime. "Absorbe los mazazos como un colchón", decía.',
        effects: [{ type: 'discoverSynergy', id: 'forro_viscoso' }],
        options: [
          { text: 'Gracias, Rulfa. Lo voy a probar.', effects: [{ type: 'relation', npc: 'rulfa', delta: 2 }] },
          { text: '¿Gel de slime? Qué asco.', effects: [{ type: 'relation', npc: 'rulfa', delta: -1 }], next: 'b' },
        ],
      },
      b: { id: 'b', speaker: 'rulfa', text: 'Asco es que te partan las costillas, tesoro.' },
    },
  },
  {
    id: 'rulfa_noche', npc: 'rulfa', priority: 20, start: 'a',
    conditions: [{ type: 'slot', in: ['noche'] }],
    nodes: {
      a: {
        id: 'a', speaker: 'rulfa',
        text: 'Noche movida. ¿Te sirvo un guiso? Tres monedas, y te lo doy con pan.',
        options: [
          { text: 'Dale, con pan. (3 oro)', conditions: [{ type: 'gold', min: 3 }], effects: [{ type: 'gold', delta: -3 }, { type: 'relation', npc: 'rulfa', delta: 4 }], next: 'b' },
          { text: 'Hoy no, gracias.', effects: [{ type: 'relation', npc: 'rulfa', delta: 1 }] },
        ],
      },
      b: { id: 'b', speaker: 'rulfa', text: 'Comé tranquilo. Escuché a unos cazadores decir que bajan lobos del monte. Van a necesitar flechas, herrero.' },
    },
  },
  {
    id: 'rulfa_charla', npc: 'rulfa', priority: 10, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'rulfa',
        text: '¿Sabías que en las colinas hay salamandrillas? Lagartijas de fuego. Ilse vende sus ascuas, dicen que con eso se hacen runas.',
        options: [
          { text: '¿Runas? Contame más.', effects: [{ type: 'relation', npc: 'rulfa', delta: 2 }], next: 'b' },
          { text: 'Interesante. Me tengo que ir.', effects: [{ type: 'relation', npc: 'rulfa', delta: 1 }] },
        ],
      },
      b: { id: 'b', speaker: 'rulfa', text: 'Una piedra rúnica y algo de un bicho con poder. Grabás, y el objeto queda encantado para siempre. Odón tenía un cuaderno lleno de eso, debe estar en tu taller.' },
    },
  },

  // ───────────── Ilse Cobreluna ─────────────
  {
    id: 'ilse_intro', npc: 'ilse', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'ilse',
        text: 'Ah, el herrero nuevo. Ilse Cobreluna, para servirte... a buen precio. Hierro, cobre, maderas, cueros, y cositas raras cuando pasa la caravana.',
        options: [
          { text: '¿"Buen precio" para quién?', effects: [{ type: 'relation', npc: 'ilse', delta: 4 }], next: 'b' },
          { text: 'Encantado. Seguro vamos a hacer negocios.', effects: [{ type: 'relation', npc: 'ilse', delta: 1 }], next: 'c' },
          { text: 'Pago lo que pidas, no tengo tiempo de regatear.', effects: [{ type: 'relation', npc: 'ilse', delta: -2 }], next: 'd' },
        ],
      },
      b: { id: 'b', speaker: 'ilse', text: '¡Ja! Para las dos, si sabés negociar. Me caés bien.' },
      c: { id: 'c', speaker: 'ilse', text: 'Eso espero. Los que no compran, no me duran en la memoria.' },
      d: { id: 'd', speaker: 'ilse', text: 'Qué aburrido. Bueno, tu oro es tan bueno como cualquier otro.' },
    },
  },
  {
    id: 'ilse_regalo', npc: 'ilse', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'ilse', value: 20 }],
    nodes: {
      a: {
        id: 'a', speaker: 'ilse',
        text: 'Tomá, me sobró de la última caravana. Una piedra rúnica. No me mires así, no es caridad: es inversión.',
        effects: [{ type: 'giveMaterial', id: 'piedra_runica', qty: 1 }],
        options: [
          { text: 'Te debo una.', effects: [{ type: 'relation', npc: 'ilse', delta: 2 }] },
          { text: '¿Cuánto me vas a cobrar después?', effects: [{ type: 'relation', npc: 'ilse', delta: 3 }], next: 'b' },
        ],
      },
      b: { id: 'b', speaker: 'ilse', text: 'Ahí está. Ahora sí sos de los míos.' },
    },
  },
  {
    id: 'ilse_charla', npc: 'ilse', priority: 10, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'ilse',
        text: 'Un dato gratis, que no se repite: la plata y la sauceluna se llevan raro. Los curas pagan fortunas por lo que sale de ahí.',
        options: [
          { text: 'Gracias por el dato.', effects: [{ type: 'relation', npc: 'ilse', delta: 2 }] },
          { text: '¿Y qué me cobrás por el próximo?', effects: [{ type: 'relation', npc: 'ilse', delta: 3 }], next: 'b' },
        ],
      },
      b: { id: 'b', speaker: 'ilse', text: 'Una pieza bien hecha que pueda revender. Ya hablaremos.' },
    },
  },

  // ───────────── Ruperto Malvesta ─────────────
  {
    id: 'ruperto_intro', npc: 'ruperto', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'ruperto',
        text: 'Así que el viejo Odón te dejó el taller a vos. A vos. Yo estuve doce años con él, ¿sabías? Doce.',
        options: [
          { text: 'Entonces vamos a ver quién forja mejor.', effects: [{ type: 'relation', npc: 'ruperto', delta: 3 }], next: 'b' },
          { text: 'Seguro que sos un gran herrero, Ruperto.', effects: [{ type: 'relation', npc: 'ruperto', delta: -3 }], next: 'c' },
          { text: '(Ignorarlo)', effects: [{ type: 'relation', npc: 'ruperto', delta: -1 }], next: 'd' },
        ],
      },
      b: { id: 'b', speaker: 'ruperto', text: 'Ja. Por lo menos tenés agallas. Ya veremos cuando los clientes elijan.' },
      c: { id: 'c', speaker: 'ruperto', text: 'No me lustres las botas. Odiaba eso de los aprendices nuevos.' },
      d: { id: 'd', speaker: 'ruperto', text: 'Eso, andá. Igual que él: siempre mirando para otro lado.' },
    },
  },
  {
    id: 'ruperto_secreto', npc: 'ruperto', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'ruperto', value: 15 }, { type: 'itemsForgedMin', value: 3 }],
    nodes: {
      a: {
        id: 'a', speaker: 'ruperto',
        text: 'Vi tus piezas en el mercado. No están mal. Te voy a decir algo, pero no lo repitas: un pomo de cuarzo glacial en una hoja de acero o plata... el frío corre por el metal.',
        effects: [{ type: 'discoverSynergy', id: 'corazon_escarcha' }],
        options: [
          { text: '¿Por qué me lo contás?', effects: [{ type: 'relation', npc: 'ruperto', delta: 2 }], next: 'b' },
          { text: 'Ya lo sabía.', effects: [{ type: 'relation', npc: 'ruperto', delta: -2 }], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'ruperto', text: 'Porque ganarle a un rival mediocre no tiene gracia.' },
      c: { id: 'c', speaker: 'ruperto', text: 'Claro. Por supuesto que lo sabías.' },
    },
  },
  {
    id: 'ruperto_charla', npc: 'ruperto', priority: 10, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'ruperto',
        text: 'El agua fría endurece, el aceite perdona. Cualquier aprendiz lo sabe. Lo que no saben es cuándo dejar de golpear.',
        options: [
          { text: '¿Y vos sabés?', effects: [{ type: 'relation', npc: 'ruperto', delta: 2 }], next: 'b' },
          { text: 'Gracias por el consejo, maestro.', effects: [{ type: 'relation', npc: 'ruperto', delta: -1 }], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'ruperto', text: 'Cuando el metal deja de cantar y empieza a quejarse. Escuchalo.' },
      c: { id: 'c', speaker: 'ruperto', text: 'No soy tu maestro. Ese murió.' },
    },
  },
];
