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

### Alta calidad (lo normal)

La herramienta guarda cada imagen **en alta calidad**: 4 píxeles por píxel de arte, con los colores de ChatGPT, sin paleta y con bordes suaves (sin el reflejo rosado del magenta). Van a `src/assets/arte/hd/<carpeta>/<clave>.png` y el juego las prefiere a las de pixel art, que quedan de respaldo. Además guarda la imagen original de ChatGPT en `src/assets/arte/originales/` (no se carga en el juego), por si hay que volver a procesarla.

- Personajes, monstruos y animales se muestran en alta de verdad; escenario, edificios y marcadores se preparan al cargar al tamaño de pantalla, suavizados.
- Las texturas del terreno y las paredes se siguen armando en su medida de arte (en alta no ganarían nada).
- Si el frente de un personaje todavía está en pixel art, su espalda en alta se lleva a la misma medida, así no cambia de tamaño al darse vuelta.
- Para rehacer algo que ya existe en pixel art, la herramienta ofrece **🖼️ Bajar la referencia: cómo se ve hoy** y el pedido pide redibujarlo igual, con más detalle.

### Pedidos en orden (lo más rápido)

Es el modo con el que abre la herramienta. Te lleva por todo lo que falta, hoja por hoja, en orden de prioridad:

1. **📋 Copiar pedido** y pegarlo en ChatGPT. Si aparece **🖼️ Bajar la referencia** (las espaldas), adjuntarla en el mismo mensaje.
2. Copiar la imagen que da ChatGPT y pegarla en la herramienta con **Ctrl+V**.
3. Revisar las vistas previas (se puede destildar lo que salió mal) y tocar **💾 Guardar y seguir**: se guarda en el juego y aparece la hoja siguiente.

La primera vez pide elegir la carpeta `src/assets/arte`; después la recuerda (el navegador puede pedir confirmar el permiso). Con **⏭️ Saltear** una hoja queda para después.

### Modo hoja: varios assets en una sola imagen

Es lo más rápido para íconos, retratos, monstruos, texturas y personajes.

1. Arriba, tocar **"Hoja: varias en una imagen"** y elegir en la lista el primero que falta. Entran ese y los siguientes del mismo tipo que todavía no tienen arte.
2. La grilla viene armada según el tipo (retratos 3×3, íconos 4×4, monstruos 3×2, texturas 3×2) y se puede cambiar. El pedido numera cada asset en el orden en que se va a cortar.
3. Copiar el pedido, generar en ChatGPT y pegar la imagen. La herramienta busca cada figura y la asigna a la celda donde cae su centro, así funciona aunque ChatGPT no deje las filas parejas. Las texturas se cortan por grilla.
4. Revisar las vistas previas y destildar las que salieron mal (quedan pendientes para la próxima hoja). Después, **"Guardar todos"**.

Si ChatGPT no respeta la grilla (pone menos, los amontona o cambia el orden), conviene volver a pedirla o bajar a una grilla más chica. Las que salen mal se rehacen después en modo "una por una".

### Espaldas: que las figuras miren en las 4 direcciones

El dibujo de frente mira abajo a la izquierda y el de espalda, arriba a la derecha. Espejando cada uno, salen las 4 diagonales. El juego elige solo cuál usar según hacia dónde camina o mira la figura. Mientras una figura no tenga espalda, usa el frente también al ir hacia arriba.

1. En la lista, en **"Espaldas de personajes"** (o de monstruos o de jefes), elegir la primera que falta, en modo hoja.
2. Tocar **"Bajar la referencia de frente"**: arma una imagen con los dibujos de frente de esas mismas figuras, en la misma grilla y el mismo orden que el pedido.
3. En ChatGPT, adjuntar esa imagen y pegar el pedido. Así dibuja las mismas figuras, cada una en su lugar, pero de espalda.
4. Pegar el resultado en la herramienta, revisar y **"Guardar todos"**. Se guardan como `<clave>.espalda.png` junto al frente.

### Nombres de archivo (la clave es el nombre)

| Archivo | Qué es |
|---|---|
| `char.herrero.png`, `char.npc.<id>.png` | Personajes. Opcional: `<clave>_b.png` para el segundo cuadro de la caminata (si no está, se repite el primero). |
| `<clave>.espalda.png` | Vista de espalda de un personaje o monstruo (`char.herrero.espalda.png`, `mon.lobo.espalda.png`). |
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

## 7. Ciudades ilustradas

Cada ciudad es **una sola ilustración en pixel art, vista desde el aire**: la ciudad entera con su muralla, su río o su puerto, calles, plazas y cientos de techos de casas comunes. Los edificios del juego van **más grandes y reconocibles** que las casas comunes, como en los mapas de los RPG, cada uno con un lugar libre delante para su nombre. Reemplaza al mapa armado con edificios sueltos.

Yo marco sobre la imagen dónde se toca cada edificio y pongo encima los nombres, el brillo de las puertas, el humo de las chimeneas y la luz de cada hora.

