import { describe, expect, it } from 'vitest';
import { CONTENT as c } from '../../data';
import { BALANCE } from '../../config/balance';
import { setup } from '../testUtils';
import type { MonsterGroup } from '../world/types';
import { dbgHire } from '../../debug/commands';
import { arenaProblems, repairCombat, RETIRED_ARENAS } from './arenaCheck';
import { buildCombat } from './engine';
import { arenasFor, hasSight, isFloor } from './grid';
import type { ArenaDef } from './types';
import { useTestArenas } from './testArenas';

useTestArenas(c);

/** Arena de prueba: todo suelo a la altura 0 salvo lo que se indique. */
function flat(rows: string[], heights?: string[]): ArenaDef {
  return {
    id: 'prueba', biome: 'pradera', terrain: rows, heights: heights ?? rows.map((r) => '0'.repeat(r.length)),
    partySpawns: [], enemySpawns: [],
  };
}

describe('arenas nuevas: línea de tiro', () => {
  it('en llano se ve; un árbol en el medio tapa', () => {
    expect(hasSight(flat(['.....']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true);
    expect(hasSight(flat(['..T..']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(false);
  });

  it('las figuras no tapan y lo vacío tampoco', () => {
    expect(hasSight(flat(['.. ..']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true);
  });

  it('un escalón de un nivel no tapa; un muro de dos, sí', () => {
    expect(hasSight(flat(['.....'], ['00100']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true);
    expect(hasSight(flat(['.....'], ['00200']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(false);
  });

  it('desde arriba se tira por encima de lo que tapa abajo', () => {
    // Una roca baja entre los dos: desde una loma alta se la sobrevuela.
    expect(hasSight(flat(['..R..'], ['00000']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(false);
    expect(hasSight(flat(['..R..'], ['50000']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(true);
  });

  it('pegado a un obstáculo se ve igual (cuerpo a cuerpo)', () => {
    expect(hasSight(flat(['.T']), { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(true);
  });

  it('si la recta roza una esquina, alcanza con un lado libre', () => {
    // Diagonal exacta de (0,0) a (2,2): pasa por la esquina entre (1,0)/(0,1) y (1,1)... con (1,1) libre se ve.
    expect(hasSight(flat(['.T.', 'T..', '...']), { x: 0, y: 0 }, { x: 2, y: 2 })).toBe(true);
  });
});

describe('arenas nuevas: datos', () => {
  const fresh = Object.values(c.arenas).filter((a) => a.gen === 2);

  it('hay arenas nuevas y pasan el chequeo (incluido llegar a todos lados con salto 1)', () => {
    expect(fresh.length).toBeGreaterThanOrEqual(3);
    for (const a of fresh) expect(arenaProblems(a)).toEqual([]);
  });

  it('si un bioma tiene arenas nuevas, se eligen solo esas', () => {
    expect(arenasFor(c, 'pradera').every((a) => a.gen === 2)).toBe(true);
    // Un bioma sin nuevas sigue con las viejas.
    expect(arenasFor(c, 'cripta').length).toBeGreaterThan(0);
  });

  it('el chequeo encuentra una casilla aislada por un acantilado', () => {
    // Un muro de 3 niveles en la columna 3 deja las columnas 4 y 5 sin camino.
    const a: ArenaDef = { ...flat(['......', '......', '......'], ['000300', '000300', '000300']), gen: 2 };
    a.partySpawns = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
    a.enemySpawns = [{ x: 4, y: 0 }, { x: 5, y: 0 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 2, y: 2 }];
    expect(arenaProblems(a).some((p) => p.includes('aislada'))).toBe(true);
  });
});

describe('arenas nuevas: armado del combate', () => {
  const group = (monsters: string[]): MonsterGroup => ({ id: 'g', x: 0, y: 0, zone: 0, monsters, threat: 0, aggressive: false });

  it('entran el herrero y 4 compañeros, cada uno en su casilla', () => {
    const { s, ctx } = setup();
    s.reputation.valdebrasa = 70;
    s.workshop.cuarto = 1;
    for (const id of ['brunilda', 'ciro', 'nayra', 'gualterio']) dbgHire(s, ctx, id);
    expect(s.party).toHaveLength(BALANCE.MAX_PARTY_SIZE + 1);
    const cs = buildCombat(c, s, group(['gelin_verde']), 'pradera_terrazas', s.party);
    const party = cs.units.filter((u) => u.side === 'party');
    expect(party).toHaveLength(5);
    expect(new Set(party.map((u) => `${u.x},${u.y}`)).size).toBe(5);
  });

  it('con 4 lugares para el grupo, el quinto va a la casilla libre más cercana', () => {
    const { s, ctx } = setup();
    s.workshop.cuarto = 1;
    for (const id of ['brunilda', 'ciro', 'nayra', 'gualterio']) dbgHire(s, ctx, id);
    const cs = buildCombat(c, s, group(['gelin_verde']), 'prueba_loma', s.party);
    const spots = cs.units.map((u) => `${u.x},${u.y}`);
    expect(new Set(spots).size).toBe(spots.length);
    for (const u of cs.units) expect(isFloor(c.arenas.prueba_loma, u.x, u.y)).toBe(true);
  });

  it('en una emboscada, los últimos del grupo aparecen detrás o al costado', () => {
    const { s } = setup();
    const a = c.arenas.pradera_terrazas;
    const cs = buildCombat(c, s, group(['lobo_gris', 'lobo_gris', 'lobo_gris', 'jabali']), a.id, ['herrero'], true);
    const enemies = cs.units.filter((u) => u.side === 'enemy');
    const hidden = enemies.filter((u) => a.ambushSpawns!.some((p) => p.x === u.x && p.y === u.y));
    expect(hidden).toHaveLength(BALANCE.combat.ambushCount);
    expect(cs.log.some((l) => l.includes('Emboscada'))).toBe(true);
  });

  it('contra un jefe no hay emboscada', () => {
    const { s } = setup();
    const cs = buildCombat(c, s, { ...group(['lobo_gris', 'lobo_gris', 'lobo_gris']), boss: true }, 'pradera_terrazas', ['herrero'], true);
    const a = c.arenas.pradera_terrazas;
    expect(cs.units.some((u) => u.side === 'enemy' && a.ambushSpawns!.some((p) => p.x === u.x && p.y === u.y))).toBe(false);
  });

  it('los monstruos se mueven una casilla más que lo que dice su ficha', () => {
    const { s } = setup();
    const cs = buildCombat(c, s, group(['lobo_gris']), 'pradera_terrazas', ['herrero']);
    const wolf = cs.units.find((u) => u.side === 'enemy')!;
    expect(wolf.move).toBe(c.monsters.lobo_gris.move + BALANCE.combat.monsterMoveBonus);
  });
});

describe('partidas guardadas en medio de un combate', () => {
  const group = (monsters: string[]): MonsterGroup => ({ id: 'g', x: 0, y: 0, zone: 0, monsters, threat: 0, aggressive: false });

  it('si la arena se retiró, pasa a la que la reemplaza y cada figura queda sobre el suelo', () => {
    const { s } = setup();
    const cs = buildCombat(c, s, group(['lobo_gris', 'lobo_gris']), 'pradera_terrazas', ['herrero']);
    cs.arenaId = 'pradera_loma';
    // Posiciones de la arena vieja: alguna cae en el vacío de la nueva, y dos quedan encimadas.
    cs.units[0].x = 0; cs.units[0].y = 0;
    cs.units[1].x = 9; cs.units[1].y = 5;
    cs.units[2].x = 9; cs.units[2].y = 5;
    expect(repairCombat(c, cs)).toBe(true);
    expect(cs.arenaId).toBe(RETIRED_ARENAS.pradera_loma);
    const a = c.arenas[cs.arenaId];
    for (const u of cs.units) expect(isFloor(a, u.x, u.y)).toBe(true);
    expect(new Set(cs.units.map((u) => `${u.x},${u.y}`)).size).toBe(cs.units.length);
  });

  it('un combate que ya está bien no se toca', () => {
    const { s } = setup();
    const cs = buildCombat(c, s, group(['lobo_gris']), 'cueva_lava', ['herrero']);
    const before = JSON.stringify(cs);
    expect(repairCombat(c, cs)).toBe(false);
    expect(JSON.stringify(cs)).toBe(before);
  });

  it('las arenas retiradas tienen reemplazo y ninguna arena del juego quedó sin rediseñar', () => {
    for (const id of Object.values(RETIRED_ARENAS)) expect(c.arenas[id]).toBeTruthy();
    const old = Object.values(c.arenas).filter((a) => a.gen !== 2 && !a.id.startsWith('prueba_'));
    expect(old.map((a) => a.id)).toEqual([]);
  });
});
