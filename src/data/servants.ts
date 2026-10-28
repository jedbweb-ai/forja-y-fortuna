import type { Dialogue, DialogueEffect, Npc } from '../core/types';
import type { MercenaryDef } from '../core/party/types';

// Mercado de esclavos: candidatos que rotan cada semana. Se compran una vez, no cobran sueldo
// y su lealtad (la relación) arranca baja. Liberarlos les da lealtad máxima, pero empiezan a cobrar.
export const SERVANTS: MercenaryDef[] = [
  {
    id: 'yago', name: 'Yago Cardo', specialty: 'guerrero', level: 2, kind: 'esclavo',
    attributes: { fuerza: 7, agilidad: 4, resistencia: 7, voluntad: 3 },
    growth: { fuerza: 0.9, agilidad: 0.4, resistencia: 0.8, voluntad: 0.3 },
    wage: 0, hireCost: 90, price: 90, startRelation: -60, freeWage: 9,
    look: { body: 0x5a4a3a, hair: 0x1e1e1e, accent: 0x8a3a2a },
    quote: 'Mirá todo lo que quieras. No soy un caballo.',
    description: 'Ex soldado de la frontera. Su capitán lo vendió para pagar deudas de juego. Pega fuerte y no perdona.',
    story: 'Sirvió diez años en la frontera. Cuando su capitán perdió a los dados, puso a su tropa como garantía.',
  },
  {
    id: 'sabela', name: 'Sabela Junco', specialty: 'explorador', level: 1, kind: 'esclavo',
    attributes: { fuerza: 4, agilidad: 7, resistencia: 4, voluntad: 5 },
    growth: { fuerza: 0.4, agilidad: 0.9, resistencia: 0.4, voluntad: 0.5 },
    wage: 0, hireCost: 70, price: 70, startRelation: -30, freeWage: 7,
    look: { body: 0x4a6a3a, hair: 0xd9a441, accent: 0x2e7a72 },
    quote: 'Si me sacás de acá, te muestro caminos que ni los lobos conocen.',
    description: 'Guía de montaña. La capturaron unos bandidos en el paso norte. Conoce cada sendero del valle.',
    story: 'Guiaba caravanas por el paso norte hasta que unos bandidos la vendieron junto con la carga.',
  },
  {
    id: 'oriol', name: 'Oriol Brea', specialty: 'arquero', level: 1, kind: 'esclavo',
    attributes: { fuerza: 4, agilidad: 7, resistencia: 4, voluntad: 4 },
    growth: { fuerza: 0.4, agilidad: 0.9, resistencia: 0.5, voluntad: 0.4 },
    wage: 0, hireCost: 75, price: 75, startRelation: -55, freeWage: 8,
    look: { body: 0x3a4a2a, hair: 0x6b3a1e, accent: 0xc8a050 },
    quote: '...',
    description: 'Cazador furtivo condenado por matar un ciervo del señor de Arce. No habla mucho; apunta bien.',
    story: 'Cazó un ciervo en las tierras de los Arce para darle de comer a su hermana. Lo condenaron a servir diez años.',
  },
  {
    id: 'marcia', name: 'Marcia Tresfuegos', specialty: 'porteador', level: 2, kind: 'esclavo',
    attributes: { fuerza: 7, agilidad: 3, resistencia: 7, voluntad: 4 },
    growth: { fuerza: 0.8, agilidad: 0.3, resistencia: 0.8, voluntad: 0.4 },
    wage: 0, hireCost: 65, price: 65, startRelation: -25, freeWage: 6,
    look: { body: 0x7a3b2e, hair: 0x2a1a10, accent: 0xf2a04a },
    quote: 'Huele a carbón tu ropa. Mi viejo era herrero.',
    description: 'Hija de un herrero que quebró. Vendieron a la familia para saldar la deuda. Carga como dos y sabe de metales.',
    story: 'Su padre tenía una herrería en Puertoseco. Cuando quebró, los acreedores se cobraron con la familia.',
  },
];

