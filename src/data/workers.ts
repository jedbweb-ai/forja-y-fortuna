import type { WorkerDef, WorkTraitDef } from '../core/staff/types';
import type { Dialogue, Npc } from '../core/types';

// Personal de la herrería: rasgos de trabajo y los empleados que se contratan en el tablón de cada ciudad.

const t = (oficio: WorkTraitDef['oficio'], id: string, name: string, effect: WorkTraitDef['effect'], description: string, negative = false): WorkTraitDef =>
  ({ id, oficio, name, effect, description, negative });

export const WORK_TRAITS: WorkTraitDef[] = [
  // Ventas
  t('ventas', 'lengua_plata', 'Lengua de plata', { precio: 6 }, 'Convence a los clientes de pagar un 6% más.'),
  t('ventas', 'don_gente', 'Don de gente', { clientes: 1 }, 'Atrae un cliente más por franja.'),
  t('ventas', 'regateo_fino', 'Regateo fino', { precio: 4 }, 'Sabe hasta dónde apretar: un 4% más por venta.'),
  t('ventas', 'vendedor_nato', 'Vendedor nato', { precio: 3, clientes: 1 }, 'Un 3% más por venta y un cliente más por franja.'),
  // Criterio
  t('criterio', 'olfato', 'Olfato para la demanda', { vidriera: 2 }, 'Arma la vidriera como si tuviera dos niveles más de Criterio.'),
  t('criterio', 'buen_ojo', 'Buen ojo', { vidriera: 1, aprende: 10 }, 'Elige mejor qué exhibir y aprende un 10% más rápido.'),
  t('criterio', 'administrador', 'Administrador', { ahorro: 0.1 }, 'Cuida los materiales: una de cada diez piezas no gasta los suyos.'),
  t('criterio', 'ordenado', 'Ordenado', { rinde: 10 }, 'Rinde un 10% más en cualquier puesto.'),
  // Forja
  t('forja', 'ojo_acero', 'Ojo para el acero', { calidadEn: { categories: ['arma', 'distancia'], value: 8 } }, '+8 de calidad en armas.'),
  t('forja', 'placas_parejas', 'Placas parejas', { calidadEn: { categories: ['armadura', 'escudo'], value: 8 } }, '+8 de calidad en armaduras y escudos.'),
  t('forja', 'flechero', 'Flechero', { lote: 25 }, 'Un 25% más de unidades por lote de flechas y arrojadizos.'),
  t('forja', 'manos_rapidas', 'Manos rápidas', { rinde: 25 }, 'Trabaja un 25% más rápido.'),
  t('forja', 'pulso_seguro', 'Pulso seguro', { defecto: -0.02 }, 'Menos riesgo de defecto en cada golpe.'),
  t('forja', 'buen_temple', 'Buen temple', { calidad: 5 }, '+5 de calidad en todas las piezas.'),
  // De nacimiento
  t('general', 'madrugador', 'Madrugador', { manana: 40 }, 'Rinde un 40% más a la mañana.'),
  t('general', 'trasnochador', 'Trasnochador', { noche: true }, 'Sigue trabajando de noche, a la mitad.'),
  t('general', 'aprende_rapido', 'Aprende rápido', { aprende: 50 }, 'Gana un 50% más de experiencia.'),
  t('general', 'ahorrativo', 'Ahorrativo', { ahorro: 0.12 }, 'A veces una pieza no gasta sus materiales.'),
  t('general', 'distraido', 'Distraído', { defecto: 0.03, rinde: -10 }, 'Se distrae: más defectos y rinde un 10% menos.', true),
  t('general', 'charlatan', 'Charlatán', { precio: -5, clientes: 1 }, 'Atrae gente, pero regala un 5% en cada venta.', true),
  t('general', 'perezoso', 'Perezoso', { tarde: -30 }, 'Después de comer rinde un 30% menos.', true),
];

