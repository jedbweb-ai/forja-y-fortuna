# Proyecto: "Forja & Fortuna"
Juego de gestión y RPG táctico donde el jugador es un herrero en un mundo de fantasía estilo JRPG/anime.

---

## 0. Rol y forma de trabajo
Sos un desarrollador senior de videojuegos web y diseñador de sistemas de juego. Vamos a construir este juego por fases.

Antes de escribir código:
1. Leé todo este documento.
2. Guardalo en el repo como `docs/GAME_DESIGN.md`. Es la fuente de verdad del diseño; releelo al empezar cada sesión.
3. Proponé la arquitectura (estructura de carpetas, módulos, modelo de datos, escenas) y el plan de fases.
4. Esperá mi OK antes de empezar.

Reglas de trabajo:
- Al cerrar cada fase, el juego corre sin errores. Decime cómo probarlo, qué quedó hecho y qué quedó pendiente.
- No agregues librerías, features ni configuraciones fuera de este documento sin consultarme primero.
- Si algo del diseño es ambiguo o contradictorio, preguntá antes de decidir.
- Todo el contenido (nombres, criaturas, lugares, lore, diseños) tiene que ser original. Se puede tomar inspiración de géneros y mecánicas, pero sin usar nombres, personajes ni contenido de franquicias existentes.
- **Todos los ejemplos de este documento son ilustrativos, no listas cerradas.** Materiales, combinaciones, monstruos, rasgos, encantamientos, NPCs y eventos mencionados acá muestran el estilo y la lógica esperados. Tu trabajo incluye diseñar mucho más contenido siguiendo esa misma lógica.

---

## 1. Concepto
El jugador es un **herrero** en un mundo de fantasía con magos, dragones, mazmorras, demonios y monstruos de todo tipo.
No es un héroe que aprende magia: es un artesano. **Todo su poder, y toda la magia del juego, viene de los objetos que fabrica.**

Forja armas, munición, armaduras, joyería, herramientas y pociones. Los vende en distintos canales y los usa para equiparse a sí mismo y a sus compañeros.

**La forja es el corazón del juego de principio a fin.** Lo más entretenido es crear objetos cada vez más increíbles y únicos: diseñarlos, verlos, venderlos y usarlos. A lo largo de toda la partida, la forja se va volviendo más profunda (nuevos materiales, rasgos, encantamientos, combinaciones), y cada objeto memorable que el jugador fabrica tiene que sentirse como un logro.

El juego combina estos pilares conectados:
1. La forja.
2. La ciudad y sus relaciones.
3. La venta.
4. La exploración y recolección.
5. El combate táctico.
6. Las mazmorras.

---

## 2. Ambientación y estilo
- Mundo de fantasía estilo JRPG / anime japonés: colorido, aventurero, con humor en momentos, y épico en los combates importantes.
- Estética: pixel art isométrico con personajes de proporciones estilo anime/chibi y efectos de habilidades llamativos (fuego, hielo, rayo, luz, oscuridad).
- Hasta definir el arte final, usar gráficos placeholder generados por código.
- Dejar el sistema preparado para reemplazarlos por sprites isométricos sin tocar la lógica.

---

## 3. Plataforma y stack técnico
- Juego web jugable en computadora y celular, en **orientación horizontal**.
- **TypeScript + Phaser + Vite**.
- Publicado como **PWA**: instalable, pantalla completa, funciona offline.
- Preparado para empaquetarse más adelante con **Capacitor** (Android/iOS) sin reescribir código.

Arquitectura en capas separadas:
- **Phaser**: escenas visuales (mapa de la ciudad, escenas vivas de cada lugar, mapa del mundo, exploración isométrica, combate táctico, mazmorras).
- **React** (o HTML/CSS) por encima del canvas: menús y paneles (inventario, forja, tienda, subasta, equipamiento, grupo, diálogos, relaciones). Proponé la opción más mantenible.
- **Lógica del juego** en TypeScript puro, sin dependencias visuales (crafteo, economía, combate, progresión, relaciones, eventos), con tests de los sistemas clave.

