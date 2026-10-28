import { BALANCE } from '../../config/balance';
import { GameError, type Content } from '../content';
import { isInjured } from '../party/progression';
import { characterProfile } from '../party/stats';
import type { Rng } from '../rng';
import type { GameState } from '../types';
import type { MonsterGroup } from '../world/types';
import { attackProps, calcAttack } from './damage';
import {
  arenaOf, chargeLanding, DIR_VEC, dirTo, dist, hasStatus, heightAt, inBounds, isFloor, reachable, targetsFor, terrainAt, unitAt, type Pt,
} from './grid';
import type { CombatFx, CombatSkill, CombatState, CombatUnit, StatusId } from './types';

const CB = BALANCE.combat;

// ───────────────────────── Armado ─────────────────────────

/** Mejor lote de flechas disponible (el de más valor). */
function bestArrows(s: GameState): string | undefined {
  return s.items.filter((i) => i.category === 'municion' && i.quantity > 0).sort((a, b) => b.value - a.value)[0]?.uid;
}

export function partyUnits(c: Content, s: GameState, members: string[]): CombatUnit[] {
  return members
    .map((id) => s.characters[id])
    .filter((ch) => ch && !isInjured(s, ch) && ch.hp > 0)
    .map((ch) => {
      const p = characterProfile(c, s, ch);
      const hpBonus = p.combat.hpBonus ?? 0;
      return {
        id: `p_${ch.id}`, side: 'party', name: ch.name, charId: ch.id,
        sprite: { key: ch.id === 'herrero' ? 'char.herrero' : `char.npc.${ch.id}` }, look: ch.look,
        x: 0, y: 0, facing: 0, hp: Math.min(ch.hp, p.maxHp) + hpBonus, maxHp: p.maxHp + hpBonus,
        atk: p.atk, def: p.def, spd: p.spd, move: p.move, jump: p.jump, evasion: p.evasion, crit: p.crit,
        damageType: p.damageType, weaponKind: p.weaponKind, affinities: p.affinities, resist: {}, elemental: p.elemental,
        immune: [], combat: p.combat, skills: p.skills, cooldowns: {}, statuses: [],
        ammoUid: p.weaponKind === 'arco' ? bestArrows(s) : undefined,
        moved: false, acted: false, alive: true,
      } satisfies CombatUnit;
    });
}

export function monsterUnit(c: Content, id: string, uid: string): CombatUnit {
  const m = c.monsters[id];
  return {
    id: uid, side: 'enemy', name: m.name, monsterId: m.id, sprite: m.sprite,
    x: 0, y: 0, facing: 2, hp: m.hp, maxHp: m.hp, atk: m.atk, def: m.def, spd: m.spd, move: m.move, jump: m.jump,
    evasion: m.evasion, crit: 0.05, damageType: m.damageType, affinities: { ...(m.affinities ?? {}) }, resist: m.resist,
    elemental: m.elemental, immune: m.immune ?? [], combat: {}, skills: m.skills, cooldowns: {}, statuses: [],
    ai: m.ai, boss: m.boss, moved: false, acted: false, alive: true,
  };
}

export function buildCombat(c: Content, s: GameState, group: MonsterGroup, arenaId: string, members: string[]): CombatState {
  const arena = c.arenas[arenaId];
  const party = partyUnits(c, s, members);
  if (!party.length) throw new GameError('No hay nadie en condiciones de pelear.');
  party.forEach((u, i) => Object.assign(u, arena.partySpawns[i % arena.partySpawns.length]));
  const enemies = group.monsters.slice(0, arena.enemySpawns.length).map((id, i) => {
    const u = monsterUnit(c, id, `e${i}`);
    Object.assign(u, arena.enemySpawns[i]);
    return u;
  });
  // Nombres distinguibles: "Lobo gris A", "Lobo gris B"...
  const counts: Record<string, number> = {};
  enemies.forEach((u) => { counts[u.name] = (counts[u.name] ?? 0) + 1; });
  const seen: Record<string, number> = {};
  enemies.forEach((u) => {
    if (counts[u.name] > 1) u.name = `${u.name} ${String.fromCharCode(65 + (seen[u.name] = (seen[u.name] ?? 0) + 1) - 1)}`;
  });
  const cs: CombatState = {
    arenaId, groupId: group.id, boss: !!group.boss, units: [...party, ...enemies], round: 0, order: [], turnIndex: 0,
    log: [], outcome: null, flags: {}, ammoUsed: {}, nextUnitId: enemies.length,
  };
  newRound(cs);
  return cs;
}

