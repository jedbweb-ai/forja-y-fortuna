import type { CityEventDef, ContractDef, QuestDef } from '../core/town/types';
import type { CustomerType, Dialogue, DialogueEffect, Material, Npc, Synergy } from '../core/types';

// Fase 6B: gente, clientes, materiales, encargos, contratos y eventos de Puertoseco y Fuerte Ceniza.

export const NPCS_6B: Npc[] = [
  {
    id: 'ondina', name: 'Ondina Varela', role: 'Capitana del puerto', city: 'puertoseco', location: 'ps_muelle',
    personality: ['brava', 'franca', 'odia a los piratas', 'ama el mar'],
    gifts: { ama: ['arrojadizo', 'coral_rojo'], gusta: ['arma', 'herramienta'], disgusta: ['joyeria', 'noble'] },
    routine: { 'mañana': 'ps_muelle', tarde: 'ps_muelle', noche: 'ps_taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te cuenta qué trae el próximo barco.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te hace precio en el muelle (10%) y te guarda perlas negras.', perks: [{ kind: 'discount', pct: 10 }, { kind: 'stock', materials: ['perla_negra'] }] },
    ],
    rumors: [
      'Ondina: "Mañana entra un barco del sur cargado de ébano. Si querés, te guardo."',
      'Ondina: "Los piratas del cabo atacan cuando hay niebla. Los marineros van a querer cuchillos."',
    ],
    look: { body: 0x2a5a8a, hair: 0x1e1e1e, accent: 0xe8c860 },
    busyLines: ['Tengo tres barcos para descargar. Mañana.', 'La marea no espera, y yo tampoco.'],
    description: 'Manda en el puerto desde que echó a los piratas a cañonazos. Respeta a quien cumple su palabra.',
  },
  {
    id: 'jazmin', name: 'Jazmín Salobre', role: 'Comerciante de la Rambla', city: 'puertoseco', location: 'ps_mercado',
    personality: ['simpática', 'charlatana', 'regatea por deporte', 'colecciona caracoles'],
    gifts: { ama: ['coral_rojo', 'perla_negra'], gusta: ['joyeria', 'hierba'], disgusta: ['chatarra_goblin', 'municion'] },
    routine: { 'mañana': 'ps_mercado', tarde: 'ps_mercado', noche: 'ps_muelle' },
    unlocks: [
      { level: 'conocido', description: 'Te avisa qué se vende bien en el puerto.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Precio de amiga en la Rambla (10%).', perks: [{ kind: 'discount', pct: 10 }] },
    ],
    rumors: ['Jazmín: "Los marineros pagan bien los cuchillos arrojadizos. Siempre pierden alguno en el agua."'],
    look: { body: 0xc87533, hair: 0x6b3a1e, accent: 0x7af0ff },
    busyLines: ['¡Hoy no paro de vender! Mañana charlamos.', 'Volvé más tarde, corazón.'],
    description: 'Vende de todo y sabe de todos. Si le caés bien, te consigue lo que necesites.',
  },
  {
    id: 'bruno', name: 'Bruno Ancla', role: 'Tabernero y posadero', city: 'puertoseco', location: 'ps_taberna',
    personality: ['grandote', 'callado', 'cocina de maravilla', 'no soporta las peleas'],
    gifts: { ama: ['herramienta'], gusta: ['pocion', 'cuero_curtido'], disgusta: ['bombas'] },
    routine: { 'mañana': 'ps_taberna', tarde: 'ps_taberna', noche: 'ps_taberna' },
    unlocks: [{ level: 'conocido', description: 'Te cuenta lo que se habla en las mesas.', perks: [{ kind: 'rumors' }] }],
    rumors: ['Bruno: "Un marinero dijo que en el Pantano de Niebla hay hongos que brillan. No le creí."'],
    look: { body: 0x5a4a3a, hair: 0x2a1a10, accent: 0xd9a441 },
    busyLines: ['Hay mucha gente. Mañana.', '...Mañana.'],
    description: 'Fue ballenero. Ahora cocina guiso de pescado y no deja que nadie rompa una silla.',
  },
  {
    id: 'rolo', name: 'Rolo Mascarón', role: 'Capitán retirado, Casa de los Navegantes', city: 'puertoseco', location: 'ps_gremio',
    personality: ['memorioso', 'exagerado', 'generoso', 'desconfía de los nobles'],
    gifts: { ama: ['distancia', 'ebano'], gusta: ['arma', 'municion'], disgusta: ['noble'] },
    routine: { 'mañana': 'ps_gremio', tarde: 'ps_gremio', noche: 'ps_taberna' },
    unlocks: [
      { level: 'conocido', description: 'Te cuenta historias (y rumores) de la costa.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te enseña cómo armaban los arcos los cazadores de ballenas.', perks: [{ kind: 'teach', synergy: 'arco_ebano' }] },
    ],
    rumors: ['Rolo: "En mis tiempos, un buen arpón valía más que un barco. Hoy lo mismo, pero nadie se acuerda."'],
    look: { body: 0x3a4a6a, hair: 0xe8e2d0, accent: 0xc0392b },
    busyLines: ['Hoy no tengo historias. Bueno, tengo, pero estoy cansado.', 'Mañana, grumete.'],
    description: 'Cuarenta años en el mar y una pata de palo que dice que le comió un tiburón.',
  },
  {
    id: 'ilda', name: 'Ilda Roca', role: 'Comandante de Fuerte Ceniza', city: 'fuerte_ceniza', location: 'fc_intendencia',
    personality: ['severa', 'práctica', 'leal a sus soldados', 'odia el despilfarro'],
    gifts: { ama: ['armadura', 'escudo'], gusta: ['municion', 'acero_negro'], disgusta: ['joyeria', 'pocion'] },
    routine: { 'mañana': 'fc_intendencia', tarde: 'fc_intendencia', noche: 'fc_cantina' },
    unlocks: [
      { level: 'conocido', description: 'Te avisa de las incursiones antes que nadie.', perks: [{ kind: 'rumors' }] },
      { level: 'amigo', description: 'Te enseña cómo se arman los petos de la frontera.', perks: [{ kind: 'teach', synergy: 'placas_negras' }] },
    ],
    rumors: ['Ilda: "Los goblins del paso se están juntando. En unos días vamos a necesitar flechas."'],
    look: { body: 0x3a3a4a, hair: 0x9a9a9a, accent: 0xc0392b },
    busyLines: ['Estoy pasando revista. Mañana.', 'Si no es urgente, no es para hoy.'],
    description: 'Defendió el fuerte tres inviernos seguidos sin perder la muralla. No sonríe, pero paga.',
  },
  {
    id: 'pim', name: 'Pim Hojalata', role: 'Intendente del mercado', city: 'fuerte_ceniza', location: 'fc_mercado',
    personality: ['nervioso', 'ordenado', 'cuenta todo dos veces', 'le teme a la comandante'],
    gifts: { ama: ['herramienta', 'acero'], gusta: ['cuero_endurecido'], disgusta: ['gel_slime'] },
    routine: { 'mañana': 'fc_mercado', tarde: 'fc_mercado', noche: 'fc_cantina' },
    unlocks: [
      { level: 'conocido', description: 'Precio de proveedor (10%).', perks: [{ kind: 'discount', pct: 10 }] },
      { level: 'amigo', description: 'Te guarda acero negro del bueno (otro 10%).', perks: [{ kind: 'discount', pct: 10 }] },
    ],
    look: { body: 0x7a6a4a, hair: 0xd9a441, accent: 0x5a5a6a },
    busyLines: ['¡Me falta un cajón! Mañana, mañana.', 'Estoy contando. No me hables.'],
    description: 'Lleva el inventario de todo el fuerte en un cuaderno que no suelta nunca.',
  },
  {
    id: 'bocanegra', name: 'Sargento Bocanegra', role: 'Cantinero y sargento retirado', city: 'fuerte_ceniza', location: 'fc_cantina',
    personality: ['gritón', 'bonachón', 'odia a los goblins', 'canta mal'],
    gifts: { ama: ['arma'], gusta: ['municion', 'pocion'], disgusta: ['joyeria'] },
    routine: { 'mañana': 'fc_plaza', tarde: 'fc_cantina', noche: 'fc_cantina' },
    unlocks: [{ level: 'conocido', description: 'Te cuenta lo que se dice en la tropa.', perks: [{ kind: 'rumors' }] }],
    rumors: ['Bocanegra: "¡La comandante quiere escudos nuevos para el invierno! ¡Escudos, herrero, escudos!"'],
    look: { body: 0x6a2a2a, hair: 0x1e1e1e, accent: 0xd9a441 },
    busyLines: ['¡SARGENTO OCUPADO! Mañana, soldado.', '¡A formar! Digo... volvé mañana.'],
    description: 'Le falta media oreja y le sobra voz. Sirve la cerveza como si diera órdenes.',
  },
];

