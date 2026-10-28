import { bagLoad } from '../../core/combat/result';
import {
  answerRiddle, bossReady, closeRiddle, dungeonDescend, dungeonExamine, dungeonInteract, dungeonUnlocked,
  exhausted, interactables, startDungeon,
} from '../../core/dungeon/dungeon';
import { isInjured, maxHp, partyMembers } from '../../core/party/progression';
import { expeditionCapacity, expeditionEnergy, readyMembers, returnHome } from '../../core/world/expedition';
import { BALANCE } from '../../config/balance';
import { Panel } from './Panel';
import { store, useGame, useSnapshot } from '../hooks';

const ACTION: Record<string, string> = { L: '🔧 Bajar palanca', G: '⛓️ Reja', D: '🗝️ Abrir puerta', I: '📜 Leer inscripción' };

/** Barra inferior dentro de una mazmorra. */
export function DungeonHud() {
  const s = useGame();
  const c = store.content;
  const e = s.expedition!;
  const run = e.dungeon!;
  const def = c.dungeons[run.id];
  const load = bagLoad(e.bag);
  const tired = exhausted(s);
  return (
    <div className="locbar region-bar">
      <div className="region-stats">
        <span className="locbar-title">{def.name} · piso {run.floor}/{def.floors}</span>
        <span className={`chip ${tired ? 'warn' : ''}`} title="Energía">⚡ {Math.floor(e.energy)}/{e.maxEnergy}{tired ? ' · agotado' : ''}</span>
        <span className={`chip ${load >= e.capacity ? 'warn' : ''}`} title="Carga">🎒 {load}/{e.capacity}</span>
        {run.keys > 0 && <span className="chip" title="Llaves">🗝️ {run.keys}</span>}
        {e.members.map((id) => {
          const ch = s.characters[id];
          return ch ? <span key={id} className="chip hide-sm" title={ch.name}>❤️ {ch.name.split(' ')[0]} {ch.hp}/{maxHp(ch)}</span> : null;
        })}
      </div>
      <div className="locbar-actions">
        {interactables(e).map((it) => (
          <button key={`${it.x},${it.y}`} className="btn" onClick={() => store.run(dungeonInteract, it.x, it.y)}>{ACTION[it.kind]}</button>
        ))}
        <button className="btn" onClick={() => store.run(dungeonExamine)}>🔍 Examinar</button>
        <button className="btn" onClick={() => store.openPanel('bag')}>🎒 Bolsa</button>
        <button className="btn" onClick={() => store.openPanel('party')}>🛡️ Grupo</button>
      </div>
      <div className="region-hint">
        {tired
          ? 'Agotado: rinden menos en combate. Llegá a la escalera para descansar.'
          : 'Buscá la escalera · Examinar descubre paredes falsas y trampas cercanas · Solo se vuelve desde los descansos'}
      </div>
    </div>
  );
}

