import type { ExpEventDef } from '../core/world/types';

// Eventos de expedición: situaciones con dos o tres opciones. Cada opción tiene resultados posibles (con peso)
// y cada resultado, efectos (core/world/types.ts → ExpEffect). Los materiales "de la zona" salen de las listas
// de la zona donde pasa el evento, así un mismo evento sirve en todas las regiones.

export const EXPEDITION_EVENTS: ExpEventDef[] = [
  {
    id: 'viajero_herido', title: 'Un viajero herido', weight: 3,
    text: 'Al costado del camino, un hombre con la pierna vendada a las apuradas te pide ayuda. Dice que lo asaltaron.',
    options: [
      {
        text: 'Ayudarlo a volver al camino (lleva tiempo)',
        outcomes: [
          { weight: 4, text: 'Te lo agradece con lo poco que le quedó y te indica un escondite de los ladrones.', effects: [{ kind: 'time', slots: 1 }, { kind: 'gold', amount: [15, 40] }, { kind: 'zoneMaterial', pool: 'cofre', qty: [1, 2] }] },
          { weight: 1, text: '¡Era una trampa! Sus compinches salen de entre los arbustos.', effects: [{ kind: 'fight', budgetMult: 0.8 }] },
        ],
      },
      { text: 'Darle agua y seguir', outcomes: [{ weight: 1, text: 'Te bendice a su manera y seguís viaje.', effects: [] }] },
    ],
  },
  {
    id: 'buhonero', title: 'Un buhonero con su mula', weight: 3,
    text: 'Un vendedor ambulante descansa a la sombra con una mula cargada de bolsas. Te saluda como a un viejo cliente.',
    options: [
      { text: 'Comprarle provisiones (20 de oro)', requires: { gold: 20 }, outcomes: [{ weight: 1, text: 'Pan, queso y una bota de vino: el grupo recupera fuerzas.', effects: [{ kind: 'energy', amount: 6 }] }] },
      {
        text: 'Preguntarle por la zona',
        outcomes: [
          { weight: 3, text: 'Te cuenta de una veta que vio al pasar. Tenía razón.', effects: [{ kind: 'zoneMaterial', pool: 'vetas', qty: [2, 4] }, { kind: 'xp', skill: 'comercio', amount: 4 }] },
          { weight: 1, text: 'Habla mucho y no dice nada. Al menos aprendiste a regatear con él.', effects: [{ kind: 'xp', skill: 'comercio', amount: 6 }] },
        ],
      },
      { text: 'Seguir de largo', outcomes: [{ weight: 1, text: 'Te despide con la mano.', effects: [] }] },
    ],
  },
  {
    id: 'piedra_inscrita', title: 'Una piedra con inscripciones', weight: 2,
    text: 'Medio enterrada entre los yuyos hay una piedra tallada con signos que brillan apenas cuando les da la luz.',
    options: [
      {
        text: 'Descifrar los signos (runas 2)', requires: { skill: { id: 'runas', level: 2 } },
        outcomes: [
          { weight: 1, text: 'Los signos son una receta: la copiás entera.', effects: [{ kind: 'grimoire' }, { kind: 'xp', skill: 'runas', amount: 8 }] },
          { weight: 2, text: 'Es una advertencia vieja. Igual te llevás un pedazo de la piedra.', effects: [{ kind: 'material', material: 'piedra_runica', qty: [1, 2] }, { kind: 'xp', skill: 'runas', amount: 5 }] },
        ],
      },
      { text: 'Picar la piedra', outcomes: [{ weight: 1, text: 'Adentro tiene vetas finas.', effects: [{ kind: 'zoneMaterial', pool: 'gemas', qty: [1, 1] }, { kind: 'energy', amount: -2 }] }] },
      { text: 'Dejarla en paz', outcomes: [{ weight: 1, text: 'Hay cosas que es mejor no tocar.', effects: [] }] },
    ],
  },
  {
    id: 'cazador_furtivo', title: 'Un cazador con trampas', weight: 2, biomes: ['pradera', 'bosque', 'colinas', 'pantano', 'montana'],
    text: 'Un cazador revisa una hilera de trampas. Cuando te ve, esconde algo atrás de la espalda.',
    options: [
      { text: 'Comprarle pieles (30 de oro)', requires: { gold: 30 }, outcomes: [{ weight: 1, text: 'Te vende dos pieles buenas, sin preguntas.', effects: [{ kind: 'material', material: 'piel_jabali', qty: [2, 3] }] }] },
      {
        text: 'Ayudarlo a desollar (desuello 2)', requires: { skill: { id: 'desuello', level: 2 } },
        outcomes: [{ weight: 1, text: 'Trabajan juntos y te deja quedarte con una parte.', effects: [{ kind: 'material', material: 'cuero_lobo', qty: [1, 2] }, { kind: 'xp', skill: 'desuello', amount: 6 }] }],
      },
      {
        text: 'Echarlo de ahí',
        outcomes: [
          { weight: 2, text: 'Se va maldiciendo y deja una trampa con una presa.', effects: [{ kind: 'material', material: 'colmillo_lobo', qty: [1, 2] }] },
          { weight: 1, text: 'No se va solo: llama a sus perros.', effects: [{ kind: 'fight', budgetMult: 0.7 }] },
        ],
      },
    ],
  },
  {
    id: 'rastro_fresco', title: 'Un rastro fresco', weight: 2, minDanger: 2,
    text: 'Huellas grandes y ramas quebradas. Lo que pasó por acá era pesado, y no hace mucho.',
    options: [
      {
        text: 'Seguirlo hasta su guarida',
        outcomes: [
          { weight: 2, text: 'Encontrás la guarida. Su dueño está en casa.', effects: [{ kind: 'fight', budgetMult: 1.3 }] },
          { weight: 1, text: 'La guarida está vacía, con restos de otras presas.', effects: [{ kind: 'zoneMaterial', pool: 'cofre', qty: [2, 3] }] },
        ],
      },
      { text: 'Borrar tus huellas y seguir', outcomes: [{ weight: 1, text: 'Mejor no cruzarse con eso.', effects: [] }] },
    ],
  },
  {
    id: 'campamento_abandonado', title: 'Un campamento abandonado', weight: 3,
    text: 'Una fogata fría, una carpa rota y cosas tiradas. Quien estaba acá se fue apurado.',
    options: [
      {
        text: 'Revisar las cosas',
        outcomes: [
          { weight: 3, text: 'Quedaba algo de valor entre las mantas.', effects: [{ kind: 'gold', amount: [10, 30] }, { kind: 'zoneMaterial', pool: 'cofre', qty: [1, 2] }] },
          { weight: 1, text: 'Los dueños vuelven, y no están contentos.', effects: [{ kind: 'fight', budgetMult: 1 }] },
        ],
      },
      { text: 'Descansar un rato junto a la fogata', outcomes: [{ weight: 1, text: 'Prenden el fuego y descansan.', effects: [{ kind: 'time', slots: 1 }, { kind: 'energy', amount: 5 }] }] },
    ],
  },
  {
    id: 'arroyo_claro', title: 'Un arroyo de agua clara', weight: 2, biomes: ['pradera', 'bosque', 'pantano', 'colinas'],
    text: 'El agua corre limpia sobre piedras redondas. Algunas brillan distinto.',
    options: [
      { text: 'Beber y lavarse las heridas', outcomes: [{ weight: 1, text: 'El agua fría les hace bien a todos.', effects: [{ kind: 'health', pct: 0.25 }] }] },
      {
        text: 'Buscar en el lecho',
        outcomes: [
          { weight: 2, text: 'Arenas con mineral: sacás un poco.', effects: [{ kind: 'zoneMaterial', pool: 'vetas', qty: [1, 2] }, { kind: 'energy', amount: -1 }] },
          { weight: 1, text: '¡Una piedra preciosa entre las otras!', effects: [{ kind: 'zoneMaterial', pool: 'gemas', qty: [1, 1] }, { kind: 'energy', amount: -1 }] },
        ],
      },
    ],
  },
  {
    id: 'arbol_hueco', title: 'Un árbol hueco', weight: 2, biomes: ['pradera', 'bosque', 'pantano'],
    text: 'Un tronco enorme, hueco por dentro. Adentro se ve algo, o alguien guardó algo.',
    options: [
      {
        text: 'Meter la mano',
        outcomes: [
          { weight: 2, text: 'Una bolsita de monedas escondida.', effects: [{ kind: 'gold', amount: [5, 25] }] },
          { weight: 1, text: 'Algo adentro te muerde.', effects: [{ kind: 'health', pct: -0.1 }] },
          { weight: 1, text: 'Un paquete envuelto en cuero.', effects: [{ kind: 'zoneMaterial', pool: 'cofre', qty: [1, 2] }] },
        ],
      },
      { text: 'Talarlo (tala 2)', requires: { skill: { id: 'tala', level: 2 } }, outcomes: [{ weight: 1, text: 'Madera seca y dura, de la buena.', effects: [{ kind: 'zoneMaterial', pool: 'arboles', qty: [3, 5] }, { kind: 'energy', amount: -2 }, { kind: 'xp', skill: 'tala', amount: 5 }] }] },
    ],
  },
  {
    id: 'derrumbe', title: 'Un derrumbe reciente', weight: 2, biomes: ['colinas', 'montana', 'ruinas', 'cueva', 'volcan'],
    text: 'Una ladera se vino abajo hace poco. Entre las piedras sueltas asoma roca nueva.',
    options: [
      { text: 'Picar entre las piedras (minería 2)', requires: { skill: { id: 'mineria', level: 2 } }, outcomes: [{ weight: 1, text: 'La roca nueva tiene mineral a la vista.', effects: [{ kind: 'zoneMaterial', pool: 'vetas', qty: [2, 4] }, { kind: 'energy', amount: -2 }, { kind: 'xp', skill: 'mineria', amount: 5 }] }] },
      {
        text: 'Trepar por encima (atajo)',
        outcomes: [
          { weight: 2, text: 'Pasan rápido y ganan tiempo.', effects: [{ kind: 'energy', amount: 3 }] },
          { weight: 1, text: 'Las piedras se mueven: golpes y raspones.', effects: [{ kind: 'health', pct: -0.15 }] },
        ],
      },
      { text: 'Rodearlo con cuidado', outcomes: [{ weight: 1, text: 'Tardan, pero sin sustos.', effects: [{ kind: 'energy', amount: -1 }] }] },
    ],
  },
  {
    id: 'niebla_extrana', title: 'Una niebla extraña', weight: 2, biomes: ['pantano', 'ruinas', 'bosque'], minDanger: 2,
    text: 'Una niebla espesa, que no se mueve con el viento, tapa el paso. Adentro se oyen voces.',
    options: [
      { text: 'Esperar a que se levante', outcomes: [{ weight: 1, text: 'Al rato se disuelve sola.', effects: [{ kind: 'time', slots: 1 }] }] },
      {
        text: 'Cruzarla',
        outcomes: [
          { weight: 2, text: 'Algo los esperaba adentro.', effects: [{ kind: 'fight', budgetMult: 1.1 }] },
          { weight: 2, text: 'Del otro lado, alguien dejó sus cosas al huir.', effects: [{ kind: 'zoneMaterial', pool: 'cofre', qty: [2, 3] }] },
          { weight: 1, text: 'Entre la niebla, un libro abierto sobre una piedra.', effects: [{ kind: 'grimoire' }] },
        ],
      },
    ],
  },
  {
    id: 'altar_ofrendas', title: 'Un altar con ofrendas', weight: 2, biomes: ['ruinas', 'colinas', 'montana', 'bosque'],
    text: 'Un altar viejo, de piedra, con monedas y flores secas encima. Alguien todavía lo cuida.',
    options: [
      { text: 'Dejar una ofrenda (20 de oro)', requires: { gold: 20 }, outcomes: [{ weight: 1, text: 'Sienten un calor tranquilo en el pecho.', effects: [{ kind: 'health', pct: 0.4 }, { kind: 'energy', amount: 4 }] }] },
      {
        text: 'Llevarse las ofrendas',
        outcomes: [
          { weight: 2, text: 'Nadie lo impide.', effects: [{ kind: 'gold', amount: [20, 50] }] },
          { weight: 2, text: 'Los guardianes del altar despiertan.', effects: [{ kind: 'fight', budgetMult: 1.2 }] },
        ],
      },
      { text: 'Seguir con respeto', outcomes: [{ weight: 1, text: 'Inclinan la cabeza al pasar.', effects: [] }] },
    ],
  },
  {
    id: 'panal', title: 'Un panal silvestre', weight: 2, biomes: ['pradera', 'bosque'],
    text: 'Un zumbido grave sale de una piedra partida: adentro hay un panal enorme, chorreando miel.',
    options: [
      { text: 'Sacar la miel con humo (siega 2)', requires: { skill: { id: 'siega', level: 2 } }, outcomes: [{ weight: 1, text: 'Las abejas se adormecen. Miel y cera para todos.', effects: [{ kind: 'zoneMaterial', pool: 'hierbas', qty: [2, 3] }, { kind: 'health', pct: 0.15 }] }] },
      { text: 'Sacarla a mano', outcomes: [{ weight: 1, text: 'Picaduras por todos lados, pero algo se llevan.', effects: [{ kind: 'zoneMaterial', pool: 'hierbas', qty: [1, 2] }, { kind: 'health', pct: -0.15 }] }] },
      { text: 'Dejarlas tranquilas', outcomes: [{ weight: 1, text: 'El zumbido queda atrás.', effects: [] }] },
    ],
  },
  {
    id: 'grieta_humeante', title: 'Una grieta humeante', weight: 3, biomes: ['volcan', 'cueva'],
    text: 'De una grieta en el suelo sale un vapor caliente. Los bordes están cubiertos de cristales.',
    options: [
      {
        text: 'Arrancar los cristales',
        outcomes: [
          { weight: 2, text: 'Salen enteros, todavía tibios.', effects: [{ kind: 'zoneMaterial', pool: 'gemas', qty: [1, 2] }, { kind: 'health', pct: -0.1 }] },
          { weight: 1, text: 'El vapor quema más de lo que parecía.', effects: [{ kind: 'health', pct: -0.25 }] },
        ],
      },
      { text: 'Juntar la roca de los bordes', outcomes: [{ weight: 1, text: 'Roca fundida y vuelta a enfriar: buen mineral.', effects: [{ kind: 'zoneMaterial', pool: 'vetas', qty: [1, 3] }, { kind: 'energy', amount: -1 }] }] },
    ],
  },
];