const rel = (npc: string, delta: number): DialogueEffect => ({ type: 'relation', npc, delta });
const intro = (id: string, text: string, good: string, goodReply: string, bad: string, badReply: string): Dialogue => ({
  id: `${id}_intro`, npc: id, priority: 100, once: true, start: 'a',
  nodes: {
    a: { id: 'a', speaker: id, text, options: [{ text: good, effects: [rel(id, 4)], next: 'b' }, { text: bad, effects: [rel(id, -2)], next: 'c' }] },
    b: { id: 'b', speaker: id, text: goodReply },
    c: { id: 'c', speaker: id, text: badReply },
  },
});
const chat = (id: string, text: string): Dialogue => ({
  id: `${id}_charla`, npc: id, priority: 5, start: 'a',
  nodes: { a: { id: 'a', speaker: id, text, options: [{ text: 'Buena charla.', effects: [rel(id, 1)] }] } },
});

export const DIALOGUES_6B: Dialogue[] = [
  intro('ondina', 'Un herrero de tierra adentro. ¿Venís a vender o a mirar los barcos? Acá se respeta al que trabaja y se ahorca al pirata.',
    'A vender, y a comprar lo que traen los barcos.', 'Bien dicho. El muelle está abierto de sol a sol.',
    '¿Ahorcan gente?', 'Solo a los que se lo ganan. Vos no tenés cara de pirata. Todavía.'),
  intro('jazmin', '¡Ay, un herrero! ¿Me hacés un anillo con coral? No, mentira, primero comprame algo. Después hablamos de anillos.',
    'Te compro algo, dale.', '¡Así me gusta! Acá tenés lo mejor de la Rambla. Y lo más caro, también.',
    'Solo vine a mirar.', 'Mirar es gratis. Por ahora.'),
  intro('bruno', '...¿Comida o cama?', 'Las dos, si hay.', 'Hay. Siempre hay.', 'Ninguna.', '...Bueno.'),
  intro('rolo', '¡Un forastero! Siéntese, siéntese. ¿Le conté de cuando un calamar gigante se tragó mi barco? Bueno, se lo cuento igual.',
    'Contame.', 'Era una noche de niebla... bueno, otro día termino. Los encargos están en el tablero.',
    'Tengo apuro.', 'Todos tienen apuro en tierra. En el mar se aprende a esperar.'),
  intro('ilda', 'Herrero. Mis soldados necesitan acero que no se parta. Si me vendés basura, me entero. Si me vendés algo bueno, también.',
    'Le traigo lo mejor, comandante.', 'Eso dicen todos. Los contratos están en la intendencia. Cumplí uno y hablamos.',
    '¿Y cuánto paga el ejército?', 'Lo justo, y puntual. A diferencia de algunos civiles.'),
  intro('pim', '¿Usted quién es? ¿Está en mi lista? No está en mi lista. ¿Viene a comprar? Eso sí está en mi lista.',
    'Vengo a comprar.', '¡Perfecto! Anoto. Acero, cuero, flechas... todo contado y en orden.',
    'Vengo a molestar.', 'Eso no está en ninguna lista. Por favor, no.'),
  intro('bocanegra', '¡SOLDADO! Ah, no, es un herrero. ¡HERRERO! ¿Una cerveza? ¡La primera la paga el ejército!',
    '¡Salud, sargento!', '¡ASÍ SE HABLA! Si alguna vez forjás un hacha para un viejo sargento, avisame.',
    'No tomo.', 'Más para mí. ¡Salud!'),
  chat('ondina', 'El mar no perdona al que se confía. La tierra tampoco, pero tarda más en cobrar.'),
  chat('jazmin', 'Los marineros compran cuchillos, los nobles compran perlas, y yo vendo de todo. ¡Así gira el mundo!'),
  chat('bruno', 'Guiso de pescado. El mejor de la costa. No lo digo yo. Bueno, sí.'),
  chat('rolo', 'Un arco de ébano tira más lejos que cualquier otro. Me lo enseñó un cazador de ballenas.'),
  chat('ilda', 'Un fuerte se sostiene con murallas, flechas y gente que cumple. En ese orden.'),
  chat('pim', 'Me faltan doce flechas en el inventario. Doce. Alguien se las llevó. O las conté mal. Las conté mal.'),
  chat('bocanegra', '¡En mis tiempos peleábamos con palos! ¡Y GANÁBAMOS! Bueno, a veces.'),
  {
    id: 'ondina_piratas', npc: 'ondina', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'ondina', value: 10 }],
    nodes: {
      a: {
        id: 'a', speaker: 'ondina',
        text: 'Mis marineros salen a perseguir piratas con cuchillos de cocina. Necesito veinte arrojadizos buenos. ¿Me los conseguís?',
        options: [
          { text: 'Te los forjo.', effects: [{ type: 'offerQuest', id: 'n_ondina_arrojadizos' }, rel('ondina', 2)] },
          { text: 'Ahora no.' },
        ],
      },
    },
  },
  {
    id: 'ilda_veteranos', npc: 'ilda', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'ilda', value: 10 }],
    nodes: {
      a: {
        id: 'a', speaker: 'ilda',
        text: 'Mis veteranos merecen algo mejor que petos de reglamento. Traeme una armadura rara, de las que se ven una vez por año.',
        options: [
          { text: 'La va a tener.', effects: [{ type: 'offerQuest', id: 'n_ilda_armadura' }, rel('ilda', 2)] },
          { text: 'No es lo mío.', effects: [rel('ilda', -1)] },
        ],
      },
    },
  },
  {
    id: 'bocanegra_hacha', npc: 'bocanegra', priority: 50, once: true, start: 'a',
    conditions: [{ type: 'relationMin', npc: 'bocanegra', value: 10 }],
    nodes: {
      a: {
        id: 'a', speaker: 'bocanegra',
        text: '¡Herrero! ¡Un viejo sargento necesita un arma que PEGUE! Una maza, un lucero, ¡algo que haga ruido!',
        options: [
          { text: '¡Sí, sargento!', effects: [{ type: 'offerQuest', id: 'n_bocanegra_maza' }, rel('bocanegra', 3)] },
          { text: 'Mejor no.' },
        ],
      },
    },
  },
];

