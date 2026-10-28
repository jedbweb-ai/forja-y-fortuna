import { activePartyUnit, attackPreview, effectiveMode, selectSkill } from '../../bridge/combatInput';
import { ammoBonus } from '../../core/combat/damage';
import { canUseSkill, currentUnit, fleeChance } from '../../core/combat/engine';
import { closeReport, combatEndTurn, combatFlee, combatSkill } from '../../core/world/expedition';
import { store, useSnapshot } from '../hooks';

const SIDE_TEXT = { front: 'de frente', side: 'de costado', back: '¡por la espalda!' };

export function CombatHud() {
  const { state, ui } = useSnapshot();
  const e = state?.expedition;
  const cs = e?.combat;
  if (!state || !e || !cs) return null;
  const c = store.content;
  const cur = !cs.outcome ? currentUnit(cs) : undefined;
  const me = activePartyUnit(store);
  const mode = me ? effectiveMode(store, me) : null;
  const preview = attackPreview(store);
  const upcoming = cs.order.slice(cs.turnIndex).map((id) => cs.units.find((u) => u.id === id)).filter((u) => u?.alive).slice(0, 8);

  return (
    <>
      <div className="turn-strip" aria-label="Orden de turnos">
        <span className="muted small">Ronda {cs.round}</span>
        {upcoming.map((u, i) => (
          <span key={u!.id} className={`turn-chip ${u!.side} ${i === 0 ? 'now' : ''}`}>{u!.name}</span>
        ))}
      </div>

      <div className="combat-bar">
        {me ? (
          <>
            <div className="combat-unit">
              <b>{me.name}</b>
              <div className="meter thin hp"><span style={{ width: `${(me.hp / me.maxHp) * 100}%` }} /></div>
              <small className="muted">❤️ {me.hp}/{me.maxHp}{me.statuses.length ? ` · ${me.statuses.map((x) => x.id).join(', ')}` : ''}</small>
            </div>
            {preview ? (
              <div className="combat-actions">
                <div className="preview-line">
                  🎯 {preview.target.name}: acierto <b>{Math.round(preview.calc.hit * 100)}%</b> · daño <b>{preview.calc.min}–{preview.calc.max}</b>
                  {' '}· crítico {Math.round(preview.calc.crit * 100)}% · {SIDE_TEXT[preview.calc.side]}
                  {preview.calc.element ? ` · ${preview.calc.element}` : ''}
                </div>
                <button className="btn primary big" onClick={() => store.run(combatSkill, me.id, ui.combat.skillId!, ui.combat.target!.x, ui.combat.target!.y)}>Confirmar</button>
                <button className="btn" onClick={() => store.setUi({ combat: { mode: null } })}>Cancelar</button>
              </div>
            ) : (
              <div className="combat-actions">
                {!me.moved && (
                  <button className={`btn ${mode === 'move' ? 'on' : ''}`} onClick={() => store.setUi({ combat: { mode: mode === 'move' ? null : 'move' } })}>👣 Mover</button>
                )}
                {me.skills.map((id) => {
                  const skill = c.skills[id];
                  const reason = canUseSkill(c, state, me, skill);
                  const ammo = skill.ammo ? ammoBonus(c, state, me) : null;
                  const left = skill.ammo && me.ammoUid ? state.items.find((i) => i.uid === me.ammoUid)?.quantity ?? 0 : null;
                  return (
                    <button
                      key={id}
                      className={`btn ${mode === 'skill' && ui.combat.skillId === id ? 'on' : ''}`}
                      disabled={!!reason}
                      title={reason ?? skill.description}
                      onClick={() => selectSkill(store, id)}
                    >
                      ⚔️ {skill.name}
                      {me.cooldowns[id] ? <small> ({me.cooldowns[id]})</small> : null}
                      {ammo && left !== null ? <small> 🏹{left}</small> : null}
                    </button>
                  );
                })}
                <button className="btn" onClick={() => store.run(combatEndTurn, me.id)}>⏭️ Terminar turno</button>
                {!me.acted && <button className="btn danger" onClick={() => store.run(combatFlee, me.id)}>🏃 Huir ({Math.round(fleeChance(cs) * 100)}%)</button>}
                {mode === 'skill' && <span className="small muted">Tocá un objetivo marcado en rojo.</span>}
              </div>
            )}
          </>
        ) : (
          <div className="combat-wait">{cur ? `Turno de ${cur.name}…` : '…'}</div>
        )}
        <div className="combat-log">{cs.log.slice(-2).map((l, i) => <div key={i}>{l}</div>)}</div>
      </div>

      {e.report && <CombatReportCard />}
    </>
  );
}

const TITLE = { victory: '¡Victoria!', defeat: 'Derrota', fled: 'Escaparon' };

function CombatReportCard() {
  const { state } = useSnapshot();
  const r = state!.expedition!.report!;
  const c = store.content;
  const lootEntries = Object.entries(r.loot);
  const lostEntries = Object.entries(r.lost);
  return (
    <div className="card-backdrop">
      <article className={`report ${r.outcome}`}>
        <h3>{TITLE[r.outcome]}</h3>
        {r.outcome === 'victory' && <p>Experiencia: +{r.xp} para cada uno.</p>}
        {r.outcome === 'defeat' && <p>El grupo cae. Despertás en Valdebrasa y perdés la mitad de lo que juntaste.</p>}
        {lootEntries.length > 0 && (
          <>
            <h4>Botín</h4>
            <ul className="tag-list">{lootEntries.map(([id, q]) => <li key={id}>+{q} {c.materials[id].name}</li>)}</ul>
          </>
        )}
        {lostEntries.length > 0 && (
          <>
            <h4>Perdido en la huida</h4>
            <ul className="tag-list bad-text">{lostEntries.map(([id, q]) => <li key={id}>−{q} {c.materials[id].name}</li>)}</ul>
          </>
        )}
        {r.notes.map((n, i) => <p key={i} className="small muted">• {n}</p>)}
        {r.levelUps.map((n) => <p key={n} className="good-text">⬆ {n}</p>)}
        {r.injured.map((n) => <p key={n} className="bad-text">🤕 {n} queda herido unos días.</p>)}
        <button className="btn primary big" onClick={() => store.run(closeReport)}>Continuar</button>
      </article>
    </div>
  );
}
