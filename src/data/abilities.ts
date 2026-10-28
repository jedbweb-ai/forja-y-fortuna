import type { CombatSkill } from '../core/combat/types';

// Fase 3: habilidades activas que dan los encantamientos, y las acciones de los arrojadizos.
// Se arman con piezas: alcance, forma del área, elemento, estados y efecto sobre el terreno.
// Usos por combate y enfriamiento NO van acá: dependen de cómo se fabricó el objeto.
export const ABILITY_SKILLS: CombatSkill[] = [
  // ── Fuego ──
  { id: 'golpe_igneo', name: 'Golpe ígneo', range: [1, 1], target: 'enemy', power: 1.5, element: 'fuego', cooldown: 0, statuses: [{ id: 'quemadura', chance: 0.6, turns: 3 }], description: 'Tajo envuelto en llamas.' },
  { id: 'abanico_brasas', name: 'Abanico de brasas', range: [1, 1], target: 'tile', area: 'cone', size: 2, power: 1, element: 'fuego', terrain: 'llamas', cooldown: 0, statuses: [{ id: 'quemadura', chance: 0.4, turns: 3 }], description: 'Cono de fuego. Incendia la hierba alta.' },
  { id: 'lluvia_ascuas', name: 'Lluvia de ascuas', range: [2, 5], target: 'tile', area: 'radius', size: 1, power: 0.9, element: 'fuego', terrain: 'llamas', ammo: true, cooldown: 0, statuses: [{ id: 'quemadura', chance: 0.4, turns: 2 }], description: 'Flechas explosivas en área.' },
  // ── Hielo ──
  { id: 'lanza_hielo', name: 'Lanza de hielo', range: [1, 1], target: 'tile', area: 'line', size: 3, power: 1.1, element: 'hielo', terrain: 'hielo', cooldown: 0, statuses: [{ id: 'ralentizado', chance: 0.6, turns: 2 }], description: 'Línea de escarcha. Congela el agua.' },
  { id: 'nova_escarcha', name: 'Nova de escarcha', range: [0, 0], target: 'self', area: 'radius', size: 1, power: 0.8, element: 'hielo', terrain: 'hielo', cooldown: 0, statuses: [{ id: 'inmovilizado', chance: 0.45, turns: 1 }], description: 'Explosión de frío alrededor.' },
  { id: 'flecha_glacial', name: 'Flecha glacial', range: [2, 6], target: 'enemy', power: 1.2, element: 'hielo', terrain: 'hielo', ammo: true, cooldown: 0, statuses: [{ id: 'inmovilizado', chance: 0.35, turns: 1 }], description: 'Congela el suelo bajo el objetivo.' },
  { id: 'escudo_glacial', name: 'Escudo glacial', range: [0, 0], target: 'self', area: 'radius', size: 1, power: 0.6, element: 'hielo', terrain: 'hielo', cooldown: 0, statuses: [{ id: 'ralentizado', chance: 0.8, turns: 2 }], description: 'Escarcha alrededor del escudo.' },
  // ── Rayo ──
  { id: 'descarga', name: 'Descarga', range: [2, 4], target: 'enemy', power: 1.1, element: 'rayo', chain: true, cooldown: 0, description: 'Rayo a distancia. Salta por el agua y a los mojados.' },
  { id: 'lanza_rayo', name: 'Lanza de rayo', range: [1, 1], target: 'tile', area: 'line', size: 4, power: 1, element: 'rayo', chain: true, cooldown: 0, description: 'Línea de rayo.' },
  { id: 'tormenta', name: 'Tormenta', range: [2, 5], target: 'tile', area: 'radius', size: 1, power: 1.2, element: 'rayo', chain: true, cooldown: 0, description: 'Rayos en área.' },
  // ── Agua ──
  { id: 'chorro', name: 'Chorro', range: [1, 3], target: 'enemy', power: 0.9, element: 'agua', terrain: 'charco', cooldown: 0, statuses: [{ id: 'mojado', chance: 1, turns: 3 }], description: 'Moja y deja un charco.' },
  { id: 'ola', name: 'Ola', range: [1, 1], target: 'tile', area: 'cone', size: 2, power: 0.8, element: 'agua', terrain: 'charco', push: 1, cooldown: 0, statuses: [{ id: 'mojado', chance: 1, turns: 3 }], description: 'Cono de agua que empuja.' },
  // ── Tierra y viento ──
  { id: 'golpe_tectonico', name: 'Golpe tectónico', range: [1, 1], target: 'enemy', power: 1.4, element: 'tierra', damageType: 'contundente', cooldown: 0, statuses: [{ id: 'aturdido', chance: 0.35, turns: 1 }], description: 'Mazazo que aturde.' },
  { id: 'sismo', name: 'Sismo', range: [0, 0], target: 'self', area: 'radius', size: 1, power: 0.9, element: 'tierra', damageType: 'contundente', cooldown: 0, statuses: [{ id: 'aturdido', chance: 0.25, turns: 1 }], description: 'Golpe al suelo alrededor.' },
  { id: 'rafaga', name: 'Ráfaga', range: [1, 1], target: 'tile', area: 'line', size: 3, power: 0.8, element: 'viento', push: 1, cooldown: 0, description: 'Línea de viento que empuja.' },
  { id: 'paso_viento', name: 'Paso de viento', range: [0, 0], target: 'self', power: 0, cooldown: 0, statuses: [{ id: 'acelerado', chance: 1, turns: 2 }], description: 'Más movimiento y velocidad.' },
  // ── Luz, oscuridad y veneno ──
  { id: 'luz_sanadora', name: 'Luz sanadora', range: [0, 3], target: 'ally', power: 0, healPct: 0.35, element: 'sagrado', cooldown: 0, description: 'Cura a un aliado.' },
  { id: 'castigo_sagrado', name: 'Castigo sagrado', range: [1, 4], target: 'enemy', power: 1.4, element: 'sagrado', cooldown: 0, description: 'Luz que golpea a distancia.' },
  { id: 'drenar', name: 'Drenar', range: [1, 1], target: 'enemy', power: 1.1, element: 'oscuro', lifeStealPct: 50, cooldown: 0, description: 'Roba la mitad del daño como vida.' },
  { id: 'nube_toxica', name: 'Nube tóxica', range: [2, 4], target: 'tile', area: 'radius', size: 1, power: 0.4, element: 'veneno', cooldown: 0, statuses: [{ id: 'veneno', chance: 0.9, turns: 3 }], description: 'Veneno en área.' },
  { id: 'bastion', name: 'Bastión', range: [0, 0], target: 'self', area: 'adjacent', power: 0, cooldown: 0, statuses: [{ id: 'protegido', chance: 1, turns: 2 }], description: 'Todo el grupo queda protegido.' },

  // ── Arrojadizos (gastan una unidad del lote del cinturón) ──
  { id: 'lanzar_cuchillo', name: 'Lanzar cuchillo', range: [2, 4], target: 'enemy', power: 1, damageType: 'perforante', throw: true, cooldown: 0, description: 'Cuchillo arrojadizo.' },
  { id: 'lanzar_hacha', name: 'Lanzar hacha', range: [1, 3], target: 'enemy', power: 1.3, damageType: 'cortante', throw: true, cooldown: 0, description: 'Hacha arrojadiza: pesada y brutal.' },
  { id: 'lanzar_estrella', name: 'Lanzar estrella', range: [2, 5], target: 'enemy', power: 0.8, damageType: 'cortante', throw: true, cooldown: 0, statuses: [{ id: 'sangrado', chance: 0.3, turns: 2 }], description: 'Llega lejos y hace sangrar.' },
  { id: 'lanzar_bomba', name: 'Lanzar bomba', range: [2, 4], target: 'tile', area: 'radius', size: 1, power: 1, damageType: 'contundente', throw: true, friendlyFire: true, cooldown: 0, description: 'Explota en área. El elemento lo da la carga.' },
];
