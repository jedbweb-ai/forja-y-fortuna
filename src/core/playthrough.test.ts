import { describe, expect, it } from 'vitest';
import { BALANCE } from '../config/balance';
import { CONTENT as c } from '../data';
import { goTo, restSlot, sleepUntilMorning } from './city';
import { currentUnit } from './combat/engine';
import { runCommand, type Command } from './commands';
import { GameError, type Ctx } from './content';
import { buyMaterial, marketStock } from './economy/market';
import { acceptOffer, askPrice, closeShop, exhibitedItems, nextCustomer, openShop, suggestedPrice, toggleExhibit } from './economy/shop';
import { forgeBegin, forgeComplete, forgeFinish, forgeQuench, forgeStop, forgeStrike } from './forge/commands';
import { computeDesign } from './forge/design';
import { equipItem } from './party/equipment';
import { hireMercenary } from './party/mercenaries';
import { buyUpgrade, learnTalent, talentBlock, upgradeBlock } from './progress/progress';
import { skillLevel } from './state';
import { setup } from './testUtils';
import type { GameEvent, GameState, ItemInstance } from './types';
import { acceptQuest, deliverQuest, questProgress } from './town/quests';
import { closeReport, combatAiStep, expMove, gather, returnHome, startExpedition } from './world/expedition';
import { regionPath } from './world/region';

// Partida simulada: un "jugador" simple usa los mismos comandos que la interfaz durante varias semanas.
// No busca jugar bien, sino recorrer todos los sistemas juntos y ver cómo avanza una partida.

type Bot = { s: GameState; ctx: Ctx; log: string[]; errors: string[]; counts: Record<string, number> };

function run<A extends unknown[]>(b: Bot, cmd: Command<A>, ...args: A): GameEvent[] | null {
  try {
    return runCommand(b.s, b.ctx, cmd, ...args);
  } catch (e) {
    const msg = (e as Error).message;
    // Los GameError son respuestas normales del juego ("te falta oro"); cualquier otro error es un bug.
    if (!(e instanceof GameError)) b.errors.push(`día ${b.s.day} ${cmd.name}: ${msg}`);
    return null;
  }
}

const count = (b: Bot, k: string, n = 1) => { b.counts[k] = (b.counts[k] ?? 0) + n; };

/** Lo que el bot sabe forjar con materiales del mercado, en orden de preferencia. */
const PICO = { bp: 'pico', mats: { cabeza: 'hierro', mango: 'pino' } };
const RECIPES: { bp: string; mats: Record<string, string> }[] = [
  { bp: 'espada_larga', mats: { hoja: 'hierro', guarda: 'hierro', mango: 'fresno', pomo: 'bronce' } },
  { bp: 'peto', mats: { placas: 'hierro', forro: 'cuero_curtido' } },
  { bp: 'daga', mats: { hoja: 'hierro', guarda: 'cobre', mango: 'pino' } },
  { bp: 'escudo_mediano', mats: { tablas: 'roble', refuerzo: 'hierro', correas: 'cuero_curtido' } },
  { bp: 'flechas', mats: { punta: 'hierro', astil: 'pino', emplumado: 'plumas_ganso' } },
  { bp: 'maza', mats: { cabeza: 'hierro', mango: 'roble' } },
];

function needs(bp: string, mats: Record<string, string>) {
  return computeDesign(c, bp, mats).needs;
}

function shopping(b: Bot) {
  const { s } = b;
  if (s.gold < 60) return;
  run(b, goTo, 'mercado');
  const stock = new Set(marketStock(c, s, 'mercado'));
  // Lo justo para las dos piezas del día: una de una franja y otra cualquiera.
  const plan = [RECIPES.filter((r) => c.blueprints[r.bp].slots === 1)[s.day % 4], RECIPES[s.day % RECIPES.length]];
  const want: Record<string, number> = {};
  for (const r of plan) for (const [id, q] of Object.entries(needs(r.bp, r.mats))) want[id] = (want[id] ?? 0) + q;
  for (const [id, q] of Object.entries(want)) {
    const missing = q - (s.materials[id] ?? 0);
    if (missing > 0 && stock.has(id) && s.gold > 40) if (run(b, buyMaterial, id, missing)) count(b, 'compras');
  }
  run(b, goTo, 'herreria');
}

