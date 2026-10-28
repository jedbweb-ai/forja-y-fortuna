import { BALANCE } from '../../config/balance';
import { GameError, type Content } from '../content';
import { consumePotion } from '../magic/alchemy';
import { isInjured } from '../party/progression';
import { characterProfile } from '../party/stats';
import type { Rng } from '../rng';
import type { Affinity, GameState } from '../types';
import type { MonsterGroup } from '../world/types';
import { attackProps, calcAttack, dominantElement } from './damage';
import {
  arenaOf, chargeLanding, DIR_VEC, dirTo, dist, hasStatus, heightAt, inBounds, isFloor, reachable, targetsFor, tileInRange, unitAt, type Pt,
} from './grid';
import { applyTerrain, areaTiles, decayTerrain, isWet, terrainForElement, terrainFxAt, unitsOn, waterNetwork } from './terrain';
import type { CombatFx, CombatSkill, CombatState, CombatUnit, StatusId } from './types';

const CB = BALANCE.combat;
const TR = BALANCE.terrain;
const AL = BALANCE.alchemy;

/** Estados negativos (los que se pueden resistir y limpiar con antídoto). */
const HARMFUL: StatusId[] = ['sangrado', 'veneno', 'quemadura', 'aturdido', 'ralentizado', 'inmovilizado', 'corroido'];

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
        ammoUid: p.weaponKind === 'arco' || Object.keys(p.abilities).some((k) => c.skills[k]?.ammo) ? bestArrows(s) : undefined,
        abilities: Object.fromEntries(Object.entries(p.abilities).map(([k, v]) => [k, { ...v }])),
        throwUid: p.throwUid, throwAtk: p.throwAtk,
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
    elemental: m.elemental, immune: m.immune ?? [], combat: {}, skills: m.skills, cooldowns: {}, statuses: [], abilities: {},
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
    log: [], outcome: null, flags: {}, ammoUsed: {}, nextUnitId: enemies.length, terrainFx: {}, burnt: [],
  };
  newRound(cs, []);
  return cs;
}

// ───────────────────────── Turnos ─────────────────────────

