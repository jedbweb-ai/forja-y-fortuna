import { CONTENT as c } from '../data';
import { aiTurn } from './combat/ai';
import { beginTurn, buildCombat } from './combat/engine';
import { equipItem } from './party/equipment';
import { createMercenary, gainXp, xpToNext } from './party/progression';
import { createRng } from './rng';
import { makeItem, setup } from './testUtils';

// Simulación de balance (solo para tests): el grupo y los monstruos pelean solos con la IA.
// Es pesimista (la IA del grupo no usa pociones ni esquiva golpes anunciados), así que mide tendencias, no números exactos.

export interface Stage { tier: number; quality: number; levels: Record<string, number> }

export const EARLY: Stage = { tier: 1, quality: 50, levels: { herrero: 1, brunilda: 3, ciro: 2 } };
export const MID: Stage = { tier: 2, quality: 70, levels: { herrero: 7, brunilda: 8, ciro: 7 } };
/** Grupo de 4 recién armado (reputación renombrada), con equipo de nivel 2: el que llega a las Ruinas. */
export const RENOWNED: Stage = { tier: 2, quality: 75, levels: { herrero: 9, brunilda: 10, ciro: 9, nayra: 9 } };
/** Grupo de 4 con equipo de materiales de nivel 3: el que llega a las Ruinas y a las Tierras del Dragón. */
export const ADVANCED: Stage = { tier: 3, quality: 85, levels: { herrero: 14, brunilda: 14, ciro: 13, nayra: 13 } };

const GEAR: Record<string, string[]> = {
  herrero: ['espada_larga', 'peto', 'escudo_mediano'],
  brunilda: ['maza', 'peto', 'escudo_mediano'],
  ciro: ['arco_corto', 'peto'],
  nayra: ['espada_larga', 'peto'],
};

/** Materiales comunes del nivel pedido para cada parte del plano (null si alguna parte no tiene). */
export function commonMaterials(blueprintId: string, tier: number): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const part of c.blueprints[blueprintId].parts) {
    const allowed = Object.values(c.materials)
      .filter((m) => (part.types.includes(m.type) || part.extra?.includes(m.id)) && m.price < 100 && m.tier <= tier)
      .sort((a, b) => b.tier - a.tier || a.price - b.price);
    // Del nivel pedido o el anterior; si la parte no tiene (plumas, cuerdas), lo mejor que haya más abajo.
    const opts = allowed.filter((m) => m.tier >= tier - 1);
    const pick = opts.length ? opts[Math.floor(opts.length / 3)].id : tier > 1 ? allowed[0]?.id : undefined;
    if (!pick) return null;
    out[part.slot] = pick;
  }
  return out;
}

export function simParty(stage: Stage, seed: number) {
  const { s, ctx } = setup(seed);
  const members = Object.keys(stage.levels);
  s.party = members;
  for (const id of members) {
    if (id !== 'herrero') s.characters[id] = createMercenary(c.mercenaries[id]);
    const ch = s.characters[id];
    let xp = 0;
    for (let l = ch.level; l < stage.levels[id]; l++) xp += xpToNext(l);
    gainXp(c, ch, xp);
    for (const bp of GEAR[id]) equipItem(s, ctx, id, makeItem(s, bp, commonMaterials(bp, stage.tier)!, stage.quality).uid);
  }
  makeItem(s, 'flechas', commonMaterials('flechas', stage.tier)!, stage.quality).quantity = 99;
  return { s, members };
}

/** Un combate completo jugado por la IA. `arena`: un bioma o el id de una arena. */
export function simFight(stage: Stage, monsters: string[], arena: string, seed: number) {
  const { s, members } = simParty(stage, seed);
  const rng = createRng(seed * 7 + 1);
  s.expedition = {
    regionId: 'linde_brezal', pos: { x: 0, y: 0 }, energy: 99, maxEnergy: 99, spent: 0, bag: {}, capacity: 99, nodes: [], groups: [],
    members, combat: null, report: null, nightSpawned: false, nextId: 1, home: 'herreria',
  };
  const arenas = Object.values(c.arenas).filter((a) => a.biome === arena || a.id === arena);
  const cs = buildCombat(c, s, { id: 'g', x: 0, y: 0, zone: 0, monsters, threat: 0, aggressive: false }, rng.pick(arenas).id, members);
  s.expedition.combat = cs;
  beginTurn(c, s, rng);
  for (let guard = 0; !cs.outcome && cs.round < 40 && guard < 2000; guard++) {
    const u = cs.units.find((x) => x.id === cs.order[cs.turnIndex]);
    if (u?.side === 'party') cs.autoUnit = u.id;
    aiTurn(c, s, rng);
  }
  const ours = cs.units.filter((u) => u.side === 'party');
  return { win: cs.outcome === 'victory', hp: ours.reduce((a, u) => a + Math.max(0, u.hp), 0) / ours.reduce((a, u) => a + u.maxHp, 0), s, members };
}
