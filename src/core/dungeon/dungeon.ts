import { BALANCE } from '../../config/balance';
import { addToBag } from '../combat/result';
import { GameError, type Content, type Ctx } from '../content';
import { acquireGrimoire } from '../magic/grimoires';
import { maxHp } from '../party/progression';
import type { Rng } from '../rng';
import { homeCity } from '../state';
import { advanceTime } from '../time';
import type { GameEvent, GameState } from '../types';
import { generateGroup } from '../world/encounters';
import {
  engageGroup, expeditionCapacity, expeditionEnergy, makeGroup, populate, readyMembers, spendEnergy,
} from '../world/expedition';
import { adjacent, type Pt } from '../world/region';
import type { ExpeditionState, RegionDef } from '../world/types';
import { generateFloor } from './generate';
import { recordDungeon } from '../town/quests';
import type { DungeonDef, DungeonFloor, DungeonProgress, DungeonRun } from './types';

const DG = BALANCE.dungeon;

export function dungeonDef(c: Content, s: GameState): DungeonDef | undefined {
  const run = s.expedition?.dungeon;
  return run ? c.dungeons[run.id] : undefined;
}

export function dungeonProgress(s: GameState, id: string): DungeonProgress {
  return s.dungeons.progress[id] ?? (s.dungeons.progress[id] = { bossDay: 0, clears: 0, deepest: 0 });
}

export function dungeonUnlocked(s: GameState, def: DungeonDef): boolean {
  if (def.unlock.flag && !s.flags[def.unlock.flag]) return false;
  if (def.unlock.reputationMin !== undefined && (s.reputation[homeCity()] ?? 0) < def.unlock.reputationMin) return false;
  return true;
}

/** El jefe vuelve cada tantos días después de caer. */
export function bossReady(s: GameState, def: DungeonDef): boolean {
  const p = s.dungeons.progress[def.id];
  return !p?.bossDay || s.day >= p.bossDay + def.boss.respawnDays;
}

/** Zona de monstruos, vetas y cofres del piso (si la mazmorra tiene menos niveles, repite el último). */
function depthOf(def: DungeonDef, floor: number) {
  const zone = def.depth[Math.min(floor - 1, def.depth.length - 1)];
  return { ...zone, cofres: def.loot[Math.min(floor - 1, def.loot.length - 1)] };
}

/**
 * Mapa que se recorre en la expedición actual: la región, o el piso generado de la mazmorra
 * con la forma de una región (así el movimiento, la recolección y los encuentros son los mismos).
 */
export function expMap(c: Content, e: ExpeditionState): RegionDef {
  if (!e.dungeon) return c.regions[e.regionId];
  const def = c.dungeons[e.dungeon.id];
  const m = e.dungeon.map;
  const lastFloor = e.dungeon.floor === def.floors;
  return {
    id: def.id, name: `${def.name} · piso ${e.dungeon.floor}`, description: def.description, danger: def.danger,
    available: true, travelSlots: def.travelSlots, world: def.world,
    terrain: m.terrain, heights: m.heights, zones: m.terrain.map((r) => '1'.repeat(r.length)),
    zoneDefs: [depthOf(def, e.dungeon.floor)],
    boss: lastFloor ? { monsters: def.boss.monsters, zone: 1 } : undefined,
  };
}

/** Pisar la entrada escondida de una región ('P') descubre la mazmorra que lleva ahí. */
export function discoverEntrance(s: GameState, c: Content): GameEvent[] {
  const e = s.expedition;
  if (!e || e.dungeon) return [];
  const r = c.regions[e.regionId];
  if (r?.terrain[e.pos.y]?.[e.pos.x] !== 'P') return [];
  const def = Object.values(c.dungeons).find((d) => d.entrance === r.id);
  if (!def?.unlock.flag || s.flags[def.unlock.flag]) return [];
  s.flags[def.unlock.flag] = true;
  return [{ type: 'toast', text: `Entre las rocas hay una escalera que baja: encontraste la entrada a ${def.name}. Ya aparece en el mapa del mundo.`, tone: 'good' }];
}

// ───────────────────────── Niebla ─────────────────────────

