import type { Enchantment, FinishOption, QuenchMedium } from '../core/types';

// ── Temples especiales (varios salen de la mesa de alquimia) ──
export const QUENCH_MEDIA_3: QuenchMedium[] = [
  { id: 'sangre', name: 'Baño de sangre', cost: { material: 'sangre_bestia', qty: 1 }, hardness: 1, effect: { statPct: { atk: 6 }, affinity: { oscuro: 1 }, valuePct: 5 }, description: 'Sangre de bestia: un filo hambriento.' },
  { id: 'agua_bendita', name: 'Agua bendita', cost: { material: 'agua_bendita', qty: 1 }, hardness: 0, effect: { affinity: { sagrado: 2 }, trait: 'azote_no_muertos' }, description: 'Consagra el metal: los muertos lo temen.' },
  { id: 'aceite_alquimico', name: 'Aceite alquímico', cost: { material: 'aceite_alquimico', qty: 1 }, hardness: -1, effect: { statPct: { dur: 20, spd: 5 }, valuePct: 8 }, description: 'Flexible y duradero como ningún otro temple.' },
  { id: 'esencia_ignea', name: 'Temple ígneo', cost: { material: 'esencia_ignea', qty: 1 }, hardness: 2, effect: { affinity: { fuego: 2 }, trait: 'quemadura' }, description: 'Fuego líquido en la hoja: quema al tocar.' },
  { id: 'esencia_tormenta', name: 'Temple de tormenta', cost: { material: 'esencia_tormenta', qty: 1 }, hardness: 1, effect: { affinity: { rayo: 2 }, trait: 'chispa' }, description: 'El metal queda cargado: descargas al golpear.' },
  { id: 'esencia_glacial', name: 'Temple glacial', cost: { material: 'esencia_glacial', qty: 1 }, hardness: 1, effect: { affinity: { hielo: 2 }, statPct: { def: 5 }, trait: 'escarcha' }, description: 'Frío profundo: ralentiza y endurece.' },
];

// ── Acabados por categoría ──
export const FINISHES_3: FinishOption[] = [
  { id: 'grip_seda', name: 'Empuñadura de seda', kind: 'grip', categories: ['arma', 'herramienta'], cost: { material: 'seda_arana', qty: 1 }, effect: { statPct: { spd: 10 }, valuePct: 6 }, beauty: 1, description: 'No resbala nunca. Velocidad +10%.' },
  { id: 'forro_acolchado', name: 'Forro acolchado', kind: 'grip', categories: ['armadura'], cost: { material: 'cuero_curtido', qty: 2 }, effect: { statPct: { def: 6 } }, description: 'Amortigua los golpes. Defensa +6%.' },
  { id: 'forro_piel', name: 'Forro de piel de lobo', kind: 'grip', categories: ['armadura'], cost: { material: 'cuero_lobo', qty: 1 }, effect: { statPct: { spd: 8, def: 3 } }, beauty: 1, description: 'Abriga sin pesar. Velocidad +8%.' },
  { id: 'forro_seda', name: 'Forro de seda', kind: 'grip', categories: ['armadura'], cost: { material: 'seda_arana', qty: 1 }, effect: { statPct: { def: 5, spd: 5 }, valuePct: 8 }, beauty: 2, description: 'Liviano y resistente.' },
  { id: 'filigrana', name: 'Filigrana', kind: 'engraving', categories: ['joyeria'], cost: { gold: 10 }, effect: { valuePct: 12 }, beauty: 4, description: 'Hilos de metal finísimos. Encanta a nobles y coleccionistas.' },
  { id: 'engaste_fino', name: 'Engaste fino', kind: 'polish', categories: ['joyeria'], cost: { gold: 8 }, effect: { valuePct: 10 }, quality: 6, beauty: 2, description: 'La gema queda perfecta: calidad +6.' },
];

// ── Encantamientos nuevos: runas activas (se fabrican) y de grimorio (se aprenden) ──
const rune = (id: string, name: string, categories: Enchantment['categories'], skill: string, uses: number, cooldown: number, cost: Enchantment['cost'], description: string): Enchantment => ({
  id, name, source: 'runa', kind: 'activa', categories, cost, effect: { valuePct: 15 }, ability: { skill, uses, cooldown }, description,
});
const book = (id: string, name: string, categories: Enchantment['categories'], skill: string, uses: number, cooldown: number, cost: Enchantment['cost'], gold: number, description: string, minRarity?: Enchantment['minRarity']): Enchantment => ({
  id, name, source: 'grimorio', kind: 'activa', categories, cost, gold, effect: { valuePct: 25 }, ability: { skill, uses, cooldown }, minRarity, description,
});