// ───────────────────────── Turnos ─────────────────────────

function newRound(cs: CombatState) {
  cs.round += 1;
  const alive = cs.units.filter((u) => u.alive);
  const initiative = (u: CombatUnit) => u.spd + (cs.round === 1 && u.combat.firstStrike ? 100 : 0) - (hasStatus(u, 'ralentizado') ? 2 : 0);
  cs.order = alive
    .sort((a, b) => initiative(b) - initiative(a) || (a.side === b.side ? 0 : a.side === 'party' ? -1 : 1) || a.id.localeCompare(b.id))
    .map((u) => u.id);
  cs.turnIndex = 0;
}

export function currentUnit(cs: CombatState): CombatUnit | undefined {
  return cs.units.find((u) => u.id === cs.order[cs.turnIndex]);
}

export function unitById(cs: CombatState, id: string): CombatUnit {
  const u = cs.units.find((x) => x.id === id);
  if (!u) throw new GameError('Unidad inexistente.');
  return u;
}

function log(cs: CombatState, text: string) {
  cs.log.push(text);
  if (cs.log.length > 40) cs.log.shift();
}

export function checkOutcome(cs: CombatState): CombatState['outcome'] {
  if (cs.outcome) return cs.outcome;
  if (!cs.units.some((u) => u.alive && u.side === 'enemy')) cs.outcome = 'victory';
  else if (!cs.units.some((u) => u.alive && u.side === 'party')) cs.outcome = 'defeat';
  return cs.outcome;
}

function kill(cs: CombatState, u: CombatUnit, fx: CombatFx[], cause?: CombatUnit['killedBy']) {
  u.hp = 0;
  u.alive = false;
  u.killedBy = cause;
  fx.push({ kind: 'death', unit: u.id });
  log(cs, `${u.name} cae.`);
}

/** Procesa el inicio del turno de la unidad actual. Saltea muertos y aturdidos. */
export function beginTurn(_c: Content, s: GameState, _rng: Rng): CombatFx[] {
  const cs = s.expedition!.combat!;
  const fx: CombatFx[] = [];
  for (let guard = 0; guard < 50 && !checkOutcome(cs); guard++) {
    if (cs.turnIndex >= cs.order.length) newRound(cs);
    const u = currentUnit(cs);
    if (!u || !u.alive) {
      cs.turnIndex++;
      continue;
    }
    u.moved = false;
    u.acted = false;
    for (const k of Object.keys(u.cooldowns)) u.cooldowns[k] = Math.max(0, u.cooldowns[k] - 1);
    // Daño por turno de sangrado, quemadura y veneno.
    for (const st of u.statuses) {
      const dot = st.id === 'veneno' ? Math.max(2, Math.round(u.maxHp * CB.dotPower.veneno)) : st.id === 'sangrado' || st.id === 'quemadura' ? st.power : 0;
      if (!dot) continue;
      u.hp -= dot;
      fx.push({ kind: 'tick', unit: u.id, damage: dot, status: st.id });
      if (u.hp <= 0) kill(cs, u, fx, { element: st.id === 'quemadura' ? 'fuego' : st.id === 'veneno' ? 'veneno' : undefined });
    }
    const stunned = hasStatus(u, 'aturdido');
    u.statuses = u.statuses.map((st) => ({ ...st, turns: st.turns - 1 })).filter((st) => st.turns > 0);
    if (!u.alive) {
      cs.turnIndex++;
      continue;
    }
    if (stunned) {
      log(cs, `${u.name} está aturdido y pierde el turno.`);
      cs.turnIndex++;
      continue;
    }
    break;
  }
  checkOutcome(cs);
  return fx;
}

export function endTurn(c: Content, s: GameState, rng: Rng): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = currentUnit(cs);
  // Quien termina parado en agua queda mojado (el rayo le hace más daño).
  if (u?.alive && terrainAt(arenaOf(c, cs), u.x, u.y) === 'w') applyStatus(u, 'mojado', 2, 0, []);
  cs.turnIndex++;
  return beginTurn(c, s, rng);
}

// ───────────────────────── Acciones ─────────────────────────

export function applyStatus(u: CombatUnit, id: StatusId, turns: number, power: number, fx: CombatFx[]): boolean {
  if (u.immune.includes(id) || !u.alive) return false;
  const existing = u.statuses.find((s) => s.id === id);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns);
    existing.power = Math.max(existing.power, power);
  } else {
    u.statuses.push({ id, turns, power });
  }
  if (id !== 'mojado') fx.push({ kind: 'status', unit: u.id, status: id });
  return true;
}

