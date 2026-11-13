# Estado del proyecto (13 de noviembre de 2026)

Resumen para retomar en un chat nuevo. El diseño completo está en `docs/GAME_DESIGN.md` y las decisiones de cada etapa, en `README.md`.

## Cómo se trabaja

- **Reglas de `GAME_DESIGN.md` §0**:
  - Proponer un plan por etapa y esperar el OK antes de programar.
  - Preguntar ante cualquier ambigüedad.
  - No sumar librerías ni configuraciones sin consultar.
  - Todo el contenido es original: no nombrar otros juegos en los pedidos de arte.
- **Publicación**: cada push a `main` corre los tests, arma el juego y lo publica en https://jedbweb-ai.github.io/forja-y-fortuna/.
- **Arte**: el usuario lo genera con ChatGPT desde `herramientas/arte.html` (modo "📦 Pedidos en orden") y lo guarda en `src/assets/arte`.
  - Las hojas que quedan sueltas en esa carpeta se procesan a mano, como cualquier pedido.
  - Las ilustraciones de lugares llevan un plano sacado del juego y se calibran sobre la imagen.
  - Detalle completo: `docs/GUIA_DE_ARTE.md`.
- **Música**: el usuario la genera con ChatGPT y la deja en `src/assets/audio` (o en `arte/originales/musica/`). Se renombra a su clave en `src/assets/audio/musica/`. Detalle: `docs/GUIA_DE_SONIDO.md`.
- **Probar**: con `?debug=1` quedan `window.fyf` (el store) y `window.fyfGame` (Phaser). La copia de prueba del navegador del panel va en silencio, para no superponerse con el juego del usuario.

## Qué está hecho

- **Las 6 fases del documento**: forja, ciudad, venta, exploración, combate, mazmorras y progresión; además, las regiones de nivel alto.
- **Arte en alta calidad**:
  - Todas las figuras, íconos y retratos.
  - 23 lugares ilustrados, incluida la herrería, cada uno con la calle de afuera.
  - Las 3 ciudades ilustradas, el mapa del mundo y los marcadores.
- **Música**: 22 temas, que suenan sin corte y con el volumen igualado. Los efectos de sonido se generan por código.
- **Personal de la herrería**:
  - Vendedor, encargado y aprendiz de forja.
  - 8 empleados para contratar, con oficios y rasgos.
  - Los esclavos pueden trabajar; los mercenarios solo pelean.
- **Sucursales**: talleres propios en Puertoseco y Fuerte Ceniza, cada uno con su vidriera, su personal y sus pedidos.
- **Tutorial**: la guía de Anselmo con 7 primeros pasos y 14 consejos de una sola vez.
- **Partidas guardadas**: versión 10 (`src/persistence/saveFile.ts`, con migraciones desde la 1).
- **Tests**: 197.

## Pendiente

- Ilustraciones de los dos talleres de las sucursales: los pedidos, con su plano, ya están en la herramienta. Cuando lleguen, se calibran como los demás interiores (`src/game/render/illustratedPlaces.ts`).
- **Darles más vida a los lugares ilustrados.** El estilo está bien, pero falta lo que hace que se sientan naturales: árboles, plantas y faroles afuera de cada tienda, gente y cosas en la calle (bancos, macetas, carros, perros) y bordes que no terminen en vacío. Se puede resolver pidiendo nuevas versiones de las ilustraciones (sumando eso al pedido de interiores en `src/tools/assetList.ts`) o agregando adornos por código sobre la imagen.
- **En curso: rehacer cómo funcionan las expediciones y las batallas.** Abajo está cómo funcionan hoy. Plan aprobado en 4 etapas:
  1. **Cámara giratoria en combate (hecha).** La arena gira de a 90° con transición (⟲ ⟳ o Q/E), se arrastra, se acerca con dos dedos o la rueda, ⤢/R alterna entre la arena entera y la vista cercana, y lo que tapa a una figura se vuelve transparente. Todo pasa por `IsoView` (`src/game/render/view.ts`); la interfaz le habla a la escena por `src/bridge/combatView.ts`.
  2. **Arenas nuevas:** unas 16×16 casillas, alturas de hasta 6, rampas, muros, puentes, cobertura, línea de visión y enemigos por varios lados. Se rehacen las 24 arenas y se rebalancea.
  3. **Expediciones, dos formatos a prueba en Linde de Brezal:** A, mapa de rutas con paradas; B, exploración libre mejorada (caminar solo hasta donde se toca, mapa más lleno, recolectar en una acción). El usuario elige uno y se extiende a todas las regiones.
  4. **Arte nuevo** para lo anterior, pedido desde `herramientas/arte.html`.