export const WORKERS: WorkerDef[] = [
  {
    id: 'benita', name: 'Benita Arcilla', title: 'Vendedora de mercado', wage: 7, hireCost: 40,
    oficios: { ventas: 3, criterio: 1, forja: 1 }, traits: ['lengua_plata', 'charlatan'],
    look: { body: 0xb5533c, hair: 0x6b3a22, accent: 0xe8c56a },
    quote: 'Yo te vendo un balde agujereado y el cliente se va contento.',
    description: 'Veinte años vendiendo en el mercado a los gritos. Habla hasta por los codos y vende cualquier cosa.',
  },
  {
    id: 'tobias', name: 'Tobías Hollín', title: 'Aprendiz de herrero', wage: 8, hireCost: 45,
    oficios: { ventas: 1, criterio: 1, forja: 3 }, traits: ['ojo_acero', 'distraido'],
    look: { body: 0x4e5a63, hair: 0x2b2018, accent: 0xc0622f },
    quote: 'Las espadas me salen bien. Lo demás, a veces me olvido.',
    description: 'Aprendió en una forja de la frontera que cerró. Tiene buena mano para las armas y la cabeza en las nubes.',
  },
  {
    id: 'leandra', name: 'Leandra Pesas', title: 'Contadora', wage: 9, hireCost: 50,
    oficios: { ventas: 2, criterio: 3, forja: 1 }, traits: ['olfato', 'ahorrativo'],
    look: { body: 0x3e5e7a, hair: 0x1d1d24, accent: 0xd9d1b8 },
    quote: 'Decime qué se vendió la semana pasada y te digo qué exhibir esta.',
    description: 'Llevaba los libros de un mercader de telas. Sabe qué se vende antes de que se venda.',
  },
  {
    id: 'gaspar', name: 'Gaspar Mimbre', title: 'Muchacho de los mandados', wage: 3, hireCost: 15,
    oficios: { ventas: 1, criterio: 1, forja: 1 }, traits: ['aprende_rapido', 'madrugador'],
    look: { body: 0x6b8a3a, hair: 0xc9a14a, accent: 0x8a5a3a },
    quote: '¡Hago lo que sea! Bueno, casi todo. Pero aprendo rápido.',
    description: 'Un pibe del pueblo con ganas de aprender un oficio. No sabe nada, pero cobra poco y aprende rápido.',
  },
  {
    id: 'celina', name: 'Celina Brasa', title: 'Herrera de oficio', wage: 14, hireCost: 90,
    oficios: { ventas: 1, criterio: 2, forja: 4 }, traits: ['placas_parejas', 'pulso_seguro'],
    look: { body: 0x7a3a2e, hair: 0x9a2f1e, accent: 0x5a5a5a },
    quote: 'Tuve mi propia forja. Ahora trabajo en la tuya. No me hagas arrepentir.',
    description: 'Una herrera con años de yunque. Perdió su taller por deudas y no le gusta hablar de eso.',
  },
  {
    id: 'mateo', name: 'Mateo Ruda', title: 'Flechero', wage: 8, hireCost: 40,
    oficios: { ventas: 1, criterio: 1, forja: 2 }, traits: ['flechero', 'manos_rapidas'],
    look: { body: 0x5a6a3a, hair: 0x4a3020, accent: 0xb89a5a },
    quote: 'Dame plumas, madera y una tarde, y te lleno un carcaj entero.',
    description: 'Hacía flechas para los cazadores del bosque. Rápido como pocos.',
  },
  {
    id: 'olimpia', name: 'Olimpia Saya', title: 'Dependienta de buena familia', wage: 11, hireCost: 70,
    oficios: { ventas: 2, criterio: 2, forja: 1 }, traits: ['don_gente', 'perezoso'],
    look: { body: 0x7a4a8a, hair: 0xe0c070, accent: 0xf0e0d0 },
    quote: 'Los nobles me conocen. Y yo sé qué les gusta.',
    description: 'Hija de una familia venida a menos. Encantadora con los clientes, aunque después de comer se le cierran los ojos.',
  },
  {
    id: 'rufo', name: 'Rufo Teja', title: 'Viejo comerciante', wage: 10, hireCost: 60,
    oficios: { ventas: 3, criterio: 3, forja: 1 }, traits: ['buen_ojo', 'trasnochador'],
    look: { body: 0x6a5a4a, hair: 0xd8d8d0, accent: 0x3a5a4a },
    quote: 'Vendí de todo en tres ciudades. Me queda una venta más en el cuerpo.',
    description: 'Un comerciante retirado que se aburre en su casa. No duerme mucho y conoce el negocio de memoria.',
  },
];

export const WORKER_NPCS: Npc[] = WORKERS.map((w) => ({
  id: w.id, name: w.name, role: `Empleado · ${w.title}`, city: 'valdebrasa', location: 'herreria',
  personality: [],
  gifts: {},
  // Su lugar real lo decide el estado: en tu herrería si trabaja ahí.
  routine: { 'mañana': 'herreria', tarde: 'herreria', noche: 'herreria' },
  look: w.look,
  busyLines: ['Estoy trabajando.', 'Después hablamos, que hay clientes.'],
  description: w.description,
}));

export const WORKER_DIALOGUES: Dialogue[] = WORKERS.map((w) => ({
  id: `${w.id}_hola`, npc: w.id, priority: 10, once: true, start: 'a',
  nodes: {
    a: {
      id: 'a', speaker: w.id, text: w.quote,
      options: [
        { text: 'Bienvenido al taller.', effects: [{ type: 'relation', npc: w.id, delta: 3 }] },
        { text: 'A trabajar.' },
      ],
    },
  },
}));
