import type { Content } from '../core/content';
import type { Condition, DialogueEffect, Effect, SynergyCondition } from '../core/types';
import { BALANCE } from '../config/balance';

/** Revisa referencias cruzadas del contenido. Devuelve la lista de errores (vacía = OK). */
export function validateContent(c: Content): string[] {
  const errors: string[] = [];
  const mat = (id: string, where: string) => { if (!c.materials[id]) errors.push(`${where}: material inexistente "${id}"`); };
  const trait = (id: string, where: string) => { if (!c.traits[id]) errors.push(`${where}: rasgo inexistente "${id}"`); };
  const effect = (e: Effect, where: string) => { if (e.trait) trait(e.trait, where); };

  for (const bp of Object.values(c.blueprints)) {
    for (const part of bp.parts) {
      part.extra?.forEach((m) => mat(m, `plano ${bp.id}.${part.slot}`));
      if (part.types.length === 0 && !part.extra?.length) errors.push(`plano ${bp.id}.${part.slot}: sin materiales permitidos`);
    }
  }

  const slotsOf = new Set(Object.values(c.blueprints).flatMap((b) => b.parts.map((p) => p.slot)));
  const checkCond = (cond: SynergyCondition, where: string) => {
    switch (cond.kind) {
      case 'materials': cond.all.forEach((m) => mat(m, where)); break;
      case 'anyMaterial': cond.any.forEach((m) => mat(m, where)); break;
      case 'materialInSlot':
        [cond.material].flat().forEach((m) => mat(m, where));
        if (!slotsOf.has(cond.slot)) errors.push(`${where}: parte inexistente "${cond.slot}"`);
        break;
      case 'blueprint': cond.in.forEach((b) => { if (!c.blueprints[b]) errors.push(`${where}: plano inexistente "${b}"`); }); break;
      default: break;
    }
  };
  for (const s of Object.values(c.synergies)) {
    s.when.forEach((w) => checkCond(w, `sinergia ${s.id}`));
    effect(s.effect, `sinergia ${s.id}`);
  }

  for (const q of Object.values(c.quench)) if (q.cost.material) mat(q.cost.material, `temple ${q.id}`);
  for (const f of Object.values(c.finishes)) if (f.cost.material) mat(f.cost.material, `acabado ${f.id}`);
  for (const e of Object.values(c.enchantments)) e.cost.forEach((k) => mat(k.material, `encantamiento ${e.id}`));

  const checkDlgCond = (cond: Condition, where: string) => {
    if ((cond.type === 'relationMin' || cond.type === 'relationMax') && !c.npcs[cond.npc]) errors.push(`${where}: NPC inexistente "${cond.npc}"`);
    if (cond.type === 'hasMaterial') mat(cond.id, where);
    if (cond.type === 'discovered' && !c.synergies[cond.synergy]) errors.push(`${where}: sinergia inexistente "${cond.synergy}"`);
  };
  const checkDlgEffect = (e: DialogueEffect, where: string) => {
    if (e.type === 'relation' && !c.npcs[e.npc]) errors.push(`${where}: NPC inexistente "${e.npc}"`);
    if (e.type === 'giveMaterial' || e.type === 'takeMaterial') mat(e.id, where);
    if (e.type === 'discoverSynergy' && !c.synergies[e.id]) errors.push(`${where}: sinergia inexistente "${e.id}"`);
  };
  for (const d of Object.values(c.dialogues)) {
    const where = `diálogo ${d.id}`;
    if (!c.npcs[d.npc]) errors.push(`${where}: NPC inexistente "${d.npc}"`);
    if (!d.nodes[d.start]) errors.push(`${where}: nodo inicial inexistente "${d.start}"`);
    d.conditions?.forEach((k) => checkDlgCond(k, where));
    for (const node of Object.values(d.nodes)) {
      if (node.next && !d.nodes[node.next]) errors.push(`${where}.${node.id}: siguiente inexistente "${node.next}"`);
      node.effects?.forEach((e) => checkDlgEffect(e, where));
      for (const opt of node.options ?? []) {
        if (opt.next && !d.nodes[opt.next]) errors.push(`${where}.${node.id}: opción apunta a "${opt.next}" inexistente`);
        opt.conditions?.forEach((k) => checkDlgCond(k, where));
        opt.effects?.forEach((e) => checkDlgEffect(e, where));
      }
    }
  }

  for (const city of Object.values(c.cities)) {
    for (const loc of city.locations) {
      for (const npcId of Object.keys(loc.scene?.npcSpots ?? {})) {
        if (!c.npcs[npcId]) errors.push(`ciudad ${city.id}.${loc.id}: NPC inexistente "${npcId}"`);
      }
    }
  }
  for (const npc of Object.values(c.npcs)) {
    for (const [slot, locId] of Object.entries(npc.routine)) {
      const city = c.cities[npc.city];
      const loc = city?.locations.find((l) => l.id === locId);
      if (!loc) errors.push(`NPC ${npc.id}: rutina ${slot} en lugar inexistente "${locId}"`);
      else if (!loc.scene?.npcSpots[npc.id]) errors.push(`NPC ${npc.id}: falta npcSpot en "${locId}"`);
    }
  }

  // ── Fase 2 ──
  const skill = (id: string, where: string) => { if (!c.skills[id]) errors.push(`${where}: acción inexistente "${id}"`); };
  for (const [kind, ids] of Object.entries(c.weaponSkills)) ids.forEach((id) => skill(id, `armas.${kind}`));
  for (const m of Object.values(c.monsters)) {
    m.skills.forEach((id) => skill(id, `monstruo ${m.id}`));
    m.loot.forEach((l) => mat(l.material, `monstruo ${m.id}`));
    m.halfHp?.summon.forEach((id) => { if (!c.monsters[id]) errors.push(`monstruo ${m.id}: invoca "${id}" inexistente`); });
  }
  for (const a of Object.values(c.arenas)) {
    const cols = a.terrain[0]?.length ?? 0;
    if (a.terrain.some((r) => r.length !== cols) || a.heights.length !== a.terrain.length || a.heights.some((r) => r.length !== cols)) {
      errors.push(`arena ${a.id}: filas de distinto largo`);
    }
    for (const p of [...a.partySpawns, ...a.enemySpawns]) {
      if (a.terrain[p.y]?.[p.x] === undefined || a.terrain[p.y][p.x] === '#') errors.push(`arena ${a.id}: aparición en (${p.x},${p.y}) bloqueada`);
    }
    if (a.enemySpawns.length < 7) errors.push(`arena ${a.id}: necesita 7 lugares de enemigos`);
  }
  for (const r of Object.values(c.regions).filter((x) => x.available)) {
    const cols = r.terrain[0]?.length ?? 0;
    for (const [name, grid] of [['terrain', r.terrain], ['heights', r.heights], ['zones', r.zones]] as const) {
      if (grid.length !== r.terrain.length || grid.some((row) => row.length !== cols)) errors.push(`región ${r.id}: ${name} con medidas distintas`);
    }
    if (!r.terrain.some((row) => row.includes('E'))) errors.push(`región ${r.id}: sin entrada (E)`);
    for (const z of r.zoneDefs) {
      [...z.vetas, ...z.arboles].forEach((o) => mat(o.material, `región ${r.id}.${z.id}`));
      for (const fam of Object.keys(z.families)) if (!Object.values(c.monsters).some((m) => m.family === fam)) errors.push(`región ${r.id}.${z.id}: familia "${fam}" sin monstruos`);
    }
    r.boss?.monsters.forEach((id) => { if (!c.monsters[id]) errors.push(`región ${r.id}: jefe "${id}" inexistente`); });
  }
  for (const m of Object.values(c.mercenaries)) if (!c.npcs[m.id]) errors.push(`mercenario ${m.id}: falta su NPC`);
  for (const ev of Object.values(c.marketEvents)) ev.materials?.forEach((id) => mat(id, `noticia ${ev.id}`));

  Object.keys(BALANCE.start.materials).forEach((m) => mat(m, 'balance.start.materials'));
  BALANCE.start.blueprints.forEach((b) => { if (!c.blueprints[b]) errors.push(`balance.start.blueprints: "${b}"`); });
  BALANCE.start.enchantments.forEach((e) => { if (!c.enchantments[e]) errors.push(`balance.start.enchantments: "${e}"`); });

  return errors;
}