export const CUSTOMERS_6B: CustomerType[] = [
  {
    id: 'marinero', name: 'Marinero', appearance: { 'mañana': 3, tarde: 3, noche: 2 }, minReputation: -50, cities: ['puertoseco'],
    budget: [20, 120], wants: { arrojadizo: 3, arma: 2, herramienta: 2, municion: 1 },
    prefStats: { spd: 1, dur: 0.6 }, likesAffinities: ['agua'], minQuality: 10,
    beautyLove: 0.1, patience: 3, generosity: 1, bulk: [10, 20],
    lines: {
      greet: ['Zarpamos mañana. Algo liviano que no se oxide.', '¿Tenés cuchillos? Siempre se nos caen al agua.'],
      noItem: ['Nada que flote. Digo, que sirva.', 'Muy pesado para un barco.'],
      happy: ['¡Buen acero! Lo voy a cuidar de la sal.', 'Trato hecho, herrero.'],
      angry: ['¡Por ese precio me compro un bote!', 'Ni los piratas cobran tanto.'],
    },
  },
  {
    id: 'soldado', name: 'Soldado', appearance: { 'mañana': 3, tarde: 3, noche: 2 }, minReputation: -50, cities: ['fuerte_ceniza'],
    budget: [30, 150], wants: { armadura: 3, escudo: 2.5, municion: 3, arma: 1.5, pocion: 1.5 },
    prefStats: { def: 1, dur: 0.8 }, minQuality: 20,
    beautyLove: 0, patience: 2, generosity: 1, bulk: [15, 30],
    lines: {
      greet: ['El reglamento no alcanza. Necesito algo que aguante de verdad.', 'Mañana me toca la muralla. ¿Qué tenés?'],
      noItem: ['Esto no aguanta un hachazo goblin.', 'Nada que me sirva en la muralla.'],
      happy: ['Firme. Me lo llevo.', 'Con esto vuelvo de la guardia, seguro.'],
      angry: ['Con la paga de soldado, imposible.', 'Eso es para oficiales, no para mí.'],
    },
  },
];

