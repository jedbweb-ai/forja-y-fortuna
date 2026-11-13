import type { Content } from '../core/content';
import { AMBIENT_VARIANTS, GUARD_VARIANTS } from '../game/render/variants';

// Lista de todo el arte que usa el juego, armada a partir del contenido.
// Cada entrada trae su clave (nombre del archivo), carpeta, medida del dibujo y el pedido para ChatGPT.
// Medidas y estilo: docs/GUIA_DE_ARTE.md.

export type AssetType = 'personaje' | 'monstruo' | 'jefe' | 'espalda' | 'espalda_monstruo' | 'espalda_jefe' | 'icono' | 'retrato' | 'textura' | 'lado' | 'escenario' | 'edificio' | 'mapa' | 'marcador' | 'animal' | 'muro' | 'decoracion' | 'interior' | 'ciudad';

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
  interior: 'Una sola ilustración horizontal, apaisada (16:9), de un lugar en vista isométrica de verdad, como la maqueta cortada de un juego táctico isométrico: '
    + 'la cámara mira desde arriba en diagonal y el piso es un rombo el doble de ancho que de alto, con sus cuatro lados en diagonal. NO es una vista de frente ni desde arriba derecha: las líneas del piso nunca son horizontales. '
    + 'Se ven las dos paredes del fondo (la de arriba a la izquierda y la de arriba a la derecha) y no hay paredes adelante, para que se vea todo adentro. '
    + 'Afuera, delante del local, a lo largo del lado de abajo a la izquierda del rombo, pasa una calle de pueblo ancha, también en diagonal, que entra y sale de la imagen por los dos costados: '
    + 'primero una vereda de piedra pegada al local y después un empedrado con lugar para que la gente pase en dos o tres filas. La entrada del local da a esa calle. '
    + 'Dejá la calle despejada (como mucho un farol o un barril contra el borde) y, del otro lado de la calle, apenas el borde de la vereda de enfrente. '
    + 'Te adjunto un plano sacado del juego: respetá la misma vista, el mismo ángulo y dónde va cada mueble, la puerta y la calle, pero dibujalo con mucho más detalle y nitidez. '
    + 'La escena llena toda la imagen: sin fondo magenta y sin marco. Sin personas ni animales. Sin texto, letras ni números. Luz cálida de día.',
  edificio: 'Un solo edificio pequeño en vista isométrica, visto desde arriba en diagonal, centrado, con la puerta hacia el frente.',
  ciudad: 'Una sola ilustración horizontal, apaisada (16:9): una ciudad entera vista desde el aire, desde bastante arriba y en diagonal, como el mapa de una ciudad en un RPG, con el mismo estilo detallado y pulido que los interiores del juego. '
    + 'Te adjunto un plano sacado del juego: respetá la forma de la muralla, el río, las calles y, sobre todo, dónde está cada edificio importante, pero dibujalo todo con mucho más detalle y nitidez. '
    + 'La ciudad llena toda la imagen: sin fondo magenta y sin marco. Luz pareja de mediodía (sin atardecer ni noche: el juego cambia la luz según la hora), sin rayos de sol ni destellos. Chimeneas sin humo (el juego lo agrega animado). '
    + 'Sin personas ni animales grandes. Sin texto, letras, números ni carteles con palabras.',
  mapa: 'Mapa de fantasía en pixel art visto desde muy arriba, levemente inclinado. Colores vivos pero naturales, bosques en manchas espesas, montañas, ríos y caminos de tierra. Sin texto. Sin fondo magenta: el mapa ocupa todo el cuadro.',
};

/** Pedido de un lugar al aire libre (plaza, mercado, muelle): como un interior, pero abierto y sin paredes. */
const OUTDOOR_TEMPLATE = 'Una sola ilustración horizontal, apaisada (16:9), de un lugar al aire libre en vista isométrica de verdad, como la maqueta cortada de un juego táctico isométrico: '
  + 'la cámara mira desde arriba en diagonal y el piso es un rombo el doble de ancho que de alto, con sus cuatro lados en diagonal. NO es una vista de frente ni desde arriba derecha: las líneas del piso nunca son horizontales. '
  + 'Es un espacio abierto, sin techo: lo que lo rodea (fachadas, muros, árboles o agua) queda atrás y a los costados, bajo, sin tapar nada de adentro. '
  + 'Te adjunto un plano sacado del juego: respetá la misma vista, el mismo ángulo y dónde va cada cosa, pero dibujalo con mucho más detalle y nitidez. Dejá libre el piso entre las cosas, para que camine la gente. '
  + 'La escena llena toda la imagen: sin fondo magenta y sin marco. Sin personas ni animales. Sin texto, letras ni números. Luz cálida de día.';