Datos y configuración:
- **Contenido data-driven**: materiales, combinaciones, planos, rasgos, encantamientos, monstruos, compañeros, NPCs, diálogos, ciudades, eventos y tablas de botín en archivos de datos separados de la lógica.
- **Valores de balance centralizados** en un archivo de configuración.

Guardado:
- Local en **IndexedDB**, con autosave y versión del save para poder migrar datos.
- Formato preparado para sumar guardado en la nube con **Supabase** más adelante (no implementarlo ahora).

Controles:
- Todo jugable con **toque**. Teclado y mouse en computadora suman atajos, pero nunca son obligatorios.
- Botones grandes y paneles legibles en pantallas de celular.

Herramientas de desarrollo:
- **Modo debug** activable: agregar oro y materiales, subir niveles, avanzar días, disparar eventos, modificar relaciones, generar combates de prueba.

---

## 4. Recurso central: el tiempo
- Cada día se divide en tres franjas: **mañana, tarde y noche**.
- Cada actividad consume franjas:
  - forjar un objeto: depende de la complejidad del plano;
  - atender la tienda;
  - recorrer la ciudad y hablar con NPCs;
  - expediciones: un día o más;
  - mazmorras: varios días.
- Decisión central del jugador cada día: **"¿abro la tienda, forjo o salgo a buscar materiales?"**.
- Mientras el herrero está afuera, la tienda está cerrada, salvo que tenga un ayudante (mejora posterior).
- Algunos monstruos, eventos y NPCs solo aparecen en ciertas franjas.

---

## 5. Pilar 1 — La forja (sistema central)
Fabricar es un proceso por etapas con decisiones reales. El resultado es un objeto con stats propios: dos objetos del mismo plano pueden salir muy distintos.

### Etapa 1: Diseño
- Elegir el **plano**. El herrero puede fabricar **cualquier objeto físico que se pueda crear en una forja o taller**. Categorías:
  - **Armas cuerpo a cuerpo**: espadas (cortas, largas, a dos manos), dagas, cuchillos, hachas, mazas, martillos de guerra, lanzas, alabardas, guadañas.
  - **Armas a distancia**: arcos, ballestas.
  - **Munición**: flechas, virotes y sus puntas especiales (perforantes, elementales, explosivas).
  - **Arrojadizos**: cuchillos arrojadizos, hachas arrojadizas, estrellas, bombas de metal.
  - **Defensa**: escudos (pequeños, medianos, torre), armaduras de pecho, cascos, guanteletes, grebas, botas.
  - **Joyería**: anillos, amuletos, colgantes, brazaletes, diademas, con **engarce de gemas y piedras especiales**.
  - **Herramientas**: picos, hachas de tala, cuchillos de desuello, hoces (necesarias para la recolección).
  - **Pociones** (en la mesa de alquimia).
- El catálogo de planos es **data-driven y ampliable**: agregar un tipo de objeto nuevo implica sumar datos, no reescribir sistemas.
- Elegir los **materiales** de cada parte del objeto (hoja, guarda, mango, núcleo, engarce, punta, etc.):
  - minerales y metales (cobre, hierro, plata, acero, mithril y otros);
  - maderas;
  - cueros;
  - **gemas y piedras especiales** (rubí, zafiro, esmeralda, ámbar, piedras rúnicas, cristales elementales), cada una con afinidades y bonus propios;
  - **partes de monstruos**.
- La munición y los arrojadizos se fabrican **por lotes** (ej. 20 flechas de una vez), se gastan al usarse en combate y se venden en volumen.
- **Las partes de monstruos son materiales de construcción, no solo de encantamiento.** Pueden usarse en cualquier tipo de equipo.
- Cada material aporta stats (daño, defensa, peso, velocidad, durabilidad) y **afinidades** (fuego, hielo, rayo, agua, tierra, viento, sagrado, oscuro, veneno). También cambia el aspecto visual del objeto.

### Combinaciones y sinergias de materiales
Esta es una de las partes más importantes del juego: descubrir qué pasa al combinar materiales.