export const MATERIALS_6B: Material[] = [
  {
    id: 'ebano', name: 'Ébano del sur', type: 'madera', tier: 3, price: 40, color: '#2a1e1a',
    stats: { atk: 10, def: 6, spd: 3, wgt: 4, dur: 30 }, tags: ['exotico', 'firme'],
    description: 'Madera negra y pesada que llega por barco. Casi tan dura como el hierro.',
  },
  {
    id: 'coral_rojo', name: 'Coral rojo', type: 'gema', tier: 2, price: 34, color: '#e85a4a',
    stats: { def: 2, dur: 5 }, affinities: { agua: 2, fuego: 1 }, tags: ['gema', 'exotico'], alchemy: { curacion: 1, proteccion: 1 },
    description: 'Ramitas de coral de los arrecifes del sur. Los marineros lo usan de amuleto.',
  },
  {
    id: 'perla_negra', name: 'Perla negra', type: 'gema', tier: 3, price: 85, color: '#2a2a3a',
    stats: { def: 3, dur: 6 }, affinities: { agua: 2, oscuro: 2 }, tags: ['gema', 'raro', 'exotico'],
    description: 'Una perla oscura como la noche sin luna. Muy buscada por nobles y magos.',
  },
  {
    id: 'acero_negro', name: 'Acero negro', type: 'metal', tier: 3, price: 45, color: '#3a3a44',
    stats: { atk: 22, def: 22, wgt: 10, dur: 38 }, tags: ['aleacion', 'frontera'],
    description: 'El acero de las forjas de la frontera: pesado, duro y feo. Ideal para armaduras.',
  },
];

