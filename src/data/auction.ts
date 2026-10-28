import type { AuctionLotDef, BidderDef } from '../core/town/types';

// Lotes de la gran subasta: materiales que no llegan al mercado, grimorios y planos raros,
// y piezas con historia. Los `unique` salen una sola vez por partida.
export const AUCTION_LOTS: AuctionLotDef[] = [
  { id: 'l_opalos', name: 'Dos ópalos lunares', source: { kind: 'material', id: 'opalo_lunar', qty: 2 }, base: 120, weight: 2, description: 'Gemas que brillan solas de noche.' },
  { id: 'l_cristal', name: 'Cristales de viento', source: { kind: 'material', id: 'cristal_viento', qty: 3 }, base: 80, weight: 2, description: 'Tres cristales que zumban si los acercás al oído.' },
  { id: 'l_brasalita', name: 'Barras de brasalita', source: { kind: 'material', id: 'brasalita', qty: 6 }, base: 70, weight: 3, description: 'Metal que guarda el calor de la fragua.' },
  { id: 'l_albino', name: 'Pelajes de lobo albino', source: { kind: 'material', id: 'pelaje_albino', qty: 2 }, base: 90, weight: 1.5, description: 'Blancos como la nieve. Muy buscados.' },
  { id: 'l_corona', name: 'Corona de colmillos', source: { kind: 'material', id: 'corona_colmillos', qty: 1 }, base: 110, weight: 1, minDay: 7, description: 'Trofeo de un jefe goblin de otra comarca.' },
  { id: 'l_nucleos', name: 'Núcleos de gelín', source: { kind: 'material', id: 'nucleo_gelin', qty: 3 }, base: 75, weight: 2, description: 'El corazón cristalino de los gelines grandes.' },
  { id: 'l_tormenta', name: 'Esencias de tormenta', source: { kind: 'material', id: 'esencia_tormenta', qty: 2 }, base: 95, weight: 1.5, description: 'Destiladas por un alquimista que ya no las vende.' },
  { id: 'l_rubies', name: 'Rubíes de la costa', source: { kind: 'material', id: 'rubi', qty: 3 }, base: 100, weight: 1.5, description: 'Tres rubíes tallados en Puertoseco.' },
  { id: 'l_zafiros', name: 'Zafiros del norte', source: { kind: 'material', id: 'zafiro', qty: 3 }, base: 100, weight: 1.5, description: 'Fríos al tacto, incluso al sol.' },
  { id: 'l_tratado', name: 'Tratado del Fuego Vivo', source: { kind: 'grimoire', id: 'tratado_fuego_vivo' }, base: 90, weight: 1, description: 'Una copia gastada, pero completa.' },
  { id: 'l_tormentas', name: 'Libro de las Tormentas', source: { kind: 'grimoire', id: 'libro_tormentas' }, base: 190, weight: 0.8, unique: true, minDay: 7, description: 'Un grimorio que no se consigue en ninguna librería del valle.' },
  { id: 'l_mandoble', name: 'Plano: Mandoble', source: { kind: 'blueprint', id: 'mandoble' }, base: 140, weight: 1, unique: true, description: 'Los planos de las espadas de dos manos de la vieja guardia.' },
  { id: 'l_lucero', name: 'Plano: Lucero del alba', source: { kind: 'blueprint', id: 'lucero_alba' }, base: 130, weight: 1, unique: true, description: 'Una maza con púas que usaban los vigías de la muralla.' },
  { id: 'l_cota', name: 'Plano: Cota de malla', source: { kind: 'blueprint', id: 'cota_malla' }, base: 150, weight: 0.8, unique: true, minDay: 10, description: 'El secreto de las anillas remachadas.' },
  {
    id: 'l_espada_arevalo', name: 'Espada del capitán Arévalo', unique: true, weight: 0.8, minDay: 7, base: 260,
    source: { kind: 'item', name: 'Espada del capitán Arévalo', blueprint: 'espada_larga', materials: { hoja: 'acero', guarda: 'plata', mango: 'cuero_endurecido', pomo: 'rubi' }, quality: 85, traits: ['filo_agudo', 'critico'], enchantments: ['runa_llama'], finish: ['grabado_blason'] },
    description: 'Defendió el puente de Valdebrasa hace cuarenta años. Todavía corta.',
  },
  {
    id: 'l_peto_guardia', name: 'Peto de la Vieja Guardia', unique: true, weight: 0.8, base: 200,
    source: { kind: 'item', name: 'Peto de la Vieja Guardia', blueprint: 'peto', materials: { placas: 'acero', forro: 'cuero_endurecido' }, quality: 80, traits: ['reforzada'] },
    description: 'Abollado en tres guerras y nunca atravesado.',
  },
  {
    id: 'l_anillo_viuda', name: 'Anillo de la viuda de Arce', unique: true, weight: 0.8, base: 220,
    source: { kind: 'item', name: 'Anillo de la viuda de Arce', blueprint: 'anillo', materials: { aro: 'plata', engarce: 'esmeralda' }, quality: 85, enchantments: ['runa_alivio'] },
    description: 'Dicen que cura a quien lo lleva puesto. Dicen.',
  },
  {
    id: 'l_daga_pliegues', name: 'Daga de los Pliegues', unique: true, weight: 0.8, base: 150,
    source: { kind: 'item', name: 'Daga de los Pliegues', blueprint: 'daga', materials: { hoja: 'acero', guarda: 'plata', mango: 'cuero_curtido' }, quality: 80, traits: ['sangrado'] },
    description: 'La daga de un ladrón famoso. Nunca la encontraron en su cuerpo.',
  },
];