function newRound(cs: CombatState, fx: CombatFx[]) {
  if (cs.round > 0) decayTerrain(cs, fx);
  cs.round += 1;
  const alive = cs.units.filter((u) => u.alive);
  const initiative = (u: CombatUnit) => u.spd + (cs.round === 1 && u.combat.firstStrike ? 100 : 0)
    - (hasStatus(u, 'ralentizado') ? 2 : 0) + (hasStatus(u, 'acelerado') ? 3 : 0);
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

/** Aplica daño. "Último aliento" deja con 1 de vida una vez por combate. */
function hurt(cs: CombatState, u: CombatUnit, amount: number, fx: CombatFx[], cause?: CombatUnit['killedBy']) {
  if (!u.alive) return;
  u.hp -= amount;
  if (u.hp > 0) return;
  if (u.combat.lastStand && !cs.flags[`ls_${u.id}`]) {
    cs.flags[`ls_${u.id}`] = true;
    u.hp = 1;
    log(cs, `${u.name} resiste de pie con su último aliento.`);
    return;
  }
  kill(cs, u, fx, cause);
}

function heal(u: CombatUnit, amount: number, fx: CombatFx[], from = u.id) {
  if (!u.alive || amount <= 0) return;
  const real = Math.min(amount, u.maxHp - u.hp);
  u.hp += real;
  if (real > 0) fx.push({ kind: 'heal', from, to: u.id, amount: real });
}

/** Procesa el inicio del turno de la unidad actual. Saltea muertos y aturdidos. */
export function beginTurn(c: Content, s: GameState, rng: Rng): CombatFx[] {
  const cs = s.expedition!.combat!;
  const fx: CombatFx[] = [];
  for (let guard = 0; guard < 50 && !checkOutcome(cs); guard++) {
    if (cs.turnIndex >= cs.order.length) newRound(cs, fx);
    const u = currentUnit(cs);
    if (!u || !u.alive) {
      cs.turnIndex++;
      continue;
    }
    u.moved = false;
    u.acted = false;
    for (const k of Object.keys(u.cooldowns)) u.cooldowns[k] = Math.max(0, u.cooldowns[k] - 1);
    // Terreno bajo los pies: llamas queman, agua moja.
    if (terrainFxAt(cs, u) === 'llamas') applyStatus(u, 'quemadura', TR.burnStatusTurns, CB.dotPower.quemadura, fx, rng);
    if (isWet(c, cs, u)) applyStatus(u, 'mojado', 2, 0, fx);
    // Regeneración (rasgos, runas o ungüento).
    const regen = (u.combat.regen ?? 0) + (u.statuses.find((st) => st.id === 'regenerando' && st.turns > 0)?.power ?? 0);
    if (regen) heal(u, regen, fx);
    // Daño por turno de sangrado, quemadura y veneno.
    for (const st of u.statuses) {
      const dot = st.id === 'veneno' ? Math.max(2, Math.round(u.maxHp * CB.dotPower.veneno)) : st.id === 'sangrado' || st.id === 'quemadura' ? st.power : 0;
      if (!dot) continue;
      fx.push({ kind: 'tick', unit: u.id, damage: dot, status: st.id });
      hurt(cs, u, dot, fx, { element: st.id === 'quemadura' ? 'fuego' : st.id === 'veneno' ? 'veneno' : undefined });
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
  const fx: CombatFx[] = [];
  // Quien termina parado en agua queda mojado (el rayo le hace más daño).
  if (u?.alive && isWet(c, cs, u)) applyStatus(u, 'mojado', 2, 0, fx);
  cs.turnIndex++;
  return [...fx, ...beginTurn(c, s, rng)];
}

// ───────────────────────── Estados ─────────────────────────

export function applyStatus(u: CombatUnit, id: StatusId, turns: number, power: number, fx: CombatFx[], rng?: Rng, element?: Affinity): boolean {
  if (u.immune.includes(id) || !u.alive) return false;
  if (rng && HARMFUL.includes(id) && u.combat.statusResist && rng.chance(u.combat.statusResist / 100)) return false;
  const existing = u.statuses.find((s) => s.id === id && s.element === element);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns);
    existing.power = Math.max(existing.power, power);
  } else {
    u.statuses.push({ id, turns, power, element });
  }
  if (id !== 'mojado') fx.push({ kind: 'status', unit: u.id, status: id });
  return true;
}

// ───────────────────────── Acciones ─────────────────────────

export function moveUnit(c: Content, s: GameState, unitId: string, to: Pt, rng?: Rng): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = unitById(cs, unitId);
  if (u.moved) throw new GameError('Ya se movió este turno.');
  const r = reachable(c, cs, u).get(`${to.x},${to.y}`);
  if (!r) throw new GameError('No llega hasta ahí.');
  const fx: CombatFx[] = [];
  if (r.path.length) {
    u.facing = dirTo(r.path.length > 1 ? r.path[r.path.length - 2] : u, to);
    u.x = to.x;
    u.y = to.y;
    fx.push({ kind: 'move', unit: u.id, path: r.path });
    // Cruzar llamas quema.
    if (r.path.some((p) => terrainFxAt(cs, p) === 'llamas')) applyStatus(u, 'quemadura', TR.burnStatusTurns, CB.dotPower.quemadura, fx, rng);
  }
  u.moved = true;
  return fx;
}

export function canUseSkill(_c: Content, s: GameState, u: CombatUnit, skill: CombatSkill): string | null {
  if (u.acted) return 'Ya actuó este turno.';
  if ((u.cooldowns[skill.id] ?? 0) > 0) return `Disponible en ${u.cooldowns[skill.id]} turno(s).`;
  const ab = u.abilities[skill.id];
  if (ab && ab.uses <= 0) return 'Sin usos en este combate.';
  if (skill.ammo) {
    const lot = u.ammoUid ? s.items.find((i) => i.uid === u.ammoUid && i.quantity > 0) : undefined;
    if (!lot) return 'No te quedan flechas.';
  }
  if (skill.throw) {
    const lot = u.throwUid ? s.items.find((i) => i.uid === u.throwUid && i.quantity > 0) : undefined;
    if (!lot) return 'No te quedan arrojadizos en el cinturón.';
  }
  return null;
}