export const SYNERGIES_6B: Synergy[] = [
  {
    id: 'mango_ebano', name: 'Mango de ébano', secret: false,
    when: [{ kind: 'materialInSlot', material: 'ebano', slot: 'mango' }],
    effect: { statPct: { spd: 8, dur: 10 }, valuePct: 10 },
    description: 'Un mango de ébano: firme, equilibrado y lindo de ver.',
    hint: 'La madera del sur no es solo para barcos.',
  },
  {
    id: 'arco_ebano', name: 'Arco de ébano', secret: true,
    when: [{ kind: 'materialInSlot', material: 'ebano', slot: 'cuerpo' }, { kind: 'category', in: ['distancia'] }],
    effect: { statPct: { atk: 15 }, trait: 'largo_alcance' },
    description: 'Un arco con cuerpo de ébano tira más lejos y más fuerte, como los de los balleneros.',
    hint: 'Los balleneros sabían algo de arcos.',
  },
  {
    id: 'engarce_coral', name: 'Engarce de coral', secret: false,
    when: [{ kind: 'materialInSlot', material: 'coral_rojo', slot: 'engarce' }],
    effect: { affinity: { agua: 2 }, valuePct: 15 },
    description: 'Un anillo con coral: protege del agua y los marineros lo adoran.',
    hint: 'Un amuleto de marinero en un dedo.',
  },
  {
    id: 'perla_sombra', name: 'Perla de sombra', secret: true,
    when: [{ kind: 'materialInSlot', material: 'perla_negra', slot: 'colgante' }],
    effect: { affinity: { oscuro: 2 }, trait: 'sombra_lunar', valuePct: 30 },
    description: 'Un amuleto con perla negra: quien lo lleva se mueve como una sombra.',
    hint: 'Lo que es oscuro en el mar, es oscuro en la tierra.',
  },
  {
    id: 'placas_negras', name: 'Placas de la frontera', secret: true,
    when: [{ kind: 'materialInSlot', material: 'acero_negro', slot: 'placas' }],
    effect: { statPct: { def: 15 }, trait: 'reforzada' },
    description: 'Un peto con placas de acero negro: el reglamento de Fuerte Ceniza.',
    hint: 'En la frontera saben hacer petos que no se doblan.',
  },
];

