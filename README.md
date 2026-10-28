# Forja & Fortuna

Juego de gestión y RPG táctico: sos un herrero en un mundo de fantasía. El diseño completo está en [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) (fuente de verdad).

**Estado: Fase 3 (profundidad de la forja y magia) terminada.**

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
`?debug=1` en la URL, o 5 toques rápidos en el ⚒️ del HUD. Aparece el botón 🐞: oro, materiales, kit de equipo de prueba, contratar mercenarios, kit mágico (grimorios, joyas con habilidades, arrojadizos, bombas, hoz y pociones en el cinturón), combates de prueba (gelines, goblins, bestias, jefe), curar al grupo, avanzar franjas/días, subir habilidades, reputación, relaciones con NPCs, revelar sinergias y reiniciar el límite diario de charlas. En modo debug la consola tiene `fyf` (el store), `fyfCmd` (comandos de expedición y combate) y `fyfGame` (Phaser).

## Arquitectura

```
src/
  core/         Lógica pura en TypeScript (sin Phaser ni React) + tests
    forge/      diseño, sinergias, golpes, rareza, valor, comandos de forja
    economy/    tienda, clientes, regateo, mercado
    party/      personajes, atributos, equipo, perfil de combate, mercenarios
    combat/     motor táctico: grilla con alturas, daño, estados, terreno (hielo, llamas, charcos), áreas, IA, botín
    magic/      habilidades activas de los objetos, grimorios, alquimia y cinturón de pociones
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

## Pendiente para próximas fases
Ver el plan en `docs/GAME_DESIGN.md` §15. Lo próximo es la Fase 4: economía, ciudad y relaciones.