Ejemplos ilustrativos del estilo buscado (no es una lista cerrada):
- escamas de dragón en una espada o una armadura → resistencia al fuego y alta durabilidad;
- hierro combinado con garras de demonio → daño oscuro y rasgo de sangrado;
- hueso de ogro en una maza → golpes contundentes que aturden;
- seda de araña gigante en la cuerda de un arco → más alcance y flechas que inmovilizan;
- gel de slime de hielo en el temple → la hoja ralentiza al enemigo;
- madera de árbol antiguo con un cristal de viento → arco liviano con disparo doble;
- plata con polvo espectral → arma efectiva contra no-muertos;
- piel de troll en una armadura → regeneración lenta en combate.

Lo que tenés que diseñar:
- **Un catálogo amplio de combinaciones** para todas las categorías de objetos (armas, munición, arrojadizos, armaduras, joyería, herramientas, pociones), cubriendo todas las familias de monstruos, minerales, maderas, cueros y gemas.
- **Sinergias**: ciertas combinaciones de materiales activan bonus extra o rasgos especiales. Ejemplos de sinergias posibles:
  - dos materiales de la misma afinidad la potencian;
  - afinidades opuestas generan inestabilidad (más riesgo, más potencia);
  - combinaciones raras crean efectos únicos.
- **Combinaciones secretas**: algunas no se informan de entrada y se descubren experimentando, en grimorios, por NPCs con buena relación o en subastas.
- Un **registro de descubrimientos** (libro del herrero) donde se guardan las combinaciones y sinergias que el jugador ya encontró.
- Todo definido en archivos de datos, fácil de ampliar y balancear.

### Etapa 2: Forjado (riesgo y recompensa)
- El jugador decide **cuántos golpes** dar.
- Cada golpe extra:
  - sube la calidad base;
  - sube la probabilidad de **defecto** (baja de stats, menor durabilidad, objeto arruinado en casos extremos);
  - sube la probabilidad de obtener un **rasgo pasivo** más poderoso (ej. "crítico +10%", "roba vida", "liviano", "irrompible", "golpe doble").
- El jugador elige cuándo frenar. La mecánica tiene que ser rápida de jugar, clara en riesgos, y emocionante.
- La habilidad de Herrería, las herramientas y los talentos mejoran las probabilidades.
- Diseñá un catálogo amplio de rasgos pasivos por categoría de objeto.

### Etapa 3: Temple
- Elegir el medio: agua, aceite o líquidos especiales (gel de slime, sangre de criatura, agua bendita, aceite alquímico y otros que diseñes).
- Define el balance entre **dureza y flexibilidad**, y puede **reforzar una afinidad**.

### Etapa 4: Acabado
- **Empuñadura o forro**: agarre, peso, velocidad.
- **Pulido**: calidad final y valor de venta.
- **Grabados**: bonus menores y valor estético. Los clientes nobles y coleccionistas los valoran más.

### Etapa 5: Encantamiento
- Requiere una de estas dos fuentes:
  - una **runa**, fabricada con materiales especiales de monstruos (núcleos, esencias, cuernos, corazones);
  - un **grimorio / libro mágico** encontrado en expediciones, mazmorras, eventos, subastas o enseñado por NPCs con buena relación.
- Los libros enseñan al herrero **encantamientos** (recetas permanentes que puede volver a aplicar). Nunca enseñan hechizos para lanzar él mismo.
- Un encantamiento otorga:
  - **habilidades activas** usables en combate (espada que lanza llamas, lanza de rayo, escudo que congela, arco con flechas explosivas);
  - **o habilidades pasivas** (amuleto de regeneración, anillo de resistencia al fuego, botas de velocidad).
- Los objetos de mayor rareza admiten más ranuras de encantamiento.
- Diseñá un catálogo amplio de encantamientos y habilidades, por elemento y por tipo de objeto.

### Rareza
- Común → poco común → raro → épico → legendario.
- La rareza sale de la combinación de materiales, las sinergias, la calidad del forjado, los rasgos y los encantamientos.
- Los objetos raros, épicos y legendarios son los que desbloquean las habilidades más poderosas del combate.