function forgeOne(b: Bot, oneSlot = false): ItemInstance | null {
  const { s } = b;
  const hasPico = s.items.some((i) => i.blueprintId === 'pico');
  const r = [...(hasPico ? [] : [PICO]), ...RECIPES].filter((x) => !oneSlot || c.blueprints[x.bp].slots === 1).find((x) => Object.entries(needs(x.bp, x.mats)).every(([id, q]) => (s.materials[id] ?? 0) >= q));
  if (!r || !run(b, forgeBegin, r.bp, r.mats)) return null;
  // Golpes hasta una calidad razonable, sin arriesgar demasiados defectos.
  for (let i = 0; i < 9 && s.forge && s.forge.defects < 2; i++) {
    run(b, forgeStrike);
    if (!s.forge) { count(b, 'arruinadas'); return null; }
  }
  run(b, forgeStop);
  if (s.forge?.stage === 'quench') run(b, forgeQuench, 'agua');
  if (s.forge?.stage === 'finish') run(b, forgeFinish, { polish: s.gold > 30 ? 'pulido_fino' : 'pulido_basico' });
  const before = s.items.length;
  run(b, forgeComplete, []);
  if (s.items.length > before) {
    count(b, 'forjadas');
    const item = s.items[s.items.length - 1];
    if (item.category === 'herramienta') item.exhibited = false;
    return item;
  }
  return null;
}

function attendShop(b: Bot) {
  const { s } = b;
  // Todo lo que no se usa va a la vitrina.
  for (const i of s.items) if (!i.exhibited && !i.equippedBy && i.category !== 'herramienta' && i.quantity > 0 && exhibitedItems(s).length < 8) run(b, toggleExhibit, i.uid);
  if (!run(b, openShop)) return;
  for (let guard = 0; guard < 30 && s.shop; guard++) {
    if (s.shop.status === 'negotiating') {
      run(b, askPrice, Math.round(suggestedPrice(s) * 1.05));
      if (s.shop.status === 'negotiating') run(b, acceptOffer);
      continue;
    }
    if (s.shop.index >= s.shop.customers.length - 1) break;
    run(b, nextCustomer);
  }
  count(b, 'ventas', s.shop?.sold.length ?? 0);
  run(b, closeShop);
}

/** Pelea sola: todas las unidades las mueve la IA. */
function autoCombat(b: Bot) {
  const { s } = b;
  for (let guard = 0; guard < 3000 && s.expedition?.combat && !s.expedition.report; guard++) {
    const cs = s.expedition.combat;
    const u = currentUnit(cs);
    if (u?.side === 'party') cs.autoUnit = u.id;
    if (!run(b, combatAiStep)) break;
  }
  const outcome = s.expedition?.report?.outcome;
  if (outcome) count(b, `combate_${outcome}`);
  if (s.expedition?.report) run(b, closeReport);
}

function stepNextTo(b: Bot, target: { x: number; y: number }) {
  const e = b.s.expedition!;
  const r = c.regions[e.regionId];
  const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))
    .map((p) => ({ p, path: regionPath(r, e.pos, p, (q) => e.groups.some((g) => g.x === q.x && g.y === q.y)) }))
    .filter((o) => o.path)
    .sort((a, b2) => a.path!.length - b2.path!.length);
  if (options[0]) run(b, expMove, options[0].p.x, options[0].p.y);
}

function expedition(b: Bot, regionId: string) {
  const { s } = b;
  if (!run(b, startExpedition, regionId)) return;
  count(b, 'expediciones');
  for (let step = 0; step < 40 && s.expedition && s.expedition.energy > 3; step++) {
    const e = s.expedition;
    if (e.combat) { autoCombat(b); continue; }
    // Primero junta lo que tenga cerca; si no, va a pelear con el grupo más cercano que no sea el jefe.
    const node = e.nodes.find((n) => n.kind !== 'llave' && Math.abs(n.x - e.pos.x) + Math.abs(n.y - e.pos.y) <= 6);
    if (node) {
      if (Math.abs(node.x - e.pos.x) + Math.abs(node.y - e.pos.y) > 1) stepNextTo(b, node);
      if (s.expedition && !s.expedition.combat && !run(b, gather, node.id)) e.nodes = e.nodes.filter((n) => n !== node);
      else count(b, 'recolecciones');
      continue;
    }
    const group = e.groups.filter((g) => !g.boss).sort((a, g2) => Math.abs(a.x - e.pos.x) + Math.abs(a.y - e.pos.y) - Math.abs(g2.x - e.pos.x) - Math.abs(g2.y - e.pos.y))[0];
    if (!group) break;
    const before = e.pos;
    stepNextTo(b, group);
    if (s.expedition && !s.expedition.combat && s.expedition.pos === before) break;
  }
  if (s.expedition?.combat) autoCombat(b);
  if (s.expedition) run(b, returnHome);
}

function equipBest(b: Bot) {
  const { s } = b;
  for (const id of s.party) {
    for (const cat of ['arma', 'armadura', 'escudo'] as const) {
      const best = s.items.filter((i) => i.category === cat && (!i.equippedBy || i.equippedBy === id)).sort((x, y) => y.value - x.value)[0];
      if (best && best.equippedBy !== id) run(b, equipItem, id, best.uid);
    }
  }
}

