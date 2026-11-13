import { cityLocation } from '../city';
import type { Content, Ctx } from '../content';
import { npcsAt } from '../city';
import { addMaterial } from '../state';
import type { GameEvent, GameState } from '../types';
import type { TutorialStepDef } from './types';

// La guía de primeros pasos: cada paso se cumple solo al hacerlo (en cualquier orden) y da un premio chico.
// Y los consejos de una sola vez, que la UI muestra la primera vez que se entra a cada sistema.

/** Cuándo se cumple cada paso (mirando el estado y lo que acaba de pasar). */
const CHECKS: Record<string, (s: GameState, events: GameEvent[]) => boolean> = {
  forjar: (s) => s.stats.itemsForged >= 1,
  vender: (s) => s.stats.itemsSold >= 1,
  comprar: (s) => !!s.flags.compro_material,
  charlar: (s) => Object.values(s.npcs).some((n) => n.lastTalkDay > 0),
  encargo: (s) => s.quests.active.length + s.quests.done.length + s.contracts.active.length + s.contracts.done.length > 0,
  expedicion: (s, events) => !!s.flags.volvio_expedicion || events.some((e) => e.type === 'expeditionEnded'),
  dormir: (s) => s.day >= 2,
};

/** El próximo paso sugerido (el primero sin cumplir), o null si la guía está apagada o terminada. */
export function currentStep(c: Content, s: GameState): TutorialStepDef | null {
  if (!s.tutorial.guide) return null;
  return c.tutorial.steps.find((st) => !s.tutorial.done.includes(st.id)) ?? null;
}

/**
 * Después de cada comando: marca los pasos que se cumplieron, da sus premios y cuenta lo que dice el maestro.
 * Al terminar todos, la guía se apaga sola.
 */
export function tutorialUpdate(s: GameState, c: Content, events: GameEvent[]): GameEvent[] {
  if (events.some((e) => e.type === 'expeditionEnded')) s.flags.volvio_expedicion = true;
  if (!s.tutorial.guide) return [];
  const out: GameEvent[] = [];
  for (const step of c.tutorial.steps) {
    if (s.tutorial.done.includes(step.id) || !CHECKS[step.id]?.(s, events)) continue;
    s.tutorial.done.push(step.id);
    const reward = giveReward(s, c, step);
    out.push({ type: 'toast', text: `📖 ${step.done}${reward ? ` (${reward})` : ''}`, tone: 'good' });
  }
  if (c.tutorial.steps.every((st) => s.tutorial.done.includes(st.id))) {
    s.tutorial.guide = false;
    out.push({ type: 'tutorialDone' });
  }
  return out;
}

function giveReward(s: GameState, c: Content, step: TutorialStepDef): string {
  const parts: string[] = [];
  if (step.reward.gold) {
    s.gold += step.reward.gold;
    parts.push(`+${step.reward.gold} de oro`);
  }
  for (const m of step.reward.materials ?? []) {
    addMaterial(s, m.id, m.qty);
    parts.push(`+${m.qty} ${c.materials[m.id]?.name.toLowerCase() ?? m.id}`);
  }
  return parts.join(', ');
}

/** Prender o apagar la guía. Al prenderla, lo que ya hiciste cuenta como cumplido (sin premio). */
export function setGuide(s: GameState, { c }: Ctx, on: boolean): GameEvent[] {
  s.tutorial.guide = on;
  if (on) for (const step of c.tutorial.steps) if (!s.tutorial.done.includes(step.id) && CHECKS[step.id]?.(s, [])) s.tutorial.done.push(step.id);
  if (on && c.tutorial.steps.every((st) => s.tutorial.done.includes(st.id))) {
    s.tutorial.guide = false;
    return [{ type: 'toast', text: 'Ya hiciste todo lo de la guía de primeros pasos.' }];
  }
  return [];
}

/** Un consejo ya leído no vuelve a aparecer. */
export function seeTip(s: GameState, _ctx: Ctx, id: string): GameEvent[] {
  if (!s.tutorial.tips.includes(id)) s.tutorial.tips.push(id);
  return [];
}

/** Volver a ver todos los consejos. */
export function resetTips(s: GameState): GameEvent[] {
  s.tutorial.tips = [];
  return [{ type: 'toast', text: 'Los consejos del maestro van a volver a aparecer.' }];
}

export type TutorialTarget = 'forjar' | 'tienda' | 'mercado' | 'hablar' | 'tablon' | 'expedicion' | 'dormir' | 'ciudad';

/** Qué botón conviene tocar ahora para avanzar el paso (se resalta en la barra de abajo). */
export function stepTarget(c: Content, s: GameState, step: TutorialStepDef): TutorialTarget {
  const loc = cityLocation(c, s.location);
  const home = s.location === 'herreria';
  switch (step.id) {
    case 'forjar': return home ? 'forjar' : 'ciudad';
    case 'vender': return home ? 'tienda' : 'ciudad';
    case 'expedicion': return home ? 'expedicion' : 'ciudad';
    case 'dormir': return home ? 'dormir' : 'ciudad';
    case 'comprar': return loc?.kind === 'mercado' ? 'mercado' : 'ciudad';
    case 'encargo': return loc?.kind === 'tablon' || loc?.kind === 'gremio' ? 'tablon' : 'ciudad';
    case 'charlar': return npcsAt(c, s, s.location).length ? 'hablar' : 'ciudad';
    default: return 'ciudad';
  }
}

/** En el mapa de la ciudad: a qué lugar conviene ir para el paso. */
export function stepPlace(step: TutorialStepDef): string {
  return { comprar: 'mercado', charlar: 'taberna', encargo: 'tablon' }[step.id] ?? 'herreria';
}
