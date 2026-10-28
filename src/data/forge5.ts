import type { GrimoireDef, PotionDef } from '../core/magic/types';
import type { Blueprint, Enchantment, Material, QuenchMedium, Synergy } from '../core/types';

// Fase 5: lo que sale de las mazmorras y sus usos en la forja.

export const MATERIALS_5: Material[] = [
  {
    id: 'hueso_denso', name: 'Hueso denso', type: 'monstruo', tier: 2, price: 14, color: '#e8e0c8',
    stats: { def: 6, dur: 18, wgt: 3 }, tags: ['no_muerto', 'hueso'], alchemy: { proteccion: 1, vigor: 1 },
    description: 'Hueso de esqueleto viejo, duro como el roble. Sirve de mango, de forro y de refuerzo.',
  },
  {
    id: 'polvo_espectral', name: 'Polvo espectral', type: 'monstruo', tier: 2, price: 18, color: '#8a8fb8',
    stats: { spd: 2 }, affinities: { oscuro: 3 }, tags: ['no_muerto', 'espectral'], alchemy: { humo: 2, veneno: 1 },
    description: 'Lo que queda de un espectro. Frío al tacto; oscurece todo lo que toca.',
  },
  {
    id: 'piedra_encantada', name: 'Piedra encantada', type: 'gema', tier: 2, price: 22, color: '#7d8a7a',
    stats: { def: 5, dur: 8 }, affinities: { tierra: 2 }, tags: ['constructo', 'piedra'], alchemy: { proteccion: 2 },
    description: 'Fragmento de un constructo. Todavía vibra con la magia que lo movía.',
  },
  {
    id: 'nucleo_runico', name: 'Núcleo rúnico', type: 'gema', tier: 3, price: 55, color: '#5ad1ff',
    stats: { atk: 3, dur: 6 }, affinities: { rayo: 2, tierra: 1 }, tags: ['constructo', 'runa', 'raro'], alchemy: { rayo: 2, celeridad: 1 },
    description: 'El corazón de un centinela: una piedra llena de runas que siguen encendidas.',
  },
  {
    id: 'gema_antigua', name: 'Gema antigua', type: 'gema', tier: 3, price: 70, color: '#f2e6a8',
    stats: { def: 3, dur: 8 }, affinities: { sagrado: 3 }, tags: ['gema', 'raro', 'antigua'], alchemy: { sagrado: 2, curacion: 1 },
    description: 'Tallada por una civilización que ya nadie recuerda. Brilla con luz propia.',
  },
  {
    id: 'acero_juramentado', name: 'Acero juramentado', type: 'metal', tier: 3, price: 90, color: '#9aa3c8',
    stats: { atk: 26, def: 20, wgt: 7, dur: 40 }, affinities: { oscuro: 2, sagrado: 1 }, tags: ['jefe', 'legendario', 'aleacion'],
    description: 'La armadura de Ulmar, fundida. Guarda el juramento de un guardián que no supo morir.',
  },
  {
    id: 'corazon_eco', name: 'Corazón del Eco', type: 'gema', tier: 3, price: 110, color: '#7af0ff',
    stats: { atk: 5, def: 4, dur: 8 }, affinities: { rayo: 4, tierra: 2 }, tags: ['jefe', 'legendario', 'gema'], alchemy: { rayo: 3 },
    description: 'El núcleo del Gólem del Eco. Si lo acercás al oído, todavía se oye retumbar la cueva.',
  },
];

