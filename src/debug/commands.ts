import type { Ctx } from '../core/content';
import { addMaterial, changeRelation, changeReputation, currentCity, nextUid, skillLevel, xpForLevel } from '../core/state';
import { buildItem } from '../core/forge/item';
import { advanceTime } from '../core/time';
import type { GameEvent, GameState, SkillId } from '../core/types';
import { hireMercenary } from '../core/party/mercenaries';
import { maxHp } from '../core/party/progression';
import { debugEngage } from '../core/world/expedition';
import { potionItem } from '../core/magic/alchemy';
import { acquireGrimoire } from '../core/magic/grimoires';

// Comandos del modo debug. Mismo formato que los comandos del juego.

export function dbgGold(s: GameState, _ctx: Ctx, amount: number): GameEvent[] {
  s.gold += amount;
  return [{ type: 'toast', text: `[debug] +${amount} oro` }];
}

export function dbgMaterials(s: GameState, { c }: Ctx, qty: number, id?: string): GameEvent[] {
  const ids = id ? [id] : Object.keys(c.materials);
  ids.forEach((m) => addMaterial(s, m, qty));
  return [{ type: 'toast', text: `[debug] +${qty} de ${id ? c.materials[id].name : 'cada material'}` }];
}

export function dbgAdvance(s: GameState, _ctx: Ctx, slots: number): GameEvent[] {
  s.outing = false;
  return advanceTime(s, slots);
}

export function dbgLevelUp(s: GameState, _ctx: Ctx, skill: SkillId): GameEvent[] {
  s.skills[skill] = xpForLevel(skillLevel(s.skills[skill]) + 1);
  return [{ type: 'toast', text: `[debug] ${skill} nivel ${skillLevel(s.skills[skill])}` }];
}

export function dbgRelation(s: GameState, _ctx: Ctx, npc: string, delta: number): GameEvent[] {
  changeRelation(s, npc, delta);
  s.npcs[npc].lastTalkDay = 0;
  return [];
}

export function dbgReputation(s: GameState, _ctx: Ctx, delta: number): GameEvent[] {
  changeReputation(s, currentCity(), delta);
  return [];
}

export function dbgRevealSynergies(s: GameState, { c }: Ctx): GameEvent[] {
  s.discoveredSynergies = Object.keys(c.synergies);
  return [{ type: 'toast', text: '[debug] Todas las sinergias reveladas' }];
}

/** Combates de prueba por familia o contra el jefe. */
export function dbgCombat(s: GameState, ctx: Ctx, kind: 'gelines' | 'goblins' | 'bestias' | 'jefe'): GameEvent[] {
  const groups: Record<string, string[]> = {
    gelines: ['gelin_verde', 'gelin_verde', 'gelin_acido'],
    goblins: ['goblin_rasposo', 'goblin_hondero', 'chaman_totem', 'goblin_escudero'],
    bestias: ['lobo_gris', 'lobo_gris', 'jabali', 'arana'],
    jefe: ctx.c.regions.linde_brezal.boss!.monsters,
  };
  return debugEngage(s, ctx, groups[kind], kind === 'jefe');
}

export function dbgHealParty(s: GameState): GameEvent[] {
  for (const id of s.party) {
    const ch = s.characters[id];
    ch.hp = maxHp(ch);
    ch.injuredUntilDay = 0;
  }
  if (s.expedition) s.expedition.energy = s.expedition.maxEnergy;
  return [{ type: 'toast', text: '[debug] Grupo curado y con energía' }];
}

export function dbgHire(s: GameState, ctx: Ctx, id: string): GameEvent[] {
  const loc = s.location;
  s.location = 'taberna';
  s.gold += ctx.c.mercenaries[id].hireCost;
  try {
    return hireMercenary(s, ctx, id);
  } finally {
    s.location = loc;
  }
}

