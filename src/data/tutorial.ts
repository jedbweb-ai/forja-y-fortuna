import type { TipDef, TutorialStepDef } from '../core/tutorial/types';

// La guía de primeros pasos y los consejos de una sola vez. Habla Anselmo, el viejo herrero que te dejó el taller,
// a través de las notas que escribió en el Libro del herrero.

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'forjar', title: 'Forjá tu primera pieza',
    text: 'Andá al yunque y forjá algo simple, una daga de hierro. Cada golpe sube la calidad, pero también el riesgo de un defecto: cuando el riesgo se ponga feo, frená. Una pieza decente vale más que una arruinada.',
    done: 'Tu primera pieza. Fea o linda, ya es tuya. Así empecé yo también.',
    reward: { gold: 20 },
  },
  {
    id: 'vender', title: 'Vendé en tu tienda',
    text: 'Lo que forjás queda en la vidriera. Atendé la tienda: cada cliente ofrece algo y vos pedís más. Si apretás de más, se va; si aflojás de entrada, regalás la plata. Mirá su cara.',
    done: 'Primera venta. El oro entra de a poco, pero entra.',
    reward: { materials: [{ id: 'hierro', qty: 3 }] },
  },
  {
    id: 'comprar', title: 'Comprá materiales',
    text: 'Sin materiales no hay forja. En el mercado de la plaza, Ilse vende metales, maderas y cueros. Los precios cambian según el día y la demanda: comprá cuando esté barato.',
    done: 'Bien. Un herrero con el depósito vacío es un herrero de brazos cruzados.',
    reward: { gold: 15 },
  },
  {
    id: 'charlar', title: 'Hablá con un vecino',
    text: 'En la taberna o en el mercado hay gente que vale la pena conocer. Charlar y hacer regalos sube la relación, y una buena relación abre puertas: descuentos, encargos, secretos del oficio.',
    done: 'La gente del pueblo te va a ir conociendo. No te olvides de ellos.',
    reward: { gold: 10 },
  },
  {
    id: 'encargo', title: 'Aceptá un encargo',
    text: 'En el tablón de anuncios hay pedidos: piezas para forjar, materiales para juntar o bichos para cazar. Cumplirlos da oro y, sobre todo, reputación en la ciudad, que trae mejores clientes.',
    done: 'Palabra dada, palabra cumplida: así se hace un nombre.',
    reward: { gold: 15, materials: [{ id: 'pino', qty: 3 }] },
  },
  {
    id: 'expedicion', title: 'Salí de expedición',
    text: 'Lo mejor no se compra: se junta. Desde la herrería, salí al mapa del mundo y elegí una zona cercana. Allá podés recolectar y vas a tener que pelear. Llevá algo forjado por vos y volvé antes de quedarte sin energía.',
    done: 'Volviste entero, que es lo importante. Lo que trajiste vale más que el oro.',
    reward: { gold: 25 },
  },
  {
    id: 'dormir', title: 'Descansá',
    text: 'Cada día tiene mañana, tarde y noche, y casi todo gasta una franja: forjar, atender, salir. El tiempo es lo que más vale en este oficio. De noche, dormí en la herrería y arrancá el día siguiente con fuerza.',
    done: 'Un día menos, un día más de oficio. Mañana se sigue.',
    reward: { gold: 15 },
  },
];

/** Lo que dice el maestro al terminar los primeros pasos. */
export const TUTORIAL_END = 'Ya sabés lo básico. El resto lo vas a descubrir solo: mazmorras viejas, la gran subasta, compañeros que pelean a tu lado y gente que te atiende el taller. Cuando dudes, abrí el libro. — Anselmo';