export function moveUnit(c: Content, s: GameState, unitId: string, to: Pt): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = unitById(cs, unitId);
  if (u.moved) throw new GameError('Ya se movió este turno.');
  const r = reachable(c, cs, u).get(`${to.x},${to.y}`);
  if (!r) throw new GameError('No llega hasta ahí.');
  if (r.path.length) {
    u.facing = dirTo(r.path.length > 1 ? r.path[r.path.length - 2] : u, to);
    u.x = to.x;
    u.y = to.y;
  }
  u.moved = true;
  return r.path.length ? [{ kind: 'move', unit: u.id, path: r.path }] : [];
}

export function canUseSkill(_c: Content, s: GameState, u: CombatUnit, skill: CombatSkill): string | null {
  if (u.acted) return 'Ya actuó este turno.';
  if ((u.cooldowns[skill.id] ?? 0) > 0) return `Disponible en ${u.cooldowns[skill.id]} turno(s).`;
  if (skill.ammo) {
    const lot = u.ammoUid ? s.items.find((i) => i.uid === u.ammoUid && i.quantity > 0) : undefined;
    if (!lot) return 'No te quedan flechas.';
  }
  return null;
}

function spendAmmo(s: GameState, cs: CombatState, u: CombatUnit) {
  const lot = s.items.find((i) => i.uid === u.ammoUid);
  if (!lot) return;
  lot.quantity -= 1;
  cs.ammoUsed[lot.uid] = (cs.ammoUsed[lot.uid] ?? 0) + 1;
  if (lot.quantity <= 0) {
    s.items = s.items.filter((i) => i.uid !== lot.uid);
    u.ammoUid = bestArrows(s);
  }
}

/** Efectos al pegar: estados de la acción y de los rasgos del arma. */
function onHitEffects(rng: Rng, skill: CombatSkill, combat: Record<string, number>, t: CombatUnit, fx: CombatFx[]) {
  for (const st of skill.statuses ?? []) if (st.id !== 'cubierto' && st.id !== 'potenciado' && rng.chance(st.chance)) applyStatus(t, st.id, st.turns, st.power ?? CB.dotPower[st.id] ?? 0, fx);
  const chance = CB.traitStatusChance;
  if (combat.bleed && rng.chance(chance)) applyStatus(t, 'sangrado', combat.bleed, CB.dotPower.sangrado, fx);
  if (combat.burn && rng.chance(chance)) applyStatus(t, 'quemadura', combat.burn, CB.dotPower.quemadura, fx);
  if (combat.poison && rng.chance(chance)) applyStatus(t, 'veneno', combat.poison, 0, fx);
  if (combat.slowPct && rng.chance(combat.slowPct / 100)) applyStatus(t, 'ralentizado', 2, 0, fx);
  if (combat.stunPct && rng.chance(combat.stunPct / 100)) applyStatus(t, 'aturdido', 1, 0, fx);
  if (combat.immobilizePct && rng.chance(combat.immobilizePct / 100)) applyStatus(t, 'inmovilizado', 1, 0, fx);
}

/** Desgaste de la armadura del objetivo (ácido). */
function wearArmor(s: GameState, t: CombatUnit, amount: number) {
  const ch = t.charId ? s.characters[t.charId] : undefined;
  const armor = ch?.equipment.cuerpo ? s.items.find((i) => i.uid === ch.equipment.cuerpo) : undefined;
  if (armor) armor.durability = Math.max(0, armor.durability - amount);
}

function push(c: Content, cs: CombatState, from: CombatUnit, t: CombatUnit, fx: CombatFx[]) {
  const a = arenaOf(c, cs);
  const [dx, dy] = DIR_VEC[dirTo(from, t)];
  const to = { x: t.x + dx, y: t.y + dy };
  if (!inBounds(a, to.x, to.y) || !isFloor(a, to.x, to.y) || unitAt(cs, to.x, to.y)) {
    t.hp -= CB.collisionDamage;
    fx.push({ kind: 'push', unit: t.id, to: { x: t.x, y: t.y }, damage: CB.collisionDamage });
    log(cs, `${t.name} choca y se golpea.`);
    return;
  }
  const drop = heightAt(a, t.x, t.y) - heightAt(a, to.x, to.y);
  const dmg = drop >= 2 ? drop * CB.fallDamagePerLevel : 0;
  t.x = to.x;
  t.y = to.y;
  t.hp -= dmg;
  fx.push({ kind: 'push', unit: t.id, to, damage: dmg });
  if (dmg) log(cs, `${t.name} cae de la loma y recibe ${dmg} de daño.`);
}