/** El pedido completo para copiar en ChatGPT. */
export function promptFor(e: AssetEntry): string {
  const tail = e.key.endsWith('_b') ? ' Es el segundo cuadro de la caminata: la misma figura con un pie adelante.' : '';
  // Un interior es una escena entera: sin el fondo magenta ni la regla de la sombra de las figuras sueltas.
  const base = e.type === 'interior' || e.type === 'ciudad' ? BASE_PROMPT.replace(' Fondo plano de un solo color magenta #FF00FF.', '').replace(', sin sombra en el piso', '') : BASE_PROMPT;
  const template = e.type === 'interior' && OUTDOOR.has(e.key) ? OUTDOOR_TEMPLATE : TEMPLATE[e.type];
  return `${base}\n\n${template} ${e.detail}${tail}`;
}

// ───────────────────────── Modo hoja: varios assets en una sola imagen ─────────────────────────

/** Grilla por defecto (columnas × filas) para cada tipo. */
export const SHEET_GRID: Record<AssetType, [number, number]> = {
  personaje: [3, 3], monstruo: [3, 2], jefe: [2, 1], espalda: [3, 3], espalda_monstruo: [3, 2], espalda_jefe: [2, 1], icono: [4, 4], retrato: [3, 3],
  textura: [3, 2], lado: [3, 2], escenario: [3, 3], edificio: [2, 2], mapa: [1, 1], marcador: [4, 3], animal: [3, 1], muro: [2, 1], decoracion: [4, 3], interior: [1, 1], ciudad: [1, 1],
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
  ciudad: 'ciudades',
  edificio: 'edificios pequeños distintos en vista isométrica, vistos desde arriba en diagonal, con la puerta hacia el frente',
  mapa: 'mapas',
};