export const QUESTS_6B: QuestDef[] = [
  // Puertoseco
  {
    id: 'ps_arpones', city: 'puertoseco', title: 'Arrojadizos para la flota', board: 'gremio', giver: 'rolo', repeatable: true, weight: 2,
    text: 'La flota pesquera necesita arrojadizos para defenderse de los piratas.', done: 'Rolo los reparte entre los capitanes.',
    objective: { kind: 'craft', category: 'arrojadizo', minQuality: 30, qty: 15 },
    days: 5, reward: { gold: 110, reputation: 3, relation: 2 }, penalty: { reputation: 2, relation: 2 },
  },
  {
    id: 'ps_hachas', city: 'puertoseco', title: 'Hachas para el astillero', board: 'gremio', client: 'Astillero del cabo', repeatable: true, weight: 2,
    text: 'El astillero necesita dos hachas buenas para cortar ébano.', done: 'El maestro carpintero prueba el filo en un tronco y sonríe.',
    objective: { kind: 'craft', blueprints: ['hacha_tala'], minQuality: 35, qty: 2 },
    days: 5, reward: { gold: 150, reputation: 3 }, penalty: { reputation: 2 },
  },
  {
    id: 'ps_dagas', city: 'puertoseco', title: 'Dagas para la tripulación', board: 'gremio', client: 'Capitán de un mercante', repeatable: true, weight: 1.5,
    text: 'Tres dagas livianas para una tripulación que zarpa la semana que viene.', done: 'El capitán paga en monedas de tres reinos distintos.',
    objective: { kind: 'craft', blueprints: ['daga'], minQuality: 35, qty: 3 },
    days: 6, reward: { gold: 190, reputation: 3 }, penalty: { reputation: 2 },
  },
  {
    id: 'ps_seda', city: 'puertoseco', title: 'Seda para las velas finas', board: 'gremio', client: 'Velería del puerto', repeatable: true, weight: 1,
    text: 'Cuatro madejas de seda de araña para las velas de un barco nuevo.', done: 'La velera las mide con la mano y asiente.',
    objective: { kind: 'materials', material: 'seda_arana', qty: 4 },
    days: 6, reward: { gold: 130, reputation: 2 }, penalty: { reputation: 1 },
  },
  {
    id: 'n_ondina_arrojadizos', city: 'puertoseco', title: 'Contra los piratas del cabo', board: 'npc', giver: 'ondina',
    text: 'Ondina necesita veinte arrojadizos para sus marineros.', done: 'Ondina golpea el muelle con la bota: "Ahora sí, que vengan".',
    objective: { kind: 'craft', category: 'arrojadizo', minQuality: 35, qty: 20 },
    days: 7, reward: { gold: 160, reputation: 6, relation: 15 }, penalty: { reputation: 3, relation: 8 },
  },
  // Fuerte Ceniza
  {
    id: 'fc_flechas', city: 'fuerte_ceniza', title: 'Flechas para la muralla', board: 'gremio', giver: 'ilda', repeatable: true, weight: 2,
    text: 'Cuarenta flechas para los arqueros de la muralla.', done: 'Ilda las cuenta. Dos veces. Están todas.',
    objective: { kind: 'craft', category: 'municion', minQuality: 35, qty: 40 },
    days: 5, reward: { gold: 140, reputation: 3, relation: 2 }, penalty: { reputation: 3, relation: 3 },
  },
  {
    id: 'fc_petos', city: 'fuerte_ceniza', title: 'Petos para los reclutas', board: 'gremio', giver: 'ilda', repeatable: true, weight: 2,
    text: 'Dos petos firmes para reclutas que salen a patrullar.', done: 'Los reclutas se los prueban y se golpean el pecho, orgullosos.',
    objective: { kind: 'craft', category: 'armadura', stat: { key: 'def', min: 18 }, qty: 2 },
    days: 6, reward: { gold: 260, reputation: 4, relation: 3 }, penalty: { reputation: 3, relation: 3 },
  },
  {
    id: 'fc_escudos', city: 'fuerte_ceniza', title: 'Escudos para el invierno', board: 'tablon', client: 'Guarnición de Fuerte Ceniza', repeatable: true, weight: 2,
    text: 'Dos escudos de buena calidad para la guardia de invierno.', done: 'El sargento de guardia los cuelga en la armería.',
    objective: { kind: 'craft', category: 'escudo', minQuality: 45, qty: 2 },
    days: 6, reward: { gold: 230, reputation: 4 }, penalty: { reputation: 3 },
  },
  {
    id: 'fc_goblins', city: 'fuerte_ceniza', title: 'El paso de los goblins', board: 'tablon', client: 'Patrulla de la frontera', repeatable: true, weight: 1.5,
    text: 'Los goblins bajan por el paso. La patrulla paga por cada banda deshecha.', done: 'La patrulla brinda por vos en la cantina.',
    objective: { kind: 'hunt', family: 'goblins', count: 8 },
    days: 7, reward: { gold: 180, reputation: 5 }, penalty: { reputation: 2 },
  },
  {
    id: 'n_ilda_armadura', city: 'fuerte_ceniza', title: 'Para los veteranos', board: 'npc', giver: 'ilda',
    text: 'Ilda quiere una armadura rara para sus veteranos.', done: 'Ilda la sostiene en silencio. "Esto vale una medalla." Y te da una.',
    objective: { kind: 'craft', category: 'armadura', minRarity: 'raro', qty: 1 },
    days: 10, reward: { gold: 380, reputation: 8, relation: 15 }, penalty: { reputation: 4, relation: 8 },
  },
  {
    id: 'n_bocanegra_maza', city: 'fuerte_ceniza', title: 'Algo que haga ruido', board: 'npc', giver: 'bocanegra',
    text: 'El sargento Bocanegra quiere una maza que pegue fuerte.', done: '¡JA! ¡Esto es un arma! ¡La próxima ronda la paga el sargento!',
    objective: { kind: 'craft', blueprints: ['maza', 'lucero_alba'], minQuality: 45, qty: 1 },
    days: 8, reward: { gold: 120, relation: 20, reputation: 3 }, penalty: { relation: 6 },
  },
];