function setSeen(m: DungeonFloor, x: number, y: number) {
  const row = m.seen[y];
  if (!row || row[x] === undefined || row[x] === '1') return;
  m.seen[y] = row.slice(0, x) + '1' + row.slice(x + 1);
}

export function isSeen(m: DungeonFloor, x: number, y: number): boolean {
  return m.seen[y]?.[x] === '1';
}

/** Lo que ve el grupo: un radio alrededor y, si está en una sala, la sala entera con sus paredes. */
export function revealAround(e: ExpeditionState) {
  const run = e.dungeon;
  if (!run) return;
  const m = run.map;
  const { x, y } = e.pos;
  for (let dy = -DG.sight; dy <= DG.sight; dy++) for (let dx = -DG.sight; dx <= DG.sight; dx++) setSeen(m, x + dx, y + dy);
  const room = m.rooms[y]?.[x];
  if (!room || room === '-') return;
  m.rooms.forEach((row, ry) => [...row].forEach((ch, rx) => {
    if (ch !== room) return;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) setSeen(m, rx + dx, ry + dy);
  }));
}

function setTile(m: DungeonFloor, x: number, y: number, ch: string) {
  m.terrain[y] = m.terrain[y].slice(0, x) + ch + m.terrain[y].slice(x + 1);
}

export function tileOf(m: DungeonFloor, x: number, y: number): string {
  return m.terrain[y]?.[x] ?? '#';
}

// ───────────────────────── Entrar y armar pisos ─────────────────────────

function buildFloor(s: GameState, c: Content, rng: Rng, def: DungeonDef, floor: number) {
  const e = s.expedition!;
  const last = floor === def.floors;
  const plan = generateFloor(def, rng, {
    bossRoom: last,
    bossPresent: last && bossReady(s, def),
    pieces: Object.values(c.roomPieces).filter((p) => !p.dungeons || p.dungeons.includes(def.id)),
    riddles: def.riddles,
  });
  e.dungeon = { id: def.id, floor, map: plan.map, keys: 0, landing: false, bossDown: false, riddle: null };
  e.pos = { ...plan.entry };
  e.nodes = [];
  e.groups = [];
  e.nightSpawned = true; // En la mazmorra no cambia nada de noche.
  const r = expMap(c, e);
  if (!last || !bossReady(s, def)) r.boss = undefined;
  populate(c, s, rng, r, plan.treasureRooms);
  revealAround(e);
  const p = dungeonProgress(s, def.id);
  p.deepest = Math.max(p.deepest, floor);
}

export function startDungeon(s: GameState, { c, rng }: Ctx, id: string): GameEvent[] {
  const def = c.dungeons[id];
  if (!def) throw new GameError('Esa mazmorra no existe.');
  if (!dungeonUnlocked(s, def)) throw new GameError(def.unlock.hint);
  if (s.expedition) throw new GameError('Ya estás de expedición.');
  if (s.forge) throw new GameError('Tenés una pieza a medio hacer en el yunque.');
  if (s.shop) throw new GameError('Primero cerrá la tienda.');
  if (s.auction.session) throw new GameError('Estás en plena subasta.');
  const members = readyMembers(s);
  for (const mid of members) s.characters[mid].hp = maxHp(s.characters[mid]);
  const energy = expeditionEnergy(s, members, c);
  s.expedition = {
    regionId: def.id, pos: { x: 0, y: 0 }, energy, maxEnergy: energy, spent: 0, bag: {}, capacity: expeditionCapacity(s, members, c),
    nodes: [], groups: [], members, combat: null, report: null, nightSpawned: true, nextId: 1, home: s.location,
  };
  buildFloor(s, c, rng, def, 1);
  s.outing = false;
  return [
    { type: 'toast', text: `Bajás a ${def.name}. Solo se puede volver desde los descansos entre pisos.`, tone: 'info' },
    ...advanceTime(s, def.travelSlots),
    { type: 'expeditionStarted' },
  ];
}

/** Antes de cada movimiento: en la mazmorra se camina aunque el grupo esté agotado. */
export function exhausted(s: GameState): boolean {
  return !!s.expedition?.dungeon && s.expedition.energy <= 0;
}

