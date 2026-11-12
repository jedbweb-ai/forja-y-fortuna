# Guía de sonido

Cómo suena Forja & Fortuna: música orquestal suave para cada lugar (generada con ChatGPT) y efectos de sonido estilo retro (generados por código, sin archivos).

## Cómo funciona

- **Música**: cada tema es un archivo en `src/assets/audio/musica/` y **su nombre es la clave del lugar** (`valdebrasa.mp3`). Al cambiar de lugar, un tema se apaga mientras entra el otro.
- **Lugares sin tema propio** usan el de su grupo: un local de la ciudad usa el de la ciudad, una mazmorra usa `mazmorra`, el combate contra un jefe usa `combate`, una región usa `mundo`. Si no hay ninguno, silencio.
- **Celular**: la música arranca con el primer toque (los navegadores no dejan sonar nada antes) y se pausa al cambiar de app.
- **Peso**: la música no entra en la carga inicial. Cada tema se baja la primera vez que suena y queda guardado.
- **Volumen**: en Ajustes, música y efectos por separado, y silenciar todo. Se guarda en el dispositivo.
- Código: `src/audio/` (`musicKey.ts` decide qué tema suena, `music.ts` lo reproduce, `sfx.ts` arma los efectos, `director.ts` los conecta con el juego).

## Cómo generar los temas con ChatGPT

1. **Un tema por conversación** (o por mensaje): copiá el bloque completo del tema y pegalo tal cual. Cada pedido ya trae todo: estilo, clima, instrumentos, tempo, duración y cómo tiene que repetirse.
2. **Escuchalo entero y fijate el final**: tiene que poder volver al principio sin que se note el salto. Si termina con un cierre fuerte, un fundido o un silencio, pedile: *"Rehacelo sin final: que el último compás enganche con el primero, sin fundido ni silencio."*
3. **Si te devuelve una partitura, un MIDI o un texto** en lugar de audio, pedile: *"Generá el audio y dame el archivo MP3 para descargar."*
4. **Ajustes que podés pedirle** si algo no te convence: *"más lento"*, *"más tranquilo, que acompañe de fondo"*, *"menos percusión"*, *"que la melodía sea más simple y fácil de recordar"*.
5. **Descargalo** y guardalo en `arte/originales/musica/` con el nombre que dice cada tema (`titulo.mp3`, `herreria.mp3`…). Avisame y lo pongo en el juego: lo ajusto para que repita sin corte y se publica solo.

**Originalidad**: los pedidos no nombran juegos, compositores ni bandas. Si agregás algo, describí el clima y los instrumentos, no "como el tema de…".

## Temas

### Pantalla de título · `titulo.mp3`

```
Componé un tema instrumental para la pantalla de título de un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime, llamado "Forja & Fortuna": la historia de un joven herrero que forja las armas de los héroes.

Clima: esperanzador y aventurero, con algo de épica tranquila. Empieza suave y crece hasta una melodía heroica que se pueda recordar.
Instrumentos: orquesta suave. Melodía principal en corno francés, cuerdas cálidas, arpa y vientos de madera. Como percusión, golpes de yunque suaves y espaciados además de timbales.
Tempo: 90 BPM, compás de 4/4, en Re mayor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo sin cansar.
Entregámelo como archivo MP3 descargable.
```