/** Pedido para una hoja: una sola imagen con todos, en grilla, numerados en el orden en que se cortan. */
export function sheetPromptFor(list: AssetEntry[], cols: number, rows: number, redo = false): string {
  // Una hoja de una sola imagen (un interior, el mapa) es el pedido de esa imagen, con su descripción completa.
  if (list.length === 1 && cols * rows === 1) return promptFor(list[0]);
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
const PRIORITY: AssetType[] = ['ciudad', 'interior', 'muro', 'decoracion', 'escenario', 'marcador', 'animal', 'espalda', 'espalda_monstruo', 'espalda_jefe'];

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
    + 'Adelante, frente al mostrador, la entrada del taller, abierta, que da a la calle. '
    + 'El centro del piso queda libre para caminar entre los muebles.',
  // Los demás lugares: dónde va cada cosa lo muestra el plano adjunto; acá va cómo es cada lugar y qué es cada mueble.
  taberna: 'La taberna El Fuelle Roto, de pueblo, cálida y ruidosa. Piso de tablones oscuros y paredes de madera oscura con vigas, faroles, jarras colgadas y un escudo viejo. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, cerca de la esquina, una barra larga de madera con canillas, jarras y botellas, y en la esquina barriles apilados; '
    + 'en la otra punta de esa pared, un hogar de piedra encendido con leña al lado y una alfombra delante; en el salón, mesas de madera con bancos, jarras y platos de guiso; adelante a la derecha, un farol de pie. '
    + 'La entrada, adelante al centro, da a la calle.',
  alquimista: 'La Retorta de Bastián, la tienda del alquimista: misteriosa y llena de cosas. Piso de baldosas de piedra y paredes de piedra con manojos de hierbas secas colgando, frascos y un mapa de estrellas. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, dos estantes altos llenos de pociones de colores y un barril en la punta; contra la pared izquierda, sacos de hierbas y un cajón; '
    + 'a la derecha, un caldero grande burbujeando sobre el fuego, con vapor verde; un poco a la izquierda del centro, el mostrador de hierbas, una mesa con morteros, una balanza y manojos de hierbas; adelante a la derecha, un farol de pie. '
    + 'La entrada, adelante al centro, da a la calle.',
  curtidor: 'La curtiembre de Tanino: un local de cueros, rústico y trabajado. Piso de tablones y paredes de madera clara con cueros y pieles estirados en bastidores. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, dos percheros con cueros, pieles y correas colgando; atrás al centro, el mostrador de madera con cueros doblados, tijeras y punzones; '
    + 'contra la pared izquierda, un cajón con pieles enrolladas; adelante a la derecha, un farol de pie. La entrada, adelante al centro, da a la calle.',
  maderero: 'El aserradero Duela: un local de maderas, con aserrín en el piso. Piso de tablones y paredes de madera clara con sierras y hachas colgadas. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, dos pilas de tablones y troncos de maderas de distintos colores; atrás al centro, el mostrador, un banco de carpintero con cepillos y una sierra; '
    + 'contra la pared izquierda, un cajón con listones; adelante a la derecha, un farol de pie. La entrada, adelante al centro, da a la calle.',
  joyero: 'La joyería Engaste: un local fino y ordenado. Piso de tablones lustrados y paredes claras con paños de terciopelo azul, espejos y apliques. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, dos vitrinas con gemas, anillos y lingotes finos; atrás al centro, el mostrador de vidrio con una lupa, una balanza y gemas brillantes sobre terciopelo; '
    + 'contra la pared izquierda, un cofre; adelante a la derecha, un farol de pie. La entrada, adelante al centro, da a la calle.',
  libreria: 'La librería Pliegue: libros viejos, polvo y grimorios raros. Piso de tablones oscuros y paredes de madera oscura. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, estantes altos repletos de libros, pergaminos y rollos; sobre el lado derecho, dos estantes más; cerca del fondo a la derecha, el mostrador con una pila de grimorios, una vela y una pluma; '
    + 'al centro, una mesa de lectura con libros abiertos; adelante, una alfombra; adelante a la izquierda, un farol de pie. La entrada, adelante al centro, da a la calle.',
  gremio: 'El gremio de aventureros: un salón amplio y animado. Piso de tablones y paredes de madera clara con estandartes, mapas, trofeos de caza y escudos. '
    + 'Muebles, como en el plano: atrás al centro, el mostrador de contratos con papeles, sellos y una bolsa de monedas; en la punta derecha de la pared del fondo, un tablero grande lleno de encargos clavados (sin letras legibles); '
    + 'en la pared del fondo, un estandarte del gremio; contra la pared izquierda, un armero con espadas y lanzas; en el salón, dos mesas largas con bancos; una alfombra al centro; un barril en la esquina derecha; adelante a la derecha, un farol de pie. '
    + 'La entrada, adelante al centro, da a la calle.',
  subastas: 'La casa de subastas: elegante y solemne. Piso de madera oscura lustrada y paredes de madera oscura con cortinados bordó, cuadros y candelabros. '
    + 'Muebles, como en el plano: atrás al centro, un estrado con un atril para el subastador; una alfombra roja larga que baja del estrado por el pasillo del medio; a los dos lados del pasillo, filas de bancos para el público; '
    + 'a la derecha, la mesa de consignaciones con cajas y etiquetas; en la esquina del fondo, un estante con objetos raros; un estandarte en la otra punta; adelante, dos faroles de pie. La entrada, adelante al centro, da a la calle.',
  ps_taberna: 'La taberna La Ballena Seca, de puerto: marineros y canciones. Piso de tablones oscuros gastados y paredes de madera oscura con redes, remos, un timón y una mandíbula de ballena colgada. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, cerca de la esquina, una barra con botellas y un barril; en la otra punta de esa pared, un hogar con leña; en el salón, mesas con bancos y jarras. '
    + 'La entrada, adelante al centro, da a la calle.',
  ps_gremio: 'La Casa de los Navegantes, el gremio del puerto. Piso de tablones y paredes de madera clara con cartas náuticas, un timón, sogas y faroles de barco. '
    + 'Muebles, como en el plano: atrás al centro, el mostrador con un catalejo, cartas y una brújula; a la derecha de la pared del fondo, un tablero de encargos; en la pared, un estandarte con una estrella; '
    + 'a la izquierda, una mesa con un mapa desplegado; adelante a la derecha, un farol. La entrada, adelante al centro, da a la calle.',
  ps_posada: 'La Posada del Faro: limpia, luminosa y con vista al mar. Piso de tablones claros y paredes blancas con vigas, ventanas al mar y cuadros de barcos; al fondo, una escalera que sube a los cuartos. '
    + 'Muebles, como en el plano: atrás, el mostrador de recepción con un libro de huéspedes, una campanita y llaves colgadas; a la izquierda, una mesa con sillas; a la derecha, un banco; al centro, una alfombra; adelante a la derecha, un farol. '
    + 'La entrada, adelante al centro, da a la calle.',
  fc_intendencia: 'La intendencia del Fuerte Ceniza: una oficina militar austera. Piso de tablones oscuros y paredes de piedra gris con vigas, estandartes rojos del ejército y escudos. '
    + 'Muebles, como en el plano: atrás al centro, el mostrador con papeles, sellos y una bolsa de monedas; a la derecha de la pared del fondo, un tablero de encargos; contra la pared izquierda, un armero con lanzas; '
    + 'a la izquierda, un cofre militar con herrajes; adelante a la derecha, un farol. La entrada, adelante al centro, da a la calle.',
  fc_cantina: 'La cantina El Escudo Roto, de soldados: ruda y gastada. Piso de tablones oscuros y paredes de piedra y madera con escudos rotos, cascos y un mapa de batallas. '
    + 'Muebles, como en el plano: contra la pared del fondo derecha, cerca de la esquina, una barra con jarras; más a la derecha, un hogar con leña y un barril; en el salón, una mesa larga con bancos. '
    + 'La entrada, adelante al centro, da a la calle.',
  fc_posada: 'El cuartel de huéspedes del fuerte: sencillo y ordenado. Piso de tablones y paredes de piedra con mantas de lana dobladas en estantes y una fila de catres contra la pared izquierda. '
    + 'Muebles, como en el plano: atrás, un mostrador con un libro de registro y llaves; dos bancos de madera; una alfombra gastada al centro; adelante a la derecha, un farol. La entrada, adelante al centro, da a la calle.',
  // Lugares al aire libre (ver OUTDOOR).
  mercado: 'El mercado de Valdebrasa, en la plaza central: una plaza de adoquines animada. Puestos de madera con toldos a rayas, como en el plano: tres atrás (rojo, azul al centro, que es el de materiales para el taller con lingotes, cueros y maderas, y verde) '
    + 'y dos más adelante (azul a la izquierda y rojo a la derecha), con frutas, telas, herramientas y cacharros; un aljibe de piedra en el centro; cajones y barriles en los bordes; un árbol adelante a la izquierda; dos faroles adelante. '
    + 'Al fondo, fachadas de casas de techos de teja roja. Adelante, la calle de tierra por donde pasan las carretas.',
  tablon: 'El tablón de anuncios: una placita de adoquines. Como en el plano: atrás al centro, un tablero grande de madera con techito, lleno de papeles clavados (sin letras legibles); dos faroles altos; dos bancos de plaza; un árbol a la izquierda; unos cajones a la derecha. '
    + 'Al fondo, fachadas de casas. Adelante, la calle de tierra.',
  esclavos: 'El mercado de esclavos: un patio de piedra apartado, sombrío y serio (sin crueldad explícita). Como en el plano: atrás, dos carpas oscuras de lona (la de la derecha es donde se hacen los tratos, con una mesa y un cofre); '
    + 'más adelante, rejas y corrales de madera y hierro; cajones y un barril; antorchas en postes. Muros altos de piedra alrededor.',
  ps_muelle: 'El muelle de Puertoseco: una plataforma de tablones sobre el agua, rodeada de mar turquesa con reflejos. Como en el plano: atrás al centro, un puesto con toldo azul con la mercadería de los barcos (ébano, coral, perlas); cajones y barriles apilados a los costados; dos faroles. '
    + 'Alrededor, botes amarrados, la proa de un barco grande, sogas, redes y bolardos. Adelante, la orilla de la rambla.',
  ps_mercado: 'El mercado de la Rambla, en Puertoseco: una plaza de adoquines junto al mar. Como en el plano: tres puestos con toldos (rojo, verde al centro y azul) con pescado, sal, especias y telas; un aljibe al centro; cajones; un farol. '
    + 'Al fondo, casas blancas con techos naranja y, asomando, el mar. Adelante, la calle.',
  fc_plaza: 'La plaza de armas del Fuerte Ceniza: un patio de piedra gris para formar la tropa. Como en el plano: atrás al centro, el tablón de avisos techado; dos estandartes rojos altos; armeros con lanzas a los costados; un farol. '
    + 'Alrededor, los muros de piedra oscura de la fortaleza. Adelante, la calle.',
  fc_mercado: 'El mercado de la guarnición del Fuerte Ceniza: un patio de piedra con puestos. Como en el plano: dos puestos con toldos rojos (el de la izquierda, con acero y cueros para armaduras); al centro, un yunque de herrero de campaña; cajones y barriles; un farol. '
    + 'Alrededor, los muros del fuerte. Adelante, la calle.',
};

