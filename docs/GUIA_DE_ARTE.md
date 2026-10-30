# Guía de arte — Forja & Fortuna

Estilo propio, inspirado en los RPG tácticos isométricos de los 90 y sus remasterizaciones. Todo el contenido es original: tomamos **cómo se ve** (proporciones, paleta, luz, acabado), nunca personajes, diseños ni imágenes de otro juego. A ChatGPT no se le nombra ningún juego: se le describe el estilo con esta guía.

Decisiones tomadas:
- **Pixel art real** para personajes, monstruos, íconos y objetos. Se genera con ChatGPT y después se procesa: se achica, se limita a la paleta y se le saca el fondo.
- **Todo isométrico**: combates, regiones, interiores y ciudades.
- **Mapa del mundo en pixel art aéreo.**

---

## 1. Reglas de estilo (van en todos los pedidos)

- **Proporción chibi anime**: unas 2,5 cabezas de alto, con cabeza y manos grandes y cuerpo corto. Cada personaje se reconoce por la **silueta**: sombrero, capa, delantal, armadura.
- **Vista isométrica** desde arriba en diagonal. Los personajes se dibujan **de frente en diagonal**, mirando abajo a la izquierda, y **de espalda en diagonal**, mirando arriba a la derecha. Las otras dos direcciones salen de espejarlos.
- **Luz desde arriba a la izquierda**, siempre.
- **3 o 4 tonos por color**: base, sombra, sombra profunda y un brillo chico.
- **Contorno de color, no negro**: el borde es una versión oscura del color de cada zona.
- **Sin tramado de puntos.** Planos de color limpios.
- **Paleta apagada y terrosa.** El color fuerte se guarda para lo importante: fuego, magia, la capa del jefe.
- **Fondo plano magenta (#FF00FF)** en todo lo que hay que recortar, para que la herramienta lo saque sin errores.
- Sin texto, sin marco, sin sombra en el piso y una sola figura por imagen, salvo que el pedido diga otra cosa.

## 2. Escala y medidas

En todo el juego **un píxel del dibujo se ve como 2×2 píxeles en pantalla**. Las medidas de abajo son las del dibujo: ChatGPT genera más grande y la herramienta lo achica a esto.

| Tipo | Medida del dibujo | En pantalla |
|---|---|---|
| Casilla isométrica (rombo) | 32×16 | 64×32 |
| Escalón de altura | 8 de alto | 16 |
| Personaje | 24×36 | 48×72 |
| Monstruo chico (gelín, diablillo, kobold) | 24×24 | 48×48 |
| Monstruo mediano (lobo, goblin, esqueleto) | 32×32 | 64×64 |
| Monstruo grande (ogro, wyvern, gólem) | 48×44 | 96×88 |
| Jefe (dragona, cíclope, señor demoníaco) | 64×56 | 128×112 |
| Ícono de objeto o material | 16×16 | 32×32 (48 en la tarjeta) |
| Retrato (diálogos, grupo, combate) | 48×48 | 96×96 |
| Textura de terreno (cuadrada, que se repite) | 32×32 | se proyecta sobre los rombos |
| Mueble o accesorio (yunque, barril, estante) | 32×32 a 64×48 | ×2 |

## 3. Paleta maestra

Todo se reduce a esta paleta, y eso es lo que hace que combine aunque cada imagen salga de un pedido distinto. Las texturas del terreno y el mapa del mundo no se reducen: en superficies grandes la paleta las vuelve manchadas. Se puede ampliar si un monstruo o una zona necesita un color que falta.

| Grupo | Colores |
|---|---|
| Oscuros y contornos | `#1e1820` `#3a2a2e` `#4a3a30` |
| Piel | `#f2d0a8` `#d9a878` `#a8704a` |
| Pelo y madera | `#6b4220` `#8a5a32` `#b88a50` |
| Piedra y tierra | `#f0e2c0` `#c8b088` `#9a8468` `#6e604e` |
| Piedra gris y metal | `#c8c8d0` `#8a8a92` `#5e5e6a` |
| Verdes | `#c8d878` `#8aaa48` `#5a8a38` `#2e5028` |
| Verdes oliva | `#a8ac68` `#7a8044` `#52582e` |
| Azules y agua | `#a8e0f0` `#5a9ad0` `#2a5a98` `#1e3060` |
| Rojos | `#f08a5a` `#c8482e` `#7a2422` |
| Violetas | `#a88ad0` `#6a4a8a` `#3a2a5a` |
| Dorados | `#f8e48a` `#e0a838` `#a8701e` |
| Blancos | `#f8f4e8` `#d8d0c0` |

**Variantes por color**: muchos monstruos son el mismo dibujo recoloreado, como el lobo gris y el albino, o los cuatro elementales. Por eso los monstruos se dibujan en grises claros y el juego les aplica el color de cada especie, como hace hoy con los gráficos provisorios.

## 4. Plantillas de pedido para ChatGPT

Copiar el **bloque base** y agregarle el bloque del tipo de asset. Lo que va entre corchetes se reemplaza.

**Bloque base**
> Pixel art para un videojuego táctico isométrico de fantasía, estilo anime. Paleta apagada y terrosa, 3 o 4 tonos por color, luz desde arriba a la izquierda, contorno de color oscuro (no negro puro), sin tramado de puntos, planos de color limpios. Fondo plano de un solo color magenta #FF00FF. Sin texto, sin marco, sin sombra en el piso.

**Personaje**
> Un solo personaje chibi de cuerpo entero, de unas 2,5 cabezas de alto, con cabeza y manos grandes, en vista isométrica de frente en diagonal (mirando hacia abajo a la izquierda), parado y quieto, centrado. [Descripción: quién es, ropa, colores, qué lleva en las manos].
>
> Segundo pedido, con la imagen anterior adjunta: "El mismo personaje, exactamente igual, ahora de espalda en diagonal (mirando hacia arriba a la derecha)". Después lo mismo para las poses: un paso caminando, golpeando, herido y caído.

**Monstruo**
> Un solo monstruo de cuerpo entero en vista isométrica de frente en diagonal, centrado, dibujado en tonos grises claros y blancos (el color se le agrega en el juego), con los ojos y los detalles oscuros. [Descripción: qué es, tamaño, forma, rasgos que lo distinguen].

**Ícono de objeto o material**
> Un solo ícono de objeto, chico y muy legible, en diagonal apuntando hacia arriba a la derecha, centrado y ocupando casi todo el cuadro, pensado para verse a 16×16 píxeles. [Descripción: qué objeto o material es, de qué está hecho, color].

**Retrato**
> Retrato de busto, de frente y un poco girado, estilo anime con ojos grandes y expresivos, encuadrado de los hombros para arriba, con fondo magenta liso. Pensado para verse a 48×48 píxeles. [Descripción: quién es, edad, pelo, ropa, expresión].

**Textura de terreno**
> Textura cuadrada de [pasto / tierra / piedra / ladrillo / ceniza / agua…] vista desde arriba, que se pueda repetir sin costuras en los cuatro lados, con poco contraste para que no distraiga, pensada para verse a 32×32 píxeles. Sin fondo magenta: la textura ocupa todo el cuadro.

**Mueble o accesorio de escenario**
> Un solo objeto de escenario en vista isométrica (rombo de piso de 2:1), centrado, apoyado sobre una casilla. [Descripción: yunque, barril, estante, árbol…].

**Mapa del mundo**
> Mapa de fantasía en pixel art visto desde muy arriba, levemente inclinado. Colores vivos pero naturales, bosques en manchas espesas, montañas, ríos y caminos de tierra. [Descripción de qué va dónde]. Sin texto.

## 5. Flujo de trabajo

Con `npm run dev` corriendo, abrir la **herramienta de arte**: http://localhost:5173/herramientas/arte.html

1. En la lista de la izquierda se elige el asset. Muestra lo que falta, lo hecho (✓), la medida y el archivo.
2. **Copiar pedido para ChatGPT.** El pedido ya trae el bloque base y la descripción de ese asset.
3. Generar en ChatGPT y pegar la imagen en la herramienta (Ctrl+V, arrastrar o elegir archivo). Conviene guardar también el original en `arte/originales/`.
4. La herramienta saca el magenta, recorta, achica a la medida y reduce a la paleta. Muestra cómo queda a tamaño real, ampliado y sobre una casilla, como en el juego. Si el borde queda con restos de fondo, se ajusta la tolerancia.
5. **Guardar.** La primera vez se elige la carpeta `src/assets/arte`, y después cada imagen va sola a su subcarpeta. Si el navegador no permite elegir carpetas, se descarga y se copia a mano.
6. El juego la usa al recargar. Lo que no tiene imagen sigue con el gráfico provisorio, así se puede reemplazar de a poco.

### Modo hoja: varios assets en una sola imagen

Es lo más rápido para íconos, retratos, monstruos, texturas y personajes.

1. Arriba, tocar **"Hoja: varias en una imagen"** y elegir en la lista el primero que falta. Entran ese y los siguientes del mismo tipo que todavía no tienen arte.
2. La grilla viene armada según el tipo (retratos 3×3, íconos 4×4, monstruos 3×2, texturas 3×2) y se puede cambiar. El pedido numera cada asset en el orden en que se va a cortar.
3. Copiar el pedido, generar en ChatGPT y pegar la imagen. La herramienta busca cada figura y la asigna a la celda donde cae su centro, así funciona aunque ChatGPT no deje las filas parejas. Las texturas se cortan por grilla.
4. Revisar las vistas previas y destildar las que salieron mal (quedan pendientes para la próxima hoja). Después, **"Guardar todos"**.

Si ChatGPT no respeta la grilla (pone menos, los amontona o cambia el orden), conviene volver a pedirla o bajar a una grilla más chica. Las que salen mal se rehacen después en modo "una por una".

### Nombres de archivo (la clave es el nombre)

| Archivo | Qué es |
|---|---|
| `char.herrero.png`, `char.npc.<id>.png` | Personajes. Opcional: `<clave>_b.png` para el segundo cuadro de la caminata (si no está, se repite el primero). |
| `retrato.herrero.png`, `retrato.<id>.png` | Retratos para diálogos, grupo y combate. |
| `mon.<dibujo>.png` | Monstruo en grises: lo comparten varias especies y el juego lo tiñe (`mon.lobo` sirve para el lobo gris y el albino). |
| `mon.<id del monstruo>.png` | Dibujo propio, con colores, para un monstruo puntual (pensado para los jefes). Tiene prioridad sobre el compartido. |
| `icon.<id>.png` | Ícono de un material, plano, poción o runa. |
| `tex.<suelo>.png` | Textura cuadrada de la tapa de las casillas (`grass`, `dirt`, `stone`…). El juego la proyecta sobre el rombo. |
| `tex.<suelo>.lado.png` | Textura de la pared de los escalones de ese suelo. Arriba se le agrega una fila del color de la tapa (el borde de pasto). |
| `prop.<nombre>.png`, `deco.tallgrass.png`, `cart.png` | Muebles y escenario. |
| `build.<lugar>.png` | Edificio del mapa de la ciudad. |
| `world.mapa.png` | Ilustración de fondo del mapa del mundo. Las ciudades y regiones se dibujan encima. |

## 6. Orden recomendado

1. **Muestra para fijar el estilo**:
   - el herrero y Brunilda;
   - los monstruos del Linde de Brezal: gelín, lobo, goblin y jabalí;
   - las texturas de pasto, tierra, piedra y agua;
   - el yunque y la fragua;
   - diez íconos de materiales y el retrato del herrero.
2. Revisar juntos cómo se ve, y ajustar esta guía si hace falta.
3. Producción por tandas: personajes y retratos de la ciudad, monstruos por familia, íconos, terrenos y escenarios por región, y el mapa del mundo.