### Tu herrería · `herreria.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: el taller de un herrero joven, donde pasa la mayor parte del juego forjando armas y atendiendo su tienda. Hay una fragua encendida, un yunque y herramientas colgadas.
Clima: acogedor, cálido y tranquilo, como estar en casa trabajando con las manos. Que acompañe horas sin cansar.
Instrumentos: guitarra acústica y cuerdas en pizzicato llevando el ritmo, una flauta dulce con la melodía, chelo de fondo y golpecitos suaves de yunque como percusión, muy espaciados.
Tempo: 85 BPM, compás de 4/4, en Fa mayor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Valdebrasa (ciudad principal) · `valdebrasa.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: Valdebrasa, un pueblo medieval de valle con un mercado animado, una taberna, tiendas de artesanos y un río con un puente de madera.
Clima: alegre, amable y con movimiento, como un día de mercado: gente regateando, carretas y vecinos que se saludan.
Instrumentos: flauta y oboe con la melodía, cuerdas en pizzicato, laúd, pandereta suave y un poco de acordeón.
Tempo: 105 BPM, compás de 4/4, en Sol mayor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Puertoseco (puerto) · `puertoseco.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: Puertoseco, un puerto soleado con muelles de madera, barcos que llegan del sur, mercado de pescado y una taberna de marineros.
Clima: luminoso, con brisa y vaivén de olas; alegre pero relajado, con olor a sal.
Instrumentos: acordeón y violín folk con la melodía, guitarra, contrabajo en pizzicato y percusión de manos suave.
Tempo: 100 BPM, compás de 6/8 (que se balancee como las olas), en La mayor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Fuerte Ceniza (fortaleza) · `fuerte_ceniza.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: Fuerte Ceniza, una fortaleza de frontera con murallas grises, soldados que forman en la plaza de armas y una cantina de soldados cansados.
Clima: disciplinado y serio, orgulloso pero cansado; una marcha firme que no llega a ser de guerra.
Instrumentos: tambor militar redoblando suave, metales graves (trombón y tuba) llevando la marcha, cuerdas graves y una trompeta lejana con la melodía.
Tempo: 95 BPM, compás de 4/4, en Re menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Mapa del mundo · `mundo.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: el mapa del mundo, donde se eligen los viajes: un valle con bosques, montañas nevadas, un pantano, la costa y tierras volcánicas a lo lejos.
Clima: sensación de viaje y de mundo grande por descubrir; amplio, esperanzador y con ganas de salir a la aventura.
Instrumentos: cuerdas amplias, oboe con la melodía, cornos de fondo, arpa y timbales suaves.
Tempo: 100 BPM, compás de 4/4, en Do mayor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Linde de Brezal (praderas, bosque y colinas) · `linde_brezal.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: Linde de Brezal, la primera zona de aventura: praderas verdes, la orilla de un bosque y colinas suaves, con criaturas no muy peligrosas.
Clima: pastoral, tranquilo y luminoso, con algo de curiosidad; un paseo al aire libre con la espada en la mano.
Instrumentos: flauta dulce y arpa con la melodía, vientos de madera que imitan pájaros, cuerdas suaves y una pandereta muy leve.
Tempo: 95 BPM, compás de 3/4, en Mi mayor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Montañas Grises · `montanas_grises.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: las Montañas Grises, laderas de piedra y nieve, viento frío, gigantes y, en la cumbre, un cíclope que no deja pasar a nadie.
Clima: majestuoso, solitario y duro; la grandeza de la montaña y el frío.
Instrumentos: chelo solo con la melodía, cuerdas que suenan como viento, coro de fondo sin palabras (solo "ah"), cornos graves y campanas lejanas.
Tempo: 80 BPM, compás de 4/4, en La menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Pantano de Niebla · `pantano_niebla.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: el Pantano de Niebla: agua quieta, niebla espesa, hongos que brillan, trolls que se curan solos y criaturas que salen del barro.
Clima: misterioso, húmedo e inquietante, pero sin llegar a dar miedo; caminar con cuidado entre la niebla.
Instrumentos: clarinete grave con la melodía, marimba lenta como gotas de agua, cuerdas con sordina, notas largas y graves de fondo.
Tempo: 75 BPM, compás de 4/4, en Mi menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Ruinas del Vigía · `ruinas_vigia.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: las Ruinas del Vigía, lo que queda de una torre antigua: gólems que todavía hacen guardia, muertos que no descansan y, en el fondo, una grieta de la que salen demonios.
Clima: solemne y amenazante; un lugar sagrado que se volvió peligroso. Zona de nivel alto.
Instrumentos: cuerdas graves, campanas lejanas, arpa con arpegios oscuros, coro grave sin palabras y timbales espaciados.
Tempo: 80 BPM, compás de 4/4, en Do menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Tierras del Dragón · `tierras_dragon.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: las Tierras del Dragón, la zona más peligrosa del juego: llanos de ceniza, nidos de wyverns y, en lo más alto, la caldera donde duerme una dragona sobre un montón de oro y huesos.
Clima: tenso y épico, con peligro constante y calor; que se sienta el final del viaje.
Instrumentos: timbales y tambores graves marcando el pulso, metales graves, cuerdas rápidas en ostinato y una melodía de cornos.
Tempo: 110 BPM, compás de 4/4, en Re menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Mazmorras · `mazmorra.mp3`

```
Componé un tema instrumental para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime.

Lugar: las mazmorras, pisos subterráneos que se exploran de a uno: criptas y cuevas oscuras con trampas, llaves, puertas cerradas y tesoros.
Clima: oscuro, con eco y tensión contenida; explorar con cuidado, sin apuro.
Instrumentos: cuerdas pulsadas muy espaciadas, notas graves sostenidas, percusión suave como gotas que caen, y una melodía corta de flauta grave que aparece y desaparece.
Tempo: 70 BPM, compás de 4/4, en Fa sostenido menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra. Mezcla suave, pensada para sonar de fondo.
Entregámelo como archivo MP3 descargable.
```

### Combate · `combate.mp3`

```
Componé un tema instrumental de combate para un videojuego de rol táctico de fantasía por turnos, con gráficos pixel art de estilo anime.