function halfHpTrigger(c: Content, cs: CombatState, t: CombatUnit, fx: CombatFx[]) {
  const def = t.monsterId ? c.monsters[t.monsterId] : undefined;
  const flag = `half_${t.id}`;
  if (!def?.halfHp || cs.flags[flag] || !t.alive || t.hp > t.maxHp / 2) return;
  cs.flags[flag] = true;
  log(cs, def.halfHp.text);
  const a = arenaOf(c, cs);
  const free: Pt[] = [];
  for (let r = 1; r <= 3 && free.length < def.halfHp.summon.length; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const p = { x: t.x + dx, y: t.y + dy };
        if (Math.abs(dx) + Math.abs(dy) === r && isFloor(a, p.x, p.y) && !unitAt(cs, p.x, p.y) && !free.some((f) => f.x === p.x && f.y === p.y)) free.push(p);
      }
    }
  }
  def.halfHp.summon.forEach((id, i) => {
    const p = free[i];
    if (!p) return;
    const u = monsterUnit(c, id, `e${cs.nextUnitId++}`);
    Object.assign(u, p);
    cs.units.push(u);
    cs.order.push(u.id); // actúa al final de esta ronda
    fx.push({ kind: 'spawn', unit: u.id });
  });
}

function strike(c: Content, s: GameState, rng: Rng, u: CombatUnit, t: CombatUnit, skill: CombatSkill, fx: CombatFx[]) {
  const cs = s.expedition!.combat!;
  const calc = calcAttack(c, s, cs, u, t, skill);
  const { combat } = attackProps(c, s, u, skill);
  if (!rng.chance(calc.hit)) {
    fx.push({ kind: 'miss', from: u.id, to: t.id, skill: skill.id });
    log(cs, `${u.name} usa ${skill.name} contra ${t.name}, pero falla.`);
    return;
  }
  const crit = rng.chance(calc.crit);
  let dmg = Math.round(rng.range(calc.min, calc.max) * (crit ? CB.critMult : 1));
  if (hasStatus(t, 'cubierto') && t.combat.blockPct && rng.chance(t.combat.blockPct / 100)) dmg = Math.round(dmg / 2);
  t.hp -= dmg;
  fx.push({ kind: 'hit', from: u.id, to: t.id, damage: dmg, crit, skill: skill.id, element: calc.element });
  log(cs, `${u.name} usa ${skill.name}: ${dmg} de daño a ${t.name}${crit ? ' (¡crítico!)' : ''}.`);
  if (combat.lifeStealPct && u.alive) {
    const heal = Math.round(dmg * combat.lifeStealPct / 100);
    u.hp = Math.min(u.maxHp, u.hp + heal);
    if (heal) fx.push({ kind: 'heal', from: u.id, to: u.id, amount: heal });
  }
  if (t.combat.thornsPct && skill.range[1] <= 1) {
    const back = Math.round(dmg * t.combat.thornsPct / 100);
    u.hp -= back;
    if (back) fx.push({ kind: 'tick', unit: u.id, damage: back, status: 'sangrado' });
    if (u.hp <= 0) kill(cs, u, fx);
  }
  if (skill.wear) wearArmor(s, t, skill.wear);
  if (t.hp <= 0) {
    kill(cs, t, fx, { element: calc.element, damageType: skill.damageType ?? u.damageType });
    return;
  }
  onHitEffects(rng, skill, combat, t, fx);
  if (skill.push) push(c, cs, u, t, fx);
  if (t.hp <= 0) kill(cs, t, fx, { damageType: 'contundente' });
  halfHpTrigger(c, cs, t, fx);
}