/** Kit de prueba: armas, armaduras, herramientas y flechas de hierro/acero. */
export function dbgKit(s: GameState, { c }: Ctx): GameEvent[] {
  const kit: [string, Record<string, string>][] = [
    ['daga', { hoja: 'acero', guarda: 'hierro', mango: 'cuero_endurecido' }],
    ['espada_larga', { hoja: 'acero', guarda: 'acero', mango: 'cuero_endurecido', pomo: 'acero' }],
    ['maza', { cabeza: 'hierro', mango: 'roble' }],
    ['arco_corto', { cuerpo: 'fresno', cuerda: 'tripa_trenzada', empunadura: 'cuero_curtido' }],
    ['flechas', { punta: 'hierro', astil: 'fresno', emplumado: 'plumas_ganso' }],
    ['escudo_mediano', { tablas: 'roble', refuerzo: 'hierro', correas: 'cuero_curtido' }],
    ['peto', { placas: 'hierro', forro: 'cuero_curtido' }],
    ['peto', { placas: 'cuero_endurecido', forro: 'cuero_curtido' }],
    ['pico', { cabeza: 'acero', mango: 'roble' }],
    ['hacha_tala', { cabeza: 'hierro', mango: 'roble' }],
    ['cuchillo_desuello', { hoja: 'hierro', mango: 'cuero_curtido' }],
  ];
  for (const [bp, materials] of kit) {
    const build = buildItem(c, { blueprintId: bp, materials, stage: 'enchant', hits: 6, quality: 65, defects: 0, traits: [], finish: [], instability: 0 });
    const { rarityScore: _r, design: _d, ...rest } = build;
    s.items.push({ ...rest, uid: nextUid(s, 'it'), exhibited: false, createdDay: s.day });
  }
  return [{ type: 'toast', text: `[debug] Kit de prueba: ${kit.length} objetos` }];
}

export function dbgResetTalks(s: GameState): GameEvent[] {
  Object.values(s.npcs).forEach((n) => { n.lastTalkDay = 0; });
  return [{ type: 'toast', text: '[debug] Límite diario de charlas reiniciado' }];
}

/** Kit de la Fase 3: grimorios, joyas con habilidades, arrojadizos, hoz y pociones en el cinturón. */
export function dbgMagicKit(s: GameState, { c }: Ctx): GameEvent[] {
  for (const g of Object.keys(c.grimoires)) acquireGrimoire(s, c, g);
  const kit: [string, Record<string, string>, string[]][] = [
    ['anillo', { aro: 'plata', engarce: 'rubi' }, ['runa_alivio']],
    ['anillo', { aro: 'cobre', engarce: 'zafiro' }, ['runa_paso']],
    ['amuleto', { cadena: 'plata', colgante: 'ambar' }, ['castigo_sagrado']],
    ['espada_larga', { hoja: 'acero', guarda: 'acero', mango: 'cuero_endurecido', pomo: 'acero' }, ['runa_chispa']],
    ['daga', { hoja: 'acero', guarda: 'hierro', mango: 'cuero_curtido' }, ['runa_escarcha']],
    ['cuchillos_arrojadizos', { hoja: 'acero', mango: 'roble' }, []],
    ['bombas', { casco: 'hierro', carga: 'ascua_salamandrilla' }, []],
    ['hoz', { hoja: 'hierro', mango: 'roble' }, []],
  ];
  for (const [bp, materials, ench] of kit) {
    const runeQuality = Object.fromEntries(ench.map((e) => [e, 80]));
    const build = buildItem(c, { blueprintId: bp, materials, stage: 'enchant', hits: 6, quality: 70, defects: 0, traits: [], finish: [], instability: 0 }, ench, runeQuality);
    const { rarityScore: _r, design: _d, ...rest } = build;
    s.items.push({ ...rest, uid: nextUid(s, 'it'), exhibited: false, createdDay: s.day });
  }
  const pot = potionItem(s, c.potions.pocion_curacion, 1, 4);
  s.items.push(pot);
  s.belt[pot.uid] = 3;
  return [{ type: 'toast', text: `[debug] Kit mágico: ${kit.length} objetos, grimorios y pociones` }];
}
