import type { Content } from '../core/content';
import type { Condition, DialogueEffect, Effect, SynergyCondition } from '../core/types';
import { BALANCE } from '../config/balance';
import type { CraftSpec, QuestReward } from '../core/town/types';

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
      if (!loc) errors.push(`NPC ${npc.id}: rutina ${slot} en lugar inexistente "${locId}" de ${npc.city}`);
      else if (!loc.scene?.npcSpots[npc.id]) errors.push(`NPC ${npc.id}: falta npcSpot en "${locId}"`);
    }
  }

  // ── Fase 2 ──
  const skill = (id: string, where: string) => { if (!c.skills[id]) errors.push(`${where}: acción inexistente "${id}"`); };
  for (const [kind, ids] of Object.entries(c.weaponSkills)) ids.forEach((id) => skill(id, `armas.${kind}`));
  for (const m of Object.values(c.monsters)) {
    m.skills.forEach((id) => skill(id, `monstruo ${m.id}`));
    m.loot.forEach((l) => mat(l.material, `monstruo ${m.id}`));
    m.halfHp?.summon?.forEach((id) => { if (!c.monsters[id]) errors.push(`monstruo ${m.id}: invoca "${id}" inexistente`); });
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
    if (a.partySpawns.length < BALANCE.MAX_PARTY_SIZE + 1) errors.push(`arena ${a.id}: necesita ${BALANCE.MAX_PARTY_SIZE + 1} lugares para el grupo`);
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

  // ── Fase 3 ──
  for (const e of Object.values(c.enchantments)) {
    if (e.ability) skill(e.ability.skill, `encantamiento ${e.id}`);
    if (e.kind === 'activa' && !e.ability) errors.push(`encantamiento ${e.id}: activo sin habilidad`);
  }
  for (const bp of Object.values(c.blueprints)) if (bp.throwSkill) skill(bp.throwSkill, `plano ${bp.id}`);
  for (const g of Object.values(c.grimoires)) {
    g.teaches.forEach((e) => { if (c.enchantments[e]?.source !== 'grimorio') errors.push(`grimorio ${g.id}: "${e}" no es un encantamiento de grimorio`); });
    g.reveals?.forEach((x) => { if (!c.synergies[x]) errors.push(`grimorio ${g.id}: sinergia inexistente "${x}"`); });
  }
  for (const e of Object.values(c.enchantments).filter((x) => x.source === 'grimorio')) {
    if (!Object.values(c.grimoires).some((g) => g.teaches.includes(e.id))) errors.push(`encantamiento ${e.id}: ningún grimorio lo enseña`);
  }
  for (const p of Object.values(c.potions)) if (p.output.kind === 'material') mat(p.output.material, `receta ${p.id}`);
  for (const q of Object.values(c.quench)) effect(q.effect, `temple ${q.id}`);
  for (const r of Object.values(c.regions).filter((x) => x.available)) {
    for (const z of r.zoneDefs) {
      [...(z.hierbas ?? []), ...(z.gemas ?? [])].forEach((o) => mat(o.material, `región ${r.id}.${z.id}`));
      z.cofres?.materials.forEach((m) => mat(m.material, `cofre ${r.id}.${z.id}`));
      z.cofres?.grimoires.forEach((g) => { if (!c.grimoires[g.id]) errors.push(`cofre ${r.id}.${z.id}: grimorio inexistente "${g.id}"`); });
    }
  }
  for (const loc of Object.values(c.cities).flatMap((x) => x.locations)) {
    loc.stock?.forEach((m) => mat(m, `tienda ${loc.id}`));
    loc.grimoires?.forEach((g) => { if (!c.grimoires[g]) errors.push(`librería ${loc.id}: grimorio inexistente "${g}"`); });
    loc.blueprintsForSale?.forEach((b) => { if (!c.blueprints[b.id]) errors.push(`librería ${loc.id}: plano inexistente "${b.id}"`); });
  }
  for (const d of Object.values(c.dialogues)) {
    for (const node of Object.values(d.nodes)) {
      for (const e of [...(node.effects ?? []), ...(node.options ?? []).flatMap((o) => o.effects ?? [])]) {
        if (e.type === 'giveGrimoire' && !c.grimoires[e.id]) errors.push(`diálogo ${d.id}: grimorio inexistente "${e.id}"`);
        if (e.type === 'discoverPotion' && !c.potions[e.id]) errors.push(`diálogo ${d.id}: receta inexistente "${e.id}"`);
      }
    }
  }

  // ── Fase 4 ──
  const npc = (id: string | undefined, where: string) => { if (id && !c.npcs[id]) errors.push(`${where}: NPC inexistente "${id}"`); };
  const bpOrRecipe = (id: string, where: string) => { if (!c.blueprints[id] && !c.potions[id]) errors.push(`${where}: plano o receta inexistente "${id}"`); };
  const spec = (sp: CraftSpec, where: string) => {
    sp.blueprints?.forEach((b) => bpOrRecipe(b, where));
    if (sp.trait) trait(sp.trait, where);
    if (sp.qty <= 0) errors.push(`${where}: cantidad inválida`);
  };
  const reward = (r: QuestReward, where: string) => {
    r.materials?.forEach((m) => mat(m.id, where));
    if (r.blueprint && !c.blueprints[r.blueprint]) errors.push(`${where}: plano inexistente "${r.blueprint}"`);
    if (r.enchantment && !c.enchantments[r.enchantment]) errors.push(`${where}: encantamiento inexistente "${r.enchantment}"`);
    if (r.potion && !c.potions[r.potion]) errors.push(`${where}: receta inexistente "${r.potion}"`);
    if (r.grimoire && !c.grimoires[r.grimoire]) errors.push(`${where}: grimorio inexistente "${r.grimoire}"`);
    if (r.synergy && !c.synergies[r.synergy]) errors.push(`${where}: sinergia inexistente "${r.synergy}"`);
  };
  const families = new Set(Object.values(c.monsters).map((m) => m.family));
  for (const q of Object.values(c.quests)) {
    const where = `encargo ${q.id}`;
    npc(q.giver, where);
    reward(q.reward, where);
    q.conditions?.forEach((k) => checkDlgCond(k, where));
    const o = q.objective;
    if (o.kind === 'craft') spec(o, where);
    if (o.kind === 'materials') mat(o.material, where);
    if (o.kind === 'hunt') {
      if (o.monster && !c.monsters[o.monster]) errors.push(`${where}: monstruo inexistente "${o.monster}"`);
      if (o.family && !families.has(o.family)) errors.push(`${where}: familia inexistente "${o.family}"`);
    }
    if ((o.kind === 'hunt' && o.region) || o.kind === 'boss') {
      const r = c.regions[o.region!];
      if (!r) errors.push(`${where}: región inexistente "${o.region}"`);
      else if (o.kind === 'boss' && !r.boss) errors.push(`${where}: la región "${o.region}" no tiene jefe`);
    }
    if (q.board === 'npc' && !Object.values(c.dialogues).some((d) => Object.values(d.nodes).some((n) =>
      [...(n.effects ?? []), ...(n.options ?? []).flatMap((op) => op.effects ?? [])].some((e) => e.type === 'offerQuest' && e.id === q.id)))) {
      errors.push(`${where}: encargo de NPC que ningún diálogo ofrece`);
    }
  }
  for (const d of Object.values(c.dialogues)) {
    for (const node of Object.values(d.nodes)) {
      for (const e of [...(node.effects ?? []), ...(node.options ?? []).flatMap((o) => o.effects ?? [])]) {
        if (e.type === 'offerQuest' && !c.quests[e.id]) errors.push(`diálogo ${d.id}: encargo inexistente "${e.id}"`);
        if (e.type === 'giveBlueprint' && !c.blueprints[e.id]) errors.push(`diálogo ${d.id}: plano inexistente "${e.id}"`);
        if (e.type === 'giveEnchantment' && !c.enchantments[e.id]) errors.push(`diálogo ${d.id}: encantamiento inexistente "${e.id}"`);
      }
      for (const k of [...(d.conditions ?? []), ...(node.options ?? []).flatMap((o) => o.conditions ?? [])]) {
        if ((k.type === 'questDone' || k.type === 'questActive') && !c.quests[k.id]) errors.push(`diálogo ${d.id}: encargo inexistente "${k.id}"`);
        if ((k.type === 'inParty' || k.type === 'servant') && !c.npcs[k.npc]) errors.push(`diálogo ${d.id}: NPC inexistente "${k.npc}"`);
      }
    }
  }
  for (const q of Object.values(c.quests)) {
    const o = q.objective;
    if (o.kind === 'dungeon') {
      const d = c.dungeons[o.dungeon];
      if (!d) errors.push(`encargo ${q.id}: mazmorra inexistente "${o.dungeon}"`);
      else if (o.floor && o.floor > d.floors) errors.push(`encargo ${q.id}: la mazmorra tiene ${d.floors} pisos`);
    }
  }
  for (const k of Object.values(c.contracts)) {
    npc(k.merchant, `contrato ${k.id}`);
    spec(k.item, `contrato ${k.id}`);
  }
  for (const ev of Object.values(c.cityEvents)) {
    ev.prices?.materials?.forEach((m) => mat(m, `evento ${ev.id}`));
    Object.keys(ev.customers ?? {}).forEach((t) => { if (!c.customers[t]) errors.push(`evento ${ev.id}: cliente inexistente "${t}"`); });
    for (const o of ev.choice?.options ?? []) {
      o.effects.forEach((e) => checkDlgEffect(e, `evento ${ev.id}`));
      o.conditions?.forEach((k) => checkDlgCond(k, `evento ${ev.id}`));
    }
  }
  for (const l of Object.values(c.auctionLots)) {
    const src = l.source;
    const where = `lote ${l.id}`;
    if (src.kind === 'material') mat(src.id, where);
    if (src.kind === 'grimoire' && !c.grimoires[src.id]) errors.push(`${where}: grimorio inexistente "${src.id}"`);
    if (src.kind === 'blueprint' && !c.blueprints[src.id]) errors.push(`${where}: plano inexistente "${src.id}"`);
    if (src.kind === 'item') {
      const bp = c.blueprints[src.blueprint];
      if (!bp) errors.push(`${where}: plano inexistente "${src.blueprint}"`);
      else for (const part of bp.parts) if (!src.materials[part.slot]) errors.push(`${where}: falta la parte "${part.slot}"`);
      Object.values(src.materials).forEach((m) => mat(m, where));
      src.traits?.forEach((t) => trait(t, where));
      src.enchantments?.forEach((e) => { if (!c.enchantments[e]) errors.push(`${where}: encantamiento inexistente "${e}"`); });
      src.finish?.forEach((f) => { if (!c.finishes[f]) errors.push(`${where}: acabado inexistente "${f}"`); });
    }
  }
  for (const b of Object.values(c.bidders)) npc(b.npc, `postor ${b.id}`);
  for (const n of Object.values(c.npcs)) {
    for (const u of n.unlocks ?? []) {
      for (const p of u.perks ?? []) {
        const where = `NPC ${n.id} (${u.level})`;
        if (p.kind === 'stock') p.materials.forEach((m) => mat(m, where));
        if (p.kind === 'teach') reward({ blueprint: p.blueprint, enchantment: p.enchantment, potion: p.potion, synergy: p.synergy, grimoire: p.grimoire }, where);
      }
    }
  }
  for (const loc of Object.values(c.cities).flatMap((x) => x.locations)) npc(loc.owner, `lugar ${loc.id}`);
  for (const m of Object.values(c.mercenaries).filter((x) => x.kind === 'esclavo')) {
    const spot = c.cities[c.npcs[m.id]?.city]?.locations.find((l) => l.kind === 'esclavos')?.scene?.npcSpots[m.id];
    if (!spot) errors.push(`compañero ${m.id}: falta su lugar en el mercado de esclavos`);
  }

  // ── Fase 5 ──
  for (const p of Object.values(c.roomPieces)) {
    if (p.rows.length !== 7 || p.rows.some((r) => r.length !== 7)) errors.push(`sala ${p.id}: tiene que ser de 7×7`);
    if (p.rows[0] !== '#######' || p.rows[6] !== '#######' || p.rows.some((r) => r[0] !== '#' || r[6] !== '#')) errors.push(`sala ${p.id}: el borde tiene que ser pared`);
    if (p.kind === 'jefe' && !p.rows.some((r) => r.includes('B'))) errors.push(`sala ${p.id}: sala de jefe sin guarida (B)`);
    p.dungeons?.forEach((d) => { if (!c.dungeons[d]) errors.push(`sala ${p.id}: mazmorra inexistente "${d}"`); });
  }
  for (const r of Object.values(c.riddles)) {
    if (r.answer < 0 || r.answer >= r.options.length) errors.push(`acertijo ${r.id}: respuesta fuera de rango`);
    r.reward.materials?.forEach((m) => mat(m.id, `acertijo ${r.id}`));
    if (r.reward.synergy && !c.synergies[r.reward.synergy]) errors.push(`acertijo ${r.id}: sinergia inexistente "${r.reward.synergy}"`);
  }
  for (const d of Object.values(c.dungeons)) {
    const where = `mazmorra ${d.id}`;
    const pieces = Object.values(c.roomPieces).filter((p) => !p.dungeons || p.dungeons.includes(d.id));
    for (const kind of ['sala', 'jefe', 'tesoro'] as const) if (!pieces.some((p) => p.kind === kind)) errors.push(`${where}: no tiene salas de tipo ${kind}`);
    if (d.grid[0] * d.grid[1] < 3) errors.push(`${where}: la grilla necesita al menos 3 salas`);
    if (!c.arenas[d.bossArena]) errors.push(`${where}: arena de jefe inexistente "${d.bossArena}"`);
    if (!Object.values(c.arenas).some((a) => a.biome === d.biome)) errors.push(`${where}: no hay arenas del bioma "${d.biome}"`);
    d.boss.monsters.forEach((m) => { if (!c.monsters[m]) errors.push(`${where}: jefe "${m}" inexistente`); });
    if (!d.boss.monsters.some((m) => c.monsters[m]?.boss)) errors.push(`${where}: el grupo del jefe no tiene un jefe`);
    d.riddles.forEach((r) => { if (!c.riddles[r]) errors.push(`${where}: acertijo inexistente "${r}"`); });
    for (const z of d.depth) {
      [...z.vetas, ...z.arboles, ...(z.hierbas ?? []), ...(z.gemas ?? [])].forEach((o) => mat(o.material, `${where}.${z.id}`));
      for (const fam of Object.keys(z.families)) if (!Object.values(c.monsters).some((m) => m.family === fam && !m.boss)) errors.push(`${where}.${z.id}: familia "${fam}" sin monstruos`);
    }
    for (const l of [...d.loot, d.secretLoot]) {
      l.materials.forEach((m) => mat(m.material, where));
      l.grimoires.forEach((g) => { if (!c.grimoires[g.id]) errors.push(`${where}: grimorio inexistente "${g.id}"`); });
    }
    for (const u of d.uniques) {
      const ok = { blueprint: c.blueprints, grimoire: c.grimoires, synergy: c.synergies, material: c.materials }[u.kind][u.ref];
      if (!ok) errors.push(`${where}: tesoro único "${u.id}" apunta a "${u.ref}" inexistente`);
    }
    if (d.entrance) {
      const r = c.regions[d.entrance];
      if (!r) errors.push(`${where}: región de entrada inexistente "${d.entrance}"`);
      else if (!r.terrain.some((row) => row.includes('P'))) errors.push(`${where}: la región "${d.entrance}" no tiene entrada (P)`);
      if (!d.unlock.flag) errors.push(`${where}: una entrada escondida necesita una marca en unlock.flag`);
    }
  }
  for (const m of Object.values(c.monsters)) m.shieldedBy?.forEach((id) => { if (!c.monsters[id]) errors.push(`monstruo ${m.id}: protegido por "${id}" inexistente`); });
  for (const sk of Object.values(c.skills)) if (sk.telegraph && sk.target !== 'tile') errors.push(`acción ${sk.id}: un golpe anunciado tiene que apuntar a una casilla`);

  // ── Fase 6 ──
  const locIds = new Map<string, string>();
  for (const city of Object.values(c.cities)) {
    for (const l of city.locations) {
      if (locIds.has(l.id)) errors.push(`lugar ${l.id}: id repetido en ${locIds.get(l.id)} y ${city.id}`);
      locIds.set(l.id, city.id);
    }
    if (!city.locations.some((l) => l.id === city.arrival)) errors.push(`ciudad ${city.id}: lugar de llegada inexistente "${city.arrival}"`);
    for (const r of city.routes) {
      if (!c.cities[r.to]) errors.push(`ciudad ${city.id}: camino a ciudad inexistente "${r.to}"`);
      else if (!c.cities[r.to].routes.some((x) => x.to === city.id)) errors.push(`ciudad ${city.id}: el camino a ${r.to} no tiene vuelta`);
      for (const fam of Object.keys(r.families)) if (!Object.values(c.monsters).some((m) => m.family === fam && !m.boss)) errors.push(`camino ${city.id}→${r.to}: familia "${fam}" sin monstruos`);
    }
    Object.keys(city.customers ?? {}).forEach((t) => { if (!c.customers[t]) errors.push(`ciudad ${city.id}: cliente inexistente "${t}"`); });
  }
  for (const t of Object.values(c.customers)) t.cities?.forEach((x) => { if (!c.cities[x]) errors.push(`cliente ${t.id}: ciudad inexistente "${x}"`); });
  for (const q of Object.values(c.quests)) if (q.city && !c.cities[q.city]) errors.push(`encargo ${q.id}: ciudad inexistente "${q.city}"`);
  for (const k of Object.values(c.contracts)) {
    const city = c.cities[k.city ?? 'valdebrasa'];
    if (!city) errors.push(`contrato ${k.id}: ciudad inexistente "${k.city}"`);
    else if (!city.locations.some((l) => l.kind === 'gremio')) errors.push(`contrato ${k.id}: ${city.id} no tiene dónde firmarlo`);
  }
  for (const ev of Object.values(c.cityEvents)) if (ev.city && !c.cities[ev.city]) errors.push(`evento ${ev.id}: ciudad inexistente "${ev.city}"`);
  for (const t of Object.values(c.talents)) {
    if (t.requires && !c.talents[t.requires]) errors.push(`talento ${t.id}: requiere "${t.requires}" inexistente`);
    if (t.requires && c.talents[t.requires]?.skill !== t.skill) errors.push(`talento ${t.id}: requiere un talento de otra habilidad`);
  }
  for (const u of Object.values(c.upgrades)) {
    u.levels.forEach((l, i) => l.cost.materials.forEach((m) => mat(m.id, `mejora ${u.id} nivel ${i + 1}`)));
  }

  Object.keys(BALANCE.start.materials).forEach((m) => mat(m, 'balance.start.materials'));
  BALANCE.start.blueprints.forEach((b) => { if (!c.blueprints[b]) errors.push(`balance.start.blueprints: "${b}"`); });
  BALANCE.start.enchantments.forEach((e) => { if (!c.enchantments[e]) errors.push(`balance.start.enchantments: "${e}"`); });

  return errors;
}
