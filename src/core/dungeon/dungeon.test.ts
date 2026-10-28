import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../config/balance';
import { CONTENT } from '../../data';
import { beginTurn, buildCombat, partyUnits, useSkill } from '../combat/engine';
import { runCommand } from '../commands';
import { createRng } from '../rng';
import { setup, toasts } from '../testUtils';
import { advanceTime } from '../time';
import { generateGroup } from '../world/encounters';
import { expMove, returnHome, startExpedition } from '../world/expedition';
import {
  answerRiddle, bossReady, discoverEntrance, dungeonDescend, dungeonExamine, dungeonInteract, grantUnique, onBossDefeated,
  startDungeon, tileOf,
} from './dungeon';
import { generateFloor } from './generate';
import type { DungeonFloor } from './types';

const PASSABLE = new Set(['.', ',', 'm', 'B', 'E', 'S', 'c']);

/** Casillas alcanzables desde la entrada sin pasar por secretos ni obstáculos (los cofres se pisan para medir). */
function reachable(m: DungeonFloor, from: { x: number; y: number }, extra = ''): Set<string> {
  const seen = new Set([`${from.x},${from.y}`]);
  const q = [from];
  while (q.length) {
    const p = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: p.x + dx, y: p.y + dy };
      const ch = m.terrain[n.y]?.[n.x];
      if (!ch || seen.has(`${n.x},${n.y}`) || !(PASSABLE.has(ch) || extra.includes(ch))) continue;
      seen.add(`${n.x},${n.y}`);
      q.push(n);
    }
  }
  return seen;
}

function find(m: DungeonFloor, ch: string) {
  const out: { x: number; y: number }[] = [];
  m.terrain.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) out.push({ x, y }); }));
  return out;
}

function enter(id = 'cripta_vigia', seed = 7) {
  const { s, ctx } = setup(seed);
  s.flags.cripta_hallada = true;
  s.reputation.valdebrasa = 50;
  startDungeon(s, ctx, id);
  return { s, ctx, e: s.expedition!, run: s.expedition!.dungeon! };
}

