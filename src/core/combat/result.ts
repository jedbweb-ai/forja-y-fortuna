import { BALANCE } from '../../config/balance';
import { bonus } from '../progress/progress';
import type { Content } from '../content';
import { gainXp } from '../party/progression';
import { characterProfile } from '../party/stats';
import type { Rng } from '../rng';
import { addXp } from '../state';
import type { GameState, ItemInstance } from '../types';
import type { CombatReport } from './types';

const CB = BALANCE.combat;

export function bagLoad(bag: Record<string, number>): number {
  return Object.values(bag).reduce((a, q) => a + q, 0);
}

/** Mejor herramienta del inventario para una tarea (mineria, tala, desuello). */
export function bestTool(s: GameState, tag: string): ItemInstance | undefined {
  return s.items
    .filter((i) => i.category === 'herramienta' && i.tags.includes(tag) && i.durability > 0)
    .sort((a, b) => b.stats.atk - a.stats.atk)[0];
}

export function toolTier(power: number): number {
  return BALANCE.tools.tierPower.filter((p) => power >= p).length;
}

/** Suma a la bolsa respetando la capacidad. Devuelve cuánto entró. */
export function addToBag(s: GameState, material: string, qty: number): number {
  const e = s.expedition!;
  const room = Math.max(0, e.capacity - bagLoad(e.bag));
  const n = Math.min(room, qty);
  if (n > 0) e.bag[material] = (e.bag[material] ?? 0) + n;
  return n;
}

export function loseFromBag(s: GameState, fraction: number): Record<string, number> {
  const e = s.expedition!;
  const lost: Record<string, number> = {};
  for (const [id, q] of Object.entries(e.bag)) {
    const n = Math.floor(q * fraction);
    if (n > 0) {
      lost[id] = n;
      e.bag[id] = q - n;
      if (e.bag[id] <= 0) delete e.bag[id];
    }
  }
  return lost;
}

/**
 * Cierra el combate: botín (según cómo murió cada monstruo), experiencia, desgaste del equipo,
 * vida y heridas de los personajes. Deja el reporte para mostrar.
 */
export function resolveCombat(c: Content, s: GameState, rng: Rng): CombatReport {
  const e = s.expedition!;
  const cs = e.combat!;
  const outcome = cs.outcome!;
  const report: CombatReport = { outcome: outcome === 'victory' || outcome === 'defeat' || outcome === 'fled' ? outcome : 'fled', loot: {}, lost: {}, notes: [], xp: 0, levelUps: [], injured: [] };
  const partyUnits = cs.units.filter((u) => u.side === 'party');

  if (outcome === 'victory') {
    const skinner = bestTool(s, 'desuello');
    // Joyas "De la fortuna": más chance de botín.
    const lootMult = 1 + partyUnits.reduce((a, u) => a + (u.alive ? u.combat.lootPct ?? 0 : 0), 0) / 100;
    const skinTier = skinner ? toolTier(skinner.stats.atk) : 0;
    let threat = 0;
    for (const u of cs.units.filter((x) => x.side === 'enemy' && !x.alive && x.monsterId)) {
      const m = c.monsters[u.monsterId!];
      threat += m.threat;
      for (const drop of m.loot) {
        if (!rng.chance(Math.min(1, drop.chance * lootMult))) continue;
        const mat = c.materials[drop.material];
        const cause = [u.killedBy?.element, u.killedBy?.damageType].filter(Boolean) as string[];
        if (drop.spoiledBy?.some((x) => cause.includes(x))) {
          report.notes.push(`${mat.name} de ${u.name}: se arruinó por cómo murió (${cause.join(', ')}).`);
          continue;
        }
        if (drop.skin && (!skinner || skinTier < mat.tier)) {
          report.notes.push(skinner ? `${mat.name}: tu cuchillo de desuello no alcanza.` : `${mat.name}: sin cuchillo de desuello no se puede sacar.`);
          continue;
        }
        let qty = rng.int(drop.qty[0], drop.qty[1]);
        if (drop.skin && rng.chance(bonus(c, s, 'desuelloExtra'))) qty += 1;
        const got = addToBag(s, drop.material, qty);
        if (got) report.loot[drop.material] = (report.loot[drop.material] ?? 0) + got;
        if (got < qty) report.notes.push(`No entra más en la bolsa: dejaste ${qty - got}× ${mat.name}.`);
        if (drop.skin && skinner) {
          skinner.durability = Math.max(0, skinner.durability - BALANCE.tools.wearPerUse);
          addXp(s, 'desuello', 4);
        }
      }
    }
    report.xp = Math.round(threat * CB.xpPerThreat);
    addXp(s, 'combate', report.xp / 2);
    e.groups = e.groups.filter((g) => g.id !== cs.groupId);
    // Flechas "Recuperables" y arrojadizos "De vuelta": se junta parte de lo lanzado.
    for (const [uid, used] of Object.entries(cs.ammoUsed)) {
      const lot = s.items.find((i) => i.uid === uid);
      if (!lot) continue;
      const pct = lot.traits.reduce((a, t) => a + Number(c.traits[t]?.combat?.recoverPct ?? 0), 0);
      const recover = Math.floor(used * pct / 100);
      if (recover) {
        lot.quantity += recover;
        report.notes.push(`Recuperaste ${recover} de ${lot.name}.`);
      }
    }
  }

  // Lotes que quedaron vacíos: se descartan y se sacan del cinturón.
  const empty = s.items.filter((i) => (i.category === 'municion' || i.category === 'arrojadizo') && i.quantity <= 0).map((i) => i.uid);
  if (empty.length) {
    s.items = s.items.filter((i) => !empty.includes(i.uid));
    for (const ch of Object.values(s.characters)) if (ch.equipment.cinturon && empty.includes(ch.equipment.cinturon)) delete ch.equipment.cinturon;
  }

  // Vida, experiencia y heridas.
  for (const u of partyUnits) {
    const ch = s.characters[u.charId!];
    if (!ch) continue;
    const profile = characterProfile(c, s, ch);
    const bonus = profile.combat.hpBonus ?? 0;
    if (!u.alive) {
      if (ch.id === 'herrero') ch.hp = 1;
      else {
        ch.hp = 1;
        if (outcome !== 'defeat') {
          ch.injuredUntilDay = s.day + BALANCE.injury.days;
          report.injured.push(ch.name);
        }
      }
    } else {
      ch.hp = Math.max(1, Math.min(profile.maxHp, u.hp - bonus));
    }
    if (outcome === 'victory' && u.alive) {
      const ups = gainXp(c, ch, report.xp);
      if (ups) report.levelUps.push(`${ch.name} sube a nivel ${ch.level}`);
    }
    // Desgaste del equipo usado.
    for (const slot of ['arma', 'escudo', 'cuerpo'] as const) {
      const item = ch.equipment[slot] ? s.items.find((i) => i.uid === ch.equipment[slot]) : undefined;
      if (item && !item.traits.includes('irrompible')) item.durability = Math.max(0, item.durability - CB.wearPerCombat);
    }
  }

  if (outcome === 'fled') report.lost = loseFromBag(s, BALANCE.expedition.fleeLoss);
  return report;
}