/** Lugares al aire libre: se piden como plaza o muelle abierto, sin paredes (los demás son interiores con su calle). */
const OUTDOOR = new Set(['mercado', 'tablon', 'esclavos', 'ps_muelle', 'ps_mercado', 'fc_plaza', 'fc_mercado'].map((id) => `interior.${id}`));

/** Ciudades ilustradas (ciudad.<id>): cómo es cada una; dónde va cada edificio lo muestra el plano adjunto. */
const CITY_ART: Record<string, string> = {
  valdebrasa: 'La ciudad de Valdebrasa: un pueblo grande de valle, próspero y acogedor, rodeado por una muralla baja de piedra clara con forma redondeada, con portones de madera donde entran los caminos. '
    + 'Adentro, cientos de casas comunes chicas y apretadas con techos de teja roja y naranja (algunos más oscuros para variar), patios con árboles y huertitas. Las calles de tierra clara y adoquines salen como rayos desde la plaza central y se cruzan con una calle en anillo. '
    + 'Un río azul entra por arriba, serpentea un poco a la izquierda del centro y sale por abajo, cruzado por puentes de piedra. Afuera de la muralla, campos de cultivo en parcelas de distintos verdes, caminos de tierra y manchas de bosque. '
    + 'Los 12 edificios del juego, en el mismo lugar que en el plano y dibujados más grandes que las casas comunes (unas tres o cuatro veces), bien reconocibles y parecidos a los del plano: '
    + 'arriba, la curtiembre (techo marrón claro, cueros secándose), la tienda del alquimista (techo violeta, alambique de cobre), la casa de subastas (techo dorado, columnas y escalinata: el edificio más elegante), la joyería (techo azul, vidriera con gemas) y la librería (techo bordó, enredaderas); '
    + 'en el medio, la herrería del protagonista (techo rojo oscuro, fragua de piedra y yunque afuera, del otro lado del río), el mercado en la plaza central (puestos con toldos a rayas), la taberna (techo verde musgo, mesas afuera) y el gremio de aventureros (techo azul, estandartes); '
    + 'abajo, el aserradero (techo oliva, troncos y una rueda de sierra, junto al río), el tablón de anuncios (un tablero techado en una placita) y el mercado de esclavos (techo marrón oscuro, rejas y antorchas, más apartado y sombrío). '
    + 'Cada edificio aparece una sola vez, sin quedar tapado, con un lugar libre delante (calle, patio o placita) para poner su nombre encima en el juego.',
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
  for (const [id, text] of Object.entries(CITY_ART)) add({ key: `ciudad.${id}`, type: 'ciudad', folder: 'ciudades', w: 640, h: 360, name: `Ciudad: ${id}`, group: 'Ciudades ilustradas', detail: text });
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
