import { describe, expect, it } from 'vitest';
import { CONTENT as c } from '../data';
import { acceptQuest } from './town/quests';
import { goTo, restSlot, sleepUntilMorning } from './city';
import { runCommand } from './commands';
import { hireMercenary } from './party/mercenaries';
import { currentCity } from './state';
import { createRng } from './rng';
import { ADVANCED, commonMaterials, EARLY, MID, simFight as fight } from './simulation';
import { makeItem, setup } from './testUtils';
import { generateGroup, groupThreat } from './world/encounters';
import { dangerFor } from './world/expedition';
import type { ZoneDef } from './world/types';

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

  it('las Tierras del Dragón piden un grupo avanzado, y sus jefes son un desafío también para él', () => {
    const caldera = c.regions.tierras_dragon.zoneDefs[2];
    const run = (stage: typeof MID, monsters: (i: number) => string[], arena: string) => {
      let wins = 0;
      let hp = 0;
      for (let i = 0; i < 8; i++) {
        const f = fight(stage, monsters(i), arena, 700 + i);
        wins += f.win ? 1 : 0;
        hp += f.hp;
      }
      return { wins: wins / 8, hp: hp / 8 };
    };
    const group = (i: number) => generateGroup(c, caldera, 'tarde', createRng(800 + i)).monsters;
    const mid = run(MID, group, caldera.biome);
    expect(mid.wins).toBeLessThanOrEqual(0.5);
    expect(mid.hp).toBeLessThan(0.3);
    expect(run(ADVANCED, group, caldera.biome).wins).toBeGreaterThan(0.8);
    const malgor = run(ADVANCED, () => c.regions.ruinas_vigia.boss!.monsters, 'ruinas_grieta');
    expect(malgor.wins).toBeGreaterThan(0.6);
    expect(malgor.hp).toBeLessThan(0.75);
    const cendralia = run(ADVANCED, () => c.regions.tierras_dragon.boss!.monsters, 'volcan_caldera');
    expect(cendralia.hp).toBeLessThan(0.5);
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
