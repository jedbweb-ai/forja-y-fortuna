import type { Content } from '../core/content';
import { AMBIENT_VARIANTS, GUARD_VARIANTS } from '../game/render/variants';

// Lista de todo el arte que usa el juego, armada a partir del contenido.
// Cada entrada trae su clave (nombre del archivo), carpeta, medida del dibujo y el pedido para ChatGPT.
// Medidas y estilo: docs/GUIA_DE_ARTE.md.

export type AssetType = 'personaje' | 'monstruo' | 'jefe' | 'espalda' | 'espalda_monstruo' | 'espalda_jefe' | 'icono' | 'retrato' | 'textura' | 'lado' | 'escenario' | 'edificio' | 'mapa' | 'marcador' | 'animal' | 'muro' | 'decoracion' | 'interior';

export interface AssetEntry {
  key: string;
  type: AssetType;
  /** Subcarpeta de src/assets/arte/. */
  folder: string;
  w: number;
  h: number;
  /** Nombre para mostrar. */
  name: string;
  /** Lo que va entre corchetes en la plantilla del pedido. */
  detail: string;
  /** Grupo para ordenar la lista. */
  group: string;
}

export const BASE_PROMPT = 'Pixel art para un videojuego táctico isométrico de fantasía, estilo anime. Paleta apagada y terrosa, 3 o 4 tonos por color, luz desde arriba a la izquierda, contorno de color oscuro (no negro puro), sin tramado de puntos, planos de color limpios. Fondo plano de un solo color magenta #FF00FF. Sin texto, sin marco, sin sombra en el piso.';

/** Cómo se describe la vista de espalda (la de frente mira abajo a la izquierda; espejando las dos salen las 4 direcciones). */
const BACK = 'de espalda en diagonal en vista isométrica: mirando hacia arriba a la derecha, alejándose de quien mira, de modo que se le ve la espalda y la nuca y no la cara';

const TEMPLATE: Record<AssetType, string> = {
  personaje: 'Un solo personaje chibi de cuerpo entero, de unas 2,5 cabezas de alto, con cabeza y manos grandes, en vista isométrica de frente en diagonal (mirando hacia abajo a la izquierda), parado y quieto, centrado.',
  monstruo: 'Un solo monstruo de cuerpo entero en vista isométrica de frente en diagonal, centrado, dibujado en tonos grises claros y blancos (el color se le agrega en el juego), con los ojos y los detalles oscuros.',
  jefe: 'Un solo monstruo jefe, grande e imponente, de cuerpo entero en vista isométrica de frente en diagonal, centrado, con sus colores definitivos.',
  espalda: `Un solo personaje chibi: el mismo de la imagen adjunta (misma ropa, colores, peinado y proporciones), pero ${BACK}, parado y quieto, centrado.`,
  espalda_monstruo: `Un solo monstruo: el mismo de la imagen adjunta, en los mismos tonos grises claros y blancos, pero ${BACK}, centrado.`,
  espalda_jefe: `Un solo monstruo jefe: el mismo de la imagen adjunta, con sus mismos colores, pero ${BACK}, centrado.`,
  icono: 'Un solo ícono de objeto, chico y muy legible, en diagonal apuntando hacia arriba a la derecha, centrado y ocupando casi todo el cuadro, pensado para verse a 16×16 píxeles.',
  retrato: 'Retrato de busto, de frente y un poco girado, estilo anime con ojos grandes y expresivos, encuadrado de los hombros para arriba, con fondo magenta liso. Pensado para verse a 48×48 píxeles.',
  textura: 'Textura cuadrada vista desde arriba, que se pueda repetir sin costuras en los cuatro lados, con poco contraste para que no distraiga, pensada para verse a 32×32 píxeles. Sin fondo magenta: la textura ocupa todo el cuadro.',
  lado: 'Textura cuadrada de la pared lateral de un escalón de terreno, vista de frente, que se pueda repetir sin costuras a los costados, pensada para verse a 32×32 píxeles. Sin fondo magenta: la textura ocupa todo el cuadro.',
  escenario: 'Un solo objeto de escenario en vista isométrica (rombo de piso de 2:1), centrado, apoyado sobre una casilla.',
  marcador: 'Un solo marcador del mapa del mundo: un dibujito chico y muy legible del lugar, como una maqueta en vista isométrica, apoyado sobre una base de pasto o tierra con forma de rombo, centrado.',
  animal: 'Un solo animal chico de pueblo, de cuerpo entero, en vista isométrica de frente en diagonal (mirando hacia abajo a la izquierda), parado, centrado.',
  muro: 'Textura cuadrada de una pared interior vista de frente, sin perspectiva, que se pueda repetir sin costuras a los costados y arriba y abajo, con poco contraste, pensada para verse a 32×32 píxeles. Sin fondo magenta: la textura ocupa todo el cuadro.',
  decoracion: 'Un solo objeto colgado en una pared, dibujado de frente y plano, sin perspectiva (como si se lo mirara de frente pegado a la pared), centrado.',
  interior: 'Una sola ilustración horizontal de un interior visto desde arriba en diagonal, en vista isométrica, como una maqueta cortada: el piso forma un rombo grande en el centro, se ven las dos paredes del fondo (izquierda y derecha) y no hay paredes adelante. La escena llena toda la imagen: sin fondo magenta y sin marco. Dejá una franja de piso o de calle arriba y abajo, porque se recorta un poco. Sin personas ni animales. Sin texto, letras ni números. Luz cálida de día.',
  edificio: 'Un solo edificio pequeño en vista isométrica, visto desde arriba en diagonal, centrado, con la puerta hacia el frente.',
  mapa: 'Mapa de fantasía en pixel art visto desde muy arriba, levemente inclinado. Colores vivos pero naturales, bosques en manchas espesas, montañas, ríos y caminos de tierra. Sin texto. Sin fondo magenta: el mapa ocupa todo el cuadro.',
};