Momento: las peleas normales contra monstruos en un tablero isométrico. Se juega por turnos y se piensa cada jugada, así que tiene que tener energía sin ser frenético.
Clima: enérgico, valiente y decidido.
Instrumentos: cuerdas en ostinato llevando el ritmo, redoblante y timbales, melodía heroica en metales (trompetas y cornos) y contramelodía en vientos de madera.
Tempo: 130 BPM, compás de 4/4, en Mi menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra.
Entregámelo como archivo MP3 descargable.
```

### Combate contra jefe · `jefe.mp3`

```
Componé un tema instrumental de combate contra un jefe para un videojuego de rol táctico de fantasía por turnos, con gráficos pixel art de estilo anime.

Momento: la pelea contra un monstruo enorme al final de cada zona (un ogro jefe, un cíclope, un demonio, una dragona).
Clima: intenso, dramático y amenazante; más grande y oscuro que el combate normal.
Instrumentos: orquesta completa, cuerdas rápidas, timbales y tambores graves fuertes, metales graves, y coro de fondo sin palabras (solo vocales).
Tempo: 140 BPM, compás de 4/4, en Do sostenido menor.
Duración: unos 2 minutos.

Tiene que repetirse en bucle sin que se note el corte: que el final enganche con el principio, en el mismo acorde, tempo y volumen. Sin final, sin fundido de salida y sin silencio al principio ni al final.
Sin voces ni letra (el coro, si está, solo con vocales).
Entregámelo como archivo MP3 descargable.
```

### Victoria · `victoria.mp3`

```
Componé una fanfarria corta de victoria para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime. Suena una sola vez al ganar una pelea.

Clima: triunfal y alegre.
Instrumentos: trompetas y cornos con una frase corta y brillante, cuerdas y timbales.
Tempo: 120 BPM, en Do mayor.
Duración: 6 a 8 segundos. Termina en un acorde mayor brillante y sostenido que se apaga solo (este tema NO se repite).
Sin voces ni letra.
Entregámelo como archivo MP3 descargable.
```

### Derrota · `derrota.mp3`

```
Componé un tema corto de derrota para un videojuego de rol táctico de fantasía, con gráficos pixel art de estilo anime. Suena una sola vez al perder una pelea.

Clima: triste y suave, sin dramatismo exagerado; la sensación de tener que volver a intentarlo.
Instrumentos: piano solo con cuerdas suaves de fondo.
Tempo: lento, 70 BPM, en La menor.
Duración: 6 a 8 segundos. Termina en un acorde suave y sostenido que se apaga solo (este tema NO se repite).
Sin voces ni letra.
Entregámelo como archivo MP3 descargable.
```

## Temas opcionales

Un lugar puede tener su propio tema con su clave; sin archivo, usa el de su grupo. Para estos, usá cualquiera de los pedidos de arriba como modelo y cambiá solo el lugar, el clima, los instrumentos y el tempo:

| Archivo | Lugar | Clima e instrumentos |
|---|---|---|
| `taberna.mp3` · `ps_taberna.mp3` · `fc_cantina.mp3` | Tabernas | Animado, folk de taberna: violín, tambores de mano, palmas, 120 BPM en Re mayor |
| `cripta_vigia.mp3` | Cripta del Vigía | Solemne, cripta real olvidada: cuerdas lentas como un órgano, campanas tenues, 65 BPM en Si menor |
| `cuevas_eco.mp3` | Cuevas del Eco | Cuevas profundas: láminas metálicas con mucho eco, notas graves sostenidas, 70 BPM en Re menor |
| `subastas.mp3` | Casa de subastas | Elegante con algo de suspenso: clave (clavecín) y cuerdas, 110 BPM en Si bemol mayor |

## Efectos de sonido

Los arma el juego al momento (`src/audio/sfx.ts`), sin archivos:

- **Interfaz**: clic, abrir y cerrar panel, error.
- **Herrería**: martillazo (bueno, perfecto, con defecto), pieza arruinada, templado al terminar, poción, sinergia nueva.
- **Dinero**: monedas al cobrar, pago al gastar.
- **Expedición**: recoger material, partir.
- **Combate**: golpe, crítico, falla, flecha, magia, fuego, hielo, rayo, curación, refuerzo, estado alterado, empuje, caída, aparición, golpe anunciado.
- **Logros**: subir de nivel, victoria y derrota (si no hay archivo `victoria`/`derrota`).
