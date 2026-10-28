import type { Synergy } from '../core/types';

// Combinaciones y sinergias. Las `secret` no aparecen en la vista previa:
// se descubren al forjar y quedan en el libro del herrero.
export const SYNERGIES: Synergy[] = [
  // ── Genéricas ──
  {
    id: 'resonancia', name: 'Resonancia elemental', secret: false, dynamicAffinity: true,
    when: [{ kind: 'sameAffinity', minParts: 2 }],
    effect: { valuePct: 15 },
    description: 'Dos materiales distintos con la misma afinidad se potencian: esa afinidad +2.',
    hint: 'Juntá dos materiales distintos del mismo elemento.',
  },
  {
    id: 'inestabilidad', name: 'Inestabilidad', secret: false,
    when: [{ kind: 'opposedAffinities' }],
    effect: { statPct: { atk: 15, def: 15 }, instability: 0.08 },
    description: 'Afinidades opuestas chocan: +15% de ataque y defensa, pero más riesgo de defecto.',
    hint: 'Fuego y hielo, sagrado y oscuro... no se llevan bien.',
  },
  {
    id: 'metal_puro', name: 'Metal puro', secret: false,
    when: [{ kind: 'pureMetal', minParts: 2 }],
    effect: { statPct: { dur: 15 }, valuePct: 5 },
    description: 'Todas las partes de metal del mismo metal: durabilidad +15%.',
    hint: 'Usá el mismo metal en todas las partes metálicas.',
  },

  // ── Armas ──
  {
    id: 'filo_colmillo', name: 'Filo de colmillo', secret: true,
    when: [{ kind: 'materialInSlot', material: 'colmillo_lobo', slot: 'hoja' }],
    effect: { trait: 'sangrado', statPct: { spd: 10 } },
    description: 'Una hoja de colmillo de lobo abre heridas que sangran.',
    hint: 'Un colmillo puede ser más que un trofeo.',
  },
  {
    id: 'cuero_firme', name: 'Empuñadura firme', secret: false,
    when: [{ kind: 'materialInSlot', material: 'cuero_endurecido', slot: 'mango' }, { kind: 'category', in: ['arma'] }],
    effect: { statPct: { spd: 10 } },
    description: 'Mango de cuero endurecido: el arma no resbala. Velocidad +10%.',
    hint: 'El mango también importa.',
  },
  {
    id: 'maza_roble', name: 'Maza de roble macizo', secret: false,
    when: [{ kind: 'blueprint', in: ['maza'] }, { kind: 'materialInSlot', material: 'roble', slot: 'mango' }, { kind: 'materialInSlot', material: ['hierro', 'acero'], slot: 'cabeza' }],
    effect: { statPct: { atk: 12 }, trait: 'aturdidora' },
    description: 'Cabeza de hierro o acero con mango de roble: golpes que aturden.',
    hint: 'Un mango denso para una cabeza pesada.',
  },
  {
    id: 'brasa_viva', name: 'Brasa viva', secret: true,
    when: [{ kind: 'materials', all: ['brasalita', 'cuarzo_igneo'] }],
    effect: { trait: 'quemadura', affinity: { fuego: 1 }, valuePct: 15 },
    description: 'Brasalita y cuarzo ígneo despiertan juntos: el arma quema.',
    hint: 'Hay un mineral rojizo que se lleva bien con cierto cristal cálido.',
  },
  {
    id: 'corazon_escarcha', name: 'Corazón de escarcha', secret: true,
    when: [{ kind: 'materialInSlot', material: 'cuarzo_glacial', slot: 'pomo' }, { kind: 'materialInSlot', material: ['acero', 'plata'], slot: 'hoja' }],
    effect: { trait: 'escarcha', affinity: { hielo: 1 } },
    description: 'Un pomo de cuarzo glacial enfría una hoja fina: ralentiza al enemigo.',
    hint: 'El frío viaja bien por un metal de calidad.',
  },
  {
    id: 'chispa_cobre', name: 'Chispa de cobre', secret: true,
    when: [{ kind: 'materials', all: ['cobre', 'ascua_salamandrilla'] }],
    effect: { trait: 'chispa', affinity: { rayo: 1 } },
    description: 'El cobre conduce el calor del ascua y lo vuelve chispa.',
    hint: 'Un metal humilde y una glándula de fuego.',
  },
  {
    id: 'plata_consagrada', name: 'Plata consagrada', secret: true,
    when: [{ kind: 'materials', all: ['plata', 'sauceluna'] }],
    effect: { trait: 'azote_no_muertos', affinity: { sagrado: 2 }, valuePct: 10 },
    description: 'Plata y madera de sauceluna: un arma que los muertos temen.',
    hint: 'Dos cosas que brillan bajo la luna.',
  },
  {
    id: 'filo_noble', name: 'Filo noble', secret: true,
    when: [{ kind: 'materials', all: ['acero', 'plata'] }, { kind: 'category', in: ['arma'] }],
    effect: { valuePct: 25, addTags: ['noble'] },
    description: 'Acero con detalles de plata: un arma digna de un salón. Los nobles pagan más.',
    hint: 'Lo útil y lo bello en la misma pieza.',
  },

  // ── A distancia y munición ──
  {
    id: 'arco_cantor', name: 'Arco cantor', secret: false,
    when: [{ kind: 'blueprint', in: ['arco_corto'] }, { kind: 'materialInSlot', material: 'fresno', slot: 'cuerpo' }, { kind: 'materialInSlot', material: 'tripa_trenzada', slot: 'cuerda' }],
    effect: { statPct: { spd: 20, atk: 10 } },
    description: 'Fresno y tripa trenzada: el arco canta al soltar. Velocidad +20%, ataque +10%.',
    hint: 'La madera flexible pide una cuerda tensa.',
  },
  {
    id: 'arco_luna', name: 'Arco de luna', secret: true,
    when: [{ kind: 'blueprint', in: ['arco_corto'] }, { kind: 'materialInSlot', material: 'sauceluna', slot: 'cuerpo' }],
    effect: { trait: 'disparo_certero', affinity: { sagrado: 1 }, valuePct: 10 },
    description: 'Cuerpo de sauceluna: las flechas buscan su blanco.',
    hint: 'Una madera pálida para un arco.',
  },
  {
    id: 'punta_colmillo', name: 'Punta de colmillo', secret: false,
    when: [{ kind: 'materialInSlot', material: 'colmillo_lobo', slot: 'punta' }],
    effect: { trait: 'sangrado' },
    description: 'Puntas de colmillo: flechas que hacen sangrar.',
    hint: 'Colmillos en la punta.',
  },
  {
    id: 'flecha_fina', name: 'Flecha fina', secret: false,
    when: [{ kind: 'materialInSlot', material: 'fresno', slot: 'astil' }, { kind: 'materialInSlot', material: 'plumas_ganso', slot: 'emplumado' }],
    effect: { statPct: { spd: 15 } },
    description: 'Astil de fresno bien emplumado: velocidad +15%.',
    hint: 'Un astil flexible vuela mejor.',
  },
  {
    id: 'flecha_silbante', name: 'Flecha silbante', secret: true,
    when: [{ kind: 'materialInSlot', material: 'sauceluna', slot: 'astil' }, { kind: 'category', in: ['municion'] }],
    effect: { trait: 'silbante', affinity: { viento: 1 } },
    description: 'Astiles de sauceluna: silban en el aire y desconcentran.',
    hint: 'Una madera que el viento conoce.',
  },
  {
    id: 'punta_ignea', name: 'Punta ígnea', secret: true,
    when: [{ kind: 'materialInSlot', material: 'brasalita', slot: 'punta' }],
    effect: { trait: 'quemadura' },
    description: 'Puntas de brasalita: flechas que prenden.',
    hint: 'Un metal que nunca se enfría, en la punta.',
  },

  // ── Defensa ──
  {
    id: 'escudo_roble_hierro', name: 'Roble y hierro', secret: false,
    when: [{ kind: 'materialInSlot', material: 'roble', slot: 'tablas' }, { kind: 'materialInSlot', material: ['hierro', 'acero'], slot: 'refuerzo' }],
    effect: { statPct: { def: 15 } },
    description: 'Tablas de roble con refuerzo de hierro o acero: defensa +15%.',
    hint: 'Madera densa, metal firme.',
  },
  {
    id: 'peto_jabali', name: 'Coraza de jabalí', secret: true,
    when: [{ kind: 'anyMaterial', any: ['piel_jabali'] }, { kind: 'category', in: ['armadura', 'escudo'] }],
    effect: { statPct: { def: 10 }, trait: 'piel_dura', affinity: { tierra: 1 } },
    description: 'La piel de jabalí sigue siendo terca: reduce el daño recibido.',
    hint: 'Una piel gruesa protege dos veces.',
  },
  {
    id: 'forro_viscoso', name: 'Forro viscoso', secret: true,
    when: [{ kind: 'materialInSlot', material: 'gel_slime', slot: 'forro' }],
    effect: { trait: 'acolchado', affinity: { agua: 1 } },
    description: 'Gel de slime como forro: absorbe los golpes contundentes.',
    hint: 'Algo blando adentro de algo duro.',
  },
  {
    id: 'trofeo_caza', name: 'Trofeo de caza', secret: true,
    when: [{ kind: 'materials', all: ['colmillo_lobo', 'piel_jabali'] }],
    effect: { valuePct: 20, addTags: ['cazador'] },
    description: 'Colmillo y piel de bestia en la misma pieza: los cazadores lo pagan bien.',
    hint: 'Dos trofeos de bestias distintas.',
  },

  // ── Herramientas ──
  {
    id: 'pico_templado', name: 'Pico de buen acero', secret: false,
    when: [{ kind: 'blueprint', in: ['pico'] }, { kind: 'materialInSlot', material: 'acero', slot: 'cabeza' }],
    effect: { statPct: { dur: 25, atk: 10 } },
    description: 'Cabeza de acero: el pico dura y muerde la roca. Durabilidad +25%.',
    hint: 'La roca respeta al acero.',
  },
];