const SERVANT_GIFTS: Record<string, Npc['gifts']> = {
  yago: { ama: ['arma', 'acero'], gusta: ['escudo', 'armadura'], disgusta: ['joyeria'] },
  sabela: { ama: ['distancia', 'cuero_lobo'], gusta: ['pocion', 'hierba'], disgusta: ['chatarra_goblin'] },
  oriol: { ama: ['distancia', 'municion'], gusta: ['pelaje_albino', 'bestia'], disgusta: ['noble'] },
  marcia: { ama: ['herramienta', 'brasalita'], gusta: ['metal', 'armadura'], disgusta: ['pocion'] },
};

export const SERVANT_NPCS: Npc[] = SERVANTS.map((m) => ({
  id: m.id, name: m.name, role: `Compañero · ${m.specialty}`, city: 'valdebrasa', location: 'herreria',
  personality: [],
  gifts: SERVANT_GIFTS[m.id],
  // Su lugar real lo decide el estado (en venta, en tu herrería o en tu grupo).
  routine: { 'mañana': 'herreria', tarde: 'herreria', noche: 'herreria' },
  unlocks: [
    { level: 'neutral', description: 'Deja de rendir menos en combate.' },
    { level: 'amigo', description: 'Pelea mejor a tu lado (+5% ataque y defensa) y te cuenta su historia.' },
    { level: 'aliado', description: 'Pelea por vos como por nadie (+10%).' },
  ],
  look: m.look,
  busyLines: ['Ya hablamos hoy.', 'Mañana, si querés.'],
  description: m.description,
}));

const rel = (npc: string, delta: number): DialogueEffect => ({ type: 'relation', npc, delta });

/** Diálogos de cada compañero: en venta, con lealtad baja, media, alta y una vez libre. */
function servantDialogues(
  id: string,
  t: { market: string; hostile: string; warming: string; story: string; quest: string; questId: string; freed: string },
): Dialogue[] {
  return [
    {
      id: `${id}_venta`, npc: id, priority: 100, once: true, start: 'a',
      nodes: {
        a: {
          id: 'a', speaker: id, text: t.market,
          options: [
            { text: 'No te voy a tratar mal.', effects: [rel(id, 3)] },
            { text: 'Solo estoy mirando.' },
          ],
        },
      },
    },
    {
      id: `${id}_hostil`, npc: id, priority: 20, start: 'a',
      conditions: [{ type: 'servant', npc: id }, { type: 'relationMax', npc: id, value: -15 }],
      nodes: {
        a: {
          id: 'a', speaker: id, text: t.hostile,
          options: [
            { text: 'Te entiendo. Dame tiempo.', effects: [rel(id, 2)] },
            { text: 'Hacé tu trabajo y callate.', effects: [rel(id, -3)] },
          ],
        },
      },
    },
    {
      id: `${id}_confianza`, npc: id, priority: 30, once: true, start: 'a',
      conditions: [{ type: 'servant', npc: id }, { type: 'relationMin', npc: id, value: -14 }],
      nodes: {
        a: {
          id: 'a', speaker: id, text: t.warming,
          options: [{ text: 'Gracias por contármelo.', effects: [rel(id, 4)] }],
        },
      },
    },
    {
      id: `${id}_historia`, npc: id, priority: 40, once: true, start: 'a',
      conditions: [{ type: 'relationMin', npc: id, value: 30 }, { type: 'inParty', npc: id }],
      nodes: {
        a: {
          id: 'a', speaker: id, text: t.story, next: 'b',
        },
        b: {
          id: 'b', speaker: id, text: t.quest,
          options: [
            { text: 'Te ayudo.', effects: [{ type: 'offerQuest', id: t.questId }, rel(id, 3)] },
            { text: 'Ahora no puedo.' },
          ],
        },
      },
    },
    {
      id: `${id}_libre`, npc: id, priority: 50, once: true, start: 'a',
      conditions: [{ type: 'servant', npc: id, freed: true }],
      nodes: { a: { id: 'a', speaker: id, text: t.freed, options: [{ text: 'Te lo ganaste.', effects: [rel(id, 5)] }] } },
    },
    {
      id: `${id}_charla`, npc: id, priority: 10, start: 'a',
      conditions: [{ type: 'relationMin', npc: id, value: -14 }],
      nodes: { a: { id: 'a', speaker: id, text: 'Hoy anduvo bien. Si seguimos así, quizás salgamos vivos de todo esto.', options: [{ text: 'Seguro.', effects: [rel(id, 2)] }] } },
    },
  ];
}