// ───────────────────────── Al caminar: trampas y escalera ─────────────────────────

/** Si en esta casilla hay una trampa sin descubrir, la devuelve. */
export function trapAt(e: ExpeditionState, p: Pt) {
  return e.dungeon?.map.traps.find((t) => t.x === p.x && t.y === p.y);
}

export function triggerTrap(s: GameState, c: Content, p: Pt): GameEvent[] {
  const e = s.expedition!;
  const run = e.dungeon!;
  const trap = trapAt(e, p);
  if (!trap) return [];
  run.map.traps = run.map.traps.filter((t) => t !== trap);
  const def = c.traps[trap.kind];
  if (trap.kind === 'dardos') {
    for (const id of e.members) {
      const ch = s.characters[id];
      if (!ch || ch.hp <= 0) continue;
      ch.hp = Math.max(1, ch.hp - Math.round(maxHp(ch) * (def.damagePct ?? 0.1)));
    }
    return [{ type: 'toast', text: `¡Trampa! ${def.text}`, tone: 'bad' }];
  }
  // Alarma: el grupo más cercano se despierta y viene.
  const near = [...e.groups].filter((g) => !g.boss)
    .sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)))[0];
  if (near) {
    near.aggressive = true;
    near.calm = 0;
  }
  return [{ type: 'toast', text: `¡Trampa! ${def.text}`, tone: 'bad' }];
}

/** Después de moverse: si llegó a la escalera, se abre el descanso. */
export function checkLanding(s: GameState, c: Content): GameEvent[] {
  const e = s.expedition!;
  const run = e.dungeon;
  if (!run || tileOf(run.map, e.pos.x, e.pos.y) !== 'S') return [];
  run.landing = true;
  const def = c.dungeons[run.id];
  const last = run.floor === def.floors;
  return [{ type: 'toast', text: last ? 'Llegaste a la salida de la mazmorra.' : `Encontraste la escalera al piso ${run.floor + 1}.`, tone: 'good' }];
}

// ───────────────────────── Examinar e interactuar ─────────────────────────

function run(s: GameState): DungeonRun {
  const r = s.expedition?.dungeon;
  if (!r) throw new GameError('No estás en una mazmorra.');
  if (s.expedition!.combat || s.expedition!.report) throw new GameError('Primero terminá el combate.');
  return r;
}

/** Examinar alrededor: descubre paredes falsas pegadas y desarma trampas cercanas. */
export function dungeonExamine(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const r = run(s);
  const e = s.expedition!;
  const events: GameEvent[] = [];
  let found = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = e.pos.x + dx;
      const y = e.pos.y + dy;
      if (Math.abs(dx) + Math.abs(dy) !== 1 || tileOf(r.map, x, y) !== 'F') continue;
      setTile(r.map, x, y, '.');
      found++;
      events.push({ type: 'toast', text: 'La pared suena hueca... ¡se corre! Hay un pasaje escondido.', tone: 'good' });
    }
  }
  const near = r.map.traps.filter((t) => Math.abs(t.x - e.pos.x) + Math.abs(t.y - e.pos.y) <= DG.examineRadius);
  for (const t of near) {
    r.map.traps = r.map.traps.filter((x) => x !== t);
    found++;
    events.push({ type: 'toast', text: `Encontrás y desarmás ${c.traps[t.kind].name.toLowerCase()}.`, tone: 'good' });
  }
  if (!found) events.push({ type: 'toast', text: 'Revisás paredes y baldosas. Nada raro por acá.' });
  revealAround(e);
  events.push(...spendEnergy(c, s, rng, DG.examineEnergy));
  return events;
}