// Postores: cada uno con su estilo, sus gustos y su bolsa. El rival (Ruperto) puja fuerte si te odia.
export const BIDDERS: BidderDef[] = [
  {
    id: 'b_violante', name: 'Doña Violante', npc: 'violante', style: 'caprichoso',
    likes: ['joyeria', 'arma', 'material', 'armadura'], valuation: [1.1, 2.2], budget: [250, 700],
    lines: {
      bid: ['Lo quiero.', 'Subo, naturalmente.', 'Que nadie se atreva.'],
      quit: ['Qué aburrido. Ya no lo quiero.', 'Que se lo quede el plebeyo.'],
      win: ['Envuélvanlo.', 'Como debía ser.'],
    },
  },
  {
    id: 'b_anselmo', name: 'Anselmo el coleccionista', style: 'paciente',
    likes: ['arma', 'joyeria', 'grimoire', 'blueprint', 'escudo', 'armadura'], valuation: [1.15, 1.7], budget: [200, 600],
    lines: {
      bid: ['Un poco más.', 'Mmm. Sigo.', 'Puedo esperar todo el día.'],
      quit: ['No vale tanto. Paso.', 'Mi colección puede esperar.'],
      win: ['Una pieza más para la vitrina.', 'Paciencia: siempre gana.'],
    },
  },
  {
    id: 'b_odalrico', name: 'Odalrico Balanza', npc: 'odalrico', style: 'cauto',
    likes: ['material', 'herramienta', 'municion', 'arrojadizo', 'pocion'], valuation: [0.9, 1.3], budget: [100, 300],
    lines: {
      bid: ['Ofrezco eso, ni una moneda más.', 'Subo un escalón.'],
      quit: ['Los números no cierran. Me retiro.', 'Demasiado para revender.'],
      win: ['Buen margen.', 'Anotado.'],
    },
  },
  {
    id: 'b_ruperto', name: 'Ruperto Malvesta', npc: 'ruperto', style: 'rival',
    likes: ['arma', 'armadura', 'escudo', 'material', 'blueprint'], valuation: [1, 1.5], budget: [150, 450],
    lines: {
      bid: ['Eso no te lo llevás vos.', 'Subo. ¿Y?', 'Ni lo sueñes.'],
      quit: ['Quedátelo. Seguro lo arruinás.', 'Bah.'],
      win: ['¡Ja! Mío.', 'Mirá y aprendé.'],
    },
  },
  {
    id: 'b_teodora', name: 'Teodora Pliegue', npc: 'teodora', style: 'paciente',
    likes: ['grimoire', 'blueprint'], valuation: [1, 1.5], budget: [120, 350],
    lines: {
      bid: ['Ese libro tiene que estar en mi estante.', 'Subo, con dolor.'],
      quit: ['Me gana el corazón, pero no la bolsa.', 'Otro día.'],
      win: ['Qué alegría. Qué alegría.', 'Bienvenido a casa, pequeño.'],
    },
  },
  {
    id: 'b_braulio', name: 'Capitán Tizón', npc: 'braulio', style: 'cauto',
    likes: ['arma', 'escudo', 'armadura'], valuation: [0.8, 1.2], budget: [80, 220],
    lines: {
      bid: ['Para la guardia. Subo.', 'Es lo que puedo.'],
      quit: ['No me da el presupuesto.', 'La ciudad no paga tanto.'],
      win: ['La guardia te lo agradece.', 'Bien.'],
    },
  },
  {
    id: 'b_encapuchada', name: 'Una figura encapuchada', style: 'impulsivo',
    likes: ['arma', 'joyeria', 'grimoire', 'blueprint', 'material', 'armadura', 'escudo', 'distancia', 'runa'], valuation: [1, 2.5], budget: [100, 900],
    lines: {
      bid: ['...', '(levanta la mano en silencio)', 'Más.'],
      quit: ['(se levanta y se va sin decir nada)', '...'],
      win: ['(deja una bolsa de oro y desaparece)', '...'],
    },
  },
  {
    id: 'b_bastian', name: 'Bastián Humo', npc: 'bastian', style: 'impulsivo',
    likes: ['material', 'pocion', 'grimoire'], valuation: [0.9, 1.6], budget: [60, 250],
    lines: {
      bid: ['¡Subo! ¡Subo!', '¡Eso va directo al caldero!'],
      quit: ['Uy, me quedé sin monedas. Otra vez.', '¡Bah, lo destilo yo mismo!'],
      win: ['¡Mío! ¡Qué emoción!', '¡Ja! ¡A experimentar!'],
    },
  },
];