export const SYNERGIES_5: Synergy[] = [
  {
    id: 'mango_hueso', name: 'Mango de hueso', secret: false,
    when: [{ kind: 'materialInSlot', material: 'hueso_denso', slot: 'mango' }],
    effect: { statPct: { dur: 15, atk: 5 } },
    description: 'Un mango de hueso denso no se astilla nunca y transmite mejor el golpe.',
    hint: 'Los huesos de la cripta no son solo para asustar.',
  },
  {
    id: 'colgante_guardian', name: 'Piedra guardiana', secret: false,
    when: [{ kind: 'materialInSlot', material: 'piedra_encantada', slot: 'colgante' }],
    effect: { statPct: { def: 15 }, trait: 'guardia_firme' },
    description: 'Un amuleto con piedra de constructo: quien lo lleva se planta como una muralla.',
    hint: 'La piedra que movía a un gólem puede sostener a una persona.',
  },
  {
    id: 'forro_espectral', name: 'Forro espectral', secret: true,
    when: [{ kind: 'materialInSlot', material: 'polvo_espectral', slot: 'forro' }],
    effect: { affinity: { oscuro: 2 }, trait: 'reflejos' },
    description: 'Un peto forrado con polvo de espectro: los golpes parecen atravesar a quien lo lleva.',
    hint: 'Lo que no se puede tocar, tampoco se deja golpear.',
  },
  {
    id: 'pomo_runico', name: 'Pomo rúnico', secret: true,
    when: [{ kind: 'materialInSlot', material: 'nucleo_runico', slot: 'pomo' }],
    effect: { affinity: { rayo: 2 }, trait: 'canalizadora', valuePct: 20 },
    description: 'Un núcleo de centinela en el pomo: las habilidades del arma salen con más fuerza.',
    hint: 'Las runas de un centinela siguen buscando algo que mover.',
  },
  {
    id: 'acero_juramento', name: 'El juramento del Vigía', secret: true,
    when: [{ kind: 'materials', all: ['acero_juramentado', 'opalo_lunar'] }],
    effect: { affinity: { sagrado: 3 }, trait: 'azote_no_muertos', valuePct: 40 },
    description: 'Acero juramentado con un ópalo lunar: el juramento de Ulmar se cumple al fin y la pieza castiga a los muertos.',
    hint: 'Un juramento roto pide la luz de la luna para cumplirse.',
  },
  {
    id: 'corazon_atronador', name: 'Corazón atronador', secret: true,
    when: [{ kind: 'materialInSlot', material: 'corazon_eco', slot: 'engarce' }],
    effect: { affinity: { rayo: 3 }, trait: 'chispa', valuePct: 40 },
    description: 'Un anillo con el Corazón del Eco: cada golpe de quien lo lleva retumba como un trueno.',
    hint: 'El corazón del gólem quiere seguir latiendo, aunque sea en un dedo.',
  },
];

export const QUENCH_5: QuenchMedium[] = [
  {
    id: 'bruma_espectral', name: 'Bruma espectral', cost: { material: 'polvo_espectral', qty: 1 }, hardness: 0,
    effect: { affinity: { oscuro: 2 }, statPct: { spd: 5 }, valuePct: 6 },
    description: 'El metal se enfría en una niebla helada: queda liviano y con un brillo oscuro.',
  },
];

export const ENCHANTMENTS_5: Enchantment[] = [
  {
    id: 'runa_hueso', name: 'Runa de Hueso', source: 'runa', kind: 'pasiva', categories: ['armadura', 'escudo'],
    cost: [{ material: 'piedra_runica', qty: 1 }, { material: 'hueso_denso', qty: 2 }],
    effect: { statPct: { def: 10, dur: 10 }, valuePct: 10 },
    description: 'Endurece la pieza como el hueso de los muertos: +10% de defensa y durabilidad.',
  },
  {
    id: 'runa_centinela', name: 'Runa del Centinela', source: 'runa', kind: 'activa', categories: ['escudo', 'armadura'],
    cost: [{ material: 'nucleo_runico', qty: 1 }, { material: 'piedra_encantada', qty: 1 }],
    effect: { valuePct: 20 }, ability: { skill: 'bastion', uses: 1, cooldown: 5 },
    description: 'Bastión: todo el grupo queda protegido por dos turnos, como detrás de un centinela.',
  },
  {
    id: 'filo_consagrado', name: 'Filo consagrado', source: 'grimorio', kind: 'pasiva', categories: ['arma', 'distancia'],
    cost: [{ material: 'gema_antigua', qty: 1 }, { material: 'agua_bendita', qty: 1 }], gold: 35,
    effect: { affinity: { sagrado: 3 }, trait: 'azote_no_muertos', valuePct: 25 },
    description: 'La hoja queda consagrada: luz sagrada y castigo contra los no-muertos.',
  },
  {
    id: 'velo_sombrio', name: 'Velo sombrío', source: 'grimorio', kind: 'pasiva', categories: ['armadura', 'joyeria'],
    cost: [{ material: 'polvo_espectral', qty: 2 }], gold: 30,
    effect: { affinity: { oscuro: 3 }, statPct: { spd: 8 }, valuePct: 20 },
    description: 'Un velo de sombra envuelve a quien lo lleva: más rápido y más difícil de seguir.',
  },
];