### Otros sistemas de la forja
- **Diseños propios**: el jugador puede guardar sus combinaciones y repetirlas.
- **Estaciones de trabajo mejorables**: yunque, mesa de runas, banco de flechería, mesa de joyería, mesa de alquimia (pociones).
- **Reparación**: el equipo pierde durabilidad en combate y se repara en la forja.
- **Pociones**: se fabrican en la mesa de alquimia con hierbas y materiales de monstruos (curación, antídotos, mejoras temporales, resistencias).
- **Presentación del objeto terminado (liviana, configurable)**:
  - al terminar un objeto, mostrar una tarjeta breve con nombre, rareza, stats principales, rasgos y habilidades;
  - el énfasis visual escala apenas con la rareza (color de borde o un pequeño destello para épico y legendario), sin animaciones largas;
  - si se descubrió una combinación o sinergia nueva, la tarjeta lo indica;
  - la tarjeta se cierra con un toque, y hay una opción en configuración para saltearla;
  - los objetos fabricados por lote (flechas, arrojadizos) muestran un resumen único del lote, no una tarjeta por unidad.

---

## 6. Pilar 2 — La ciudad

### Mapa y escenas vivas
- La ciudad se muestra como un **mapa ilustrado con edificios tocables**:
  - herrería propia,
  - mercado,
  - tiendas especializadas (alquimista, curtidor, maderero, joyero, librería),
  - taberna,
  - gremio de aventureros,
  - tablón de anuncios,
  - casa de subastas,
  - mercado de esclavos.
- Al tocar un lugar, la cámara pasa a una **escena viva** de ese sitio:
  - el herrero aparece parado en el lugar elegido;
  - alrededor hay NPCs con rutinas simples: caminan, entran y salen de tiendas, conversan entre ellos, miran puestos, discuten precios;
  - pasan carruajes, carretas y animales;
  - el ambiente cambia con la franja del día: más gente de día, faroles y guardias de noche.
- Desde esa escena se interactúa con el lugar (comprar, hablar, aceptar encargos, contratar) mediante paneles de UI.

### Eventos, encargos y misiones
- **Eventos de ciudad**: caravanas con materiales exóticos, amenazas de monstruos que disparan la demanda de armas, torneos, festivales, pedidos de nobles, escasez de un mineral.
- **Misiones secundarias y encargos**: salen de la taberna, el gremio, el tablón y de NPCs específicos. Piden fabricar objetos con propiedades específicas, conseguir materiales, o limpiar una zona.

### Varias ciudades
Cada ciudad tiene identidad, clientes, demanda, NPCs y eventos propios. Ejemplos:
- **ciudad portuaria**: marineros y mercaderes, armas ligeras, materiales exóticos por barco;
- **fortaleza fronteriza**: soldados, armaduras pesadas, flechas, contratos militares;
- **ciudad de magos**: anillos, amuletos, objetos encantados, gemas, grimorios;
- **pueblo minero**: herramientas, minerales baratos, picos.

Viajar entre ciudades consume tiempo y puede tener encuentros en el camino.

### Reputación por ciudad
- Es la imagen general del herrero en cada ciudad.
- Desbloquea clientes mejores, encargos especiales, precios y contenido.
- Se ve afectada por las relaciones individuales con NPCs (ver 6B).

---

## 6B. Relaciones con NPCs
Sistema de relaciones inspirado en los juegos de vida/granja: cada NPC importante tiene un vínculo con el herrero que sube o baja según lo que el jugador hace.

### Medidor de relación
- Cada NPC con nombre (comerciantes, tabernero, maestro del gremio, nobles, aldeanos recurrentes, compañeros) tiene un **valor de relación** con niveles:
  - hostil, desconfiado, neutral, conocido, amigo, aliado.
- Puede subir y **también bajar**: las relaciones malas tienen consecuencias reales.

### Qué mueve la relación
- **Diálogos con opciones**: las respuestas del jugador gustan o disgustan según la personalidad del NPC.
- **Misiones secundarias**: completarlas sube la relación; fracasarlas o abandonarlas la baja.
- **Encargos**: entregar a tiempo y con buena calidad sube; entregar tarde, mal o no entregar baja.
- **Regalos**: cada NPC tiene objetos que ama, le gustan, le son indiferentes o le disgustan. Un objeto forjado a medida es el mejor regalo posible.
- **Decisiones en eventos**: tomar partido en un conflicto de la ciudad puede subir la relación con unos y bajarla con otros.
- Límite diario de interacciones por NPC, para que la relación se construya con el tiempo.

