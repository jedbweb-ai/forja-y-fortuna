# Forja & Fortuna

Juego de gestión y RPG táctico: sos un herrero en un mundo de fantasía. El diseño completo está en [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) (fuente de verdad).

**Estado: Fase 1 (base y forja) terminada.**

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
`?debug=1` en la URL, o 5 toques rápidos en el ⚒️ del HUD. Aparece el botón 🐞: oro, materiales, avanzar franjas/días, subir habilidades, reputación, relaciones con NPCs, revelar sinergias y reiniciar el límite diario de charlas.

## Arquitectura

```
src/
  core/         Lógica pura en TypeScript (sin Phaser ni React) + tests
    forge/      diseño, sinergias, golpes, rareza, valor, comandos de forja
    economy/    tienda, clientes, regateo, mercado
    city.ts     movimiento por la ciudad, NPCs presentes por franja
    dialogue.ts motor de diálogos (condiciones y efectos)
    time.ts     días y franjas
  data/         Contenido data-driven (materiales, planos, sinergias, rasgos, temple,
                acabados, runas, clientes, NPCs, diálogos, ciudades) + validador
  config/       balance.ts: todos los números de balance
  persistence/  formato de guardado versionado, migraciones, repositorio IndexedDB
  bridge/       GameStore: estado único, comandos, eventos, autoguardado
  game/         Phaser: mapa de la ciudad, escenas vivas isométricas, placeholders
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

## Pendiente para próximas fases
Ver el plan en `docs/GAME_DESIGN.md` §15. Lo próximo es la Fase 2: región explorable, recolección, combate táctico, bestiario inicial y compañeros.