/** Descanso en la escalera: seguir bajando o volver a la ciudad con lo juntado. */
export function LandingBox() {
  const s = useGame();
  const c = store.content;
  const e = s.expedition!;
  const run = e.dungeon!;
  const def = c.dungeons[run.id];
  const last = run.floor >= def.floors;
  const load = bagLoad(e.bag);
  return (
    <div className="dialogue-wrap">
      <section className="dialogue landing">
        <div className="dialogue-main">
          <header><b>{last ? 'La salida' : `Escalera al piso ${run.floor + 1}`}</b><small className="muted">{def.name}</small></header>
          <p>
            {last
              ? `Llegaste a la salida. Llevás ${load} materiales.`
              : `Llevás ${load} materiales. Abajo hay más amenaza y mejor botín${run.floor + 1 === def.floors ? `, y ${bossReady(s, def) ? `te espera ${def.boss.name}` : 'el jefe todavía no volvió'}` : ''}.`}
            {!last && ` Al bajar recuperan ${Math.round(BALANCE.dungeon.restEnergy * 100)}% de energía y ${Math.round(BALANCE.dungeon.restHp * 100)}% de vida.`}
            {' '}Si el grupo cae, se pierde la mitad de lo juntado.
          </p>
          <div className="dialogue-options">
            {!last && <button className="btn primary" onClick={() => store.run(dungeonDescend)}>⬇️ Bajar al piso {run.floor + 1}</button>}
            <button className={`btn ${last ? 'primary' : ''}`} onClick={() => store.run(returnHome)}>🏠 Volver a la ciudad</button>
            <small className="muted">o tocá el mapa para seguir recorriendo este piso</small>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Inscripción con acertijo: tres respuestas. */
export function RiddleBox() {
  const s = useGame();
  const c = store.content;
  const id = s.expedition?.dungeon?.riddle;
  if (!id) return null;
  const r = c.riddles[id];
  return (
    <div className="dialogue-wrap">
      <section className="dialogue">
        <div className="dialogue-main">
          <header><b>📜 Inscripción</b><small className="muted">Si te equivocás, algo va a despertar.</small></header>
          <p>{r.text}</p>
          <div className="dialogue-options">
            {r.options.map((o, i) => <button key={o} className="btn" onClick={() => store.run(answerRiddle, i)}>{o}</button>)}
            <button className="btn" onClick={() => store.run(closeRiddle)}>Dejarlo para después</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Entrada a una mazmorra desde el mapa del mundo. */
export function DungeonPanel() {
  const s = useGame();
  const { ui } = useSnapshot();
  const c = store.content;
  const def = ui.dungeonId ? c.dungeons[ui.dungeonId] : undefined;
  if (!def) return null;
  const open = dungeonUnlocked(s, def);
  const prog = s.dungeons.progress[def.id] ?? { bossDay: 0, clears: 0, deepest: 0 };
  const members = readyMembers(s);
  const injured = partyMembers(s).filter((ch) => isInjured(s, ch));
  const families = [...new Set(def.depth.flatMap((z) => Object.keys(z.families)))];
  const FAMILY: Record<string, string> = { no_muertos: 'No-muertos', constructos: 'Constructos de piedra', gelines: 'Gelines', goblins: 'Goblins', bestias: 'Bestias' };
  const found = def.uniques.filter((u) => s.dungeons.uniques.includes(u.id)).length;
  const back = prog.bossDay ? prog.bossDay + def.boss.respawnDays : 0;
  return (
    <Panel
      title={def.name}
      subtitle={`${'★'.repeat(def.danger)} · ${def.floors} pisos · Viaje: ${def.travelSlots} franja(s) de ida y de vuelta`}
      onClose={() => store.setUi({ panel: null, dungeonId: null })}
      footer={open ? (
        <button className="btn primary big" disabled={!members.length} onClick={() => store.run(startDungeon, def.id)}>
          ⬇️ Bajar con {members.length} {members.length === 1 ? 'persona' : 'personas'}
        </button>
      ) : undefined}
      wide
    >
      <p>{def.description}</p>
      {!open && <p className="bad-text">🔒 {def.unlock.hint}</p>}
      <ul className="tag-list">
        <li>👹 Monstruos: {families.map((f) => FAMILY[f] ?? f).join(', ')}</li>
        <li>👑 Jefe: <b>{def.boss.name}</b> · {bossReady(s, def) ? 'te espera en el último piso' : `vuelve el día ${back}`}</li>
        <li>✦ Tesoros únicos encontrados: {found}/{def.uniques.length}</li>
        <li>🗺️ Piso más hondo: {prog.deepest || '—'} · Veces completada: {prog.clears}</li>
        <li>⚡ Energía: {expeditionEnergy(s, members, c)} · 🎒 Carga: {expeditionCapacity(s, members, c)}</li>
        {injured.map((ch) => <li key={ch.id} className="muted">🤕 {ch.name} se queda: herido hasta el día {ch.injuredUntilDay}.</li>)}
      </ul>
      <p className="muted small">
        Los pisos cambian cada vez que bajás. Solo se vuelve desde los descansos de las escaleras; sin energía el grupo sigue, pero agotado.
        Examiná las paredes: hay salas secretas, palancas, puertas con llave, inscripciones y algunas trampas.
      </p>
    </Panel>
  );
}
