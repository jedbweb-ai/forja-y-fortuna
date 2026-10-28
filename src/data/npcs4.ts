import type { Dialogue, DialogueEffect, Npc } from '../core/types';

// NPC de la Fase 4: gremio, tablón, casa de subastas y mercado de esclavos.
export const NPCS_4: Npc[] = [
  {
    id: 'aldana', name: 'Aldana Ferrovieja', role: 'Maestra del gremio de aventureros', city: 'valdebrasa', location: 'gremio',
    personality: ['directa', 'exigente', 'justa', 'odia las excusas'],
    gifts: { ama: ['escudo', 'cota_malla'], gusta: ['armadura', 'municion', 'pocion'], disgusta: ['joyeria', 'noble'] },
    routine: { 'mañana': 'gremio', tarde: 'gremio', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te cuenta qué piden los aventureros esta semana.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te enseña el plano de la cota de malla del gremio.', perks: [{ kind: 'teach', blueprint: 'cota_malla' }] },
      { level: 'aliado', description: 'Te pasa el secreto de las flechas de los veteranos.', perks: [{ kind: 'teach', synergy: 'flecha_fina' }] },
    ],
    rumors: [
      'Aldana: "Los novatos vuelven de Brezal sin flechas. Si tenés lotes, el tablero se vacía rápido."',
      'Aldana: "Dicen que Gruñaz cambió de guarida. Llevá escudos si vas a buscarlo."',
      'Aldana: "Un escudo bien templado vale más que tres espadas baratas. Anotalo."',
    ],
    look: { body: 0x3a5a7a, hair: 0x9a9a9a, accent: 0xd9a441 },
    busyLines: ['Tengo diez encargos sin asignar. Mañana.', 'Si no venís a entregar algo, no me hagas perder el día.'],
    description: 'Fue mercenaria veinte años. Ahora reparte trabajo y no perdona a quien no cumple.',
  },
  {
    id: 'odalrico', name: 'Odalrico Balanza', role: 'Mercader de contratos', city: 'valdebrasa', location: 'gremio',
    personality: ['calculador', 'puntual', 'afable con quien cumple', 'detesta las demoras'],
    gifts: { ama: ['herramienta', 'plata'], gusta: ['municion', 'cuero_endurecido'], disgusta: ['pocion', 'gel'] },
    routine: { 'mañana': 'gremio', tarde: 'mercado', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te avisa qué se va a vender caro en la costa.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te enseña a templar con aceite como en las forjas del sur.', perks: [{ kind: 'teach', synergy: 'pico_templado' }] },
    ],
    rumors: [
      'Odalrico: "En la costa pagan las herramientas el doble cuando llega el invierno."',
      'Odalrico: "No le vendas cuchillos a cualquiera esta semana: el precio va a subir."',
    ],
    look: { body: 0x6a5a2a, hair: 0x2a2a2a, accent: 0xe8c860 },
    busyLines: ['El tiempo es oro, y hoy ya gasté el mío con vos.', 'Mañana revisamos números.'],
    description: 'Compra por volumen y paga puntual. Si no cumplís una entrega, no te vuelve a firmar nada.',
  },
  {
    id: 'lisandro', name: 'Lisandro Mazo', role: 'Subastador', city: 'valdebrasa', location: 'subastas',
    personality: ['teatral', 'memorioso', 'ama las piezas con historia', 'odia a los tacaños'],
    gifts: { ama: ['joyeria', 'opalo_lunar'], gusta: ['noble', 'trofeo'], disgusta: ['chatarra_goblin', 'municion'] },
    routine: { 'mañana': 'subastas', tarde: 'subastas', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te adelanta qué postores van a ir a la próxima subasta.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te cuenta cómo hacían las espadas de gala.', perks: [{ kind: 'teach', synergy: 'filo_noble' }] },
    ],
    rumors: [
      'Lisandro: "Doña Violante viene a la próxima subasta con la bolsa llena. Cuidado con sus caprichos."',
      'Lisandro: "El coleccionista Anselmo nunca puja primero, pero nunca se va antes del final."',
      'Lisandro: "Una pieza con historia se vende por el doble. Grabala, pulila, ponele nombre."',
    ],
    look: { body: 0x7a2a3a, hair: 0xe8e2d0, accent: 0xffd27a },
    busyLines: ['¡Mañana, mañana! Hoy estoy catalogando lotes.', 'Si no traés algo para vender, volvé el día de la subasta.'],
    description: 'Su martillo de madera decide fortunas una vez por semana. Recuerda cada pieza que pasó por sus manos.',
  },
  {
    id: 'violante', name: 'Violante de Arce', role: 'Noble de la casa de Arce', city: 'valdebrasa', location: 'subastas',
    personality: ['altiva', 'generosa con lo bello', 'rencorosa', 'caprichosa'],
    gifts: { ama: ['joyeria', 'plata', 'noble'], gusta: ['engaste_fino', 'filigrana', 'grabado_blason'], disgusta: ['municion', 'herramienta', 'chatarra_goblin'] },
    routine: { 'mañana': 'subastas', tarde: 'mercado' },
    unlocks: [
      { level: 'conocido', description: 'Habla bien de vos entre los nobles.' },
      { level: 'amigo', description: 'Te regala un grimorio de la biblioteca familiar.', perks: [{ kind: 'teach', grimoire: 'salterio_alba' }] },
    ],
    look: { body: 0x8a2a6a, hair: 0xd9a441, accent: 0xf2f2f2 },
    busyLines: ['Hoy no recibo a nadie.', 'Mandá a decir cuando tengas algo digno de mí.'],
    description: 'Heredera de la casa más vieja del valle. Paga fortunas por lo que le gusta y no olvida un desaire.',
  },
  {
    id: 'corvino', name: 'Corvino Sal', role: 'Tratante del mercado de esclavos', city: 'valdebrasa', location: 'esclavos',
    personality: ['frío', 'pragmático', 'no hace preguntas', 'respeta el oro'],
    gifts: { ama: ['brasalita', 'plata'], gusta: ['arma'], disgusta: ['agua_bendita', 'sagrado'] },
    routine: { 'mañana': 'esclavos', tarde: 'esclavos' },
    unlocks: [
      { level: 'conocido', description: 'Te cobra un poco menos.', perks: [{ kind: 'discount', pct: 10 }] },
      { level: 'amigo', description: 'Te hace precio de cliente fijo.', perks: [{ kind: 'discount', pct: 20 }] },
    ],
    look: { body: 0x2a2a3a, hair: 0x5a5a5a, accent: 0x8a3a2a },
    busyLines: ['Ya hablamos. Si querés comprar, mirá el corral.', 'No tengo tiempo para charlas.'],
    description: 'Compra deudas, cautivos y condenas. No pregunta de dónde vienen ni le importa a dónde van.',
  },
  {
    id: 'braulio', name: 'Braulio Tizón', role: 'Capitán de la guardia', city: 'valdebrasa', location: 'tablon',
    personality: ['recto', 'cansado', 'leal a la ciudad', 'desconfía de los mercenarios'],
    gifts: { ama: ['escudo', 'acero'], gusta: ['arma', 'armadura'], disgusta: ['bombas', 'veneno', 'glandula_veneno'] },
    routine: { 'mañana': 'tablon', tarde: 'gremio', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te cuenta dónde se mueven los monstruos.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te enseña cómo arma la guardia sus escudos.', perks: [{ kind: 'teach', synergy: 'escudo_roble_hierro' }] },
    ],
    rumors: [
      'Braulio: "Hay goblins en el camino del este. La guardia va a necesitar flechas."',
      'Braulio: "De noche en Brezal se ven lobos más grandes de lo normal."',
    ],
    look: { body: 0x4a5a6a, hair: 0x3a2418, accent: 0xc0392b },
    busyLines: ['Estoy de servicio. Mañana.', 'Si es algo urgente, avisale a la guardia de turno.'],
    description: 'Tiene más cicatrices que soldados. Lleva veinte años sosteniendo la guardia con poco presupuesto.',
  },
  {
    id: 'mirta', name: 'Mirta Pregón', role: 'Pregonera del tablón', city: 'valdebrasa', location: 'tablon',
    personality: ['chismosa', 'ruidosa', 'de buen corazón', 'ama las flores'],
    gifts: { ama: ['pocion', 'flor_brasa'], gusta: ['hierba', 'joyeria'], disgusta: ['arma', 'chatarra_goblin'] },
    routine: { 'mañana': 'tablon', tarde: 'tablon', noche: 'taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te cuenta los chismes antes que nadie.', perks: [{ kind: 'rumors' }] },
    ],
    rumors: [
      'Mirta: "¡Se viene una boda grande en la casa de Arce! Van a comprar joyas como locos."',
      'Mirta: "Dicen que Ruperto está endeudado hasta las cejas. Por eso anda de mal humor."',
      'Mirta: "Un mago de la Academia preguntó por runas en la taberna anoche."',
    ],
    look: { body: 0xc87533, hair: 0xb5543c, accent: 0xf2d16b },
    busyLines: ['¡Ay, no puedo, tengo que leer los avisos de la tarde!', 'Mañana te cuento todo, tesoro.'],
    description: 'Lee los avisos en voz alta tres veces al día. Lo que no está en el tablón, lo sabe igual.',
  },
];