function spendAmmo(s: GameState, cs: CombatState, u: CombatUnit) {
  const lot = s.items.find((i) => i.uid === u.ammoUid);
  if (!lot) return;
  lot.quantity -= 1;
  cs.ammoUsed[lot.uid] = (cs.ammoUsed[lot.uid] ?? 0) + 1;
  if (lot.quantity <= 0) u.ammoUid = bestArrows(s);
}

function spendThrow(s: GameState, cs: CombatState, u: CombatUnit) {
  const lot = s.items.find((i) => i.uid === u.throwUid);
  if (!lot) return;
  lot.quantity -= 1;
  cs.ammoUsed[lot.uid] = (cs.ammoUsed[lot.uid] ?? 0) + 1;
  if (lot.quantity <= 0) u.throwUid = undefined;
}

/** Efectos al pegar: estados de la acción y de los rasgos del arma. */
function onHitEffects(rng: Rng, skill: CombatSkill, combat: Record<string, number>, t: CombatUnit, fx: CombatFx[]) {
  for (const st of skill.statuses ?? []) {
    if (st.id !== 'cubierto' && st.id !== 'potenciado' && rng.chance(st.chance)) applyStatus(t, st.id, st.turns, st.power ?? CB.dotPower[st.id] ?? 0, fx, rng);
  }
  const chance = CB.traitStatusChance;
  if (combat.bleed && rng.chance(chance)) applyStatus(t, 'sangrado', combat.bleed, CB.dotPower.sangrado, fx, rng);
  if (combat.burn && rng.chance(chance)) applyStatus(t, 'quemadura', combat.burn, CB.dotPower.quemadura, fx, rng);
  if (combat.poison && rng.chance(chance)) applyStatus(t, 'veneno', combat.poison, 0, fx, rng);
  if (combat.slowPct && rng.chance(combat.slowPct / 100)) applyStatus(t, 'ralentizado', 2, 0, fx, rng);
  if (combat.stunPct && rng.chance(combat.stunPct / 100)) applyStatus(t, 'aturdido', 1, 0, fx, rng);
  if (combat.immobilizePct && rng.chance(combat.immobilizePct / 100)) applyStatus(t, 'inmovilizado', 1, 0, fx, rng);
}

/** Desgaste de la armadura del objetivo (ácido). */
function wearArmor(s: GameState, t: CombatUnit, amount: number) {
  const ch = t.charId ? s.characters[t.charId] : undefined;
  const armor = ch?.equipment.cuerpo ? s.items.find((i) => i.uid === ch.equipment.cuerpo) : undefined;
  if (armor) armor.durability = Math.max(0, armor.durability - amount);
}