### Qué desbloquea
- **Relación buena**:
  - descuentos y acceso a mercadería exclusiva;
  - planos, recetas, combinaciones secretas y encantamientos que el NPC enseña;
  - misiones especiales y cadenas de historia del personaje;
  - información (rumores sobre mazmorras, zonas o subastas);
  - prioridad o invitaciones a eventos.
- **Relación mala**:
  - precios más altos;
  - el NPC se niega a comerciar o a dar encargos;
  - rumores negativos que bajan la reputación en la ciudad;
  - en casos extremos, rivales que complican al jugador (pujan contra él en subastas, sabotean un contrato).

### Datos
- Cada NPC se define en archivos de datos: personalidad, gustos y disgustos, rutina diaria, árbol de diálogos, misiones asociadas y desbloqueos por nivel de relación.
- Los diálogos usan un formato simple data-driven (nodos con texto, opciones, condiciones y efectos), para poder escribir contenido sin tocar código.
- Diseñá un elenco inicial variado de NPCs con personalidades distintas para cada ciudad.

---

## 7. Compañeros
- **Grupo máximo: 3 personajes** (el herrero + 2 compañeros).
- El máximo es un valor configurable (`MAX_PARTY_SIZE = 3`), pensado para ampliarse más adelante con progresión.

### Formas de conseguir compañeros
- **Taberna (mercenarios)**:
  - cobran sueldo diario;
  - vienen con algo de experiencia y una especialidad (guerrero, arquero, explorador, porteador);
  - si no se les paga o la relación cae demasiado, abandonan el grupo.
- **Mercado de esclavos**:
  - pago único, más barato;
  - arrancan sin experiencia;
  - su **lealtad** usa el mismo sistema de relaciones de la sección 6B: arranca en "desconfiado" u "hostil";
  - la lealtad sube con buen trato (buen equipo, curarlos, no exponerlos a riesgos innecesarios), con conversaciones, regalos y misiones personales del compañero;
  - con lealtad baja rinden peor en combate, desobedecen órdenes ocasionalmente y pueden escaparse durante una expedición;
  - con lealtad alta desbloquean su historia personal, bonus en combate y la posibilidad de quedarse como ayudante;
  - el jugador puede **liberarlos**: pasan a ser compañeros libres con lealtad máxima, pero empiezan a cobrar sueldo.

### Reglas de todos los compañeros
- **No tienen habilidades propias de combate.** Todas sus habilidades, activas, pasivas y mágicas, vienen del equipo que el herrero les forja y les asigna. Lo mismo vale para el herrero.
- Tienen **atributos base** (fuerza, agilidad, resistencia, voluntad) que suben con la experiencia y definen qué equipo usan bien (ej. armadura pesada requiere fuerza; ciertos objetos mágicos requieren voluntad).
- Cada compañero tiene personalidad, gustos, diálogos e historia propia, dentro del sistema de relaciones.
- Los mercenarios también usan el sistema de relaciones: con relación alta cobran menos, no abandonan el grupo ante una mala racha y desbloquean misiones personales.
- Ganan experiencia en combate y en expediciones.
- Si caen en combate quedan heridos y fuera de servicio unos días.
- En mazmorras de alto nivel puede haber muerte permanente (opción configurable).
- Más adelante, un compañero de confianza puede quedarse como **ayudante en la tienda**.

---

## 8. Pilar 3 — La venta

### Canales de venta
| Canal | Cómo funciona | Para qué sirve |
|---|---|---|
| Tu tienda | Clientes que entran, miran, regatean | Ganancia media, sube la reputación local |
| Mercado | Venta rápida al por mayor, precio fluctuante | Liquidar stock, oro rápido |
| Contratos de mercaderes | Volumen fijo, plazo, precio garantizado | Ingreso estable con compromiso de producción |
| Gran subasta (evento) | Ver abajo | Objetos raros, ganancia alta e incierta |

