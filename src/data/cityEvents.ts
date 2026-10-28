import type { CityEventDef } from '../core/town/types';

// Eventos de ciudad: se anuncian en el tablón, duran varios días y cambian la demanda,
// los precios y quién entra a la tienda. Algunos piden tomar partido.
export const CITY_EVENTS: CityEventDef[] = [
  {
    id: 'torneo', name: 'Torneo de la Brasa', weight: 2, duration: [3, 4], minDay: 4,
    text: 'Caballeros y aventureros llegan para el torneo anual. Todos quieren lucirse con equipo nuevo.',
    demand: { arma: 1.4, escudo: 1.3, armadura: 1.25 }, customers: { aventurero: 1.6, noble: 1.4 },
  },
  {
    id: 'festival', name: 'Festival de la Cosecha', weight: 2, duration: [2, 3],
    text: 'Guirnaldas, música y nobles paseando por la plaza con la bolsa abierta.',
    demand: { joyeria: 1.5, pocion: 1.2 }, customers: { noble: 1.8, coleccionista: 1.5, mago: 1.3 },
  },
  {
    id: 'plaga_gelines', name: 'Plaga de gelines', weight: 2, duration: [3, 5],
    text: 'Los gelines invadieron los trigales. Los cazadores y la guardia compran flechas y pociones.',
    demand: { municion: 1.5, arrojadizo: 1.4, pocion: 1.3 }, customers: { cazador: 1.5, guardia: 1.3 },
    prices: { tags: ['slime'], mult: 0.6 },
  },
  {
    id: 'escasez_mineral', name: 'Huelga en la Cantera Gris', weight: 1.5, duration: [3, 5], minDay: 3,
    text: 'Los mineros pararon: piden mejor paga. El metal escasea y sube de precio.',
    demand: { herramienta: 1.3 }, prices: { types: ['metal'], mult: 1.5 },
    choice: {
      prompt: 'Los mineros juntan firmas en el tablón. Ilse dice que la huelga le arruina el negocio.',
      options: [
        { text: 'Firmar el petitorio de los mineros', effects: [{ type: 'reputation', delta: 3 }, { type: 'relation', npc: 'ilse', delta: -5 }], result: 'Los mineros te aplauden. Ilse te mira de reojo.' },
        { text: 'Comprarle a Ilse el metal que trae de afuera', effects: [{ type: 'relation', npc: 'ilse', delta: 6 }, { type: 'reputation', delta: -2 }], result: 'Ilse te guiña un ojo. Algunos mineros murmuran.' },
      ],
    },
  },
  {
    id: 'caravana_este', name: 'Caravana del Este', weight: 2, duration: [2, 3],
    text: 'Llegó una caravana cargada de gemas y mercaderes con ganas de comprar.',
    demand: { herramienta: 1.2, joyeria: 1.2 }, customers: { mercader: 2 }, prices: { types: ['gema'], mult: 0.7 },
  },
  {
    id: 'goblins_camino', name: 'Goblins en el camino', weight: 1.5, duration: [3, 4], minDay: 5,
    text: 'Una banda goblin asalta las carretas en el camino del este. La guardia pide refuerzos.',
    demand: { arma: 1.3, municion: 1.3, escudo: 1.2 }, customers: { guardia: 1.6, aventurero: 1.3 },
    choice: {
      prompt: 'El capitán Tizón pide ayuda a los artesanos de la ciudad.',
      options: [
        { text: 'Donar 40 de oro para la guardia', conditions: [{ type: 'gold', min: 40 }], effects: [{ type: 'gold', delta: -40 }, { type: 'relation', npc: 'braulio', delta: 8 }, { type: 'reputation', delta: 4 }], result: 'Braulio te estrecha la mano frente a la guardia.' },
        { text: 'Cobrarles a precio de guerra', effects: [{ type: 'gold', delta: 60 }, { type: 'relation', npc: 'braulio', delta: -5 }], result: 'Ganás buen dinero. Braulio no lo olvida.' },
      ],
    },
  },
  {
    id: 'boda_arce', name: 'Boda en la casa de Arce', weight: 1, duration: [3, 4], minDay: 6,
    text: 'La casa de Arce casa a su heredera. Toda la nobleza del valle está en la ciudad.',
    demand: { joyeria: 1.6, arma: 1.2 }, customers: { noble: 2, coleccionista: 1.4 },
    choice: {
      prompt: 'Doña Violante espera regalos de todos los artesanos de la ciudad.',
      options: [
        { text: 'Mandar un regalo de bodas (30 de oro)', conditions: [{ type: 'gold', min: 30 }], effects: [{ type: 'gold', delta: -30 }, { type: 'relation', npc: 'violante', delta: 8 }, { type: 'reputation', delta: 2 }], result: 'Violante te agradece con una nota perfumada.' },
        { text: 'No mandar nada', effects: [{ type: 'relation', npc: 'violante', delta: -4 }], result: 'Violante toma nota de quién no mandó regalo.' },
      ],
    },
  },
  {
    id: 'inspeccion_gremio', name: 'Inspección del gremio', weight: 1, duration: [2, 3], minDay: 5,
    text: 'Un inspector del gremio revisa los talleres: quiere ver calidad, no excusas.',
    customers: { aventurero: 0.8 },
    choice: {
      prompt: 'El inspector quiere visitar tu taller.',
      options: [
        { text: 'Mostrarle tu mejor trabajo', effects: [{ type: 'relation', npc: 'aldana', delta: 5 }, { type: 'reputation', delta: 2 }], result: 'El inspector anota algo con cara seria. Aldana te felicita después.' },
        { text: 'Quejarte de la burocracia en la taberna', effects: [{ type: 'relation', npc: 'aldana', delta: -5 }, { type: 'relation', npc: 'rulfa', delta: 3 }], result: 'Rulfa te sirve otra cerveza. Aldana se entera.' },
      ],
    },
  },
  {
    id: 'lluvias', name: 'Lluvias torrenciales', weight: 1.5, duration: [2, 3],
    text: 'Llueve sin parar. Poca gente en la calle; la madera seca escasea.',
    demand: { herramienta: 0.85 }, customers: { aventurero: 0.7, cazador: 0.7, noble: 0.6 }, prices: { types: ['madera'], mult: 1.3 },
  },
  {
    id: 'magos_academia', name: 'Visita de la Academia', weight: 1.5, duration: [2, 4], minDay: 5,
    text: 'Un grupo de magos de la Academia recorre el valle buscando joyas, runas y pociones.',
    demand: { joyeria: 1.3, runa: 1.5, pocion: 1.3 }, customers: { mago: 2.5 },
  },
  {
    id: 'ruperto_precios', name: 'Ruperto baja los precios', weight: 1, duration: [3, 4], minDay: 6,
    text: 'Ruperto Malvesta liquida espadas y petos a precio de costo para quitarte clientes.',
    demand: { arma: 0.8, armadura: 0.85 },
    choice: {
      prompt: 'Todo el mercado habla de la guerra de precios entre las dos herrerías.',
      options: [
        { text: 'Ir a hablar con Ruperto', effects: [{ type: 'relation', npc: 'ruperto', delta: 6 }], result: 'Ruperto gruñe, pero acepta un trago. Parece que la guerra se enfría.' },
        { text: 'Contestarle en la plaza', effects: [{ type: 'relation', npc: 'ruperto', delta: -8 }, { type: 'reputation', delta: 3 }], result: 'La plaza se ríe de tu respuesta. Ruperto no.' },
      ],
    },
  },
  {
    id: 'gran_caceria', name: 'Gran cacería de otoño', weight: 1.5, duration: [3, 4],
    text: 'Empieza la temporada de caza. Los cazadores quieren arcos, flechas y cuchillos.',
    demand: { distancia: 1.4, municion: 1.5, herramienta: 1.15 }, customers: { cazador: 1.8 },
    prices: { tags: ['bestia'], mult: 0.75 },
  },
  {
    id: 'incendio_puerto', name: 'Incendio en el barrio bajo', weight: 0.8, duration: [2, 3], minDay: 8,
    text: 'Un incendio arrasó varias casas del barrio bajo. Hace falta reconstruir.',
    demand: { herramienta: 1.4 },
    choice: {
      prompt: 'Los vecinos piden ayuda para reconstruir.',
      options: [
        { text: 'Donar 4 de hierro para los herrajes', conditions: [{ type: 'hasMaterial', id: 'hierro', qty: 4 }], effects: [{ type: 'takeMaterial', id: 'hierro', qty: 4 }, { type: 'reputation', delta: 5 }, { type: 'relation', npc: 'mirta', delta: 4 }], result: 'Los vecinos no se olvidan de quién ayudó.' },
        { text: 'Seguir con lo tuyo', effects: [], result: 'La vida sigue. Algunos lo notan.' },
      ],
    },
  },
];