**Inspiración**: ciudades amuralladas vistas desde el aire, con un río que las cruza, calles que salen de una plaza central y techos apretados. Es solo inspiración: **no subas a ChatGPT capturas de animes ni de otros juegos**, el pedido ya lo describe en palabras.

**Cómo pedirla:**

1. En ChatGPT, **adjuntá las hojas de edificios de esa ciudad** (están en `arte/originales/edificios/`), para que los dibuje parecidos a los que ya tenemos.
2. Pegá el pedido de la ciudad (abajo).
3. Si un edificio importante sale repetido, falta, queda tapado o tiene letras, pedile que lo corrija sobre la misma imagen.
4. Guardala en `arte/originales/ciudades/<ciudad>.png` (o mandámela por el chat).

**Formato**: horizontal 3:2. El juego la muestra en 16:9, así que se recorta un poco arriba y abajo: por eso cada pedido deja una franja de campo, mar o roca en esos bordes.

### Valdebrasa

Adjuntar: `hoja54.webp` (herrería, mercado, taberna, alquimista), `hoja53.webp` (curtiembre, aserradero, joyería, librería) y `hoja58.webp` (gremio, tablón, subastas, mercado de esclavos).

```
Pixel art para un videojuego de rol táctico de fantasía, estilo anime, muy detallado y pulido, con el mismo estilo que los edificios de las imágenes adjuntas: paleta terrosa con acentos de color, 3 o 4 tonos por color, contorno de color oscuro (no negro puro), luz desde arriba a la izquierda, planos de color limpios y sin tramado de puntos.

Una sola ilustración horizontal: la ciudad de Valdebrasa vista desde el aire, desde bastante arriba y en diagonal, como el mapa de una ciudad en un RPG. Es un pueblo grande de valle, próspero y acogedor, rodeado por una muralla baja de piedra clara con forma redondeada, con portones de madera donde entran los caminos. La ciudad llena casi toda la imagen.

Adentro de la muralla, cientos de casas comunes chicas, apretadas, con techos de teja roja y naranja (algunas con techos más oscuros para variar), patios con árboles y huertitas entre ellas. Las calles de tierra clara y adoquines salen como rayos desde una plaza central y se cruzan con calles en anillo. Un río azul entra por arriba, serpentea por la ciudad un poco a la izquierda del centro y sale por abajo, cruzado por dos puentes de piedra. Afuera de la muralla: campos de cultivo en parcelas de distintos verdes, caminos de tierra y manchas de bosque espeso.

Los 12 edificios importantes de las imágenes adjuntas van dibujados más grandes que las casas comunes (unas tres o cuatro veces), bien reconocibles, con la misma forma, color de techo y detalles que en las imágenes. Cada uno aparece una sola vez, sin quedar tapado, y con un espacio libre delante (calle, patio o placita) para poner su nombre encima en el juego. Ubicación, mirando la imagen:

Arriba, de izquierda a derecha:
1. Curtiembre de Tanino (techo marrón claro, cueros secándose afuera), en el extremo izquierdo.
2. La Retorta de Bastián, la tienda del alquimista (techo violeta, alambique de cobre).
3. Casa de subastas (techo dorado, columnas y escalinata), arriba al centro: el edificio más elegante de la ciudad.
4. Joyería Engaste (techo azul, vidriera con gemas).
5. Librería Pliegue (techo bordó, enredaderas), a la derecha.

En el medio, de izquierda a derecha:
6. Tu herrería (techo rojo oscuro, fragua de piedra y yunque afuera), a la izquierda, del otro lado del río: es la casa del protagonista.
7. El Mercado, en el centro de la plaza central de adoquines: puestos con toldos a rayas rojos, crema y azules.
8. Taberna El Fuelle Roto (techo verde musgo, mesas afuera), a la derecha de la plaza.
9. Gremio de aventureros (techo azul, estandartes), en el extremo derecho.

Abajo, de izquierda a derecha:
10. Aserradero Duela (techo oliva, rueda de sierra y troncos), abajo a la izquierda, junto al río.
11. Tablón de anuncios (un tablero techado con papeles), abajo al centro, en una placita.
12. Mercado de esclavos (techo marrón oscuro, rejas y antorchas), abajo a la derecha, más apartado y sombrío.

Dejá una franja de campos y bosque arriba y abajo de la imagen, sin edificios importantes, porque se recorta un poco.
Luz pareja de mediodía (sin atardecer ni noche: el juego cambia la luz según la hora), sin rayos de sol ni destellos. Chimeneas sin humo (el juego lo agrega animado).
Sin personas ni animales grandes. Sin texto, letras, números ni carteles con palabras.
```

### Puertoseco

Adjuntar: `hoja52.webp` (muelle, mercado, taberna, casa de los navegantes) y `hoja49.webp` (la posada es el de arriba a la izquierda).