### Clientes y precios
- **Tipos de cliente**: aventurero, guardia, noble, mago, cazador, mercader, coleccionista. Cada uno tiene presupuesto, preferencias de stats, afinidades buscadas y nivel de exigencia.
- **Demanda constante de consumibles**: aventureros, cazadores y guardias compran munición, arrojadizos y pociones con frecuencia, lo que da un ingreso estable además de las piezas únicas.
- **Precio óptimo**: depende de la demanda local, la calidad, los rasgos, los encantamientos, la rareza, la reputación y la relación con el cliente.
- **Regateo** simple con el cliente.
- **Economía dinámica simple**: los eventos del mundo y de la ciudad mueven precios y demanda.

### Evento: la gran subasta
- Ocurre cada cierta cantidad de días y se anuncia con anticipación en el tablón. Puede ser itinerante entre ciudades.
- **Como vendedor**:
  - el jugador consigna objetos con precio base;
  - los NPCs pujan según su perfil, presupuesto y la calidad del objeto;
  - el resultado es incierto: puede superar mucho el valor o no venderse.
- **Como comprador**:
  - otros personajes del mundo ponen lotes a la venta: materiales legendarios, gemas raras, grimorios, planos antiguos, runas, equipo raro;
  - el jugador puja contra NPCs con personalidades distintas (el noble caprichoso, el coleccionista paciente, el mercader que se retira rápido);
  - los rivales con relación mala pujan más agresivamente contra el jugador.
- Es la fuente principal de algunos objetos únicos que no se consiguen de otra forma.

---

## 9. Pilar 4 — Exploración y recolección
- **Mapa del mundo** por regiones, con nivel de peligro visible: praderas, bosque, montañas, cuevas, pantanos, ruinas, zonas elementales, tierras del dragón.
- Viajar a una región consume tiempo.
- Dentro de cada región hay un **mapa isométrico recorrible por casillas** con:
  - árboles, vetas de mineral, depósitos de gemas, hierbas y animales;
  - **herramientas requeridas** (pico, hacha, cuchillo de desuello, hoz): su nivel define qué se puede extraer;
  - **energía limitada por expedición**: el jugador decide qué juntar y cuándo volver;
  - capacidad de carga limitada (un compañero porteador la amplía);
  - encuentros con monstruos visibles en el mapa, que pasan a combate táctico al contacto;
  - descubrimientos ocasionales: cofres, ruinas, entradas a mazmorras, grimorios, NPCs con misiones.

---

## 10. Pilar 5 — Combate táctico

### Reglas base
- Por turnos, en **grilla isométrica con alturas**, estilo RPG táctico clásico.
- **Grupo del jugador: hasta 3 personajes.**
- **Enemigos: de 2 a 7 por combate**, según la zona, el nivel de peligro y la franja del día.

Mecánicas:
- orden de turnos por velocidad;
- movimiento y acción por turno;
- las alturas afectan alcance y daño;
- bonus por atacar de costado o por la espalda;
- el terreno influye (agua, lava, hielo, hierba alta, terreno elevado);
- la munición y los arrojadizos se consumen al usarse;
- se puede huir del combate, con riesgo y pérdida de parte del botín de la salida.

Habilidades:
- Salen **exclusivamente del equipo** de cada personaje.
- Cambiar el equipo cambia las habilidades disponibles.
- Los objetos de mayor rareza dan habilidades más poderosas, combinables entre personajes (ej. un compañero congela el terreno y otro lanza rayo sobre enemigos mojados).

Debilidades y botín:
- Los monstruos tienen debilidades y resistencias por tipo de daño (cortante, contundente, perforante) y por elemento.
- **Botín según cómo se los mata**: un elemento contrario puede arruinar ciertos materiales (ej. matar con fuego a una bestia quema su cuero).