/** Usar algo pegado al grupo: palancas, puertas cerradas, rejas e inscripciones. */
export function dungeonInteract(s: GameState, _ctx: Ctx, x: number, y: number): GameEvent[] {
  const r = run(s);
  const e = s.expedition!;
  if (!adjacent(e.pos, { x, y })) throw new GameError('Acercate primero.');
  const ch = tileOf(r.map, x, y);
  switch (ch) {
    case 'L': {
      const lever = r.map.levers.find((l) => l.x === x && l.y === y);
      if (!lever || lever.pulled) throw new GameError('La palanca ya está bajada.');
      lever.pulled = true;
      setTile(r.map, lever.gate.x, lever.gate.y, '.');
      return [{ type: 'toast', text: 'Bajás la palanca. A lo lejos, una reja se levanta con un chirrido.', tone: 'good' }];
    }
    case 'G':
      throw new GameError('Una reja de hierro. Tiene que haber una palanca en algún lado.');
    case 'D':
      if (r.keys <= 0) throw new GameError('La puerta está cerrada con llave.');
      r.keys -= 1;
      setTile(r.map, x, y, '.');
      return [{ type: 'toast', text: 'La llave gira con esfuerzo. La puerta se abre.', tone: 'good' }];
    case 'I': {
      const riddle = r.map.riddles.find((q) => q.x === x && q.y === y);
      if (!riddle) throw new GameError('Las letras están borradas.');
      if (riddle.solved) throw new GameError('Ya resolviste esta inscripción.');
      r.riddle = riddle.id;
      return [];
    }
    default:
      throw new GameError('No hay nada para usar ahí.');
  }
}

export function closeRiddle(s: GameState): GameEvent[] {
  if (s.expedition?.dungeon) s.expedition.dungeon.riddle = null;
  return [];
}

/** Responder la inscripción: si acertás, premio; si no, emboscada. */
export function answerRiddle(s: GameState, { c, rng }: Ctx, index: number): GameEvent[] {
  const r = run(s);
  const e = s.expedition!;
  const riddle = r.map.riddles.find((q) => q.id === r.riddle && !q.solved);
  if (!riddle) throw new GameError('No hay ninguna inscripción abierta.');
  const def = c.riddles[riddle.id];
  riddle.solved = true;
  r.riddle = null;
  if (index === def.answer) {
    const events: GameEvent[] = [];
    const found: string[] = [];
    if (def.reward.gold) {
      s.gold += def.reward.gold;
      found.push(`${def.reward.gold} de oro`);
    }
    for (const m of def.reward.materials ?? []) {
      const got = addToBag(s, m.id, m.qty);
      if (got) found.push(`${got}× ${c.materials[m.id].name}`);
    }
    if (def.reward.synergy && !s.discoveredSynergies.includes(def.reward.synergy)) {
      s.discoveredSynergies.push(def.reward.synergy);
      events.push({ type: 'synergyDiscovered', id: def.reward.synergy });
      found.push(`el secreto «${c.synergies[def.reward.synergy].name}»`);
    }
    events.unshift({ type: 'toast', text: `La piedra se abre: ${found.join(', ') || 'nada... pero se siente bien acertar'}.`, tone: 'good' });
    return events;
  }
  // Emboscada: aparece un grupo al lado y ataca.
  const def2 = c.dungeons[r.id];
  const zone = depthOf(def2, r.floor);
  const g = generateGroup(c, zone, 'noche', rng);
  const free = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: e.pos.x + dx, y: e.pos.y + dy }))
    .find((p) => '.,'.includes(tileOf(r.map, p.x, p.y)) && !e.groups.some((o) => o.x === p.x && o.y === p.y)) ?? { ...e.pos };
  const group = makeGroup(c, e, free, 0, g.monsters, { aggressive: true });
  e.groups.push(group);
  return [{ type: 'toast', text: 'Respuesta equivocada. Las sombras de la sala se mueven...', tone: 'bad' }, ...engageGroup(c, s, rng, group)];
}

// ───────────────────────── Descansos, jefe y tesoros únicos ─────────────────────────

