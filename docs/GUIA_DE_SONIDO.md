# Guía de sonido

Cómo suena Forja & Fortuna: música orquestal suave para cada lugar (generada con una IA de música) y efectos de sonido estilo retro (generados por código, sin archivos).

## Cómo funciona

- **Música**: cada tema es un archivo en `src/assets/audio/musica/` y **su nombre es la clave del lugar** (`valdebrasa.mp3`). Al cambiar de lugar, un tema se apaga mientras entra el otro.
- **Lugares sin tema propio** usan el de su grupo: un local de la ciudad usa el de la ciudad, una mazmorra usa `mazmorra`, el combate contra un jefe usa `combate`, una región usa `mundo`. Si no hay ninguno, silencio.
- **Celular**: la música arranca con el primer toque (los navegadores no dejan sonar nada antes) y se pausa al cambiar de app.
- **Peso**: la música no entra en la carga inicial. Cada tema se baja la primera vez que suena y queda guardado.
- **Volumen**: en Ajustes, música y efectos por separado, y silenciar todo. Se guarda en el dispositivo.
- Código: `src/audio/` (`musicKey.ts` decide qué tema suena, `music.ts` lo reproduce, `sfx.ts` arma los efectos, `director.ts` los conecta con el juego).

## Cómo generar los temas

1. En la herramienta de música (por ejemplo Suno), activá **Instrumental** (sin voces).
2. Pegá el **estilo base** y, a continuación, el pedido del tema.
3. Generá, escuchá las dos versiones y elegí la que mejor repita: que el final no tenga un cierre fuerte ni un silencio largo.
4. Descargá en **mp3** y mandámelo diciendo de qué lugar es. Yo lo recorto para que repita sin corte y lo pongo en su lugar.

**Licencia**: antes de publicar, fijate que tu plan permita usar la música en un juego publicado (en varias herramientas, el plan gratis no lo permite).

**Originalidad**: no nombres juegos, compositores ni bandas en los pedidos. Se describe el clima y los instrumentos.

### Estilo base (pegarlo siempre primero)

```
soft orchestral fantasy RPG soundtrack, instrumental, no vocals, warm strings, woodwinds, harp, light percussion, gentle and melodic, retro 16-bit era tactical RPG feel, seamless loop, no fade out
```

## Temas

| Archivo | Lugar | Pedido (después del estilo base) |
|---|---|---|
| `titulo` | Pantalla de título | `main theme, hopeful and adventurous, slow intro building to a memorable heroic melody on french horn, anvil strikes as subtle percussion, 90 bpm` |
| `herreria` | Tu herrería | `cozy workshop, calm and warm, plucked strings and acoustic guitar, soft rhythmic anvil taps, crackling hearth mood, homely, 85 bpm` |
| `valdebrasa` | Valdebrasa (ciudad) | `bustling medieval market town, cheerful, flute melody over pizzicato strings, tambourine, friendly and lively, 105 bpm` |
| `puertoseco` | Puertoseco (puerto) | `seaside port town, breezy, accordion and fiddle, gentle sway like waves, salty and sunny, 6/8 time, 100 bpm` |
| `fuerte_ceniza` | Fuerte Ceniza (fortaleza) | `frontier fortress, disciplined and stern, military snare, low brass, steady march, proud but tired, 95 bpm` |
| `mundo` | Mapa del mundo | `world map travel theme, wide open landscapes, sweeping strings, oboe melody, sense of journey and wonder, 100 bpm` |
| `linde_brezal` | Linde de Brezal (praderas y bosque) | `peaceful meadows and forest edge, pastoral, recorder and harp, birdsong-like woodwinds, light and green, 95 bpm` |
| `montanas_grises` | Montañas Grises | `cold mountain pass, snow and stone, lonely solo cello, airy choir pads without words, wind-like strings, majestic and harsh, 80 bpm` |
| `pantano_niebla` | Pantano de Niebla | `misty swamp, eerie and damp, low clarinet, slow dripping marimba, muted strings, mysterious, 75 bpm` |
| `ruinas_vigia` | Ruinas del Vigía | `ancient ruins with a demonic rift below, solemn and ominous, low strings, distant bells, dark harp arpeggios, 80 bpm` |
| `tierras_dragon` | Tierras del Dragón | `volcanic wasteland with dragons, tense and epic, pounding timpani, low brass, fiery strings, dangerous, 110 bpm` |
| `mazmorra` | Mazmorras (todas) | `underground dungeon, dark and echoing, sparse plucked strings, low drones, dripping percussion, careful exploration, 70 bpm` |
| `combate` | Combate | `tactical battle theme, energetic but not frantic, driving strings ostinato, snare and timpani, heroic brass melody, 130 bpm` |
| `jefe` | Combate contra jefe | `boss battle, intense and dramatic, full orchestra, fast strings, heavy timpani, choir-like pads without words, menacing, 140 bpm` |
| `victoria` | Victoria (suena una vez) | `short victory fanfare, triumphant brass and strings, 8 seconds, ends on a bright held chord` |
| `derrota` | Derrota (suena una vez) | `short defeat theme, sad and gentle, solo piano and strings, 8 seconds, ends softly` |

### Opcionales

Si querés más variedad, un lugar puede tener su propio tema con su clave. Sin archivo, usa el de su grupo.

| Archivo | Lugar | Pedido |
|---|---|---|
| `taberna` · `ps_taberna` · `fc_cantina` | Tabernas | `lively tavern, folk jig, fiddle and hand drums, clapping, mugs clinking mood, 120 bpm` |
| `cripta_vigia` | Cripta del Vigía | `forgotten royal crypt, solemn, slow organ-like strings, faint bells, 65 bpm` |
| `cuevas_eco` | Cuevas del Eco | `deep echoing caves, crystal-like mallets with long echoes, low drones, 70 bpm` |
| `subastas` | Casa de subastas | `elegant auction house, playful harpsichord and strings, a bit of suspense, 110 bpm` |

## Efectos de sonido

Los arma el juego al momento (`src/audio/sfx.ts`), sin archivos:

- **Interfaz**: clic, abrir y cerrar panel, error.
- **Herrería**: martillazo (bueno, perfecto, con defecto), pieza arruinada, templado al terminar, poción, sinergia nueva.
- **Dinero**: monedas al cobrar, pago al gastar.
- **Expedición**: recoger material, partir.
- **Combate**: golpe, crítico, falla, flecha, magia, fuego, hielo, rayo, curación, refuerzo, estado alterado, empuje, caída, aparición, golpe anunciado.
- **Logros**: subir de nivel, victoria y derrota (si no hay archivo `victoria`/`derrota`).
