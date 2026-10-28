import type { CustomerType } from '../core/types';

export const CUSTOMER_TYPES: CustomerType[] = [
  {
    id: 'aventurero', name: 'Aventurero', appearance: { 'mañana': 3, tarde: 3, noche: 2 }, minReputation: -50,
    budget: [30, 160], wants: { arma: 3, distancia: 1.5, municion: 2, escudo: 1.5, armadura: 1.5 },
    prefStats: { atk: 1, spd: 0.6 }, likesAffinities: ['fuego', 'rayo'], minQuality: 15,
    beautyLove: 0.1, patience: 3, generosity: 1.1, bulk: [10, 20],
    lines: {
      greet: ['¡Buenas! Mañana salgo hacia las colinas. ¿Qué tenés?', 'Necesito algo que no se rompa al primer goblin.'],
      noItem: ['Nada de esto me sirve para lo que voy a enfrentar...', 'Vuelvo otro día, a ver si forjaste algo más filoso.'],
      happy: ['¡Trato hecho! Esto me va a salvar el pellejo.', '¡Excelente! Te voy a recomendar en el gremio.'],
      angry: ['¿Tanto? Con eso me compro un caballo.', 'Mejor me arreglo con mi espada vieja.'],
    },
  },
  {
    id: 'guardia', name: 'Guardia', appearance: { 'mañana': 2, tarde: 2, noche: 3 }, minReputation: -50,
    budget: [40, 170], wants: { escudo: 3, armadura: 3, arma: 1.5, municion: 1.5 },
    prefStats: { def: 1, dur: 0.6 }, minQuality: 20,
    beautyLove: 0.05, patience: 2, generosity: 1.0, bulk: [10, 20],
    lines: {
      greet: ['El capitán quiere que renovemos el equipo. Mostrame lo sólido.', 'Turno largo esta noche. ¿Algo que aguante?'],
      noItem: ['Esto no pasaría la inspección.', 'Nada que me proteja de verdad. Paso.'],
      happy: ['Bien hecho, herrero. El cuartel va a escuchar de vos.', 'Firme. Me lo llevo.'],
      angry: ['Con el sueldo de guardia, ni en sueños.', 'Eso es un robo, y de robos sé bastante.'],
    },
  },
  {
    id: 'cazador', name: 'Cazador', appearance: { 'mañana': 3, tarde: 2, noche: 1 }, minReputation: -50,
    budget: [15, 100], wants: { distancia: 3, municion: 3.5, herramienta: 1.5, arma: 1 },
    prefStats: { spd: 1, atk: 0.6 }, likesTags: ['cazador', 'trofeo', 'bestia'], minQuality: 10,
    beautyLove: 0, patience: 3, generosity: 0.95, bulk: [10, 30],
    lines: {
      greet: ['Los lobos están bajando del monte. Necesito flechas.', 'Algo liviano para el bosque, si tenés.'],
      noItem: ['Nada para la caza. Qué lástima.', 'Muy pesado todo. El bosque no perdona.'],
      happy: ['Buena pieza. Te traigo un colmillo la próxima.', 'Esto vuela derecho. Gracias.'],
      angry: ['Por ese precio cazo con piedras.', 'Me tomás por noble, ¿eh?'],
    },
  },
  {
    id: 'noble', name: 'Noble', appearance: { 'mañana': 1, tarde: 2, noche: 0 }, minReputation: 5,
    budget: [120, 520], wants: { arma: 3, escudo: 1, armadura: 1.5 },
    prefStats: { atk: 0.4, def: 0.4 }, likesTags: ['noble'], likesAffinities: ['sagrado'], minQuality: 45,
    beautyLove: 1, patience: 2, generosity: 1.35,
    lines: {
      greet: ['Mi sobrino cumple años. Quiero algo... digno de mi casa.', 'Mostradme vuestra mejor obra, artesano.'],
      noItem: ['Qué rústico todo. Buen día.', 'Nada que pueda colgar en mi salón.'],
      happy: ['Exquisito. Pagaré sin rechistar.', 'Por fin un artesano con gusto.'],
      angry: ['¿Me creéis tonto por tener dinero?', 'Insolente. Me retiro.'],
    },
  },
  {
    id: 'mercader', name: 'Mercader', appearance: { 'mañana': 2, tarde: 2, noche: 1 }, minReputation: -50,
    budget: [30, 220], wants: { municion: 2, herramienta: 2.5, arma: 1, escudo: 1 },
    prefStats: { dur: 1 }, minQuality: 10,
    beautyLove: 0.2, patience: 4, generosity: 0.85, bulk: [20, 40],
    lines: {
      greet: ['Compro para revender en la costa. Hablemos números.', 'Busco mercadería que se mueva. ¿Qué me ofrecés?'],
      noItem: ['No le veo salida a esto. Otra vez será.', 'Mis clientes no comprarían esto.'],
      happy: ['Negocio cerrado. Un placer.', 'Con este margen, vuelvo seguro.'],
      angry: ['Así no gano nada. Adiós.', 'Regatear con vos es como regatear con un yunque.'],
    },
  },
  {
    id: 'coleccionista', name: 'Coleccionista', appearance: { 'mañana': 1, tarde: 1, noche: 1 }, minReputation: 15,
    budget: [150, 800], wants: { arma: 2, distancia: 1.5, escudo: 1.5, armadura: 1.5 },
    prefStats: {}, likesTags: ['noble', 'trofeo'], minQuality: 55,
    beautyLove: 0.8, patience: 5, generosity: 1.5,
    lines: {
      greet: ['Oí hablar de vos. Solo me interesan piezas únicas.', 'Busco algo que nadie más tenga.'],
      noItem: ['Correcto, pero común. No es para mi colección.', 'Avisame cuando forjes algo memorable.'],
      happy: ['Una joya. Le haré un lugar especial.', 'Esto va a valer el doble en diez años.'],
      angry: ['Hasta la paciencia de un coleccionista tiene límite.', 'No. Simplemente no.'],
    },
  },
];

export const CUSTOMER_NAMES = [
  'Brina', 'Toribio', 'Asela', 'Corvo', 'Nilda', 'Fermín', 'Ysolde', 'Benigno', 'Maruja', 'Teo',
  'Quila', 'Damián', 'Orla', 'Pancracio', 'Lisandra', 'Ulises', 'Rosalba', 'Gildo', 'Elvira', 'Saúl',
];