```
Pixel art para un videojuego de rol táctico de fantasía, estilo anime, muy detallado y pulido, con el mismo estilo que los edificios de las imágenes adjuntas: paleta terrosa con acentos de color, 3 o 4 tonos por color, contorno de color oscuro (no negro puro), luz desde arriba a la izquierda, planos de color limpios y sin tramado de puntos.

Una sola ilustración horizontal: la ciudad de Puertoseco vista desde el aire, desde bastante arriba y en diagonal, como el mapa de una ciudad en un RPG. Es un puerto de pescadores y contrabandistas sobre una bahía: la ciudad baja en terrazas desde unas colinas secas (arriba) hasta el mar (abajo). Una muralla de piedra clara la rodea por tierra y termina en el agua con dos torres. La ciudad llena casi toda la imagen.

Adentro, cientos de casas comunes chicas y apretadas de paredes blancas y crema, con techos de teja naranja y algunos azules, escaleras entre terrazas, callejones y patios con macetas. Una calle ancha (la rambla) baja de la puerta de la muralla hasta el puerto. Abajo, el mar azul turquesa con muelles de madera, barcos de pesca y un par de barcos grandes con velas recogidas, redes, cajones y barriles. Un faro de piedra en la punta de la bahía.

Los 5 edificios importantes de las imágenes adjuntas van dibujados más grandes que las casas comunes (unas tres o cuatro veces), bien reconocibles, con la misma forma, color de techo y detalles que en las imágenes. Cada uno aparece una sola vez, sin quedar tapado, y con un espacio libre delante para poner su nombre encima en el juego. Ubicación, mirando la imagen:

1. Posada del Faro (techo rojo, cartel de jarra y bandera con ancla), arriba a la izquierda, cerca de la muralla y mirando al mar.
2. Casa de los Navegantes (techo azul, timón en la fachada y bandera con estrella), arriba a la derecha.
3. Mercado de la Rambla (techo naranja, puestos con toldos y pescado), a la izquierda del centro, sobre la rambla.
4. Taberna La Ballena Seca (techo marrón, cartel con una ballena), a la derecha del centro.
5. El muelle (galpón de techo azul sobre un muelle de madera, grúa con red y un bote), abajo al centro, sobre el agua.

Dejá una franja de colinas secas arriba y de mar abajo, sin edificios importantes, porque se recorta un poco.
Luz pareja de mediodía (sin atardecer ni noche: el juego cambia la luz según la hora), sin rayos de sol ni destellos. Chimeneas sin humo (el juego lo agrega animado).
Sin personas ni animales grandes. Sin texto, letras, números ni carteles con palabras.
```

### Fuerte Ceniza

Adjuntar: `hoja49.webp` (plaza de armas, intendencia y mercado de la guarnición: los tres que no son la posada) y `hoja50.webp` (cantina y cuartel de huéspedes).

```
Pixel art para un videojuego de rol táctico de fantasía, estilo anime, muy detallado y pulido, con el mismo estilo que los edificios de las imágenes adjuntas: paleta terrosa con acentos de color, 3 o 4 tonos por color, contorno de color oscuro (no negro puro), luz desde arriba a la izquierda, planos de color limpios y sin tramado de puntos.

Una sola ilustración horizontal: Fuerte Ceniza visto desde el aire, desde bastante arriba y en diagonal, como el mapa de una ciudad en un RPG. Es la última fortaleza antes de la frontera, sobre una meseta de tierra y roca gris con poca vegetación: una muralla alta y gruesa de piedra gris en forma de estrella, con torres en cada punta, almenas, pasarelas y un portón grande abajo al centro con puente levadizo sobre un foso seco. La fortaleza llena casi toda la imagen.

Adentro, cuarteles, establos, depósitos y casas comunes de piedra gris con techos de pizarra oscura y algunos de teja marrón, apretados en calles rectas que llevan a una gran plaza de armas empedrada en el centro. Detalles: armeros, carros de suministros, pilas de leña, barriles, estandartes azules y rojos, una forja militar y campos de entrenamiento con muñecos de paja. Afuera de la muralla, tierra seca, pocos árboles, un camino que sale hacia la frontera y un campamento de carpas a un costado.

Los 5 edificios importantes de las imágenes adjuntas van dibujados más grandes que las casas comunes (unas tres o cuatro veces), bien reconocibles, con la misma forma, color de techo y detalles que en las imágenes. Cada uno aparece una sola vez, sin quedar tapado, y con un espacio libre delante para poner su nombre encima en el juego. Ubicación, mirando la imagen:

1. Cuartel de huéspedes (techo de pizarra azul, catres bajo un alero), arriba al centro.
2. Intendencia (edificio de piedra con techo de pizarra, columnas, balanza en el estandarte), arriba a la derecha.
3. Mercado de la guarnición (techo marrón, toldos claros y armas y armaduras en venta), a la izquierda.
4. Plaza de armas (patio empedrado con estandartes, armero de lanzas y tablón de avisos), en el centro.
5. Cantina El Escudo Roto (techo marrón oscuro, cartel con un escudo rojo), abajo a la derecha.

Dejá una franja de tierra seca y roca arriba y abajo de la imagen, sin edificios importantes, porque se recorta un poco.
Luz pareja de mediodía (sin atardecer ni noche: el juego cambia la luz según la hora), sin rayos de sol ni destellos. Chimeneas sin humo (el juego lo agrega animado).
Sin personas ni animales grandes. Sin texto, letras, números ni carteles con palabras.
```
