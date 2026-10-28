# Forja & Fortuna

Juego de gestión y RPG táctico: sos un herrero en un mundo de fantasía. El diseño completo está en [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) (fuente de verdad).

**Estado: las seis fases del documento de diseño están hechas, más las regiones de nivel alto. Lo próximo es el arte definitivo.**

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173  (agregá ?debug=1 para el modo debug)
npm test           # tests de la lógica (Vitest)
npm run build      # build de producción + PWA en dist/
npm run preview    # sirve dist/ para probar la PWA y el modo offline
npm run icons      # regenera los íconos placeholder de la PWA
```

Para probar en el celular: `npm run dev -- --host`, abrir la IP de la compu desde el celu (misma red) y girarlo a horizontal.

### Modo debug
`?debug=1` en la URL, o 5 toques rápidos en el ⚒️ del HUD. Aparece el botón 🐞: oro, materiales, kit de equipo de prueba, contratar mercenarios, kit mágico (grimorios, joyas con habilidades, arrojadizos, bombas, hoz y pociones en el cinturón), combates de prueba (gelines, goblins, bestias, jefe), curar al grupo, avanzar franjas/días, subir habilidades, reputación, relaciones con NPCs (también la lealtad de los compañeros), revelar sinergias, reiniciar el límite diario de charlas, disparar un evento de ciudad, poner la subasta para hoy, renovar avisos y contratos, dar por cumplidas las cacerías de los encargos, abrir las mazmorras, revelar el piso (con una llave de regalo), bajar un piso sin buscar la escalera y hacer volver a los jefes. En modo debug la consola tiene `fyf` (el store), `fyfCmd` (comandos de expedición y combate) y `fyfGame` (Phaser).

## Arquitectura

```
src/
  core/         Lógica pura en TypeScript (sin Phaser ni React) + tests
    forge/      diseño, sinergias, golpes, rareza, valor, comandos de forja
    economy/    tienda, clientes, regateo, mercado
    party/      personajes, atributos, equipo, perfil de combate, mercenarios
    combat/     motor táctico: grilla con alturas, daño, estados, terreno (hielo, llamas, charcos), áreas, IA, botín
    magic/      habilidades activas de los objetos, grimorios, alquimia y cinturón de pociones
    town/       relaciones y regalos, encargos, contratos, demanda, eventos de ciudad, subasta y compañeros por lealtad
    dungeon/    mazmorras: generación de pisos con salas hechas a mano, niebla, secretos, trampas, descansos y jefes
    progress/   talentos por habilidad, mejoras de la herrería, ayudante de la tienda y tamaño del grupo
    world/      regiones, encuentros por presupuesto de amenaza, expediciones
    city.ts     movimiento por la ciudad, NPCs presentes por franja
    dialogue.ts motor de diálogos (condiciones y efectos)
    time.ts     días y franjas
  data/         Contenido data-driven (materiales, planos, sinergias, rasgos, temple,
                acabados, runas, clientes, NPCs, diálogos, ciudades) + validador
  config/       balance.ts: todos los números de balance
  persistence/  formato de guardado versionado, migraciones, repositorio IndexedDB
  bridge/       GameStore: estado único, comandos, eventos, autoguardado
  game/         Phaser: mapa de la ciudad, escenas vivas, mapa del mundo, región y arena de combate
  ui/           React: HUD, paneles (forja, tienda, mercado, inventario, libro, ajustes, debug)
  debug/        comandos del modo debug