### Dificultad y curva de progresión
- **Los combates NO tienen que estar siempre equilibrados.** Algunos son difíciles a propósito y se resuelven con táctica: posicionamiento, uso del terreno, alturas y combinación de habilidades de los objetos.
- **La forja es central durante todo el juego.** Lo que escala con la progresión es la escala del combate, no la importancia de la forja.
- **Inicio del juego**: combates cortos, con pocos enemigos y más simples. La forja ya es protagonista, con objetos básicos pero que se sienten propios.
- **A medida que avanza**: el jugador crea objetos raros, épicos y legendarios con habilidades más poderosas, y eso abre la puerta a **batallas épicas** (jefes, dragones, señores demoníacos, grupos grandes y mixtos).
- **Retroalimentación constante**: cada batalla difícil da materiales para forjar algo mejor, y cada objeto nuevo permite enfrentar desafíos mayores.
- **Generación de encuentros**: cada zona tiene un presupuesto de amenaza y cada monstruo un costo.
  - Los grupos grandes suelen ser de monstruos débiles; los grupos chicos, de monstruos fuertes.
  - Algunas zonas y encuentros superan ese presupuesto a propósito como desafíos opcionales.
- **El nivel de peligro se ve antes de entrar** a una zona o mazmorra, para que el jugador decida si arriesgarse.
- Formaciones mixtas de enemigos (atacantes, a distancia, sanadores, tanques) que obliguen a pensar la táctica.

---

## 11. Bestiario (familias base)
Cada familia tiene un elemento o rasgo, zonas donde aparece y materiales propios para la forja. La tabla es un punto de partida: ampliá cada familia con más criaturas, variantes y materiales, y sumá familias nuevas siguiendo la misma lógica.

| Familia | Ejemplos | Zonas | Materiales que dejan |
|---|---|---|---|
| Slimes | slime común, ácido, de magma, de hielo | Praderas, cuevas, todas | Gel elemental (temple, pociones) |
| Goblinoides | goblin, arquero goblin, chamán, jefe goblin | Bosque, colinas | Chatarra, colmillos, tótems (runas menores) |
| Bestias | lobo, jabalí, oso, araña gigante | Bosque, montaña | Cueros, garras, seda |
| Gigantes | ogro, troll, cíclope | Montaña, pantano | Huesos densos, piel gruesa (armaduras pesadas) |
| Constructos de piedra | gólem, gárgola, centinela de ruinas | Ruinas, cuevas | Núcleos rúnicos, piedra encantada, gemas |
| Elementales | de agua, de fuego, de viento, de tierra | Zonas elementales | Esencias y cristales elementales (encantamientos, engarces) |
| No-muertos | esqueleto, espectro, caballero caído | Ruinas, mazmorras, de noche | Huesos, polvo espectral (afinidad oscura) |
| Demonios | diablillo, demonio cornudo, señor demoníaco | Mazmorras profundas, grietas | Garras y cuernos demoníacos, sangre infernal |
| Dracónidos | kobold, wyvern, dragón | Tierras del dragón | Escamas, colmillos, corazón de dragón |

- Cada familia escala por niveles (ej. goblin → goblin veterano → señor goblin).
- Hay **monstruos raros** y **jefes de zona**, con baja probabilidad de aparición y materiales únicos.
- **Cada material de monstruo tiene que tener usos concretos en la forja** (como material base, en el temple, en runas o en pociones) y aparecer en el catálogo de combinaciones de la sección 5.
- Cada monstruo se define en un archivo de datos con: stats, elemento, debilidades, resistencias, habilidades, IA básica, costo de amenaza y tabla de botín.
- Los nombres y diseños concretos de cada criatura son originales.

---

## 12. Pilar 6 — Mazmorras
- Varios pisos que combinan exploración con niebla de guerra y combate táctico.
- Pisos armados con **piezas diseñadas a mano combinadas de forma procedural**, para que tengan sentido y variedad.
- **Secretos**: paredes falsas, llaves, palancas, salas ocultas, acertijos simples.
- **Tesoros**: planos antiguos, materiales legendarios, gemas raras, runas, grimorios, combinaciones secretas.
- **Jefe final** por mazmorra, con mecánicas propias y materiales únicos.
- **Retirada**: al terminar cada piso, el jugador decide si vuelve a la ciudad con lo que tiene o sigue bajando. Si el grupo cae, pierde parte del botín.
- Las mazmorras son el lugar de las batallas épicas y de los mejores materiales del juego.