/** Bajar al piso siguiente desde el descanso: recupera parte de la energía y de la vida. */
export function dungeonDescend(s: GameState, { c, rng }: Ctx): GameEvent[] {
  const r = run(s);
  const def = c.dungeons[r.id];
  if (!r.landing) throw new GameError('Primero encontrá la escalera.');
  if (r.floor >= def.floors) throw new GameError('No hay más pisos: es la salida.');
  const e = s.expedition!;
  e.energy = Math.min(e.maxEnergy, e.energy + Math.round(e.maxEnergy * DG.restEnergy));
  for (const id of e.members) {
    const ch = s.characters[id];
    if (ch && ch.hp > 0) ch.hp = Math.min(maxHp(ch), ch.hp + Math.round(maxHp(ch) * DG.restHp));
  }
  buildFloor(s, c, rng, def, r.floor + 1);
  const progress = recordDungeon(s, c, def.id, r.floor, false);
  const last = r.floor + 1 === def.floors;
  return [...progress, {
    type: 'toast',
    text: last ? `Piso ${r.floor + 1}: el último. ${bossReady(s, def) ? `Se siente la presencia de ${def.boss.name}.` : 'Está en silencio.'}` : `Bajás al piso ${r.floor + 1}.`,
    tone: last ? 'bad' : 'info',
  }];
}

/** Cayó el jefe: queda la salida en su guarida, se anota y deja un tesoro único (si queda alguno). */
export function onBossDefeated(s: GameState, c: Content, rng: Rng, lair: Pt): GameEvent[] {
  const r = s.expedition?.dungeon;
  if (!r) return [];
  const def = c.dungeons[r.id];
  r.bossDown = true;
  setTile(r.map, lair.x, lair.y, 'S');
  dungeonProgress(s, def.id).bossDay = s.day;
  return [
    { type: 'toast', text: `¡${def.boss.name} cayó! Se abre el camino de salida.`, tone: 'good' },
    ...grantUnique(s, c, rng, def, r.floor),
    ...recordDungeon(s, c, def.id, r.floor, true),
  ];
}

/** Un tesoro único que todavía no salió (plano, grimorio, combinación o material legendario). */
export function grantUnique(s: GameState, c: Content, rng: Rng, def: DungeonDef, floor: number): GameEvent[] {
  const left = def.uniques.filter((u) => u.minFloor <= floor && !s.dungeons.uniques.includes(u.id));
  if (!left.length) return [];
  const u = rng.pick(left);
  s.dungeons.uniques.push(u.id);
  switch (u.kind) {
    case 'blueprint':
      if (!s.knownBlueprints.includes(u.ref)) s.knownBlueprints.push(u.ref);
      return [{ type: 'toast', text: `✦ Tesoro único: plano antiguo «${c.blueprints[u.ref].name}».`, tone: 'good' }];
    case 'grimoire':
      return [{ type: 'toast', text: `✦ Tesoro único: ${c.grimoires[u.ref].name}.`, tone: 'good' }, ...acquireGrimoire(s, c, u.ref)];
    case 'synergy':
      if (!s.discoveredSynergies.includes(u.ref)) s.discoveredSynergies.push(u.ref);
      return [{ type: 'synergyDiscovered', id: u.ref }, { type: 'toast', text: `✦ Tesoro único: el secreto «${c.synergies[u.ref].name}».`, tone: 'good' }];
    case 'material': {
      const got = addToBag(s, u.ref, u.qty ?? 1);
      return [{ type: 'toast', text: `✦ Tesoro único: ${got}× ${c.materials[u.ref].name}.`, tone: 'good' }];
    }
  }
}

/** Al volver desde la salida del último piso con el jefe vencido, cuenta como mazmorra completada. */
export function recordLeave(s: GameState) {
  const r = s.expedition?.dungeon;
  if (!r) return;
  if (r.bossDown) dungeonProgress(s, r.id).clears += 1;
}

/** Lugares del piso donde se puede usar algo (para la UI). */
export function interactables(e: ExpeditionState): { x: number; y: number; kind: string }[] {
  const r = e.dungeon;
  if (!r) return [];
  const out: { x: number; y: number; kind: string }[] = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = e.pos.x + dx;
    const y = e.pos.y + dy;
    const ch = tileOf(r.map, x, y);
    if (!'LGDI'.includes(ch)) continue;
    // Palancas ya bajadas e inscripciones resueltas no se vuelven a usar.
    if (ch === 'L' && r.map.levers.find((l) => l.x === x && l.y === y)?.pulled) continue;
    if (ch === 'I' && r.map.riddles.find((q) => q.x === x && q.y === y)?.solved) continue;
    out.push({ x, y, kind: ch });
  }
  return out;
}