```

- Cada comando del juego es `(estado, {contenido, rng}, ...args) => eventos`. El `GameStore` lo corre sobre una copia: si falla, el estado no cambia.
- React y Phaser solo leen el estado y mandan comandos; nunca se hablan entre sí.
- **Arte placeholder**: todas las texturas se generan en `game/render/placeholders.ts` con claves estables (`char.herrero`, `prop.anvil`…). Para usar sprites reales alcanza con cargarlos con las mismas claves en `BootScene`.
- **Guardado**: IndexedDB, autoguardado tras cada acción y al minimizar. El formato (`SaveFile` con `version`) está listo para sumar un repositorio en la nube con la misma interfaz `SaveRepository`.
- **RNG con semilla** guardada en la partida: la forja y los clientes son reproducibles.

## Decisiones de la Fase 1

- **Salir a la ciudad consume la franja**: ir al mercado o la taberna no cuesta nada al entrar, pero al volver al taller se gasta la franja (podés visitar varios lugares en la misma salida). Mientras estás afuera no podés forjar ni abrir la tienda.
- **Forjar** consume las franjas del plano al terminar la pieza; **atender la tienda** consume una franja.
- **Golpes**: cada golpe se resuelve en el momento y la UI muestra antes el riesgo de defecto, la ganancia de calidad y el tier de rasgo habilitado (3, 6 y 9 golpes). Con 3 defectos la pieza se arruina.
- **Temple** solo aplica si la pieza tiene alguna parte de metal.
- **Encantamiento** con 3 runas pasivas básicas (piedra rúnica + parte de monstruo). Los lotes de munición no se encantan todavía.
- **Rareza**: los 5 niveles están activos; épico y legendario son muy difíciles con los materiales de esta fase.
- **Partes de monstruo**: 3 se compran en el mercado (gel de slime, colmillo de lobo, ascua de salamandrilla) para mostrar ya su uso como material.
- **Relaciones**: el valor se registra y los diálogos lo mueven (con límite de una charla por día y por NPC). Los niveles, regalos y desbloqueos completos llegan en la Fase 4.

## Decisiones de la Fase 2

- **Acciones de combate por tipo de arma** (y escudo): siguen saliendo del equipo. Daga: puñalada por la espalda; espada: tajo giratorio; maza: golpe aplastante; arco: disparo apuntado; escudo: cubrirse y empujón. Los rasgos y runas ya forjados (sangrado, quemadura, crítico...) funcionan en combate.
- **Expediciones**: 1 franja de ida y 1 de vuelta; cada 10 de energía gastada pasa una franja. La energía base alcanza para unas 2 franjas de exploración (la exploradora suma 10).
- **Derrota**: se pierde la mitad de la bolsa, se despierta en la ciudad a la mañana y los compañeros quedan heridos 2 días. Huir pierde el 25% de la bolsa.
- **Combate en arenas chicas** (10×8) según el terreno de la zona, con alturas, agua, hierba alta y obstáculos.
- **Mercado de partes de monstruo**: stock limitado y precio caro, con 1 o 2 noticias por día que mueven la oferta (cazadores que vuelven, plagas de gelines, asaltos goblin...). Los materiales comunes siguen sin límite.
- **Hoz y hierbas** quedan para la Fase 3, junto con las pociones.
- **Botín según cómo se mata**: el fuego quema cueros, sedas y geles; aplastar una araña revienta su glándula. Sin cuchillo de desuello no hay cueros.
- **Requisitos**: el equipo pide fuerza según su peso y voluntad según sus encantamientos; sin cumplirlos rinde menos. El equipo roto rinde la mitad hasta repararlo en la forja.
- Las partidas de la Fase 1 se migran solas al formato nuevo (versión 2 del guardado).

## Decisiones de la Fase 3

- **Dos fuentes de encantamiento**: las **runas** se graban en la mesa de runas (una sesión de trazos como la forja, con su calidad) y se gastan al encantar una pieza. Los **grimorios** se leen una vez y enseñan encantamientos para siempre; después se aplican con reactivos y oro, sin runa. Algunos piden una pieza de cierta rareza.
- **Habilidades activas fabricadas**: sus usos por combate y su recarga dependen de cómo se hizo la pieza (rareza, calidad, calidad de la runa, afinidad del arma y rasgos). Las joyas del mismo elemento las potencian. Así las habilidades fuertes son escasas y hay que combinarlas con las acciones del arma, los arrojadizos y las pociones.
- **Joyería**: 2 anillos y 1 amuleto por personaje, en su propia mesa. Las gemas dan defensa, resistencia a su elemento y piden voluntad.
- **Arrojadizos** (cuchillos, hachas, estrellas, bombas) en el cinturón de cada personaje, por lote. La bomba toma el elemento de su carga.
- **Pociones del grupo**: un cinturón compartido de 6 pociones. En combate se le dan a uno mismo o a un aliado al lado; durante la expedición se pueden tomar las de curación.
- **Alquimia**: 2 o 3 ingredientes suman propiedades y eligen la receta; el fuego suave, medio o fuerte cambia la potencia y el riesgo. Hay recetas secretas y recetas que dan materiales (líquidos de temple, esencias para grimorios).
- **Terreno en combate**: el hielo congela el agua (se puede cruzar y atrapa a quien estaba en ella), el fuego prende la hierba alta y se propaga, el agua apaga las llamas y el rayo corre por el agua y los charcos. Se pueden sumar más reglas en `core/combat/terrain.ts`.
- **Ciudad**: abren la alquimia de Bastián (hierbas y reactivos) y la librería de Teodora (grimorios y planos). En las regiones aparecen hierbas (con hoz; alguna solo de noche), depósitos de gemas y cofres.
- Las partidas anteriores se migran solas (versión 3 del guardado) y reciben los NPC y recetas nuevos del contenido.

## Decisiones de la Fase 4

- **Reputación por niveles** (mal vista, desconocida, conocida, respetada, renombrada, famosa, legendaria): trae mejores clientes y habilita encargos y contratos mejores. Baja si fallás encargos o rompés contratos, y con los rumores de quien te odia.
- **Relaciones con efectos reales**, definidos por NPC en sus datos (`unlocks` con `perks`): descuentos, mercadería exclusiva, enseñanzas (planos, recetas, combinaciones, grimorios) y rumores en el tablón. Con relación mala, el dueño de un lugar te cobra más y, si es hostil, no te atiende; un NPC hostil habla mal de vos. Ruperto enojado te saca clientes, puja en tu contra en la subasta y a veces se queda con un contrato.
- **Regalos**: uno por persona por día (además de la charla). Cada NPC ama, le gusta, le da igual o le disgusta según ids, tipos, categorías, tags, afinidades y acabados. Una pieza forjada por vos vale más que un material suelto, y suma por calidad. Los gustos se van descubriendo en el panel de Contactos.
- **Encargos** del gremio y del tablón (rotan cada 2 días) y **pedidos personales** que los NPC ofrecen charlando (con cadenas, por ejemplo la del capitán Tizón que termina en Gruñaz). Tipos: pieza con requisitos, materiales, cacería y jefe. Fallar o abandonar baja la reputación y la relación.
- **Contratos de mercaderes**: volumen fijo con entregas periódicas y precio por unidad que no depende de la demanda. Se cobra al entregar (sin seña); si vence una entrega sin cumplir, se rompe y perdés reputación y relación.
- **Demanda por categoría**: vender mucho de lo mismo baja el precio (en la tienda y en la venta rápida) y se recupera día a día hacia lo que piden los eventos. Aventureros, cazadores y guardias compran pociones y arrojadizos; se sumó el **mago**, que busca joyas, runas y piezas encantadas.
- **Eventos de ciudad** (torneo, festival, plagas, huelga, caravana, boda noble, inspección...): duran días, mueven demanda, precios y clientes, y algunos piden tomar partido en el tablón.
- **Gran subasta** cada 7 días, anunciada 3 días antes. Comprás pujando por rondas contra postores con estilo propio (caprichoso, paciente, impulsivo, cauto, rival); lo que consignás se vende solo y ves las pujas. La casa cobra el 10%. Si no vas, vende igual lo consignado. Tiene lotes únicos (planos, grimorios, piezas con historia).
- **Mercado de esclavos y lealtad**: candidatos que rotan cada semana, se compran una vez y no cobran. La lealtad es la relación: sube con equipo, victorias, charlas, regalos y su pedido personal; baja si salen sin equipo o caen heridos. Con lealtad baja rinden menos; hostiles, desobedecen el 20% de los turnos (la IA juega por ellos) y pueden escaparse con lo puesto tras una derrota o huida. Liberarlos les da lealtad máxima y empiezan a cobrar. Se pueden dejar esperando en la herrería.
- **Mercenarios**: con relación de amigo cobran 15% menos (aliado, 30%) y no se van aunque les debas.
- Las partidas anteriores se migran solas (versión 4 del guardado) y reciben los NPC nuevos con su lealtad inicial.

## Decisiones de la Fase 5

- **Dos mazmorras**: la **Cripta del Vigía** (3 pisos, no-muertos) y las **Cuevas del Eco** (5 pisos, constructos de piedra y algo de no-muertos). La entrada de la cripta se descubre pisando una escalera escondida en las colinas de Brezal, o te la cuenta el capitán Tizón. Las cuevas se abren con reputación "respetada".
- **Pisos con piezas hechas a mano**: cada piso es una grilla de salas de 7×7 dibujadas a mano (`data/dungeons.ts`) que el generador combina al azar. Siempre hay camino de la entrada a la escalera; los secretos van en salas sin salida, así nunca te traban. Cada vez que bajás, los pisos son distintos.
- **Niebla**: ves un poco alrededor y la sala entera en la que estás. Lo descubierto queda descubierto.
- **Secretos**: paredes falsas (se descubren con **Examinar**), rejas que abre una palanca en otra sala, puertas cerradas con la llave del piso e inscripciones con acertijos (acertar da oro, materiales o una combinación secreta; errar despierta una emboscada).
- **Trampas, pocas y simples**: dardos (lastiman al grupo sin matar) y alarmas (despiertan a un grupo). Examinar desarma las que estén cerca.
- **Retirada**: solo se vuelve desde los descansos de las escaleras. Al bajar se recupera la mitad de la energía y un 30% de la vida. Sin energía no te echa: el grupo sigue, pero agotado (rinde 15% menos en combate). Si el grupo cae, pierde la mitad de lo juntado.
- **Jefes con mecánicas propias**: Ulmar, el Vigía Caído, anuncia su golpe (marca casillas en rojo y pega al turno siguiente) y a mitad de vida llama a su guardia. El Gólem del Eco no recibe daño mientras resuenen sus cristales, también anuncia golpes y a mitad de vida se enfurece. Los jefes vuelven cada 7 días y dejan sus materiales.
- **Tesoros únicos** (una sola vez por partida): planos antiguos (cimitarra, arco largo, escudo torre), el grimorio Liturgia de Ceniza (filo consagrado y velo sombrío) y combinaciones secretas con los materiales de los jefes.
- **Familias y materiales nuevos**: no-muertos (esqueleto, arquero, espectro, caballero caído, nigromante) y constructos (gólem menor, gárgola, centinela, vigía rúnico). Hueso denso, polvo espectral, piedra encantada, núcleo rúnico, gema antigua, acero juramentado y Corazón del Eco, todos con usos en la forja: combinaciones, temple (bruma espectral), runas (de Hueso y del Centinela) y una receta secreta.
- **Arenas de mazmorra** con columnas, sarcófagos, canales y **lava** (arde todo el combate). Encargos nuevos del gremio y del tablón para las mazmorras.
- Las partidas anteriores se migran solas (versión 5 del guardado).

## Decisiones de la Fase 6A (progresión y herrería)

- **Talentos**: cada nivel de una habilidad (después del primero) da un punto para su árbol. Hay talentos para todas las habilidades (más calidad, menos defectos, más rasgos y perfectos, intuición para anotar combinaciones, armas y armaduras más fuertes, lotes más grandes, joyas y runas mejores, alquimia más segura, recolección extra, mejor regateo y venta rápida, y combate, carga y energía del herrero). Están en `data/progress.ts`.
- **Mejoras de la herrería** (oro y materiales): yunque, banco de flechería, mesas de joyería, runas y alquimia, vitrinas (de 8 a 12 y 16 lugares), decoración (más nobles, coleccionistas y magos) y el **cuarto para compañeros**, que con reputación renombrada agranda el grupo a 4.
- Talentos y mejoras suman **bonos con nombre** que cada sistema lee con `bonus()`: se agregan talentos o mejoras nuevas sin tocar la lógica.
- **Ayudante**: un compañero con relación "amigo" o más (o uno liberado) atiende la tienda en las franjas en que no atendés vos. Vende lo exhibido sin regatear, al 80%, cobra su sueldo y no sale de expedición.
- **Muerte permanente**: opción en Ajustes, apagada por defecto. Solo para compañeros y solo en mazmorras de 5 estrellas o más.
- Las partidas anteriores se migran solas (versión 6 del guardado).

## Decisiones de la Fase 6B (varias ciudades y viajes)

- **Tres ciudades**: Valdebrasa (con tu herrería), **Puertoseco** (puerto: marineros, arrojadizos y herramientas, ébano, coral y perlas negras que llegan por barco) y **Fuerte Ceniza** (frontera: soldados, armaduras, escudos, flechas y acero negro).
- **Viajes** desde el mapa del mundo: tardan franjas y a veces sale algo al cruce. Se pelea en el camino y después se sigue viaje; si el grupo cae, unos bandidos se llevan parte del oro.
- **La herrería queda en Valdebrasa.** En las otras ciudades se compra, se vende rápido, se arma un **puesto ambulante** en el mercado (la misma tienda, con los clientes de esa ciudad), se aceptan encargos y contratos, y se duerme en la **posada** (la noche se paga).
- Cada ciudad tiene su reputación, sus clientes (marineros, soldados), su **demanda**, sus NPC, encargos, contratos y eventos. Los lugares tienen ids únicos en todo el mundo, así que sumar una ciudad es agregar datos (`data/cities6.ts`, `data/content6b.ts`).
- Las expediciones y mazmorras vuelven a la ciudad desde donde saliste.
- Las partidas anteriores se migran solas (versión 7 del guardado).

## Decisiones de la Fase 6C (más mundo)

- **Montañas Grises** (faldas, riscos y cumbre, que van subiendo) y **Pantano de Niebla** (orilla, ciénaga y corazón), cada una con su jefe: **Rocamuda**, el cíclope que anuncia avalanchas, y **Madre Ciénaga**, una troll que se cura sola cada turno.
- **Gigantes** (ogro que empuja, troll que se regenera, cíclope que tira rocas) y **elementales** de agua, fuego, viento y tierra, cada uno débil a su contrario. Arenas de montaña (con alturas) y de pantano (con agua).
- Materiales nuevos con sus usos: hueso de gigante y piel gruesa (armaduras pesadas), sangre de troll (temple que regenera y una receta secreta), cristales de marea y magma, piedra viva, y los trofeos de los jefes con combinaciones secretas.
- **Tiendas especializadas** en Valdebrasa: curtiembre, aserradero y joyería, cada una con su dueño, descuentos y mercadería exclusiva.
- Encargos nuevos de cacería y de jefes.

## Decisiones de la Fase 6D (balance y pulido)

- **Simulación de balance** en `src/core/balance.test.ts`: el grupo y los monstruos pelean solos con la IA en todas las zonas y pisos, en etapas de inicio y de mitad de juego. Es pesimista, porque la IA no usa pociones ni esquiva los golpes anunciados. Sirve para ver tendencias, no números exactos. También revisa que forjar con materiales comunes siempre deje ganancia y que 120 días seguidos no rompan nada.
- **Etiqueta de peligro recalibrada**: grupos que se perdían 1 de cada 4 veces figuraban como "fácil". Ahora "fácil" es casi siempre una victoria cómoda y "difícil" o "mortal" avisan de verdad. El factor y los umbrales están en `BALANCE.expedition` (`dangerPowerFactor`, `dangerThresholds`).
- **Jefes de la Fase 6C más justos**: Rocamuda va con un solo ogro y pega un poco menos. Madre Ciénaga se cura 8 por turno (antes 10), llama a un solo elemental y ya no la acompaña un troll. Quedan a la par de Ulmar en la Cripta.
- **Bug corregido en la IA**: una unidad que se movía y después se curaba a sí misma apuntaba a la casilla donde estaba antes, y el combate tiraba error (le pasaba al chamán del tótem).
- **Atajos de teclado** opcionales en computadora. La tecla se ve en cada botón solo si hay mouse, y la lista completa está en Ajustes:
  - G/I/L/E/C: grupo, inventario, libro, encargos y contactos.
  - F/T/D en el taller: forjar, tienda y descansar.
  - X/M: mapa del mundo y de la ciudad.
  - B/V de expedición: bolsa y volver.
  - En combate: M para mover, 1-9 para las acciones y T para terminar el turno.
  - 1-9 en los diálogos, Enter para confirmar o continuar y Esc para cerrar o cancelar.

## Prueba general antes del arte

- **Partida simulada** en `src/core/playthrough.test.ts`: un jugador automático juega 60 días con los mismos comandos que la interfaz. Forja, vende regateando, contrata, sale de expedición, pelea, cumple encargos y compra talentos y mejoras. Falla si aparece un error interno. Con `FYF_LOG=1 npx vitest run src/core/playthrough.test.ts --reporter=verbose` muestra cómo avanzó la partida. En una corrida típica, la reputación pasa de 0 a unos 60, el herrero llega a nivel 7 y se arma un grupo de 3.
- **Para probar en el celular**: `npm run build` y después `npm run preview -- --host`. Se abre la dirección "Network" que muestra la consola, desde un teléfono en la misma red Wi‑Fi. Instalarlo como app y jugar sin conexión requiere HTTPS, así que eso se prueba cuando esté publicado.
- Correcciones: la flecha del turno en combate quedaba flotando lejos de la unidad después de moverse. El aviso de derrota hablaba de "huida".
- Más atajos: Espacio y F en el yunque. Enter, A y N en la tienda. Enter para empezar, seguir y terminar una pieza, y para continuar en la pantalla de título.

## Regiones de nivel alto

- **Ruinas del Vigía (★6)**: lo que queda de la torre, arriba de su cripta.
  - Tres zonas: patio derrumbado, galerías rotas y la Grieta.
  - Su jefe es **Malgor, señor de la Grieta**, que anuncia una lluvia de azufre en círculo.
  - Se abre con reputación renombrada (70) en Valdebrasa.
- **Tierras del Dragón (★9)**: tres zonas, los llanos de ceniza, los nidos de wyvern y la Caldera.
  - Su jefa es **Cendralia**, que anuncia su aliento de fuego en cono y en la segunda fase barre con la cola.
  - Se abre al vencer a Malgor.
  - En el mapa, cada región cerrada muestra qué le falta. Las condiciones están en los datos (`unlock` de cada región).
- Dos familias nuevas que estaban en el documento:
  - **Demonios**: diablillo, demonio cornudo, sombra abisal y señor demoníaco.
  - **Dracónidos**: kobold, kobold chamán, wyvern, draco joven y dragona.
- Materiales y combinaciones nuevos:
  - Garras, cuernos y sangre infernal, que también sirve de temple.
  - Escamas, colmillos y cuero de wyvern.
  - Dos trofeos de jefe con combinaciones secretas.
  - Las combinaciones incluyen dos del documento: hierro con garras de demonio da daño oscuro y sangrado, y la escama de dragón resiste el fuego y dura mucho.
- Encargos nuevos del gremio y del tablón para las dos regiones.
- Las zonas pueden pedir un nivel mínimo de monstruo (`minTier`), así en las zonas profundas no salen los más débiles de la familia. Cada región tiene su propia arena para el jefe.
- **Balance** medido con la simulación (`src/core/simulation.ts`):
  - Un grupo de nivel medio no aguanta la Caldera.
  - Uno avanzado, de 4 integrantes y con materiales de nivel 3, la cruza, pero sufre contra los dos jefes.
- Correcciones:
  - La combinación "Placas de gigante" era imposible, porque el hueso de gigante no entraba en el peto. Ahora el validador revisa que cada combinación se pueda lograr.
  - El panel de expedición decía "en las colinas" para cualquier jefe, mostraba nombres internos de familias ("no_muertos") y escribía "2 franja".

## Pendiente para próximas fases
- **Arte definitivo** con una herramienta de imágenes por IA, en lugar de los gráficos provisorios.
- Tutorial (más adelante, a decidir).