---

## 13. Progresión

### Herrero
- **Nivel general** por experiencia.
- **Habilidades que suben con el uso**: Herrería, Armería, Flechería, Joyería (anillos, amuletos, engarces), Runas y encantamiento, Alquimia, Minería, Tala, Desuello, Comercio, Combate.
- **Árbol de talentos** por habilidad. Ejemplos:
  - "más chance de rasgo en el forjado";
  - "menos riesgo de defecto";
  - "más chance de descubrir sinergias";
  - "más unidades por lote de flechas";
  - "mejor regateo";
  - "más carga en expediciones".

### Desbloqueos
- **Planos, recetas de pociones, combinaciones y encantamientos**: por nivel, compra en la librería, encargos, relaciones con NPCs, subastas y botín de mazmorras.

### Herrería
- Más estaciones de trabajo.
- Más exhibición en la tienda.
- Almacén.
- Ayudante que atiende la tienda.
- Decoración que sube el atractivo para clientes de mayor nivel.

### Grupo
- Ampliar `MAX_PARTY_SIZE` más adelante como hito de progresión.

---

## 14. Loop principal
1. La ciudad y sus NPCs generan demanda, encargos, misiones y eventos.
2. Las expediciones y mazmorras dan materiales, gemas, partes de monstruos, planos y grimorios.
3. La forja transforma eso en equipo único, cada vez más increíble, descubriendo nuevas combinaciones.
4. Ese equipo se vende (tienda, mercado, contratos, subasta), se regala a NPCs o equipa al grupo.
5. El oro, la reputación y las relaciones desbloquean mejoras, zonas, ciudades, compañeros y secretos.
6. Mejor equipo implica mejores habilidades, que permiten enfrentar zonas, jefes y mazmorras más difíciles, que dan mejores materiales para forjar.

---

## 15. Fases de desarrollo (ajustalas en tu propuesta)

### Fase 1 — Base y forja
- Estructura del proyecto, PWA, guardado, modo debug.
- Ciclo de días con franjas.
- Una ciudad con mapa y 3 escenas vivas: herrería, mercado, taberna.
- Forja completa (5 etapas) con 5–8 planos de distintas categorías (incluida munición por lotes) y materiales básicos.
- Primer set de combinaciones y sinergias, y registro de descubrimientos.
- Presentación liviana del objeto terminado.
- Tienda con clientes básicos y regateo.
- Formato de datos de NPCs y diálogos ya definido, aunque el sistema de relaciones completo llegue después.

### Fase 2 — Mundo y combate
- Una región explorable con recolección y herramientas.
- Combate táctico isométrico.
- 3–4 familias de monstruos (slimes, goblinoides, bestias) y un jefe de zona.
- Partes de monstruos como materiales de forja, con sus combinaciones.
- Compañeros: contratación en la taberna.

### Fase 3 — Profundidad de la forja
- Rasgos pasivos, temple con líquidos especiales, acabado.
- Runas y encantamientos con habilidades usables en combate.
- Grimorios y combinaciones secretas.
- Joyería con gemas y engarces.
- Rareza completa.
- Arrojadizos.
- Pociones.

### Fase 4 — Economía, ciudad y relaciones
- Mercado con precios dinámicos.
- Contratos de mercaderes.
- Gran subasta como evento.
- Eventos de ciudad y reputación.
- Sistema de relaciones con NPCs: diálogos con opciones, regalos, misiones secundarias y desbloqueos.
- Mercado de esclavos y lealtad de compañeros sobre el sistema de relaciones.

### Fase 5 — Mazmorras
- Pisos procedurales con secretos.
- Jefes.
- Decisión de retirada.
- Materiales y tesoros únicos.

### Fase 6 — Expansión y pulido
- Varias ciudades y viajes.
- Más regiones, familias de monstruos, combinaciones y NPCs.
- Mejoras de herrería y ayudante.
- Ampliación del grupo.
- Balance general y pulido.

---

Empezá por el punto 0: guardá este documento, proponé la arquitectura y el plan detallado de la Fase 1, y esperá mi OK.