## Expediciones y combate hoy

### El recorrido

1. **Elegir adónde ir.** En la herrería, el botón «Expedición» abre el mapa del mundo (`WorldMapScene`).
   - Se elige una región (`ExpeditionPanel`). Las regiones tienen peligro visible y algunas se abren con reputación o al vencer a un jefe.
   - Se elige el grupo: el herrero y hasta 2 compañeros, 3 con la mejora «Cuarto para compañeros».
   - Salir consume una franja de ida (`startExpedition` en `src/core/world/expedition.ts`).
2. **Recorrer la región.** Es un mapa isométrico por casillas (`RegionScene`, `src/core/world/region.ts`), con vetas, árboles, hierbas y animales.
   - Para recolectar hace falta la herramienta adecuada (`gather`).
   - Moverse y recolectar gasta **energía**, y cada 10 puntos pasa una franja (`spendEnergy`).
   - La **carga** es limitada (`expeditionCapacity`).
3. **Encuentros.** Hay grupos de monstruos visibles en el mapa, armados con un presupuesto de amenaza por zona (`src/core/world/encounters.ts`).
   - De noche hay más grupos y algunos son desafíos a propósito.
   - Si te acercás (`aggroRange`), empieza el combate (`engageGroup`).
4. **Combate.** Por turnos, en una arena chica con alturas (`CombatScene`, `src/core/combat/`).
   - `engine.ts`: arma el combate, el orden de turnos por velocidad, mover y usar habilidades.
   - `damage.ts`: el daño, con alturas, ataques de costado y por la espalda, defensa, elementos y críticos.
   - `grid.ts`: la grilla y el alcance.
   - `terrain.ts`: efectos del terreno, como agua que conduce el rayo o hielo.
   - `ai.ts`: la IA enemiga.
   - Las habilidades salen del equipo: tipo de arma, escudo y encantamientos.
   - Los compañeros esclavos pueden desobedecer según su lealtad.
5. **Resultado.** `result.ts` reparte el botín según cómo se mató al monstruo, por ejemplo el fuego quema el cuero.
   - Si perdés, se pierde el 50% de la bolsa y los compañeros quedan heridos 2 días.
   - Huir también tiene un costo.
   - Hay muerte permanente opcional, solo para compañeros en mazmorras peligrosas.
6. **Volver.** La vuelta consume una franja.

### Mazmorras

`src/core/dungeon/` trata cada piso como una región (`expMap`).

- **Pisos:** se arman con salas de 7×7 hechas a mano (`generate.ts`).
- **Trampas:** se ven con «Examinar».
- **Entre pisos:** se puede descansar o volver.
- **Jefe:** espera en el fondo y reaparece cada 7 días.
- **Tesoros:** hay tesoros únicos.

### Interfaz

- `RegionHud` y `DungeonHud`: la barra durante la expedición.
- `CombatHud`: acciones, objetivo y pociones del cinturón compartido.
- `GameStore.driveCombat`: hace jugar a la IA con pausas para las animaciones.

### Balance y tests

- **Números:** `src/config/balance.ts`, en las secciones `expedition` y `combat`.
- **Simulación:** `src/core/simulation.ts` y `src/core/balance.test.ts` simulan peleas con la IA en los dos bandos para calibrar.
- **Tests:** `src/core/combat/*.test.ts`, `src/core/world/*.test.ts` y `src/core/dungeon/dungeon.test.ts`.

### Datos

- **Regiones:** `src/data/regions.ts` y `content6c.ts`/`content7.ts`.
- **Monstruos:** `monsters*.ts`.
- **Arenas:** `arenas.ts`.
- **Habilidades:** `combatSkills.ts` y `abilities.ts`.
- **Mazmorras:** `dungeons.ts`.