const rel = (npc: string, delta: number): DialogueEffect => ({ type: 'relation', npc, delta });

export const DIALOGUES_4: Dialogue[] = [
  // ───────────── Aldana (gremio) ─────────────
  {
    id: 'aldana_intro', npc: 'aldana', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'aldana',
        text: 'Así que vos sos el que heredó el taller de Odón. El gremio necesita un herrero que cumpla. El último entregaba tarde y se le partían las espadas.',
        options: [
          { text: 'Yo cumplo. Pruébeme.', effects: [rel('aldana', 4)], next: 'b' },
          { text: '¿Y cuánto paga el gremio?', effects: [rel('aldana', -1)], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'aldana', text: 'Eso vamos a ver. Los encargos están en el tablero. Si fallás uno, me entero. Si cumplís, también.' },
      c: { id: 'c', speaker: 'aldana', text: 'Lo justo, y a tiempo. Igual que vos vas a entregar. El tablero está ahí.' },
    },
  },
  {
    id: 'aldana_prueba', npc: 'aldana', priority: 60, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'aldana', value: 5 }, { type: 'questDone', id: 'n_aldana_prueba', not: true }],
    nodes: {
      a: {
        id: 'a', speaker: 'aldana',
        text: 'Tengo una partida de novatos que sale en cinco días y no tiene flechas. Treinta, bien hechas. Si las traés a tiempo, hablamos de cosas más grandes.',
        options: [
          { text: 'Trato hecho.', effects: [{ type: 'offerQuest', id: 'n_aldana_prueba' }, rel('aldana', 2)] },
          { text: 'Ahora no puedo.', next: 'b' },
        ],
      },
      b: { id: 'b', speaker: 'aldana', text: 'Entonces alguien más lo va a hacer. Así funciona esto.' },
    },
  },
  {
    id: 'aldana_veterana', npc: 'aldana', priority: 55, once: true, start: 'a',
    conditions: [{ type: 'questDone', id: 'n_aldana_prueba' }, { type: 'relationMin', npc: 'aldana', value: 20 }],
    nodes: {
      a: {
        id: 'a', speaker: 'aldana',
        text: 'Cumpliste. Ahora algo en serio: una veterana mía vuelve al frente y quiere un escudo que aguante un hachazo de ogro. Calidad, no adornos.',
        options: [
          { text: 'Lo forjo yo.', effects: [{ type: 'offerQuest', id: 'n_aldana_escudo' }] },
          { text: 'Más adelante.' },
        ],
      },
    },
  },
  {
    id: 'aldana_charla', npc: 'aldana', priority: 5, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'aldana', text: 'Veinte años de mercenaria me enseñaron una cosa: el equipo barato sale caro. Siempre.',
        options: [{ text: 'Tomo nota.', effects: [rel('aldana', 1)] }],
      },
    },
  },
  // ───────────── Odalrico (contratos) ─────────────
  {
    id: 'odalrico_intro', npc: 'odalrico', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'odalrico',
        text: 'Odalrico Balanza, para servirle. Compro por volumen: flechas, cuchillos, herramientas. Precio fijo, pago en la entrega. Lo único que no tolero es la demora.',
        options: [
          { text: 'Me interesa. ¿Dónde firmo?', effects: [rel('odalrico', 4)], next: 'b' },
          { text: 'Precio fijo suena a precio bajo.', effects: [rel('odalrico', 1)], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'odalrico', text: 'En el gremio, mañana o cuando haya contratos nuevos. Le aviso: si rompe uno, se entera toda la ciudad.' },
      c: { id: 'c', speaker: 'odalrico', text: 'Precio seguro, que no es lo mismo. Cuando la demanda se cae, mis contratos siguen pagando igual.' },
    },
  },
  {
    id: 'odalrico_charla', npc: 'odalrico', priority: 5, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'odalrico', text: 'Si vende cien flechas en el mercado, el precio se hunde. Si me las vende a mí, no. Piénselo.',
        options: [{ text: 'Tiene sentido.', effects: [rel('odalrico', 1)] }],
      },
    },
  },
  // ───────────── Lisandro (subastas) ─────────────
  {
    id: 'lisandro_intro', npc: 'lisandro', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'lisandro',
        text: '¡Un herrero en mi casa de subastas! Cada siete días, la gran subasta. Traé tus mejores piezas en consignación: yo me quedo con un diezmo, vos con la gloria.',
        options: [
          { text: '¿Y qué se compra acá?', effects: [rel('lisandro', 3)], next: 'b' },
          { text: 'Un diezmo es mucho.', effects: [rel('lisandro', -2)], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'lisandro', text: 'Grimorios perdidos, planos de forjas que ya no existen, gemas que no llegan al mercado... Cosas que no vas a encontrar en otro lado.' },
      c: { id: 'c', speaker: 'lisandro', text: 'Es mucho para un tacaño y poco para quien vende bien. Vos decidís qué querés ser.' },
    },
  },
  {
    id: 'lisandro_charla', npc: 'lisandro', priority: 5, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'lisandro', text: 'El secreto de una buena subasta es el silencio justo antes del martillazo. Ahí se ve quién de verdad quiere la pieza.',
        options: [{ text: 'Lo voy a tener en cuenta.', effects: [rel('lisandro', 1)] }],
      },
    },
  },
  // ───────────── Violante (noble) ─────────────
  {
    id: 'violante_intro', npc: 'violante', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'violante',
        text: 'Vos sos el herrero nuevo. Mi familia le compraba a Odón cuando todavía hacía cosas bonitas. Después se volvió práctico. Qué pena.',
        options: [
          { text: 'Puedo hacer cosas bonitas, señora.', effects: [rel('violante', 4)], next: 'b' },
          { text: 'Lo práctico salva vidas.', effects: [rel('violante', -3)], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'violante', text: 'Ya veremos. Me gustan la plata, las gemas y los grabados. Y no me gusta esperar.' },
      c: { id: 'c', speaker: 'violante', text: 'Qué aburrido. Ruperto dice lo mismo, y por eso no le compro.' },
    },
  },
  {
    id: 'violante_anillo', npc: 'violante', priority: 60, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'violante', value: 10 }, { type: 'reputationMin', value: 15 }],
    nodes: {
      a: {
        id: 'a', speaker: 'violante',
        text: 'Mi sobrina se compromete. Quiero un anillo raro, de verdad raro, que haga callar a las demás familias. Pago lo que valga.',
        options: [
          { text: 'Va a tener el mejor anillo del valle.', effects: [{ type: 'offerQuest', id: 'n_violante_anillo' }, rel('violante', 2)] },
          { text: 'No hago encargos tan apurados.', effects: [rel('violante', -2)] },
        ],
      },
    },
  },
  // ───────────── Corvino (mercado de esclavos) ─────────────
  {
    id: 'corvino_intro', npc: 'corvino', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'corvino',
        text: 'Deudores, prisioneros, desertores. Gente que alguien vendió. Son baratos y no cobran sueldo. Tampoco te quieren, claro. Eso tenés que ganártelo vos.',
        options: [
          { text: '¿Y si alguno se escapa?', next: 'b' },
          { text: 'Esto no me gusta nada.', effects: [rel('corvino', -2)], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'corvino', text: 'Si los tratás como perros, se escapan en la primera oportunidad. Con lo que tengan puesto. Si los tratás bien... a veces se quedan aunque los liberes.' },
      c: { id: 'c', speaker: 'corvino', text: 'A nadie le gusta. Igual, si no los compra alguien como vos, los compra alguien peor.' },
    },
  },
  // ───────────── Braulio (guardia) ─────────────
  {
    id: 'braulio_intro', npc: 'braulio', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'braulio',
        text: 'Capitán Tizón. La guardia de Valdebrasa son doce hombres, tres escudos sanos y un presupuesto de risa. Si sabés forjar, nos vamos a llevar bien.',
        options: [
          { text: 'Cuente conmigo, capitán.', effects: [rel('braulio', 4)], next: 'b' },
          { text: 'Si paga, sí.', effects: [rel('braulio', 1)], next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'braulio', text: 'Eso espero. Pasá por el tablón: ahí pongo lo que necesitamos.' },
      c: { id: 'c', speaker: 'braulio', text: 'Pagamos poco y tarde. Pero pagamos. Algo es algo.' },
    },
  },
  {
    id: 'braulio_escudos', npc: 'braulio', priority: 60, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'braulio', value: 5 }],
    nodes: {
      a: {
        id: 'a', speaker: 'braulio',
        text: 'Necesito tres escudos para la puerta norte. Nada lujoso: que aguanten. Te pago lo que puedo y la ciudad se va a enterar de quién los hizo.',
        options: [
          { text: 'Los tendrá.', effects: [{ type: 'offerQuest', id: 'n_braulio_escudos' }, rel('braulio', 2)] },
          { text: 'Ahora no tengo tiempo.' },
        ],
      },
    },
  },
  {
    id: 'braulio_goblins', npc: 'braulio', priority: 58, once: true, start: 'a',
    conditions: [{ type: 'questDone', id: 'n_braulio_escudos' }],
    nodes: {
      a: {
        id: 'a', speaker: 'braulio',
        text: 'Los escudos aguantaron. Ahora el problema son los goblins de Brezal: asaltan las carretas. No tengo gente para salir. Vos tenés grupo.',
        options: [
          { text: 'Vamos a limpiar el camino.', effects: [{ type: 'offerQuest', id: 'n_braulio_goblins' }] },
          { text: 'Soy herrero, no soldado.', effects: [rel('braulio', -2)] },
        ],
      },
    },
  },
  {
    id: 'braulio_grunaz', npc: 'braulio', priority: 56, once: true, start: 'a',
    conditions: [{ type: 'questDone', id: 'n_braulio_goblins' }, { type: 'relationMin', npc: 'braulio', value: 25 }],
    nodes: {
      a: {
        id: 'a', speaker: 'braulio',
        text: 'Los goblins vuelven siempre porque Gruñaz Dientepartido los junta. Si cae Gruñaz, el valle respira un año entero. Te lo pido como favor, y como capitán.',
        options: [
          { text: 'Gruñaz va a caer.', effects: [{ type: 'offerQuest', id: 'n_braulio_grunaz' }, rel('braulio', 3)] },
          { text: 'Todavía no estoy listo.' },
        ],
      },
    },
  },
  {
    id: 'braulio_cripta', npc: 'braulio', priority: 54, once: true, start: 'a',
    conditions: [{ type: 'questDone', id: 'n_braulio_goblins' }],
    nodes: {
      a: {
        id: 'a', speaker: 'braulio',
        text: 'Los pastores juran que en las colinas de Brezal, al sur de la guarida goblin, hay una escalera vieja que baja a la roca. Mi abuelo decía que ahí abajo todavía hay guardias de un rey que ya nadie recuerda.',
        effects: [{ type: 'flag', flag: 'cripta_hallada', value: true }],
        next: 'b',
      },
      b: {
        id: 'b', speaker: 'braulio',
        text: 'El último de esos guardias se llamaba Ulmar. Si sigue ahí abajo, quiero que alguien termine su guardia. ¿Lo harías?',
        options: [
          { text: 'Voy a bajar.', effects: [{ type: 'offerQuest', id: 'n_braulio_cripta' }, rel('braulio', 3)] },
          { text: 'Primero quiero ver esa escalera.' },
        ],
      },
    },
  },
  {
    id: 'braulio_charla', npc: 'braulio', priority: 5, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'braulio', text: 'Un guardia con buen escudo vuelve a casa. Uno con espada brillante, a veces no.',
        options: [{ text: 'Sabias palabras.', effects: [rel('braulio', 1)] }],
      },
    },
  },
  // ───────────── Mirta (tablón) ─────────────
  {
    id: 'mirta_intro', npc: 'mirta', priority: 100, once: true, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'mirta',
        text: '¡Ay, el herrero nuevo! Yo leo los avisos, anuncio la subasta y sé quién se pelea con quién. Preguntame lo que quieras... bueno, casi todo.',
        options: [
          { text: '¿Quién se pelea con quién?', effects: [rel('mirta', 4)], next: 'b' },
          { text: 'Solo vine a mirar los avisos.', next: 'c' },
        ],
      },
      b: { id: 'b', speaker: 'mirta', text: 'Ruperto con medio pueblo, Ilse con los mineros y Doña Violante con todo el que le dice que no. Vos cuidate de los tres.' },
      c: { id: 'c', speaker: 'mirta', text: 'Mirá, mirá. Pero los mejores avisos no están escritos, tesoro.' },
    },
  },
  {
    id: 'mirta_charla', npc: 'mirta', priority: 5, start: 'a',
    nodes: {
      a: {
        id: 'a', speaker: 'mirta', text: 'Si un día la ciudad entera te pide algo, es porque te ganaste el nombre. Y si te critica, también.',
        options: [{ text: 'Gracias, Mirta.', effects: [rel('mirta', 2)] }],
      },
    },
  },
  // ───────────── Encargos personales de NPC que ya existían ─────────────
  {
    id: 'rulfa_cuchillo', npc: 'rulfa', priority: 45, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'rulfa', value: 10 }],
    nodes: {
      a: {
        id: 'a', speaker: 'rulfa',
        text: 'Mi cuchillo de cocina tiene más años que vos y ya no corta ni la manteca. ¿Me forjarías uno bueno? Te pago en guiso... y en oro, no te asustes.',
        options: [
          { text: 'Para usted, lo mejor.', effects: [{ type: 'offerQuest', id: 'n_rulfa_cuchillo' }, rel('rulfa', 2)] },
          { text: 'Ahora estoy con mucho trabajo.' },
        ],
      },
    },
  },
  {
    id: 'ilse_seda', npc: 'ilse', priority: 45, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'ilse', value: 10 }],
    nodes: {
      a: {
        id: 'a', speaker: 'ilse',
        text: 'Tengo un comprador en la costa que paga una fortuna por seda de araña. Si me conseguís cuatro madejas antes que la competencia, repartimos.',
        options: [
          { text: 'Las consigo.', effects: [{ type: 'offerQuest', id: 'n_ilse_seda' }] },
          { text: 'Las arañas no me gustan.', effects: [rel('ilse', -1)] },
        ],
      },
    },
  },
  {
    id: 'ruperto_desafio', npc: 'ruperto', priority: 45, once: true, start: 'a',
    conditions: [{ type: 'itemsForgedMin', value: 5 }],
    nodes: {
      a: {
        id: 'a', speaker: 'ruperto',
        text: 'Dicen que sos bueno. Lo dudo. Forjá una espada larga de verdad, de las que hacía el viejo, y traémela. Si me convence, dejo de hablar mal de vos.',
        options: [
          { text: 'Acepto el desafío.', effects: [{ type: 'offerQuest', id: 'n_ruperto_desafio' }, { type: 'relation', npc: 'ruperto', delta: 3 }] },
          { text: 'No tengo nada que demostrarte.', effects: [{ type: 'relation', npc: 'ruperto', delta: -4 }] },
        ],
      },
    },
  },
  {
    id: 'bastian_lirios', npc: 'bastian', priority: 45, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'bastian', value: 10 }],
    nodes: {
      a: {
        id: 'a', speaker: 'bastian',
        text: '¡Necesito lirios nocturnos! Tres. Solo florecen de noche en Brezal, y yo de noche... bueno, me duermo. Si me los traés te enseño algo que te va a hacer correr más rápido. Literal.',
        options: [
          { text: 'Te los traigo.', effects: [{ type: 'offerQuest', id: 'n_bastian_lirios' }, rel('bastian', 2)] },
          { text: '¿De noche? Ni loco.' },
        ],
      },
    },
  },
  {
    id: 'teodora_opalo', npc: 'teodora', priority: 45, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'teodora', value: 15 }],
    nodes: {
      a: {
        id: 'a', speaker: 'teodora',
        text: 'Hay un códice que solo se lee a la luz de un ópalo lunar. Si me conseguís uno, te dejo copiar lo que dice sobre las tormentas.',
        options: [
          { text: 'Voy a buscarlo.', effects: [{ type: 'offerQuest', id: 'n_teodora_opalo' }] },
          { text: 'Suena a superstición.', effects: [rel('teodora', -2)] },
        ],
      },
    },
  },
  // ───────────── Pedidos personales de los mercenarios (con buena relación y en el grupo) ─────────────
  ...([
    ['brunilda', 'n_brunilda_maza', 'Te voy a confesar algo: las espadas no son lo mío. Yo quiero algo que aplaste. Una maza que haga temblar el piso.'],
    ['ciro', 'n_ciro_flechas', 'Tus flechas están bien. Bien no alcanza. Quiero cuarenta de las finas, de esas que no se desvían ni con viento.'],
    ['nayra', 'n_nayra_albino', 'Todos hablan del lobo blanco de Brezal y nadie lo vio. Yo quiero verlo. De noche, con vos.'],
    ['gualterio', 'n_gualterio_peto', '...Cargo todo. Pero cuando pegan, pegan a mí. Un peto. Firme. Si podés.'],
  ] as const).map(([npc, quest, text]): Dialogue => ({
    id: `${npc}_pedido`, npc, priority: 40, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc, value: 20 }, { type: 'inParty', npc }],
    nodes: {
      a: {
        id: 'a', speaker: npc, text,
        options: [
          { text: 'Dalo por hecho.', effects: [{ type: 'offerQuest', id: quest }, rel(npc, 2)] },
          { text: 'Más adelante.' },
        ],
      },
    },
  })),
];