export const CONTRACTS_6B: ContractDef[] = [
  {
    id: 'k_ps_arrojadizos', city: 'puertoseco', title: 'Cuchillos para la flota', merchant: 'rolo', weight: 2,
    text: 'La flota compra arrojadizos todas las semanas.',
    item: { category: 'arrojadizo', minQuality: 25, qty: 15 }, deliveries: 3, everyDays: 3, pricePerUnit: 4,
    bonus: { gold: 60, reputation: 3, relation: 6 }, penalty: { reputation: 4, relation: 10 },
  },
  {
    id: 'k_ps_herramientas', city: 'puertoseco', title: 'Herramientas para el astillero', merchant: 'jazmin', weight: 1.5,
    text: 'El astillero gasta herramientas como pan.',
    item: { category: 'herramienta', minQuality: 30, qty: 2 }, deliveries: 2, everyDays: 4, pricePerUnit: 60,
    bonus: { gold: 50, reputation: 3, relation: 8 }, penalty: { reputation: 3, relation: 10 },
  },
  {
    id: 'k_fc_flechas', city: 'fuerte_ceniza', title: 'Flechas para la guarnición', merchant: 'ilda', weight: 2,
    text: 'Contrato militar: flechas en cantidad, entregas puntuales.',
    item: { category: 'municion', minQuality: 30, qty: 30 }, deliveries: 4, everyDays: 3, pricePerUnit: 2.8,
    bonus: { gold: 90, reputation: 5, relation: 8 }, penalty: { reputation: 6, relation: 12 },
  },
  {
    id: 'k_fc_petos', city: 'fuerte_ceniza', title: 'Petos de reglamento', merchant: 'ilda', weight: 1.5, minReputation: 10,
    text: 'Un peto por entrega, que pase la inspección.',
    item: { category: 'armadura', minQuality: 40, qty: 1 }, deliveries: 3, everyDays: 4, pricePerUnit: 95,
    bonus: { gold: 100, reputation: 6, relation: 10 }, penalty: { reputation: 6, relation: 12 },
  },
];

