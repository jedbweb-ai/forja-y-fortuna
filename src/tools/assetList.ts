import type { Content } from '../core/content';
import { AMBIENT_VARIANTS, GUARD_VARIANTS } from '../game/render/variants';

// Lista de todo el arte que usa el juego, armada a partir del contenido.
// Cada entrada trae su clave (nombre del archivo), carpeta, medida del dibujo y el pedido para ChatGPT.
// Medidas y estilo: docs/GUIA_DE_ARTE.md.

export type AssetType = 'personaje' | 'monstruo' | 'jefe' | 'icono' | 'retrato' | 'textura' | 'lado' | 'escenario' | 'edificio' | 'mapa';

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

const TEMPLATE: Record<AssetType, string> = {
  personaje: 'Un solo personaje chibi de cuerpo entero, de unas 2,5 cabezas de alto, con cabeza y manos grandes, en vista isométrica de frente en diagonal (mirando hacia abajo a la izquierda), parado y quieto, centrado.',
  monstruo: 'Un solo monstruo de cuerpo entero en vista isométrica de frente en diagonal, centrado, dibujado en tonos grises claros y blancos (el color se le agrega en el juego), con los ojos y los detalles oscuros.',
  jefe: 'Un solo monstruo jefe, grande e imponente, de cuerpo entero en vista isométrica de frente en diagonal, centrado, con sus colores definitivos.',
  icono: 'Un solo ícono de objeto, chico y muy legible, en diagonal apuntando hacia arriba a la derecha, centrado y ocupando casi todo el cuadro, pensado para verse a 16×16 píxeles.',
  retrato: 'Retrato de busto, de frente y un poco girado, estilo anime con ojos grandes y expresivos, encuadrado de los hombros para arriba, con fondo magenta liso. Pensado para verse a 48×48 píxeles.',
  textura: 'Textura cuadrada vista desde arriba, que se pueda repetir sin costuras en los cuatro lados, con poco contraste para que no distraiga, pensada para verse a 32×32 píxeles. Sin fondo magenta: la textura ocupa todo el cuadro.',
  lado: 'Textura cuadrada de la pared lateral de un escalón de terreno, vista de frente, que se pueda repetir sin costuras a los costados, pensada para verse a 32×32 píxeles. Sin fondo magenta: la textura ocupa todo el cuadro.',
  escenario: 'Un solo objeto de escenario en vista isométrica (rombo de piso de 2:1), centrado, apoyado sobre una casilla.',
  edificio: 'Un solo edificio pequeño en vista isométrica, visto desde arriba en diagonal, centrado, con la puerta hacia el frente.',
  mapa: 'Mapa de fantasía en pixel art visto desde muy arriba, levemente inclinado. Colores vivos pero naturales, bosques en manchas espesas, montañas, ríos y caminos de tierra. Sin texto. Sin fondo magenta: el mapa ocupa todo el cuadro.',
};

/** El pedido completo para copiar en ChatGPT. */
export function promptFor(e: AssetEntry): string {
  const tail = e.key.endsWith('_b') ? ' Es el segundo cuadro de la caminata: la misma figura con un pie adelante.' : '';
  return `${BASE_PROMPT}\n\n${TEMPLATE[e.type]} ${e.detail}${tail}`;
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
};

/** Medida del dibujo de un monstruo según su vida (o jefe). */
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
    const [w, h] = monsterSize(Math.max(...ref.map((m) => m.hp)));
    add({
      key, type: 'monstruo', folder: 'monstruos', w, h, name: ref.map((m) => m.name.split(',')[0]).join(', '), group: 'Monstruos',
      detail: `${ref[0].name.split(',')[0]}: ${ref[0].description} (Este mismo dibujo se usa también para: ${ref.slice(1).map((m) => m.name.split(',')[0]).join(', ') || 'nada más'}.)`,
    });
  }
  for (const m of Object.values(c.monsters).filter((x) => x.boss)) {
    add({ key: `mon.${m.id}`, type: 'jefe', folder: 'monstruos', w: 64, h: 56, name: m.name, group: 'Jefes (opcional: si no, usan el dibujo de su especie)', detail: `${m.name}. ${m.description}` });
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
  // Agrupado por tipo, en el orden en que aparece cada grupo.
  const order = [...new Set(out.map((e) => e.group))];
  return out.sort((x, y) => order.indexOf(x.group) - order.indexOf(y.group));
}
