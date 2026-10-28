import type { Content } from '../content';
import type { Rng } from '../rng';
import type { GameState } from '../types';
import { calcAttack, expectedDamage } from './damage';
import { canUseSkill, endTurn, moveUnit, useSkill } from './engine';
import { arenaOf, dist, hasStatus, heightAt, reachable, targetsFor, type Pt } from './grid';
import type { CombatFx, CombatState, CombatUnit } from './types';

interface Plan {
  move: Pt;
  skill?: string;
  target?: Pt;
  score: number;
}

function enemiesOf(cs: CombatState, u: CombatUnit) {
  return cs.units.filter((x) => x.alive && x.side !== u.side);
}

function alliesOf(cs: CombatState, u: CombatUnit) {
  return cs.units.filter((x) => x.alive && x.side === u.side);
}

/** Valor de una posición según el rol (distancia, altura, cercanía a aliados). */
function positionScore(c: Content, cs: CombatState, u: CombatUnit, p: Pt): number {
  const a = arenaOf(c, cs);
  const enemies = enemiesOf(cs, u);
  const nearest = Math.min(...enemies.map((e) => dist(p, e)));
  const h = heightAt(a, p.x, p.y);
  switch (u.ai) {
    case 'tirador':
      return (nearest >= 3 ? 4 : nearest <= 1 ? -6 : -1) + h * 2;
    case 'sanador':
      return nearest >= 3 ? 3 : -3;
    case 'tanque': {
      const guarding = alliesOf(cs, u).some((al) => al !== u && dist(p, al) === 1);
      return (nearest === 1 ? 3 : 0) + (guarding ? 2 : 0);
    }
    case 'jefe':
      return h * 2;
    default:
      return 0;
  }
}

/** Elige la mejor combinación de posición + acción + objetivo. */
export function planTurn(c: Content, s: GameState, cs: CombatState, u: CombatUnit): Plan {
  const positions = [...reachable(c, cs, u).values()].map((r) => ({ x: r.x, y: r.y }));
  const enemies = enemiesOf(cs, u);
  let best: Plan = { move: { x: u.x, y: u.y }, score: -Infinity };

  for (const p of positions) {
    const base = positionScore(c, cs, u, p);
    const ghost = { ...u, x: p.x, y: p.y };
    for (const id of u.skills) {
      const skill = c.skills[id];
      if (!skill || canUseSkill(c, s, u, skill)) continue;
      for (const t of targetsFor(c, cs, ghost, skill, p)) {
        let score = base;
        if (skill.target === 'enemy') {
          const calc = calcAttack(c, s, cs, ghost, t, skill, p);
          const exp = expectedDamage(calc) * (skill.area === 'adjacent' ? enemies.filter((e) => dist(p, e) === 1).length : 1);
          score += exp + (calc.min >= t.hp ? 30 : 0) + (skill.statuses?.length ? 4 : 0) + (skill.push ? 2 : 0);
          // La manada busca a quien ya está rodeado.
          if (u.ai === 'manada') score += alliesOf(cs, u).filter((al) => al !== u && dist(al, t) === 1).length * 3;
          // Todos priorizan a los que curan o están débiles.
          score += (1 - t.hp / t.maxHp) * 6;
        } else if (skill.healPct) {
          const missing = t.maxHp - t.hp;
          if (t.hp / t.maxHp > 0.6) continue;
          score += Math.min(missing, t.maxHp * skill.healPct) * 1.5;
        } else if (skill.target === 'ally') {
          if (hasStatus(t, 'potenciado') || t === u) continue;
          score += enemies.some((e) => dist(e, t) <= 2) ? 9 : 2;
        } else {
          // Acciones sobre uno mismo (cubrirse, rugido, grito de guerra).
          const threatened = enemies.some((e) => dist(e, p) <= 2);
          if (id === 'grito_guerra') score += cs.round === 1 || alliesOf(cs, u).every((al) => !hasStatus(al, 'potenciado')) ? 25 : 0;
          else if (hasStatus(u, skill.statuses?.[0]?.id ?? 'potenciado')) continue;
          else score += threatened ? 7 : 1;
        }
        if (score > best.score) best = { move: p, skill: id, target: { x: t.x, y: t.y }, score };
      }
    }
  }

  if (best.skill && best.score > 0) return best;

  // Sin nada para hacer: acercarse (o, si es tirador, quedar a media distancia).
  const want = u.ai === 'tirador' || u.ai === 'sanador' ? 3 : 1;
  let move = { x: u.x, y: u.y };
  let bestDist = Infinity;
  for (const p of positions) {
    const d = Math.min(...enemies.map((e) => Math.abs(dist(p, e) - want)));
    const score = d - positionScore(c, cs, u, p) * 0.1;
    if (score < bestDist) {
      bestDist = score;
      move = p;
    }
  }
  return { move, score: 0 };
}

/** Juega el turno completo de una unidad controlada por la IA. */
export function aiTurn(c: Content, s: GameState, rng: Rng): CombatFx[] {
  const cs = s.expedition!.combat!;
  const u = cs.units.find((x) => x.id === cs.order[cs.turnIndex]);
  const fx: CombatFx[] = [];
  if (!u || !u.alive || u.side !== 'enemy') return fx;
  const plan = planTurn(c, s, cs, u);
  if (plan.move.x !== u.x || plan.move.y !== u.y) fx.push(...moveUnit(c, s, u.id, plan.move));
  if (plan.skill && plan.target && !cs.outcome) fx.push(...useSkill(c, s, rng, u.id, plan.skill, plan.target));
  if (!cs.outcome) fx.push(...endTurn(c, s, rng));
  return fx;
}