export const GRIMOIRES_5: GrimoireDef[] = [
  {
    id: 'liturgia_ceniza', name: 'Liturgia de Ceniza', tier: 3, price: 0, teaches: ['filo_consagrado', 'velo_sombrio'], reveals: ['forro_espectral'],
    description: 'El libro de oraciones de los vigías de la cripta. Enseña a consagrar el acero y a vestir la sombra.',
  },
];

export const BLUEPRINTS_5: Blueprint[] = [
  {
    id: 'cimitarra', name: 'Cimitarra', category: 'arma', station: 'yunque', slots: 2,
    parts: [
      { slot: 'hoja', label: 'Hoja', types: ['metal'], extra: ['garra_oso', 'colmillo_lobo'], weight: 0.6, qty: 2 },
      { slot: 'guarda', label: 'Guarda', types: ['metal'], weight: 0.15, qty: 1 },
      { slot: 'mango', label: 'Mango', types: ['madera', 'cuero'], extra: ['hueso_denso'], weight: 0.25, qty: 1 },
    ],
    base: { atk: 6, spd: 4, dur: 8 },
    scale: { atk: 1, spd: 0.9, wgt: 0.7, dur: 1 },
    quench: true, grip: true, engrave: true, tags: ['cortante', 'curva'], weaponKind: 'espada',
    description: 'Plano antiguo de la cripta: una hoja curva y rápida que corta al pasar.',
  },
  {
    id: 'escudo_torre', name: 'Escudo torre', category: 'escudo', station: 'yunque', slots: 2,
    parts: [
      { slot: 'tablas', label: 'Tablas', types: ['madera'], extra: ['hueso_denso'], weight: 0.45, qty: 3 },
      { slot: 'refuerzo', label: 'Refuerzo', types: ['metal'], weight: 0.4, qty: 3 },
      { slot: 'correas', label: 'Correas', types: ['cuero'], weight: 0.15, qty: 1 },
    ],
    base: { def: 10, dur: 14 },
    scale: { atk: 0.1, def: 1.3, spd: 0.1, wgt: 1.4, dur: 1.1 },
    quench: true, grip: false, engrave: true, tags: ['bloqueo', 'pesado'],
    description: 'Plano antiguo de las cuevas: un muro portátil. Pesa, pero detiene casi todo.',
  },
  {
    id: 'arco_largo', name: 'Arco largo', category: 'distancia', station: 'flecheria', slots: 2,
    parts: [
      { slot: 'cuerpo', label: 'Cuerpo', types: ['madera'], extra: ['hueso_denso'], weight: 0.6, qty: 3 },
      { slot: 'cuerda', label: 'Cuerda', types: [], extra: ['cuerda_lino', 'tripa_trenzada', 'seda_arana'], weight: 0.3, qty: 1 },
      { slot: 'empunadura', label: 'Empuñadura', types: ['cuero'], weight: 0.1, qty: 1 },
    ],
    base: { atk: 7, spd: 3, dur: 8 },
    scale: { atk: 1.2, spd: 0.6, wgt: 0.6, dur: 1 },
    quench: false, grip: false, engrave: true, tags: ['perforante', 'distancia'], weaponKind: 'arco', twoHanded: true,
    description: 'Plano antiguo de las cuevas: más alto que quien lo usa, y más letal.',
  },
];

export const POTIONS_5: PotionDef[] = [
  {
    id: 'resguardo_sombrio', name: 'Resguardo sombrío', secret: true, requires: { sagrado: 2, humo: 1 }, priority: 3, main: 'sagrado',
    output: { kind: 'pocion', effect: { type: 'resguardo', element: 'oscuro', turns: 4 } }, qty: 2, value: 26, color: '#8a8fb8',
    description: 'Protege de la magia oscura de los no-muertos.',
  },
];