export function useSkill(c: Content, s: GameState, rng: Rng, unitId: string, skillId: string, target: Pt): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = unitById(cs, unitId);
  const skill = c.skills[skillId];
  if (!skill || !u.skills.includes(skillId)) throw new GameError('No tiene esa acción.');
  const reason = canUseSkill(c, s, u, skill);
  if (reason) throw new GameError(reason);
  const fx: CombatFx[] = [];
  const t = skill.target === 'self' ? u : unitAt(cs, target.x, target.y);
  if (!t || !targetsFor(c, cs, u, skill).includes(t)) throw new GameError('Objetivo fuera de alcance.');

  // Embestida: primero carga en línea recta.
  if (skill.charge && dist(u, t) > 1) {
    const landing = chargeLanding(c, cs, u, u, t, skill.charge)!;
    const path: Pt[] = [];
    const sx = Math.sign(landing.x - u.x);
    const sy = Math.sign(landing.y - u.y);
    for (let p = { x: u.x + sx, y: u.y + sy }; ; p = { x: p.x + sx, y: p.y + sy }) {
      path.push(p);
      if (p.x === landing.x && p.y === landing.y) break;
    }
    u.x = landing.x;
    u.y = landing.y;
    fx.push({ kind: 'move', unit: u.id, path });
  }
  if (t !== u) u.facing = dirTo(u, t);
  u.acted = true;
  if (skill.cooldown) u.cooldowns[skill.id] = skill.cooldown + 1;
  if (skill.ammo) spendAmmo(s, cs, u);

  if (skill.target === 'self') {
    // "Grito de guerra": la acción en área desde uno mismo potencia a todo su bando.
    const affected = skill.area === 'adjacent' ? cs.units.filter((x) => x.alive && x.side === u.side) : [u];
    for (const x of affected) for (const st of skill.statuses ?? [{ id: 'potenciado', chance: 1, turns: 2 }]) applyStatus(x, st.id, st.turns, 0, fx);
    fx.push({ kind: 'buff', unit: u.id, skill: skill.id });
    log(cs, `${u.name} usa ${skill.name}.`);
  } else if (skill.target === 'ally') {
    if (skill.healPct) {
      const amount = Math.round(t.maxHp * skill.healPct);
      t.hp = Math.min(t.maxHp, t.hp + amount);
      fx.push({ kind: 'heal', from: u.id, to: t.id, amount });
      log(cs, `${u.name} cura ${amount} a ${t.name}.`);
    }
    for (const st of skill.statuses ?? []) applyStatus(t, st.id, st.turns, 0, fx);
    if (!skill.healPct) log(cs, `${u.name} usa ${skill.name} sobre ${t.name}.`);
  } else {
    const victims = skill.area === 'adjacent' ? cs.units.filter((x) => x.alive && x.side !== u.side && dist(u, x) === 1) : [t];
    for (const v of victims) {
      strike(c, s, rng, u, v, skill, fx);
      // Golpe doble por rasgo del arma.
      const { combat } = attackProps(c, s, u, skill);
      if (v.alive && u.alive && combat.doubleHitPct && skill.range[1] <= 1 && rng.chance(combat.doubleHitPct / 100)) strike(c, s, rng, u, v, skill, fx);
      if (v.alive && u.alive && skill.ammo && combat.doubleShotPct && rng.chance(combat.doubleShotPct / 100) && canUseSkill(c, s, { ...u, acted: false }, skill) === null) {
        spendAmmo(s, cs, u);
        strike(c, s, rng, u, v, skill, fx);
      }
    }
  }
  checkOutcome(cs);
  return fx;
}

/** Intento de huida: si sale bien, el combate termina. */
export function tryFlee(s: GameState, rng: Rng, unitId: string): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = unitById(cs, unitId);
  if (u.acted) throw new GameError('Ya actuó este turno.');
  u.acted = true;
  if (rng.chance(fleeChance(cs))) {
    cs.outcome = 'fled';
    log(cs, '¡El grupo logra escapar!');
  } else {
    log(cs, `${u.name} intenta huir, pero no hay salida.`);
  }
  return [];
}

export function fleeChance(cs: CombatState): number {
  const party = cs.units.filter((x) => x.alive && x.side === 'party');
  const enemies = cs.units.filter((x) => x.alive && x.side === 'enemy');
  const avg = (list: CombatUnit[]) => list.reduce((a, x) => a + x.spd, 0) / Math.max(1, list.length);
  return cs.boss ? CB.fleeBoss : Math.min(0.85, Math.max(0.15, CB.fleeBase + (avg(party) - avg(enemies)) * CB.fleePerSpd));
}

export function usableSkills(c: Content, s: GameState, u: CombatUnit): { skill: CombatSkill; reason: string | null }[] {
  return u.skills.map((id) => c.skills[id]).filter(Boolean).map((skill) => ({ skill, reason: canUseSkill(c, s, u, skill) }));
}

