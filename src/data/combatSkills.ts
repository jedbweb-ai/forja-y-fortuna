import type { CombatSkill } from '../core/combat/types';
import type { WeaponKind } from '../core/party/types';

// Acciones de combate. Las del grupo vienen SIEMPRE del equipo (tipo de arma o escudo).
export const COMBAT_SKILLS: CombatSkill[] = [
  // ── Grupo: por tipo de arma ──
  { id: 'punetazo', name: 'Puñetazo', range: [1, 1], target: 'enemy', power: 1, damageType: 'contundente', cooldown: 0, description: 'Sin arma, a las piñas.' },
  { id: 'ataque', name: 'Ataque', range: [1, 1], target: 'enemy', power: 1, cooldown: 0, description: 'Golpe básico con el arma.' },
  { id: 'punalada', name: 'Puñalada', range: [1, 1], target: 'enemy', power: 1, flankPower: 1.7, critBonus: 0.1, cooldown: 2, description: 'Por la espalda o de costado hace mucho más daño.' },
  { id: 'tajo_giratorio', name: 'Tajo giratorio', range: [1, 1], target: 'enemy', area: 'adjacent', power: 0.8, cooldown: 3, description: 'Golpea a todos los enemigos que tenés al lado.' },
  { id: 'golpe_aplastante', name: 'Golpe aplastante', range: [1, 1], target: 'enemy', power: 1.3, damageType: 'contundente', cooldown: 3, statuses: [{ id: 'aturdido', chance: 0.4, turns: 1 }], description: 'Golpe pesado: 40% de chance de aturdir.' },
  { id: 'disparo', name: 'Disparo', range: [2, 5], target: 'enemy', power: 1, damageType: 'perforante', ammo: true, cooldown: 0, description: 'Dispara una flecha. Gasta munición.' },
  { id: 'disparo_apuntado', name: 'Disparo apuntado', range: [2, 6], target: 'enemy', power: 1.4, damageType: 'perforante', ammo: true, critBonus: 0.15, cooldown: 2, description: 'Más daño y crítico. Gasta munición.' },
  { id: 'culatazo', name: 'Culatazo', range: [1, 1], target: 'enemy', power: 0.5, damageType: 'contundente', cooldown: 0, description: 'Golpe con el arco cuando el enemigo está encima.' },
  { id: 'golpe_herramienta', name: 'Herramientazo', range: [1, 1], target: 'enemy', power: 0.9, cooldown: 0, description: 'No es un arma, pero pega.' },
  { id: 'cubrirse', name: 'Cubrirse', range: [0, 0], target: 'self', power: 0, cooldown: 2, statuses: [{ id: 'cubierto', chance: 1, turns: 1 }], description: 'Hasta tu próximo turno recibís mucho menos daño.' },
  { id: 'empujon', name: 'Empujón de escudo', range: [1, 1], target: 'enemy', power: 0.4, damageType: 'contundente', push: 1, cooldown: 2, description: 'Empuja al enemigo una casilla. Si cae de una altura, se lastima.' },

  // ── Monstruos ──
  { id: 'mordisco', name: 'Mordisco', range: [1, 1], target: 'enemy', power: 1, cooldown: 0, description: '' },
  { id: 'golpe_gel', name: 'Golpe gelatinoso', range: [1, 1], target: 'enemy', power: 1, damageType: 'contundente', cooldown: 0, description: '' },
  { id: 'escupitajo_acido', name: 'Escupitajo ácido', range: [1, 3], target: 'enemy', power: 0.8, element: 'veneno', wear: 3, cooldown: 2, statuses: [{ id: 'corroido', chance: 0.7, turns: 2 }], description: 'Corroe la armadura.' },
  { id: 'toque_escarcha', name: 'Toque de escarcha', range: [1, 1], target: 'enemy', power: 1, element: 'hielo', cooldown: 0, statuses: [{ id: 'ralentizado', chance: 0.5, turns: 2 }], description: 'Ralentiza.' },
  { id: 'tajo_goblin', name: 'Tajo oxidado', range: [1, 1], target: 'enemy', power: 1, damageType: 'cortante', cooldown: 0, description: '' },
  { id: 'honda', name: 'Honda', range: [2, 4], target: 'enemy', power: 0.9, damageType: 'contundente', cooldown: 0, description: '' },
  { id: 'curar_totem', name: 'Canto del tótem', range: [0, 3], target: 'ally', power: 0, healPct: 0.3, cooldown: 2, description: 'Cura a un aliado.' },
  { id: 'furia_totem', name: 'Furia del tótem', range: [0, 3], target: 'ally', power: 0, cooldown: 3, statuses: [{ id: 'potenciado', chance: 1, turns: 2 }], description: 'Potencia a un aliado.' },
  { id: 'escudazo', name: 'Escudazo', range: [1, 1], target: 'enemy', power: 0.9, damageType: 'contundente', cooldown: 0, description: '' },
  { id: 'guardia_goblin', name: 'Guardia', range: [0, 0], target: 'self', power: 0, cooldown: 2, statuses: [{ id: 'cubierto', chance: 1, turns: 1 }], description: '' },
  { id: 'zarpazo', name: 'Zarpazo', range: [1, 1], target: 'enemy', power: 1.1, damageType: 'cortante', cooldown: 0, statuses: [{ id: 'sangrado', chance: 0.35, turns: 2 }], description: '' },
  { id: 'embestida', name: 'Embestida', range: [1, 1], target: 'enemy', power: 1.5, damageType: 'contundente', charge: 4, push: 1, cooldown: 2, description: 'Carga en línea recta y empuja.' },
  { id: 'telarana', name: 'Telaraña', range: [2, 4], target: 'enemy', power: 0.4, cooldown: 2, statuses: [{ id: 'inmovilizado', chance: 0.9, turns: 2 }], description: 'Inmoviliza.' },
  { id: 'picadura', name: 'Picadura', range: [1, 1], target: 'enemy', power: 1, damageType: 'perforante', element: 'veneno', cooldown: 0, statuses: [{ id: 'veneno', chance: 0.5, turns: 3 }], description: '' },
  { id: 'rugido', name: 'Rugido', range: [0, 0], target: 'self', power: 0, cooldown: 4, statuses: [{ id: 'potenciado', chance: 1, turns: 2 }], description: '' },
  { id: 'grito_guerra', name: 'Grito de guerra', range: [0, 0], target: 'self', area: 'adjacent', power: 0, cooldown: 4, description: 'Potencia a toda la banda.' },
  { id: 'hachazo_jefe', name: 'Hachazo', range: [1, 1], target: 'enemy', power: 1.3, damageType: 'cortante', cooldown: 0, statuses: [{ id: 'sangrado', chance: 0.3, turns: 2 }], description: '' },
];

export const WEAPON_SKILLS: Record<WeaponKind | 'escudo', string[]> = {
  punos: ['punetazo'],
  daga: ['ataque', 'punalada'],
  espada: ['ataque', 'tajo_giratorio'],
  maza: ['ataque', 'golpe_aplastante'],
  arco: ['disparo', 'disparo_apuntado', 'culatazo'],
  herramienta: ['golpe_herramienta'],
  escudo: ['cubrirse', 'empujon'],
};