export const CITY_EVENTS_6B: CityEventDef[] = [
  {
    id: 'ps_flota', city: 'puertoseco', name: 'Llega la flota del sur', weight: 2, duration: [2, 3],
    text: 'Veinte barcos en el puerto: marineros con ganas de gastar y gemas a buen precio.',
    demand: { arrojadizo: 1.3, arma: 1.2 }, customers: { marinero: 2, mercader: 1.5 }, prices: { types: ['gema'], mult: 0.75 },
  },
  {
    id: 'ps_tormenta', city: 'puertoseco', name: 'Temporal en el mar', weight: 1.5, duration: [2, 3],
    text: 'Ningún barco sale ni entra. La madera escasea y poca gente anda por la calle.',
    customers: { marinero: 0.6, mercader: 0.5 }, prices: { types: ['madera'], mult: 1.3 },
  },
  {
    id: 'ps_piratas', city: 'puertoseco', name: 'Piratas en el cabo', weight: 1, duration: [3, 4], minDay: 4,
    text: 'Velas negras en el horizonte. Los marineros se arman.',
    demand: { arma: 1.4, arrojadizo: 1.5, escudo: 1.2 }, customers: { marinero: 1.5 },
    choice: {
      prompt: 'La capitana Ondina pide ayuda para armar a los pescadores.',
      options: [
        { text: 'Donar 40 de oro para armas', conditions: [{ type: 'gold', min: 40 }], effects: [{ type: 'gold', delta: -40 }, { type: 'relation', npc: 'ondina', delta: 8 }, { type: 'reputation', delta: 4 }], result: 'Ondina te da la mano: "Esto no se olvida en el puerto".' },
        { text: 'Venderles a precio de guerra', effects: [{ type: 'gold', delta: 60 }, { type: 'relation', npc: 'ondina', delta: -5 }], result: 'Ganás bien. Ondina no te mira igual.' },
      ],
    },
  },
  {
    id: 'fc_incursion', city: 'fuerte_ceniza', name: 'Incursión en la frontera', weight: 2, duration: [3, 4],
    text: 'Una banda goblin cruzó el paso. El fuerte se prepara para el ataque.',
    demand: { armadura: 1.3, municion: 1.5, escudo: 1.3, pocion: 1.3 }, customers: { soldado: 1.6 },
    choice: {
      prompt: 'La comandante Ilda necesita flechas ya.',
      options: [
        { text: 'Donar 4 de hierro para puntas', conditions: [{ type: 'hasMaterial', id: 'hierro', qty: 4 }], effects: [{ type: 'takeMaterial', id: 'hierro', qty: 4 }, { type: 'relation', npc: 'ilda', delta: 8 }, { type: 'reputation', delta: 4 }], result: 'Ilda asiente: "El fuerte te debe una".' },
        { text: 'Seguir con lo tuyo', effects: [], result: 'La tropa se arregla como puede.' },
      ],
    },
  },
  {
    id: 'fc_revista', city: 'fuerte_ceniza', name: 'Revista militar', weight: 1.5, duration: [2, 3],
    text: 'Llega un general de la capital a inspeccionar la tropa. Todos quieren lucir equipo nuevo.',
    demand: { arma: 1.3, armadura: 1.2, escudo: 1.2 }, customers: { soldado: 1.4, noble: 2 },
  },
  {
    id: 'fc_invierno', city: 'fuerte_ceniza', name: 'Invierno duro', weight: 1, duration: [3, 5], minDay: 6,
    text: 'Nieva sobre la muralla. Faltan leña y pociones.',
    demand: { pocion: 1.5, herramienta: 1.2 }, prices: { types: ['madera'], mult: 1.4 },
    choice: {
      prompt: 'El sargento Bocanegra junta leña para los heridos.',
      options: [
        { text: 'Donar 4 de roble', conditions: [{ type: 'hasMaterial', id: 'roble', qty: 4 }], effects: [{ type: 'takeMaterial', id: 'roble', qty: 4 }, { type: 'relation', npc: 'bocanegra', delta: 6 }, { type: 'reputation', delta: 3 }], result: '¡BIEN, HERRERO! —grita Bocanegra.' },
        { text: 'No tenés para dar', effects: [], result: 'El invierno sigue.' },
      ],
    },
  },
];