export const SERVANT_DIALOGUES: Dialogue[] = [
  ...servantDialogues('yago', {
    market: 'Si me comprás, voy a pelear. Pero no esperes que te cuide la espalda.',
    hostile: 'Peleo porque si no, me matan. No porque me importes.',
    warming: 'Me diste una espada de verdad. Mi capitán nunca lo hizo. ...Eso no quiere decir nada. Todavía.',
    story: 'Diez años en la frontera. Mi capitán, Gaspar Uría, me apostó a los dados. Perdió. Yo terminé acá.',
    quest: 'Uría se esconde en algún lado del valle. No te pido que lo busques. Te pido algo que pueda llevar a su cara: una espada con filo de verdad.',
    questId: 'n_yago_espada',
    freed: '¿Libre? ...Me quedo. No por deuda. Porque quiero.',
  }),
  ...servantDialogues('sabela', {
    market: 'Conozco el paso norte mejor que nadie. Si me tratás bien, te llevo por donde los monstruos no miran.',
    hostile: 'No me gusta que me digan adónde ir. Antes yo guiaba.',
    warming: 'Hoy caminamos por un sendero que me enseñó mi padre. Hacía años que no lo pisaba.',
    story: 'Los bandidos del paso norte me vendieron con las mulas. Todavía tienen mi brújula: era de mi padre.',
    quest: 'No quiero la brújula. Quiero que no vuelvan a vender a nadie. Hay lobos en ese paso: si limpiamos el camino, las caravanas vuelven a pasar.',
    questId: 'n_sabela_lobos',
    freed: '¿Puedo irme cuando quiera? Entonces me quedo un tiempo más. Hay caminos que quiero mostrarte.',
  }),
  ...servantDialogues('oriol', {
    market: '...',
    hostile: '...',
    warming: 'Mi hermana se llama Nilda. Cuando cumpla mi condena, la voy a buscar. ...Eso es todo.',
    story: 'Cacé un ciervo de los Arce porque Nilda tenía hambre. Diez años por un ciervo. Esos nobles comen tres por semana.',
    quest: 'Quiero un arco propio. No uno de préstamo. Uno que pueda llevarme cuando termine esto.',
    questId: 'n_oriol_arco',
    freed: 'Voy a ir a ver a Nilda. Y después vuelvo. Alguien tiene que cuidarte de los lobos.',
  }),
  ...servantDialogues('marcia', {
    market: 'Tu ropa huele a carbón. Mi viejo era herrero. Si me comprás, por lo menos sé distinguir el hierro del bronce.',
    hostile: 'Cargo tus cosas. No me pidas que sonría.',
    warming: 'Tu yunque suena bien. El de mi viejo sonaba igual antes de que se lo llevaran.',
    story: 'La herrería de mi padre estaba en Puertoseco. Cuando quebró, se llevaron el yunque, las herramientas y a nosotros.',
    quest: 'Hacé un martillo bueno, una herramienta de verdad. Algún día voy a abrir mi propio taller y quiero empezar con algo hecho por vos.',
    questId: 'n_marcia_herramienta',
    freed: 'Libre. Mi viejo estaría orgulloso de vos, ¿sabés? Me quedo a trabajar. Y esta vez, con sueldo.',
  }),
];