/** El pedido completo para copiar en ChatGPT. */
export function promptFor(e: AssetEntry): string {
  const tail = e.key.endsWith('_b') ? ' Es el segundo cuadro de la caminata: la misma figura con un pie adelante.' : '';
  return `${BASE_PROMPT}\n\n${TEMPLATE[e.type]} ${e.detail}${tail}`;
}

// ───────────────────────── Modo hoja: varios assets en una sola imagen ─────────────────────────

/** Grilla por defecto (columnas × filas) para cada tipo. */
export const SHEET_GRID: Record<AssetType, [number, number]> = {
  personaje: [3, 3], monstruo: [3, 2], jefe: [2, 1], espalda: [3, 3], espalda_monstruo: [3, 2], espalda_jefe: [2, 1], icono: [4, 4], retrato: [3, 3],
  textura: [3, 2], lado: [3, 2], escenario: [3, 3], edificio: [2, 2], mapa: [1, 1], marcador: [4, 3], animal: [3, 1], muro: [2, 1], decoracion: [4, 3], interior: [1, 1],
};

const SHEET_ITEMS: Record<AssetType, string> = {
  personaje: 'personajes chibi distintos, de cuerpo entero, de unas 2,5 cabezas de alto, con cabeza y manos grandes, en vista isométrica de frente en diagonal (mirando hacia abajo a la izquierda), parados y quietos',
  monstruo: 'monstruos distintos, de cuerpo entero, en vista isométrica de frente en diagonal, dibujados en tonos grises claros y blancos (el color se les agrega en el juego), con los ojos y los detalles oscuros',
  jefe: 'monstruos jefe distintos, grandes e imponentes, de cuerpo entero, en vista isométrica de frente en diagonal, con sus colores definitivos',
  espalda: `personajes chibi distintos, de cuerpo entero, ${BACK}, parados y quietos`,
  espalda_monstruo: `monstruos distintos, de cuerpo entero, ${BACK}, en tonos grises claros y blancos`,
  espalda_jefe: `monstruos jefe distintos, grandes e imponentes, de cuerpo entero, ${BACK}, con sus colores definitivos`,
  icono: 'íconos de objetos distintos, chicos y muy legibles, cada uno en diagonal apuntando hacia arriba a la derecha, pensados para verse a 16×16 píxeles',
  retrato: 'retratos de busto distintos, de frente y un poco girados, estilo anime con ojos grandes y expresivos, encuadrados de los hombros para arriba, pensados para verse a 48×48 píxeles',
  textura: 'texturas cuadradas distintas vistas desde arriba, cada una repetible sin costuras y con poco contraste, pensadas para verse a 32×32 píxeles. Cada textura llena por completo su cuadrado y entre los cuadrados queda una franja magenta',
  lado: 'texturas cuadradas distintas de paredes laterales de escalones de terreno, vistas de frente y repetibles a los costados, pensadas para verse a 32×32 píxeles. Cada textura llena por completo su cuadrado y entre los cuadrados queda una franja magenta',
  escenario: 'objetos de escenario distintos en vista isométrica (rombo de piso de 2:1), cada uno apoyado sobre su casilla',
  marcador: 'marcadores distintos del mapa del mundo: dibujitos chicos y muy legibles de cada lugar, como maquetas en vista isométrica, cada uno apoyado sobre una base de pasto o tierra con forma de rombo',
  animal: 'animales chicos de pueblo distintos, de cuerpo entero, en vista isométrica de frente en diagonal (mirando hacia abajo a la izquierda), parados',
  muro: 'texturas cuadradas distintas de paredes interiores vistas de frente, sin perspectiva, cada una repetible sin costuras y con poco contraste, pensadas para verse a 32×32 píxeles. Cada textura llena por completo su cuadrado y entre los cuadrados queda una franja magenta',
  decoracion: 'objetos distintos colgados en una pared, cada uno dibujado de frente y plano, sin perspectiva (como si se los mirara de frente pegados a la pared)',
  interior: 'interiores',
  edificio: 'edificios pequeños distintos en vista isométrica, vistos desde arriba en diagonal, con la puerta hacia el frente',
  mapa: 'mapas',
};