export const ENCHANTMENTS_3: Enchantment[] = [
  // Runas activas: insumo que se fabrica en la mesa de runas y se gasta al encantar.
  rune('runa_llama', 'Runa de Llama', ['arma'], 'golpe_igneo', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'flor_brasa', qty: 2 }, { material: 'ascua_salamandrilla', qty: 1 }], 'Golpe ígneo: un tajo envuelto en llamas que quema.'),
  rune('runa_escarcha', 'Runa de Escarcha', ['arma'], 'lanza_hielo', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'gel_escarcha', qty: 2 }], 'Lanza de hielo: una línea de escarcha que ralentiza y congela el agua.'),
  rune('runa_chispa', 'Runa de Chispa', ['arma', 'distancia'], 'descarga', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'ambar', qty: 1 }], 'Descarga: un rayo a distancia que salta por el agua y los mojados.'),
  rune('runa_marea', 'Runa de Marea', ['arma', 'escudo'], 'chorro', 2, 2, [{ material: 'piedra_runica', qty: 1 }, { material: 'gel_slime', qty: 2 }], 'Chorro: moja al enemigo y deja un charco. Ideal para combinar con rayo.'),
  rune('runa_vendaval', 'Runa de Vendaval', ['arma', 'escudo'], 'rafaga', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'seda_arana', qty: 1 }, { material: 'plumas_ganso', qty: 2 }], 'Ráfaga: una línea de viento que empuja.'),
  rune('runa_roca', 'Runa de Roca', ['arma'], 'golpe_tectonico', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'colmillo_jabali', qty: 2 }], 'Golpe tectónico: un mazazo que aturde.'),
  rune('runa_alivio', 'Runa de Alivio', ['joyeria', 'escudo'], 'luz_sanadora', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'hoja_alivio', qty: 2 }, { material: 'agua_bendita', qty: 1 }], 'Luz sanadora: cura a un aliado cercano.'),
  rune('runa_paso', 'Runa del Paso', ['joyeria', 'armadura'], 'paso_viento', 2, 3, [{ material: 'piedra_runica', qty: 1 }, { material: 'plumas_ganso', qty: 2 }, { material: 'seda_arana', qty: 1 }], 'Paso de viento: más movimiento y velocidad por dos turnos.'),

  // Grimorios: receta permanente; se paga con reactivos y oro, sin runa.
  book('abanico_brasas', 'Abanico de brasas', ['arma'], 'abanico_brasas', 1, 4, [{ material: 'esencia_ignea', qty: 1 }], 20, 'Un cono de llamas que quema e incendia la hierba alta.'),
  book('lluvia_ascuas', 'Lluvia de ascuas', ['distancia'], 'lluvia_ascuas', 1, 4, [{ material: 'esencia_ignea', qty: 1 }, { material: 'ascua_salamandrilla', qty: 1 }], 20, 'Flechas explosivas: fuego en área a distancia.'),
  book('nova_escarcha', 'Nova de escarcha', ['escudo', 'armadura'], 'nova_escarcha', 1, 4, [{ material: 'esencia_glacial', qty: 1 }], 20, 'Una explosión de frío alrededor: inmoviliza y congela el agua.'),
  book('flecha_glacial', 'Flecha glacial', ['distancia'], 'flecha_glacial', 2, 3, [{ material: 'esencia_glacial', qty: 1 }], 15, 'Una flecha que congela el suelo bajo el enemigo.'),
  book('escudo_glacial', 'Escudo glacial', ['escudo'], 'escudo_glacial', 1, 3, [{ material: 'gel_escarcha', qty: 2 }], 15, 'El escudo suelta escarcha: ralentiza a quien está al lado.'),
  book('lanza_rayo', 'Lanza de rayo', ['arma'], 'lanza_rayo', 1, 4, [{ material: 'esencia_tormenta', qty: 1 }], 25, 'Una línea de rayo que salta por el agua.'),
  book('tormenta', 'Tormenta', ['arma', 'distancia', 'joyeria'], 'tormenta', 1, 5, [{ material: 'esencia_tormenta', qty: 2 }, { material: 'ambar', qty: 1 }], 60, 'Rayos en área. Sobre agua o mojados, devastador.', 'épico'),
  book('ola', 'Ola', ['arma', 'escudo'], 'ola', 1, 4, [{ material: 'gel_slime', qty: 3 }], 15, 'Un cono de agua que empuja, moja y deja charcos.'),
  book('sismo', 'Sismo', ['arma'], 'sismo', 1, 4, [{ material: 'totem_tallado', qty: 1 }, { material: 'garra_oso', qty: 1 }], 25, 'Golpe al suelo: daña y aturde alrededor.'),
  book('castigo_sagrado', 'Castigo sagrado', ['arma', 'joyeria'], 'castigo_sagrado', 2, 3, [{ material: 'agua_bendita', qty: 2 }], 30, 'Luz que golpea a distancia.'),
  book('drenar', 'Drenar', ['arma'], 'drenar', 2, 3, [{ material: 'amatista', qty: 1 }, { material: 'sangre_bestia', qty: 1 }], 30, 'Un golpe oscuro que roba la mitad del daño como vida.'),
  book('nube_toxica', 'Nube tóxica', ['distancia', 'joyeria'], 'nube_toxica', 1, 4, [{ material: 'glandula_veneno', qty: 2 }], 20, 'Una nube de veneno en área.'),
  book('bastion', 'Bastión', ['escudo'], 'bastion', 1, 5, [{ material: 'totem_tallado', qty: 1 }, { material: 'agua_bendita', qty: 1 }], 30, 'Todo el grupo queda protegido por dos turnos.', 'raro'),
  {
    id: 'regeneracion', name: 'Regeneración', source: 'grimorio', kind: 'pasiva', categories: ['joyeria', 'armadura'],
    cost: [{ material: 'esencia_vital', qty: 1 }], gold: 25, effect: { valuePct: 20 }, combat: { regen: 3 },
    description: 'Recupera 3 de vida por turno en combate.',
  },
  {
    id: 'reserva_arcana', name: 'Reserva arcana', source: 'grimorio', kind: 'pasiva', categories: ['joyeria'],
    cost: [{ material: 'opalo_lunar', qty: 1 }], gold: 40, effect: { valuePct: 30 }, combat: { abilityUses: 1 }, minRarity: 'raro',
    description: 'Un uso más por combate para todas las habilidades activas de quien la lleva.',
  },
];
