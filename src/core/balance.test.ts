import { describe, expect, it } from 'vitest';
import { CONTENT as c } from '../data';
import { acceptQuest } from './town/quests';
import { goTo, restSlot, sleepUntilMorning } from './city';
import { aiTurn } from './combat/ai';
import { runCommand } from './commands';
import { hireMercenary } from './party/mercenaries';
import { currentCity } from './state';
import { beginTurn, buildCombat } from './combat/engine';
import { equipItem } from './party/equipment';
import { createMercenary, gainXp, xpToNext } from './party/progression';
import { createRng } from './rng';
import { makeItem, setup } from './testUtils';
import { generateGroup, groupThreat } from './world/encounters';
import { dangerFor } from './world/expedition';
import type { ZoneDef } from './world/types';

// Simulación de balance: el grupo y los monstruos pelean solos con la IA.
// Es pesimista (la IA del grupo no usa pociones ni esquiva golpes anunciados), así que mide tendencias, no números exactos.

interface Stage { tier: number; quality: number; levels: Record<string, number> }

const EARLY: Stage = { tier: 1, quality: 50, levels: { herrero: 1, brunilda: 3, ciro: 2 } };
const MID: Stage = { tier: 2, quality: 70, levels: { herrero: 7, brunilda: 8, ciro: 7 } };
const GEAR: Record<string, string[]> = {
  herrero: ['espada_larga', 'peto', 'escudo_mediano'],
  brunilda: ['maza', 'peto', 'escudo_mediano'],
  ciro: ['arco_corto', 'peto'],
};

/** Materiales comunes del nivel pedido para cada parte del plano (null si alguna parte no tiene). */
function commonMaterials(blueprintId: string, tier: number): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const part of c.blueprints[blueprintId].parts) {
    const opts = Object.values(c.materials)
      .filter((m) => (part.types.includes(m.type) || part.extra?.includes(m.id)) && m.price < 100 && m.tier <= tier && m.tier >= tier - 1)
      .sort((a, b) => b.tier - a.tier || a.price - b.price);
    const pick = opts[Math.floor(opts.length / 3)]?.id;
    if (!pick) return null;
    out[part.slot] = pick;
  }
  return out;
}

function party(stage: Stage, seed: number) {
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

function fight(stage: Stage, monsters: string[], biome: string, seed: number) {
  const { s, members } = party(stage, seed);
  const rng = createRng(seed * 7 + 1);
  s.expedition = {
    regionId: 'linde_brezal', pos: { x: 0, y: 0 }, energy: 99, maxEnergy: 99, spent: 0, bag: {}, capacity: 99, nodes: [], groups: [],
    members, combat: null, report: null, nightSpawned: false, nextId: 1, home: 'herreria',
  };
  const arenas = Object.values(c.arenas).filter((a) => a.biome === biome);
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

const ZONES: ZoneDef[] = [
  ...Object.values(c.regions).filter((r) => r.available && !r.hidden).flatMap((r) => r.zoneDefs),
  ...Object.values(c.dungeons).flatMap((d) => d.depth),
];

describe('balance (simulación)', () => {
  it('los combates de todas las zonas se juegan enteros sin errores de la IA', () => {
    for (const stage of [EARLY, MID]) {
      ZONES.forEach((z, i) => {
        const g = generateGroup(c, z, i % 2 ? 'noche' : 'tarde', createRng(900 + i));
        expect(() => fight(stage, g.monsters, z.biome, 40 + i)).not.toThrow();
      });
    }
  });

  it('la etiqueta de peligro acompaña lo que pasa en el combate', () => {
    const byLabel: Record<string, { n: number; wins: number; hp: number }> = {};
    for (const stage of [EARLY, MID]) {
      ZONES.forEach((z, i) => {
        for (let k = 0; k < 3; k++) {
          const g = generateGroup(c, z, 'tarde', createRng(1000 + i * 10 + k));
          const r = fight(stage, g.monsters, z.biome, 70 + i * 10 + k);
          const label = dangerFor(c, r.s, groupThreat(c, g.monsters), r.members);
          const a = (byLabel[label] ??= { n: 0, wins: 0, hp: 0 });
          a.n++;
          a.wins += r.win ? 1 : 0;
          a.hp += r.hp;
        }
      });
    }
    const winRate = (l: string) => byLabel[l].wins / byLabel[l].n;
    const hpLeft = (l: string) => byLabel[l].hp / byLabel[l].n;
    expect(winRate('fácil')).toBeGreaterThan(0.95);
    expect(hpLeft('fácil')).toBeGreaterThan(0.6);
    expect(winRate('difícil')).toBeLessThan(winRate('fácil'));
    expect(hpLeft('parejo')).toBeLessThan(hpLeft('fácil'));
    expect(hpLeft('difícil')).toBeLessThan(hpLeft('parejo'));
  });

  it('en cada región, las zonas más profundas son más duras', () => {
    for (const r of Object.values(c.regions).filter((x) => x.available && !x.hidden && x.zoneDefs.length > 1)) {
      const hp = r.zoneDefs.map((z, zi) => {
        let sum = 0;
        for (let i = 0; i < 8; i++) sum += fight(MID, generateGroup(c, z, 'tarde', createRng(300 + zi * 20 + i)).monsters, z.biome, 300 + i).hp;
        return sum / 8;
      });
      expect(hp[hp.length - 1], r.id).toBeLessThan(hp[0]);
    }
  });
});

describe('balance (economía)', () => {
  it('forjar con materiales comunes siempre deja ganancia', () => {
    for (const bp of Object.values(c.blueprints)) {
      for (const [tier, quality] of [[1, 50], [2, 70]]) {
        const mats = commonMaterials(bp.id, tier);
        if (!mats) continue;
        const cost = bp.parts.reduce((a, p) => a + c.materials[mats[p.slot]].price * p.qty, 0);
        const { s } = setup(1);
        const it = makeItem(s, bp.id, mats, quality);
        expect(it.value * it.quantity, `${bp.id} t${tier}`).toBeGreaterThan(cost * 1.5);
      }
    }
  });
});

describe('partida larga', () => {
  it('pasan 120 días con grupo y encargos sin errores ni valores rotos', () => {
    const { s, ctx } = setup(7);
    s.gold = 5000;
    runCommand(s, ctx, goTo, 'taberna');
    runCommand(s, ctx, hireMercenary, 'brunilda');
    for (let day = 0; day < 120; day++) {
      if (day % 15 === 0 && s.quests.offers.length) {
        const offer = s.quests.offers[0];
        const board = c.cities[offer.city].locations.find((l) => l.kind === offer.board);
        if (board && offer.city === currentCity(s)) {
          runCommand(s, ctx, goTo, board.id);
          runCommand(s, ctx, acceptQuest, offer.id);
        }
      }
      if (s.location !== 'herreria') runCommand(s, ctx, goTo, 'herreria');
      runCommand(s, ctx, restSlot);
      runCommand(s, ctx, restSlot);
      runCommand(s, ctx, sleepUntilMorning);
    }
    expect(s.day).toBeGreaterThanOrEqual(120);
    expect(Number.isFinite(s.gold)).toBe(true);
    for (const v of Object.values(s.reputation)) expect(Number.isFinite(v)).toBe(true);
    for (const city of Object.values(s.demand)) for (const v of Object.values(city)) expect(Number.isFinite(v as number)).toBe(true);
    expect(s.market?.day).toBe(s.day);
  });
});