/** Pedido para una hoja: una sola imagen con todos, en grilla, numerados en el orden en que se cortan. */
export function sheetPromptFor(list: AssetEntry[], cols: number, rows: number, redo = false): string {
  const empty = list.length < cols * rows ? ' Las celdas que sobran quedan vacías, solo con fondo magenta.' : '';
  const ref = isBack(list[0].type)
    ? ` Te adjunto una imagen de referencia con estos mismos ${list.length}, en la misma grilla y el mismo orden, vistos de frente: dibujá exactamente los mismos (misma ropa, colores, peinado, armas y proporciones) y en el mismo lugar de la grilla, pero de espalda.`
    : redo
      ? ` Te adjunto una imagen de referencia con estos mismos ${list.length}, en la misma grilla y el mismo orden, como se ven hoy en baja resolución: redibujalos iguales (misma ropa, colores, forma y proporciones) y en el mismo lugar de la grilla, pero con más detalle y nitidez.`
      : '';
  return `${BASE_PROMPT}\n\nUna sola imagen con ${list.length} ${SHEET_ITEMS[list[0].type]}, ordenados en una grilla pareja de ${cols} columnas por ${rows} filas. `
    + `Cada uno centrado en su celda, todos del mismo tamaño y en el mismo estilo, bien separados entre sí, sin tocarse ni cortarse en los bordes.${empty}${ref} `
    + `En orden, de izquierda a derecha y de arriba a abajo:\n\n${list.map((e, i) => `${i + 1}. ${e.detail}`).join('\n')}`;
}

/** Tipos de vista de espalda y el dibujo de frente del que salen. */
export const isBack = (t: AssetType) => t === 'espalda' || t === 'espalda_monstruo' || t === 'espalda_jefe';
export const frontKey = (key: string) => key.replace(/\.espalda$/, '');

/** Orden en que conviene generar lo que falta: primero lo que más se ve. */
const PRIORITY: AssetType[] = ['interior', 'muro', 'decoracion', 'escenario', 'marcador', 'animal', 'espalda', 'espalda_monstruo', 'espalda_jefe'];

export interface PendingSheet {
  /** Número de hoja, de 1 en adelante, en el orden de PRIORITY. */
  n: number;
  type: AssetType;
  group: string;
  entries: AssetEntry[];
  cols: number;
  rows: number;
}