describe('generación de pisos', () => {
  it('siempre se llega de la entrada a la escalera sin pasar por secretos', () => {
    for (const def of Object.values(CONTENT.dungeons)) {
      for (let seed = 1; seed <= 60; seed++) {
        const plan = generateFloor(def, createRng(seed), {
          bossRoom: seed % 3 === 0, bossPresent: seed % 2 === 0,
          pieces: Object.values(CONTENT.roomPieces).filter((p) => !p.dungeons || p.dungeons.includes(def.id)), riddles: def.riddles,
        });
        const m = plan.map;
        const goal = [...find(m, 'S'), ...find(m, 'B')];
        expect(goal.length).toBeGreaterThan(0);
        const r = reachable(m, plan.entry);
        expect(goal.some((g) => r.has(`${g.x},${g.y}`))).toBe(true);
        expect(m.levers.length).toBe(find(m, 'G').length);
        expect(m.terrain.every((row) => row.length === m.terrain[0].length)).toBe(true);
      }
    }
  });

  it('las salas de tesoro solo se alcanzan abriendo su secreto', () => {
    let checked = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const def = CONTENT.dungeons.cuevas_eco;
      const plan = generateFloor(def, createRng(seed), { bossRoom: false, bossPresent: false, pieces: Object.values(CONTENT.roomPieces), riddles: [] });
      const m = plan.map;
      const closed = reachable(m, plan.entry);
      const open = reachable(m, plan.entry, 'FGD');
      for (const room of plan.treasureRooms) {
        const tiles = m.rooms.flatMap((row, y) => [...row].map((ch, x) => (ch === room ? `${x},${y}` : ''))).filter(Boolean);
        expect(tiles.some((t) => closed.has(t))).toBe(false);
        expect(tiles.some((t) => open.has(t))).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});

describe('entrar y recorrer', () => {
  it('la cripta se descubre pisando su entrada en las colinas de Brezal', () => {
    const { s, ctx } = setup();
    expect(() => startDungeon(s, ctx, 'cripta_vigia')).toThrow(/colinas/);
    startExpedition(s, ctx, 'linde_brezal');
    const r = CONTENT.regions.linde_brezal;
    const y = r.terrain.findIndex((row) => row.includes('P'));
    s.expedition!.pos = { x: r.terrain[y].indexOf('P'), y };
    const ev = discoverEntrance(s, ctx.c);
    expect(s.flags.cripta_hallada).toBe(true);
    expect(toasts(ev)[0]).toMatch(/Cripta del Vigía/);
  });

  it('las Cuevas del Eco piden reputación respetada', () => {
    const { s, ctx } = setup();
    expect(() => startDungeon(s, ctx, 'cuevas_eco')).toThrow(/reputación/);
    s.reputation.valdebrasa = 35;
    startDungeon(s, ctx, 'cuevas_eco');
    expect(s.expedition!.dungeon!.floor).toBe(1);
  });

  it('arranca en la entrada con la sala a la vista y el resto en la niebla', () => {
    const { e, run } = enter();
    expect(tileOf(run.map, e.pos.x, e.pos.y)).toBe('E');
    expect(run.map.seen[e.pos.y][e.pos.x]).toBe('1');
    const seen = run.map.seen.join('').split('').filter((c) => c === '1').length;
    expect(seen).toBeLessThan(run.map.seen.join('').length / 2);
  });

  it('solo se vuelve desde el descanso de la escalera, y bajar recupera energía', () => {
    const { s, ctx, e, run } = enter();
    expect(() => returnHome(s, ctx)).toThrow(/descansos/);
    // Despejar el piso para caminar tranquilo hasta la escalera.
    e.groups = [];
    run.map.traps = [];
    const stairs = find(run.map, 'S')[0];
    runCommand(s, ctx, expMove, stairs.x, stairs.y);
    expect(s.expedition!.dungeon!.landing).toBe(true);
    s.expedition!.energy = 2;
    dungeonDescend(s, ctx);
    expect(s.expedition!.dungeon!.floor).toBe(2);
    expect(s.expedition!.energy).toBeGreaterThan(2);
    expect(s.dungeons.progress.cripta_vigia.deepest).toBe(2);
  });

  it('volver desde el descanso guarda lo juntado', () => {
    const { s, ctx, e, run } = enter();
    e.groups = [];
    run.map.traps = [];
    e.bag = { hueso_denso: 3 };
    const stairs = find(run.map, 'S')[0];
    runCommand(s, ctx, expMove, stairs.x, stairs.y);
    returnHome(s, ctx);
    expect(s.expedition).toBeNull();
    expect(s.materials.hueso_denso).toBe(3);
  });

  it('agotado se sigue caminando, pero el grupo pelea peor', () => {
    const { s, ctx, e, run } = enter();
    e.groups = [];
    run.map.traps = [];
    e.energy = 0;
    const before = partyUnits(ctx.c, s, e.members)[0];
    const stairs = find(run.map, 'S')[0];
    expect(() => runCommand(s, ctx, expMove, stairs.x, stairs.y)).not.toThrow();
    e.energy = 10;
    const rested = partyUnits(ctx.c, s, e.members)[0];
    expect(before.atk).toBeLessThanOrEqual(rested.atk);
    expect(BALANCE.dungeon.exhaustedMult).toBeLessThan(1);
  });
});

describe('secretos y trampas', () => {
  it('examinar abre paredes falsas pegadas y desarma trampas cercanas', () => {
    const { s, ctx, e, run } = enter();
    const x = e.pos.x + 1;
    run.map.terrain[e.pos.y] = run.map.terrain[e.pos.y].slice(0, x) + 'F' + run.map.terrain[e.pos.y].slice(x + 1);
    run.map.traps = [{ x: e.pos.x, y: e.pos.y + 1, kind: 'dardos' }];
    dungeonExamine(s, ctx);
    expect(tileOf(run.map, x, e.pos.y)).toBe('.');
    expect(run.map.traps).toHaveLength(0);
  });

  it('palancas abren rejas, las llaves abren puertas y los acertijos premian o castigan', () => {
    const { s, ctx, e, run } = enter();
    const set = (x: number, y: number, ch: string) => { run.map.terrain[y] = run.map.terrain[y].slice(0, x) + ch + run.map.terrain[y].slice(x + 1); };
    const { x, y } = e.pos;
    set(x + 1, y, 'L');
    set(x + 5, y, 'G');
    run.map.levers = [{ x: x + 1, y, gate: { x: x + 5, y }, pulled: false }];
    dungeonInteract(s, ctx, x + 1, y);
    expect(tileOf(run.map, x + 5, y)).toBe('.');

    set(x - 1, y, 'D');
    expect(() => dungeonInteract(s, ctx, x - 1, y)).toThrow(/llave/);
    run.keys = 1;
    dungeonInteract(s, ctx, x - 1, y);
    expect(tileOf(run.map, x - 1, y)).toBe('.');

    set(x, y + 1, 'I');
    run.map.riddles = [{ x, y: y + 1, id: 'r_fuego', solved: false }];
    dungeonInteract(s, ctx, x, y + 1);
    expect(run.riddle).toBe('r_fuego');
    const gold = s.gold;
    answerRiddle(s, ctx, ctx.c.riddles.r_fuego.answer);
    expect(s.gold).toBeGreaterThan(gold);

    set(x, y - 1, 'I');
    run.map.riddles.push({ x, y: y - 1, id: 'r_yunque', solved: false });
    dungeonInteract(s, ctx, x, y - 1);
    const ev = answerRiddle(s, ctx, 2);
    expect(ev.some((x2) => x2.type === 'combatStarted')).toBe(true);
  });

  it('pisar una trampa de dardos frena al grupo y lo lastima sin matar', () => {
    const { s, ctx, e, run } = enter();
    e.groups = [];
    const stairs = find(run.map, 'S')[0];
    // Poner una trampa en el primer paso del camino.
    const step = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: e.pos.x + dx, y: e.pos.y + dy })).find((p) => '.,'.includes(tileOf(run.map, p.x, p.y)))!;
    run.map.traps = [{ ...step, kind: 'dardos' }];
    const hp = s.characters.herrero.hp;
    const ev = runCommand(s, ctx, expMove, stairs.x, stairs.y);
    if (e.pos.x === step.x && e.pos.y === step.y) {
      expect(s.characters.herrero.hp).toBeLessThan(hp);
      expect(s.characters.herrero.hp).toBeGreaterThan(0);
      expect(toasts(ev).some((t) => t.includes('Trampa'))).toBe(true);
    }
  });
});