function progress(b: Bot) {
  const { s } = b;
  for (const t of Object.values(c.talents)) if (!talentBlock(c, s, t.id)) if (run(b, learnTalent, t.id)) count(b, 'talentos');
  if (s.gold > 400) for (const u of Object.values(c.upgrades)) if (!upgradeBlock(c, s, u.id) && s.gold > 400) if (run(b, buyUpgrade, u.id)) count(b, 'mejoras');
}

/** El bot solo acepta pedidos de materiales que ya casi tiene. */
function questDoable(b: Bot, id: string) {
  const o = c.quests[id].objective;
  return o.kind === 'materials' && (b.s.materials[o.material] ?? 0) >= o.qty / 2;
}

function quests(b: Bot) {
  const { s } = b;
  for (const aq of [...s.quests.active]) {
    const p = questProgress(c, s, aq);
    if (p.have >= p.need) {
      run(b, goTo, c.quests[aq.id].board === 'gremio' ? 'gremio' : 'tablon');
      if (run(b, deliverQuest, aq.uid)) count(b, 'encargos_cumplidos');
    }
  }
  const offer = s.quests.offers.find((o) => o.city === 'valdebrasa' && questDoable(b, o.id));
  if (offer && s.quests.active.length < 2) {
    run(b, goTo, offer.board === 'gremio' ? 'gremio' : 'tablon');
    if (run(b, acceptQuest, offer.id)) count(b, 'encargos_aceptados');
  }
  if (s.location !== 'herreria') run(b, goTo, 'herreria');
}

function playDays(days: number, seed: number): Bot {
  const { s, ctx } = setup(seed);
  const b: Bot = { s, ctx, log: [], errors: [], counts: {} };
  for (let d = 0; d < days; d++) {
    const day = s.day;
    if (s.location !== 'herreria') run(b, goTo, 'herreria');
    if (s.party.length < 2 && s.gold > 150) {
      run(b, goTo, 'taberna');
      if (run(b, hireMercenary, 'brunilda')) count(b, 'contrataciones');
      run(b, goTo, 'herreria');
    }
    if (day % 3 === 0) quests(b);
    if (day % 4 === 3 && s.party.length >= 2) {
      equipBest(b);
      expedition(b, skillLevel(s.skills.herreria) >= 6 && s.party.length >= 3 ? 'montanas_grises' : 'linde_brezal');
    } else {
      shopping(b);
      if (s.slot === 0) forgeOne(b, true);
      if (s.day === day && s.slot === 1) attendShop(b);
      if (s.day === day && s.slot === 2) forgeOne(b);
    }
    progress(b);
    if (s.party.length === 2 && s.gold > 300) {
      run(b, goTo, 'taberna');
      if (run(b, hireMercenary, 'ciro')) count(b, 'contrataciones');
      run(b, goTo, 'herreria');
    }
    // Termina el día.
    for (let guard = 0; s.day === day && guard < 4; guard++) {
      if (s.location !== 'herreria') run(b, goTo, 'herreria');
      run(b, s.slot === 2 ? sleepUntilMorning : restSlot);
    }
    if (s.day % 5 === 0) {
      const worth = Math.floor(s.gold + Object.entries(s.materials).reduce((a, [id, q]) => a + (c.materials[id]?.price ?? 0) * q, 0) + s.items.reduce((a, i) => a + i.value * i.quantity * 0.5, 0));
      b.log.push(`día ${String(s.day).padStart(2)}: oro ${String(Math.floor(s.gold)).padStart(5)} · patrimonio ${String(worth).padStart(5)} · rep ${s.reputation.valdebrasa} · herrería nv ${skillLevel(s.skills.herreria)} · grupo ${s.party.length} (herrero nv ${s.characters.herrero.level}) · objetos ${s.items.length}`);
    }
  }
  return b;
}

describe('partida simulada', () => {
  it('60 días jugando con todos los sistemas, sin errores internos', () => {
    const b = playDays(60, 11);
    // FYF_LOG=1 npx vitest run src/core/playthrough.test.ts --reporter=verbose muestra cómo avanzó la partida.
    if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.FYF_LOG) console.log([...b.log, JSON.stringify(b.counts)].join('\n'));
    expect(b.errors).toEqual([]);
    expect(b.counts.forjadas).toBeGreaterThan(20);
    expect(b.counts.ventas).toBeGreaterThan(20);
    expect(b.counts.expediciones).toBeGreaterThan(5);
    expect(b.s.gold).toBeGreaterThan(BALANCE.start.gold);
    expect(b.s.reputation.valdebrasa).toBeGreaterThan(20);
  });
});
