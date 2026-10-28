import { calcAttack, type AttackCalc } from '../core/combat/damage';
import { canUseSkill, currentUnit, effectiveSkill } from '../core/combat/engine';
import { dist, reachable, skillRange, targetsFor, tileInRange, unitAt, type Pt } from '../core/combat/grid';
import { areaTiles } from '../core/combat/terrain';
import type { CombatUnit } from '../core/combat/types';
import { combatMove, combatPotion, combatSkill } from '../core/world/expedition';
import type { GameStore } from './GameStore';

/** Unidad del grupo que está jugando su turno (si la UI puede actuar). */
export function activePartyUnit(store: GameStore): CombatUnit | undefined {
  const snap = store.getSnapshot();
  const cs = snap.state?.expedition?.combat;
  if (!cs || cs.outcome || snap.ui.busy) return undefined;
  const u = currentUnit(cs);
  return u && u.side === 'party' && cs.autoUnit !== u.id ? u : undefined;
}

/** Modo efectivo: si no eligió nada y todavía no se movió, se muestran las casillas de movimiento. */
export function effectiveMode(store: GameStore, u: CombatUnit) {
  const mode = store.getSnapshot().ui.combat.mode;
  return mode ?? (u.moved ? null : 'move');
}

export function selectSkill(store: GameStore, skillId: string) {
  const u = activePartyUnit(store);
  if (!u) return;
  const skill = store.content.skills[skillId];
  const reason = canUseSkill(store.content, store.state, u, skill);
  if (reason) return store.toast(reason, 'bad');
  if (skill.target === 'self') {
    store.run(combatSkill, u.id, skillId, u.x, u.y);
    return;
  }
  const cs = store.state.expedition!.combat!;
  if (skill.target !== 'tile' && !targetsFor(store.content, cs, u, skill).length) store.toast('No hay objetivos al alcance. Movete primero.', 'bad');
  store.setUi({ combat: { mode: 'skill', skillId } });
}

/** Elegir una poción del cinturón: después se toca a quién dársela (uno mismo o un aliado al lado). */
export function selectPotion(store: GameStore, potionUid: string) {
  const u = activePartyUnit(store);
  if (!u) return;
  if (u.acted) return store.toast('Ya actuó este turno.', 'bad');
  store.setUi({ combat: { mode: 'potion', potionUid } });
}

/** Aliados a los que se les puede dar una poción. */
function potionTargets(store: GameStore, u: CombatUnit): CombatUnit[] {
  const cs = store.state.expedition!.combat!;
  return cs.units.filter((t) => t.alive && t.side === u.side && dist(u, t) <= 1);
}

/** Tocar una casilla de la arena. */
export function combatTap(store: GameStore, x: number, y: number) {
  const u = activePartyUnit(store);
  if (!u) return;
  const c = store.content;
  const s = store.state;
  const cs = s.expedition!.combat!;
  const ui = store.getSnapshot().ui;
  const mode = effectiveMode(store, u);

  if (mode === 'potion' && ui.combat.potionUid) {
    const target = unitAt(cs, x, y);
    if (target && potionTargets(store, u).includes(target)) store.run(combatPotion, u.id, ui.combat.potionUid, x, y);
    else store.setUi({ combat: { mode: null } });
    return;
  }

  if (mode === 'skill' && ui.combat.skillId) {
    const skill = c.skills[ui.combat.skillId];
    const target = unitAt(cs, x, y);
    const ok = skill.target === 'tile' ? tileInRange(c, cs, u, skill, { x, y }) : !!target && targetsFor(c, cs, u, skill).includes(target);
    if (ok) {
      // Primer toque: elige objetivo y muestra la vista previa. Segundo toque: confirma.
      if (ui.combat.target?.x === x && ui.combat.target?.y === y) store.run(combatSkill, u.id, skill.id, x, y);
      else store.setUi({ combat: { ...ui.combat, target: { x, y } } });
      return;
    }
    store.setUi({ combat: { mode: null } });
    return;
  }

  if (mode === 'move' && !u.moved) {
    if (x === u.x && y === u.y) return store.setUi({ combat: { mode: null } });
    if (reachable(c, cs, u).has(`${x},${y}`)) store.run(combatMove, u.id, x, y);
  }
}

export interface Highlights {
  move: Pt[];
  range: Pt[];
  targets: Pt[];
  /** Casillas que cubriría el área de la acción elegida. */
  area: Pt[];
  selected?: Pt;
}

/** Casillas a resaltar en la arena según el modo de la UI. */
export function combatHighlights(store: GameStore): Highlights {
  const out: Highlights = { move: [], range: [], targets: [], area: [] };
  const u = activePartyUnit(store);
  if (!u) return out;
  const c = store.content;
  const cs = store.state.expedition!.combat!;
  const ui = store.getSnapshot().ui;
  const mode = effectiveMode(store, u);
  if (mode === 'move' && !u.moved) {
    for (const r of reachable(c, cs, u).values()) if (r.cost > 0) out.move.push({ x: r.x, y: r.y });
  }
  if (mode === 'skill' && ui.combat.skillId) {
    const skill = c.skills[ui.combat.skillId];
    const [min, max] = skillRange(c, cs, u, skill);
    const a = c.arenas[cs.arenaId];
    for (let y = 0; y < a.terrain.length; y++) {
      for (let x = 0; x < a.terrain[0].length; x++) {
        const d = dist(u, { x, y });
        if (d >= min && d <= (skill.charge ? skill.charge + 1 : max) && d > 0) out.range.push({ x, y });
      }
    }
    out.targets = targetsFor(c, cs, u, skill).map((t) => ({ x: t.x, y: t.y }));
    out.selected = ui.combat.target;
    if (ui.combat.target && skill.area) out.area = areaTiles(c, cs, u, effectiveSkill(store.state, u, skill), ui.combat.target);
  }
  if (mode === 'potion') out.targets = potionTargets(store, u).map((t) => ({ x: t.x, y: t.y }));
  return out;
}

/** Vista previa del ataque elegido (acierto y daño). */
export function attackPreview(store: GameStore): { calc: AttackCalc; target: CombatUnit } | null {
  const u = activePartyUnit(store);
  const ui = store.getSnapshot().ui;
  if (!u || ui.combat.mode !== 'skill' || !ui.combat.skillId || !ui.combat.target) return null;
  const cs = store.state.expedition!.combat!;
  const target = unitAt(cs, ui.combat.target.x, ui.combat.target.y);
  const skill = store.content.skills[ui.combat.skillId];
  if (!target || target.side === u.side || (skill.target !== 'enemy' && skill.target !== 'tile')) return null;
  return { calc: calcAttack(store.content, store.state, cs, u, target, skill), target };
}