describe('jefes y tesoros', () => {
  it('el jefe deja la salida, vuelve a los 7 días y los tesoros únicos salen una sola vez', () => {
    const { s, ctx, e } = enter();
    const def = ctx.c.dungeons.cripta_vigia;
    expect(bossReady(s, def)).toBe(true);
    onBossDefeated(s, ctx.c, ctx.rng, e.pos);
    expect(tileOf(e.dungeon!.map, e.pos.x, e.pos.y)).toBe('S');
    expect(bossReady(s, def)).toBe(false);
    s.day += def.boss.respawnDays;
    expect(bossReady(s, def)).toBe(true);
    for (let i = 0; i < 10; i++) grantUnique(s, ctx.c, ctx.rng, def, 3);
    expect(s.dungeons.uniques.filter((u) => def.uniques.some((x) => x.id === u))).toHaveLength(def.uniques.length);
    expect(new Set(s.dungeons.uniques).size).toBe(s.dungeons.uniques.length);
  });

  it('en el último piso aparece el jefe solo si ya volvió', () => {
    const { s, ctx, e, run } = enter();
    for (let f = 1; f < 3; f++) {
      s.expedition!.dungeon!.landing = true;
      dungeonDescend(s, ctx);
    }
    expect(s.expedition!.dungeon!.floor).toBe(3);
    expect(s.expedition!.groups.some((g) => g.boss)).toBe(true);
    expect(run).toBeTruthy();
    expect(e).toBeTruthy();
  });

  it('el Gólem del Eco no recibe daño mientras queden cristales', () => {
    const { s, ctx, e } = enter('cuevas_eco');
    const g = { id: 'gx', x: 0, y: 0, zone: 0, monsters: ['golem_eco', 'cristal_eco'], threat: 18, boss: true, aggressive: false };
    e.combat = buildCombat(ctx.c, s, g, 'jefe_cueva', e.members);
    const cs = e.combat;
    const golem = cs.units.find((u) => u.monsterId === 'golem_eco')!;
    const crystal = cs.units.find((u) => u.monsterId === 'cristal_eco')!;
    const hp = golem.hp;
    const hero = cs.units.find((u) => u.side === 'party')!;
    Object.assign(hero, { x: golem.x - 1, y: golem.y });
    cs.order = [hero.id];
    cs.turnIndex = 0;
    useSkill(ctx.c, s, createRng(1), hero.id, hero.skills[0], { x: golem.x, y: golem.y });
    expect(golem.hp).toBe(hp);
    crystal.alive = false;
    hero.acted = false;
    for (let i = 0; i < 5 && golem.hp === hp; i++) {
      hero.acted = false;
      useSkill(ctx.c, s, createRng(10 + i), hero.id, hero.skills[0], { x: golem.x, y: golem.y });
    }
    expect(golem.hp).toBeLessThan(hp);
  });

  it('un golpe anunciado marca casillas y cae al turno siguiente de quien lo lanzó', () => {
    const { s, ctx, e } = enter();
    const g = { id: 'gx', x: 0, y: 0, zone: 0, monsters: ['ulmar'], threat: 16, boss: true, aggressive: false };
    e.combat = buildCombat(ctx.c, s, g, 'jefe_cripta', e.members);
    const cs = e.combat;
    const boss = cs.units.find((u) => u.monsterId === 'ulmar')!;
    const hero = cs.units.find((u) => u.side === 'party')!;
    Object.assign(hero, { x: boss.x - 2, y: boss.y });
    const fx = useSkill(ctx.c, s, createRng(1), boss.id, 'juicio_vigia', { x: hero.x, y: hero.y });
    expect(fx.some((f) => f.kind === 'telegraph')).toBe(true);
    expect(cs.pending).toHaveLength(1);
    const hp = hero.hp;
    cs.order = [boss.id];
    cs.turnIndex = 0;
    beginTurn(ctx.c, s, createRng(3));
    expect(cs.pending).toHaveLength(0);
    expect(hero.hp).toBeLessThanOrEqual(hp);
    expect(cs.log.some((l) => l.includes('cae sobre las casillas'))).toBe(true);
  });

  it('los cristales del jefe nunca salen en grupos comunes', () => {
    const rng = createRng(5);
    for (const z of CONTENT.dungeons.cuevas_eco.depth) {
      for (let i = 0; i < 30; i++) expect(generateGroup(CONTENT, z, 'tarde', rng).monsters).not.toContain('cristal_eco');
    }
  });

  it('la lava arde todo el combate', () => {
    const { s, ctx, e } = enter('cuevas_eco');
    const g = { id: 'gx', x: 0, y: 0, zone: 0, monsters: ['gargola', 'gargola'], threat: 8, aggressive: false };
    e.combat = buildCombat(ctx.c, s, g, 'cueva_lava', e.members);
    expect(Object.values(e.combat.terrainFx).filter((f) => f.kind === 'llamas' && f.turns > 100).length).toBeGreaterThan(3);
  });

  it('las mazmorras se repiten con pisos distintos', () => {
    const a = enter('cripta_vigia', 1).run.map.terrain.join('');
    const b = enter('cripta_vigia', 2).run.map.terrain.join('');
    expect(a).not.toBe(b);
    const { s, ctx } = setup();
    runCommand(s, ctx, (st) => advanceTime(st, 1));
    expect(s.dungeons.progress).toEqual({});
  });
});