/** Lo que todavía no tiene arte, repartido en hojas con la grilla de cada tipo (el modo "Pedidos en orden" de la herramienta). */
export function pendingSheets(list: AssetEntry[], hasArt: (key: string) => boolean): PendingSheet[] {
  const out: PendingSheet[] = [];
  const types = [...PRIORITY, ...[...new Set(list.map((e) => e.type))].filter((t) => !PRIORITY.includes(t))];
  for (const type of types) {
    const [cols, rows] = SHEET_GRID[type];
    const pending = list.filter((e) => e.type === type && !hasArt(e.key));
    for (let i = 0; i < pending.length; i += cols * rows) {
      const entries = pending.slice(i, i + cols * rows);
      out.push({ n: out.length + 1, type, group: entries[0].group, entries, cols, rows });
    }
  }
  return out;
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Suelos del juego (tile.<nombre>) y su descripción. */
const FLOORS: Record<string, string> = {
  grass: 'Pasto verde corto con alguna florcita.',
  darkgrass: 'Pasto oscuro de bosque, con hojas caídas.',
  dirt: 'Tierra apisonada marrón con piedritas.',
  road: 'Camino de tierra clara con huellas de carreta.',
  stone: 'Adoquines de piedra gris clara.',
  wood: 'Tablones de madera de un piso interior.',
  wood_dark: 'Tablones de madera oscura de taberna.',
  water: 'Agua azul poco profunda con reflejos.',
  cryptstone: 'Losas de piedra gris violácea de una cripta antigua.',
  cave: 'Roca de cueva marrón oscura y despareja.',
  lava: 'Lava naranja brillante con costra oscura.',
  ash: 'Ceniza volcánica gris oscura con brasas chiquitas.',
};
const SIDES: Record<string, string> = {
  grass: 'Tierra marrón con raíces finas (la pared de un escalón de pasto).',
  dirt: 'Tierra marrón en capas con piedritas.',
  stone: 'Bloques de piedra gris apilados.',
  cryptstone: 'Muro de piedra violácea con grietas.',
  cave: 'Roca de cueva en capas.',
  ash: 'Basalto oscuro con vetas de brasa.',
};

/** Escenario (prop.<nombre>), con su medida de dibujo y descripción. */
const PROPS: Record<string, [number, number, string]> = {
  forge: [32, 36, 'Una fragua de piedra con brasas encendidas y fuelle.'],
  anvil: [24, 20, 'Un yunque de hierro sobre un tronco.'],
  barrel: [16, 20, 'Un barril de madera con aros de hierro.'],
  crate: [24, 22, 'Un cajón de madera.'],
  table: [32, 22, 'Una mesa de madera rústica.'],
  bench: [32, 18, 'Un banco largo de madera.'],
  counter: [32, 26, 'Un mostrador de madera de tienda.'],
  bar: [32, 28, 'La barra de una taberna con jarras.'],
  chest: [24, 20, 'Un arcón de madera con herrajes.'],
  rack: [24, 32, 'Un armero de madera con armas colgadas.'],
  lamp: [12, 36, 'Un farol de calle sobre un poste.'],
  fireplace: [32, 36, 'Una chimenea de piedra encendida.'],
  well: [32, 32, 'Un pozo de piedra con techito de madera.'],
  tree: [32, 48, 'Un árbol frondoso de hojas verdes.'],
  runetable: [32, 26, 'Una mesa de grabar runas con cinceles y piedras brillantes.'],
  jewelbench: [32, 26, 'Un banco de joyero con lupa y gemas.'],
  alchemy: [32, 30, 'Una mesa de alquimia con frascos y un alambique.'],
  shelf: [32, 40, 'Un estante alto con libros y cajas.'],
  potionshelf: [32, 40, 'Un estante con frascos de pociones de colores.'],
  cauldron: [28, 26, 'Un caldero de hierro burbujeando.'],
  board: [32, 40, 'Un tablón de anuncios con papeles clavados.'],
  podium: [32, 32, 'El estrado de un rematador de subastas.'],
  banner: [20, 40, 'Un estandarte de tela colgando de un poste.'],
  tent: [32, 36, 'Una carpa de campamento de lona.'],
  fence: [32, 20, 'Un tramo de cerca de madera.'],
  stall_red: [32, 36, 'Un puesto de mercado con toldo rojo.'],
  stall_blue: [32, 36, 'Un puesto de mercado con toldo azul.'],
  stall_green: [32, 36, 'Un puesto de mercado con toldo verde.'],
  rock: [24, 18, 'Una roca gris redondeada.'],
  vein: [24, 18, 'Una roca con vetas de mineral brillante.'],
  palisade: [24, 24, 'Un tramo de empalizada de troncos afilados.'],
  sign: [16, 22, 'Un cartel de madera clavado en el piso.'],
  stump: [20, 14, 'Un tocón de árbol cortado.'],
  herbs: [20, 14, 'Una mata de hierbas silvestres.'],
  gemrock: [24, 20, 'Una roca con cristales de gema asomando.'],
  cryptwall: [32, 29, 'Un bloque de muro de cripta de piedra violácea.'],
  cavewall: [32, 29, 'Un bloque de pared de roca de cueva.'],
  pillar: [16, 32, 'Una columna de piedra antigua.'],
  stalagmite: [20, 28, 'Una estalagmita de roca.'],
  stairs: [32, 20, 'Una escalera de piedra que baja hacia la oscuridad.'],
  stairsup: [32, 20, 'Una escalera de piedra que sube.'],
  gate: [24, 30, 'Una reja de hierro cerrada.'],
  door: [24, 30, 'Una puerta de madera reforzada.'],
  lever: [16, 20, 'Una palanca de hierro hacia arriba.'],
  lever_on: [16, 20, 'Una palanca de hierro hacia abajo.'],
  inscription: [20, 26, 'Una lápida con una inscripción tallada.'],
  key: [14, 10, 'Una llave de hierro antigua en el piso.'],
  cryptdoor: [32, 28, 'Una puerta de cripta de piedra con relieves.'],
  basalt: [20, 28, 'Una columna de basalto oscuro con una grieta de brasa.'],
  // Interiores
  alfombra: [48, 26, 'Una alfombra rectangular tejida, roja con guarda dorada, plana sobre el piso y vista desde arriba en isométrico (forma de rombo 2:1).'],
  tina: [24, 22, 'Una tina de madera con agua para templar el metal, con aros de hierro y un poco de vapor.'],
  afiladora: [28, 26, 'Una piedra de afilar redonda con pedal, montada en un banco de madera.'],
  lena: [28, 20, 'Una pila de leña cortada, apilada prolija.'],
  sacos: [24, 20, 'Dos o tres sacos de arpillera llenos, uno abierto con carbón.'],
};

/** Cómo se ve cada lugar en su marcador del mapa del mundo. */
const MARKERS: Record<string, string> = {
  valdebrasa: 'un pueblo chico amurallado, con techos de teja roja alrededor de una plaza y un río con un puente.',
  puertoseco: 'un puerto chico: casas blancas de techos naranjas junto al agua, un muelle con un barco de vela y un faro.',
  fuerte_ceniza: 'una fortaleza chica de piedra gris en forma de estrella, con torres y un estandarte rojo.',
  linde_brezal: 'una pradera verde con árboles frondosos al borde de un bosque y un sendero de tierra.',
  montanas_grises: 'dos picos de roca gris con nieve en la punta y un paso entre ellos.',
  pantano_niebla: 'un pantano: agua verdosa, árboles secos retorcidos, hongos que brillan y un poco de niebla.',
  ruinas_vigia: 'las ruinas de una torre de piedra con arcos rotos y una grieta violeta brillante en el suelo.',
  tierras_dragon: 'un volcán chico con lava naranja y un nido de huesos al pie.',
  cripta_vigia: 'la entrada a una cripta: una puerta de piedra en la ladera de una colina, entre dos columnas.',
  cuevas_eco: 'la boca de una cueva oscura en una pared de roca, con cristales azules brillando adentro.',
};

/** Paredes de los interiores (tex.muro.<nombre>): madera clara en tiendas y talleres, oscura en tabernas y salones. */
const WALLS: Record<string, string> = {
  claro: 'Pared de revoque color crema con vigas de madera marrón (entramado), algunas manchas y grietas finas.',
  oscuro: 'Pared de piedra gris oscura en la parte de abajo y tablones de madera oscura arriba, con vigas.',
};

/** Lo que se cuelga en las paredes de los interiores (deco.<nombre>), con su medida y descripción. */
const WALL_DECOR: Record<string, [number, number, string]> = {
  ventana: [18, 22, 'Una ventana de madera con vidrios en cuadritos, con luz de día del otro lado y una maceta con flores en el alféizar.'],
  herramientas: [24, 18, 'Un tablero de madera con herramientas de herrero colgadas: tenazas, martillos y una lima.'],
  escudos: [24, 20, 'Dos escudos redondos de madera y metal con dos espadas cruzadas detrás.'],
  antorcha: [8, 16, 'Una antorcha de pared con soporte de hierro y la llama encendida.'],
  estante: [26, 16, 'Un estante de madera con frascos, jarras y un par de libros.'],
  tapiz: [16, 28, 'Un tapiz de tela roja con bordes dorados y un emblema de un martillo y un yunque.'],
  hierbas: [22, 14, 'Ramos de hierbas y flores secas colgando cabeza abajo de una cuerda.'],
  cornamenta: [22, 14, 'Una cornamenta de ciervo montada en una tabla de madera.'],
  cuadro: [16, 14, 'Un cuadro chico con marco de madera: un paisaje de montañas.'],
  mapa: [22, 16, 'Un mapa de pergamino clavado en la pared, con caminos y montañas dibujados.'],
};

/** Interiores ilustrados (interior.<lugar>): cómo es cada lugar y dónde va cada mueble, mirando la imagen. */
const INTERIORS: Record<string, string> = {
  herreria: 'El interior de la herrería del protagonista, un taller de pueblo acogedor y trabajado. Piso de tablones de madera. Paredes de revoque crema con vigas de madera, con ventanas con luz, herramientas colgadas, escudos, antorchas y estantes. '
    + 'Muebles, mirando la imagen: en la esquina del fondo, contra la pared izquierda, una fragua grande de piedra encendida con fuelle, y a su lado una pila de leña y sacos de carbón; '
    + 'delante de la fragua, un poco hacia el centro, el yunque sobre un tronco y una tina de madera con agua para templar; '
    + 'contra la pared del fondo derecha, cerca del centro, una mesa de joyero con lupa y gemas, y más a la derecha dos armeros con espadas y lanzas; '
    + 'sobre el lado derecho, una mesa de runas con piedras brillantes, un arcón grande con herrajes y, más adelante, una mesa de alquimia con frascos y un alambique; '
    + 'sobre el lado izquierdo, barriles contra la pared, una piedra de afilar y una mesa con un libro grande abierto; '
    + 'adelante al centro, el mostrador de la tienda, largo y de madera, con algunas armas a la venta. '
    + 'Al frente de todo, en el borde de abajo, una franja de calle de tierra con la puerta abierta del taller. '
    + 'El centro del piso queda libre para caminar entre los muebles.',
};

/** Animales (animal.<nombre>), con su medida de dibujo y descripción. */
const ANIMALS: Record<string, [number, number, string]> = {
  gallina: [16, 14, 'Una gallina blanca de cresta roja.'],
  gato: [20, 12, 'Un gato gris atigrado, caminando.'],
  perro: [22, 16, 'Un perro marrón de pueblo, de orejas caídas.'],
};

/**
 * Medida del dibujo de cada monstruo (ancho × alto en píxeles de arte), pensada respecto de un personaje (24×36).
 * Los jefes que comparten dibujo se agrandan en el juego con su escala.
 */
const MONSTER_SIZE: Record<string, [number, number]> = {
  'mon.gelin': [24, 20], 'mon.goblin': [24, 28], 'mon.jefe': [32, 36], 'mon.lobo': [32, 24], 'mon.jabali': [32, 24],
  'mon.arana': [32, 24], 'mon.oso': [40, 36], 'mon.esqueleto': [32, 36], 'mon.espectro': [32, 36], 'mon.caballero': [36, 40],
  'mon.golem': [36, 40], 'mon.gargola': [36, 34], 'mon.cristal': [20, 30], 'mon.ogro': [40, 44], 'mon.ciclope': [44, 48],
  'mon.elemental': [28, 34], 'mon.diablillo': [32, 30], 'mon.demonio': [40, 44], 'mon.kobold': [30, 30], 'mon.wyvern': [48, 40],
  'mon.dragon': [56, 48],
  // Jefes con dibujo propio.
  'mon.grunaz': [44, 46], 'mon.ulmar': [48, 54], 'mon.golem_eco': [60, 56], 'mon.rocamuda': [58, 56],
  'mon.madre_cienaga': [56, 54], 'mon.malgor': [60, 58], 'mon.cendralia': [76, 60],
};

/** Medida por vida, para monstruos nuevos que todavía no están en la tabla. */
function monsterSize(hp: number): [number, number] {
  if (hp < 60) return [24, 24];
  if (hp < 130) return [32, 32];
  return [48, 44];
}

export function buildAssetList(c: Content): AssetEntry[] {
  const out: AssetEntry[] = [];
  const add = (e: AssetEntry) => out.push(e);

  // Personajes y retratos
  add({ key: 'char.herrero', type: 'personaje', folder: 'personajes', w: 24, h: 36, name: 'Herrero (protagonista)', group: 'Personajes', detail: 'Un herrero joven y fuerte, con delantal de cuero sobre una camisa marrón, pelo castaño oscuro, guantes y un martillo chico en la cintura. Detalles en rojo.' });
  add({ key: 'char.herrero_b', type: 'personaje', folder: 'personajes', w: 24, h: 36, name: 'Herrero, paso', group: 'Personajes', detail: 'El mismo herrero de la imagen adjunta.' });
  add({ key: 'retrato.herrero', type: 'retrato', folder: 'retratos', w: 48, h: 48, name: 'Retrato del herrero', group: 'Retratos', detail: 'Un herrero joven, decidido y simpático, pelo castaño oscuro un poco despeinado, una mancha de hollín en la mejilla, delantal de cuero.' });
  for (const npc of Object.values(c.npcs)) {
    const look = `Colores: ropa ${hex(npc.look.body)}, pelo ${hex(npc.look.hair)}, detalles ${hex(npc.look.accent)}.`;
    add({ key: `char.npc.${npc.id}`, type: 'personaje', folder: 'personajes', w: 24, h: 36, name: npc.name, group: 'Personajes', detail: `${npc.name}, ${npc.role.toLowerCase()}. ${npc.description} ${look}` });
    add({ key: `retrato.${npc.id}`, type: 'retrato', folder: 'retratos', w: 48, h: 48, name: `Retrato de ${npc.name}`, group: 'Retratos', detail: `${npc.name}, ${npc.role.toLowerCase()}. ${npc.description} Personalidad: ${npc.personality.join(', ')}. ${look}` });
  }
  for (let i = 0; i < AMBIENT_VARIANTS; i++) {
    add({ key: `char.amb.${i}`, type: 'personaje', folder: 'personajes', w: 24, h: 36, name: `Vecino ${i + 1}`, group: 'Personajes', detail: `Un vecino o vecina común de un pueblo de fantasía (variante ${i + 1}: cambiar edad, ropa y peinado respecto de las otras).` });
  }
  for (let i = 0; i < GUARD_VARIANTS; i++) {
    add({ key: `char.guard.${i}`, type: 'personaje', folder: 'personajes', w: 24, h: 36, name: `Guardia ${i + 1}`, group: 'Personajes', detail: `Un guardia de la ciudad con casco, cota gris y tabardo rojo, con una lanza (variante ${i + 1}).` });
  }

  // Monstruos: un dibujo por especie que comparte sprite (se tiñe), y los jefes pueden tener el suyo.
  const bySprite = new Map<string, typeof c.monsters[string][]>();
  for (const m of Object.values(c.monsters)) bySprite.set(m.sprite.key, [...(bySprite.get(m.sprite.key) ?? []), m]);
  for (const [key, ms] of bySprite) {
    const common = ms.filter((m) => !m.boss);
    const ref = common.length ? common : ms;
    const [w, h] = MONSTER_SIZE[key] ?? monsterSize(Math.max(...ref.map((m) => m.hp)));
    add({
      key, type: 'monstruo', folder: 'monstruos', w, h, name: ref.map((m) => m.name.split(',')[0]).join(', '), group: 'Monstruos',
      detail: `${ref[0].name.split(',')[0]}: ${ref[0].description} (Este mismo dibujo se usa también para: ${ref.slice(1).map((m) => m.name.split(',')[0]).join(', ') || 'nada más'}.)`,
    });
  }
  for (const m of Object.values(c.monsters).filter((x) => x.boss)) {
    add({ key: `mon.${m.id}`, type: 'jefe', folder: 'monstruos', w: (MONSTER_SIZE[`mon.${m.id}`] ?? [64, 56])[0], h: (MONSTER_SIZE[`mon.${m.id}`] ?? [64, 56])[1], name: m.name, group: 'Jefes (opcional: si no, usan el dibujo de su especie)', detail: `${m.name}. ${m.description}` });
  }

  // Espaldas: la misma figura vista de atrás. Con el espejo, frente y espalda cubren las 4 direcciones.
  const BACK_OF = { personaje: ['espalda', 'Espaldas de personajes'], monstruo: ['espalda_monstruo', 'Espaldas de monstruos'], jefe: ['espalda_jefe', 'Espaldas de jefes'] } as const;
  for (const e of out.filter((x) => x.type in BACK_OF && !x.key.endsWith('_b'))) {
    const [type, group] = BACK_OF[e.type as keyof typeof BACK_OF];
    add({ ...e, key: `${e.key}.espalda`, type, name: `${e.name} (espalda)`, group });
  }

  // Íconos
  for (const m of Object.values(c.materials)) {
    add({ key: `icon.${m.id}`, type: 'icono', folder: 'iconos', w: 16, h: 16, name: m.name, group: 'Íconos de materiales', detail: `${m.name}: ${m.description} Color principal ${m.color}.` });
  }
  for (const b of Object.values(c.blueprints)) {
    add({ key: `icon.${b.id}`, type: 'icono', folder: 'iconos', w: 16, h: 16, name: b.name, group: 'Íconos de objetos', detail: `${b.name} de hierro: ${b.description}` });
  }
  for (const p of Object.values(c.potions)) {
    add({ key: `icon.${p.id}`, type: 'icono', folder: 'iconos', w: 16, h: 16, name: p.name, group: 'Íconos de pociones', detail: `Un frasco de vidrio: ${p.name}. ${p.description} Color del líquido ${p.color}.` });
  }
  for (const e of Object.values(c.enchantments).filter((x) => x.source === 'runa')) {
    add({ key: `icon.${e.id}`, type: 'icono', folder: 'iconos', w: 16, h: 16, name: e.name, group: 'Íconos de runas', detail: `Una piedra tallada con una runa brillante: ${e.name}. ${e.description}` });
  }

  // Terreno
  for (const [id, text] of Object.entries(FLOORS)) add({ key: `tex.${id}`, type: 'textura', folder: 'texturas', w: 32, h: 32, name: `Suelo: ${id}`, group: 'Terreno', detail: text });
  for (const [id, text] of Object.entries(SIDES)) add({ key: `tex.${id}.lado`, type: 'lado', folder: 'texturas', w: 32, h: 32, name: `Pared de escalón: ${id}`, group: 'Terreno', detail: text });

  // Interiores ilustrados (se muestran a 1280×720)
  for (const [id, text] of Object.entries(INTERIORS)) add({ key: `interior.${id}`, type: 'interior', folder: 'interiores', w: 640, h: 360, name: `Interior: ${id}`, group: 'Interiores ilustrados', detail: text });

  // Paredes y decoración de los interiores
  for (const [id, text] of Object.entries(WALLS)) add({ key: `tex.muro.${id}`, type: 'muro', folder: 'texturas', w: 32, h: 32, name: `Pared interior: ${id}`, group: 'Interiores: paredes', detail: text });
  for (const [id, [w, h, text]] of Object.entries(WALL_DECOR)) add({ key: `deco.${id}`, type: 'decoracion', folder: 'escenario', w, h, name: id, group: 'Interiores: cosas colgadas', detail: text });

  // Escenario y edificios
  for (const [id, [w, h, text]] of Object.entries(PROPS)) add({ key: `prop.${id}`, type: 'escenario', folder: 'escenario', w, h, name: id, group: 'Escenario', detail: text });
  add({ key: 'deco.tallgrass', type: 'escenario', folder: 'escenario', w: 20, h: 10, name: 'Hierba alta', group: 'Escenario', detail: 'Una mata de hierba alta.' });
  add({ key: 'cart', type: 'escenario', folder: 'escenario', w: 32, h: 20, name: 'Carreta', group: 'Escenario', detail: 'Una carreta de madera de dos ruedas cargada de bolsas.' });
  for (const city of Object.values(c.cities)) {
    for (const loc of city.locations) {
      add({
        key: `build.${loc.id}`, type: 'edificio', folder: 'edificios', w: Math.round((loc.map.w + 20) / 2), h: Math.round(loc.map.h / 2),
        name: `${loc.name} (${city.name})`, group: 'Edificios de las ciudades', detail: `${loc.name}: ${loc.description} Techo color ${loc.map.roof}.`,
      });
    }
  }

  // Mapa del mundo
  add({
    key: 'world.mapa', type: 'mapa', folder: 'mapa', w: 620, h: 340, name: 'Mapa del mundo', group: 'Mapa del mundo',
    detail: 'Un valle con una ciudad en el centro, bosques al noreste, montañas nevadas arriba a la derecha, un pantano a la izquierda, la costa con un puerto abajo a la izquierda, una fortaleza arriba a la izquierda, ruinas abajo a la derecha y tierras volcánicas en la esquina de arriba a la derecha. Sin pueblos dibujados: el juego pone encima las ciudades y las regiones.',
  });
  // Marcadores de cada lugar sobre el mapa del mundo (reemplazan a los círculos y triángulos dibujados).
  const places = [
    ...Object.values(c.cities).map((x) => ({ id: x.id, name: x.name })),
    ...Object.values(c.regions).filter((r) => !r.hidden).map((r) => ({ id: r.id, name: r.name })),
    ...Object.values(c.dungeons).map((d) => ({ id: d.id, name: d.name })),
  ];
  for (const p of places) {
    add({ key: `world.${p.id}`, type: 'marcador', folder: 'mapa', w: 40, h: 36, name: p.name, group: 'Marcadores del mapa del mundo', detail: `${p.name}: ${MARKERS[p.id] ?? 'un lugar de aventura.'}` });
  }

  // Animales que andan por los interiores y las calles
  for (const [id, [w, h, text]] of Object.entries(ANIMALS)) add({ key: `animal.${id}`, type: 'animal', folder: 'personajes', w, h, name: id, group: 'Animales', detail: text });

  // Agrupado por tipo, en el orden en que aparece cada grupo.
  const order = [...new Set(out.map((e) => e.group))];
  return out.sort((x, y) => order.indexOf(x.group) - order.indexOf(y.group));
}