function push(c: Content, cs: CombatState, from: Pt, t: CombatUnit, fx: CombatFx[]) {
  const a = arenaOf(c, cs);
  const [dx, dy] = DIR_VEC[dirTo(from, t)];
  const to = { x: t.x + dx, y: t.y + dy };
  if (!inBounds(a, to.x, to.y) || !isFloor(a, to.x, to.y) || unitAt(cs, to.x, to.y)) {
    fx.push({ kind: 'push', unit: t.id, to: { x: t.x, y: t.y }, damage: CB.collisionDamage });
    log(cs, `${t.name} choca y se golpea.`);
    hurt(cs, t, CB.collisionDamage, fx, { damageType: 'contundente' });
    return;
  }
  const drop = heightAt(a, t.x, t.y) - heightAt(a, to.x, to.y);
  const dmg = drop >= 2 ? drop * CB.fallDamagePerLevel : 0;
  t.x = to.x;
  t.y = to.y;
  fx.push({ kind: 'push', unit: t.id, to, damage: dmg });
  if (dmg) {
    log(cs, `${t.name} cae de la loma y recibe ${dmg} de daño.`);
    hurt(cs, t, dmg, fx, { damageType: 'contundente' });
  }
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

/** Un golpe contra un objetivo. Devuelve el daño hecho (0 si falló). */
function strike(c: Content, s: GameState, rng: Rng, u: CombatUnit, t: CombatUnit, skill: CombatSkill, fx: CombatFx[], from: Pt = u): number {
  const cs = s.expedition!.combat!;
  const calc = calcAttack(c, s, cs, u, t, skill, from);
  const { combat } = attackProps(c, s, u, skill);
  if (!rng.chance(calc.hit)) {
    fx.push({ kind: 'miss', from: u.id, to: t.id, skill: skill.id });
    log(cs, `${u.name} usa ${skill.name} contra ${t.name}, pero falla.`);
    return 0;
  }
  const crit = rng.chance(calc.crit);
  let dmg = Math.round(rng.range(calc.min, calc.max) * (crit ? CB.critMult : 1));
  if (hasStatus(t, 'cubierto') && t.combat.blockPct && rng.chance(t.combat.blockPct / 100)) dmg = Math.round(dmg / 2);
  fx.push({ kind: 'hit', from: u.id, to: t.id, damage: dmg, crit, skill: skill.id, element: calc.element });
  log(cs, `${u.name} usa ${skill.name}: ${dmg} de daño a ${t.name}${crit ? ' (¡crítico!)' : ''}.`);
  const steal = (combat.lifeStealPct ?? 0) + (skill.lifeStealPct ?? 0);
  if (steal && u.alive) heal(u, Math.round(dmg * steal / 100), fx);
  if (t.combat.thornsPct && skill.range[1] <= 1 && !skill.area) {
    const back = Math.round(dmg * t.combat.thornsPct / 100);
    if (back) {
      fx.push({ kind: 'tick', unit: u.id, damage: back, status: 'sangrado' });
      hurt(cs, u, back, fx);
    }
  }
  if (skill.wear) wearArmor(s, t, skill.wear);
  hurt(cs, t, dmg, fx, { element: calc.element, damageType: skill.damageType ?? u.damageType });
  if (!t.alive) return dmg;
  onHitEffects(rng, skill, combat, t, fx);
  if (skill.push) push(c, cs, from, t, fx);
  halfHpTrigger(c, cs, t, fx);
  return dmg;
}

/** El rayo se propaga por el agua conectada a la casilla del objetivo. */
function chainLightning(c: Content, cs: CombatState, u: CombatUnit, origin: CombatUnit, dmg: number, fx: CombatFx[], hit: Set<string>) {
  if (!dmg || !isWet(c, cs, origin)) return;
  const tiles = waterNetwork(c, cs, origin);
  const victims = unitsOn(cs, tiles).filter((v) => !hit.has(v.id) && v.id !== u.id);
  if (!victims.length) return;
  fx.push({ kind: 'chain', tiles });
  for (const v of victims) {
    const d = Math.max(1, Math.round(dmg * TR.chainFraction * (v.elemental.rayo ?? 1)));
    hit.add(v.id);
    fx.push({ kind: 'hit', from: u.id, to: v.id, damage: d, crit: false, skill: 'cadena', element: 'rayo' });
    log(cs, `El rayo corre por el agua: ${d} de daño a ${v.name}.`);
    hurt(cs, v, d, fx, { element: 'rayo' });
  }
}

/** Acción efectiva: las bombas toman el elemento (y el terreno) de su carga. */
export function effectiveSkill(s: GameState, u: CombatUnit, skill: CombatSkill): CombatSkill {
  if (!skill.throw || skill.area !== 'radius') return skill;
  const lot = s.items.find((i) => i.uid === u.throwUid);
  const el = lot ? dominantElement({ ...skill, element: undefined }, lot.affinities, {}) : undefined;
  const statuses = el === 'veneno' ? [{ id: 'veneno' as const, chance: 0.9, turns: 3 }] : skill.statuses;
  return { ...skill, element: el, terrain: terrainForElement(el), chain: el === 'rayo', statuses };
}

export function useSkill(c: Content, s: GameState, rng: Rng, unitId: string, skillId: string, target: Pt): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = unitById(cs, unitId);
  const base = c.skills[skillId];
  if (!base || !u.skills.includes(skillId)) throw new GameError('No tiene esa acción.');
  const reason = canUseSkill(c, s, u, base);
  if (reason) throw new GameError(reason);
  const skill = effectiveSkill(s, u, base);
  const fx: CombatFx[] = [];

  // Validar el objetivo.
  let t: CombatUnit | undefined;
  if (skill.target === 'self') t = u;
  else if (skill.target === 'tile') {
    if (!tileInRange(c, cs, u, skill, target)) throw new GameError('Casilla fuera de alcance.');
  } else {
    t = unitAt(cs, target.x, target.y);
    if (!t || !targetsFor(c, cs, u, skill).includes(t)) throw new GameError('Objetivo fuera de alcance.');
  }

  // Embestida: primero carga en línea recta.
  if (skill.charge && t && dist(u, t) > 1) {
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
  if (skill.target !== 'self') u.facing = dirTo(u, t ?? target);
  u.acted = true;
  const ab = u.abilities[skill.id];
  if (ab) {
    ab.uses -= 1;
    u.cooldowns[skill.id] = ab.cooldown + 1;
  } else if (skill.cooldown) {
    u.cooldowns[skill.id] = skill.cooldown + 1;
  }
  if (skill.ammo) spendAmmo(s, cs, u);
  if (skill.throw) spendThrow(s, cs, u);

  const hit = new Set<string>();
  const strikeAll = (victims: CombatUnit[], from: Pt) => {
    for (const v of victims) {
      if (!v.alive || !u.alive) continue;
      hit.add(v.id);
      const dmg = strike(c, s, rng, u, v, skill, fx, from);
      if (skill.chain) chainLightning(c, cs, u, v, dmg, fx, hit);
      // Golpe doble por rasgo del arma.
      const { combat } = attackProps(c, s, u, skill);
      if (v.alive && u.alive && combat.doubleHitPct && skill.range[1] <= 1 && !skill.area && rng.chance(combat.doubleHitPct / 100)) strike(c, s, rng, u, v, skill, fx);
      if (v.alive && u.alive && skill.ammo && !skill.area && combat.doubleShotPct && rng.chance(combat.doubleShotPct / 100) && canUseSkill(c, s, { ...u, acted: false }, skill) === null) {
        spendAmmo(s, cs, u);
        strike(c, s, rng, u, v, skill, fx);
      }
    }
  };
  const terrainOn = (tiles: Pt[]) => {
    if (!skill.terrain) return;
    const changed = applyTerrain(c, cs, tiles, skill.terrain);
    if (!changed.length) return;
    fx.push({ kind: 'terrain', tiles: changed, terrain: skill.terrain });
    // Los que estaban en el agua quedan atrapados en el hielo.
    if (skill.terrain === 'hielo') for (const v of unitsOn(cs, changed)) applyStatus(v, 'inmovilizado', 1, 0, fx, rng);
  };
  const inArea = (tiles: Pt[]) => unitsOn(cs, tiles).filter((v) => v.id !== u.id && (v.side !== u.side || skill.friendlyFire));

  if (skill.target === 'self' && skill.area === 'adjacent') {
    // Acciones sobre uno mismo con área "adjacent": potencian a todo su bando (grito de guerra, bastión).
    for (const x of cs.units.filter((v) => v.alive && v.side === u.side)) {
      for (const st of skill.statuses ?? [{ id: 'potenciado' as const, chance: 1, turns: 2 }]) applyStatus(x, st.id, st.turns, 0, fx);
    }
    fx.push({ kind: 'buff', unit: u.id, skill: skill.id });
    log(cs, `${u.name} usa ${skill.name}.`);
  } else if (skill.target === 'self' && skill.area === 'radius') {
    const tiles = areaTiles(c, cs, u, skill, u);
    fx.push({ kind: 'area', from: u.id, tiles, skill: skill.id, element: skill.element });
    log(cs, `${u.name} usa ${skill.name}.`);
    strikeAll(inArea(tiles), u);
    terrainOn(tiles);
  } else if (skill.target === 'self') {
    for (const st of skill.statuses ?? []) applyStatus(u, st.id, st.turns, 0, fx);
    fx.push({ kind: 'buff', unit: u.id, skill: skill.id });
    log(cs, `${u.name} usa ${skill.name}.`);
  } else if (skill.target === 'ally') {
    if (skill.healPct) {
      const amount = Math.round(t!.maxHp * skill.healPct * (ab?.power ?? 1));
      heal(t!, amount, fx, u.id);
      log(cs, `${u.name} cura ${amount} a ${t!.name}.`);
    }
    for (const st of skill.statuses ?? []) applyStatus(t!, st.id, st.turns, 0, fx);
    if (!skill.healPct) log(cs, `${u.name} usa ${skill.name} sobre ${t!.name}.`);
  } else if (skill.target === 'tile') {
    const tiles = areaTiles(c, cs, u, skill, target);
    fx.push({ kind: 'area', from: u.id, tiles, skill: skill.id, element: skill.element });
    log(cs, `${u.name} usa ${skill.name}.`);
    strikeAll(inArea(tiles), u);
    terrainOn(tiles);
  } else {
    const victims = skill.area === 'adjacent' ? cs.units.filter((x) => x.alive && x.side !== u.side && dist(u, x) === 1) : [t!];
    strikeAll(victims, u);
    terrainOn([{ x: t!.x, y: t!.y }]);
  }
  checkOutcome(cs);
  return fx;
}

/** Usar una poción del cinturón sobre uno mismo o un aliado al lado. Gasta la acción. */
export function usePotion(c: Content, s: GameState, rng: Rng, unitId: string, potionUid: string, target: Pt): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = unitById(cs, unitId);
  if (u.acted) throw new GameError('Ya actuó este turno.');
  const t = unitAt(cs, target.x, target.y);
  if (!t || t.side !== u.side || dist(u, t) > 1) throw new GameError('Las pociones se dan a uno mismo o a un aliado al lado.');
  const item = s.items.find((i) => i.uid === potionUid);
  const def = item?.potion ? c.potions[item.potion.recipe] : undefined;
  if (!item || !def || def.output.kind !== 'pocion') throw new GameError('Esa poción no existe.');
  const potency = item.potion!.potency;
  consumePotion(s, potionUid);
  u.acted = true;
  const fx: CombatFx[] = [];
  const effect = def.output.effect;
  switch (effect.type) {
    case 'curar':
      heal(t, Math.round(t.maxHp * effect.pct * (1 + AL.healPerPotency * (potency - 1))), fx, u.id);
      break;
    case 'limpiar':
      t.statuses = t.statuses.filter((st) => !HARMFUL.includes(st.id));
      fx.push({ kind: 'buff', unit: t.id, skill: 'antidoto' });
      break;
    case 'estado':
      applyStatus(t, effect.status, effect.turns + potency - 1, effect.status === 'regenerando' ? 4 + potency * 2 : 0, fx);
      break;
    case 'resguardo':
      applyStatus(t, 'resguardo', effect.turns + potency - 1, 0, fx, undefined, effect.element);
      break;
    case 'huida':
      if (!cs.boss || rng.chance(0.6)) cs.outcome = 'fled';
      else log(cs, 'El humo no alcanza para escapar del jefe.');
      break;
  }
  log(cs, `${u.name} usa ${def.name}${t !== u ? ` en ${t.name}` : ''}.`);
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