export const TIPS: TipDef[] = [
  {
    id: 'bienvenida', title: 'Una carta en el yunque',
    text: 'Si estás leyendo esto, el taller ya es tuyo. No te dejo mucho: un yunque, una fragua, algunas deudas de reputación y estas notas. Te voy a ir diciendo qué hacer, en el orden que quieras. Arriba a la izquierda vas a ver la próxima tarea. — Anselmo',
  },
  { id: 'combate', title: 'Pelear', text: 'Se pelea por turnos: tocá una casilla para moverte y después elegí una acción del arma. Atacar de costado o por la espalda pega más. Las pociones del cinturón salvan vidas: no las guardes para siempre.' },
  { id: 'mazmorra', title: 'Las mazmorras', text: 'Una mazmorra se baja piso por piso. Entre piso y piso podés descansar o volver a casa. Mirá con «Examinar» antes de pisar algo raro: hay trampas. En el fondo espera un jefe, y a veces tesoros que no existen en ningún otro lado.' },
  { id: 'subasta', title: 'La gran subasta', text: 'Cada siete días hay subasta. Se anuncia unos días antes en el tablón. Podés pujar por rarezas o dejar piezas tuyas en consignación para que las vendan. Las pujas suben rápido: decidí antes hasta dónde vas.' },
  { id: 'esclavos', title: 'El mercado de esclavos', text: 'Acá se compran compañeros que no cobran sueldo, pero que no confían en vos. Con poca lealtad rinden menos y hasta pueden escaparse. Tratalos bien: equipo, charlas y victorias. Liberarlos les da lealtad total, pero empiezan a cobrar.' },
  { id: 'mercenarios', title: 'Mercenarios', text: 'En la taberna hay gente que pelea por plata. Cobran un sueldo cada día; si no les pagás, se van. Equipalos con lo que forjás: pelean mejor y vos aprendés qué funciona.' },
  { id: 'runas', title: 'La mesa de runas', text: 'En la mesa de runas se graban runas con golpes de cincel, como en el yunque. Después se gastan en el último paso de la forja para encantar una pieza. Cada runa sirve para una sola pieza.' },
  { id: 'joyeria', title: 'La mesa de joyería', text: 'Anillos, amuletos y talismanes se hacen acá, con metales finos y gemas. No pegan ni protegen mucho, pero dan efectos que ninguna espada da. Los nobles y los magos pagan bien por ellas.' },
  { id: 'alquimia', title: 'La mesa de alquimia', text: 'Con hierbas y reactivos se preparan pociones. Algunas recetas se conocen; otras se descubren probando combinaciones. Lo que preparás va al cinturón del grupo para las expediciones, o se vende.' },
  { id: 'talentos', title: 'Talentos', text: 'Cada vez que sube de nivel una habilidad (herrería, comercio, combate…) ganás un punto para esa habilidad. Gastalo en un talento: piezas de más calidad, mejores precios, más carga en las expediciones.' },
  { id: 'taller', title: 'Mejorar el taller', text: 'Con oro y materiales se mejora el taller: un yunque mejor, más vitrinas, decoración que atrae nobles, lugar para más gente trabajando. Son caras, pero son para siempre.' },
  { id: 'personal', title: 'Tu personal', text: 'Los compañeros comprados y los empleados que contratás en el tablón pueden trabajar en el taller mientras no estás: vender, armar la vidriera o forjar los pedidos que les dejes. Aprenden con el tiempo. Los mercenarios no: ellos solo pelean.' },
  { id: 'local', title: 'Un local en venta', text: 'Si lo comprás, es tu taller en esta ciudad: con su vidriera, su gente y los clientes de acá. No se forja en él, pero tu aprendiz sí. Pide reputación en la ciudad: primero hacete conocer.' },
  { id: 'viajes', title: 'Viajar', text: 'Hay otras ciudades, con otros clientes, otros materiales y otros precios. El viaje lleva varias franjas y en el camino puede salir algo. Lo que no se vende acá, a lo mejor allá vale el doble.' },
  { id: 'reparar', title: 'Reparar', text: 'Las armas y armaduras se gastan peleando. Repararlas en el yunque sale barato y te salva de que se rompan en el peor momento.' },
];
