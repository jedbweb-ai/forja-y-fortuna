import { useState } from 'react';
import type { SkillId } from '../../core/types';
import { relationLevel, skillLevel } from '../../core/state';
import {
  dbgAdvance, dbgGold, dbgLevelUp, dbgMaterials, dbgRelation, dbgReputation, dbgResetTalks, dbgRevealSynergies,
} from '../../debug/commands';
import { setDebugPersisted } from '../../bridge/store';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

const SKILLS: SkillId[] = ['herreria', 'armeria', 'flecheria', 'comercio', 'runas'];

export function DebugPanel() {
  const s = useGame();
  const c = store.content;
  const [mat, setMat] = useState(Object.keys(c.materials)[0]);
  return (
    <Panel title="🐞 Modo debug" wide>
      <section className="debug-grid">
        <div>
          <h4>Oro y materiales</h4>
          <div className="row">
            <button className="btn" onClick={() => store.run(dbgGold, 100)}>+100 oro</button>
            <button className="btn" onClick={() => store.run(dbgGold, 1000)}>+1000 oro</button>
            <button className="btn" onClick={() => store.run(dbgMaterials, 10)}>+10 de todo</button>
          </div>
          <div className="row">
            <select value={mat} onChange={(e) => setMat(e.target.value)} aria-label="Material">
              {Object.values(c.materials).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button className="btn" onClick={() => store.run(dbgMaterials, 5, mat)}>+5</button>
          </div>
        </div>
        <div>
          <h4>Tiempo</h4>
          <div className="row">
            <button className="btn" onClick={() => store.run(dbgAdvance, 1)}>+1 franja</button>
            <button className="btn" onClick={() => store.run(dbgAdvance, 3)}>+1 día</button>
            <button className="btn" onClick={() => store.run(dbgResetTalks)}>Reiniciar charlas</button>
          </div>
          <h4>Reputación ({s.reputation.valdebrasa ?? 0})</h4>
          <div className="row">
            <button className="btn" onClick={() => store.run(dbgReputation, -10)}>−10</button>
            <button className="btn" onClick={() => store.run(dbgReputation, 10)}>+10</button>
          </div>
        </div>
        <div>
          <h4>Habilidades</h4>
          {SKILLS.map((k) => (
            <div key={k} className="row tight">
              <span className="grow">{k} nv {skillLevel(s.skills[k])}</span>
              <button className="btn" onClick={() => store.run(dbgLevelUp, k)}>Subir nivel</button>
            </div>
          ))}
        </div>
        <div>
          <h4>Relaciones</h4>
          {Object.values(c.npcs).map((n) => (
            <div key={n.id} className="row tight">
              <span className="grow">{n.name}: {s.npcs[n.id].relation} ({relationLevel(s.npcs[n.id].relation)})</span>
              <button className="btn" onClick={() => store.run(dbgRelation, n.id, -10)}>−10</button>
              <button className="btn" onClick={() => store.run(dbgRelation, n.id, 10)}>+10</button>
            </div>
          ))}
        </div>
        <div>
          <h4>Forja</h4>
          <div className="row">
            <button className="btn" onClick={() => store.run(dbgRevealSynergies)}>Revelar sinergias</button>
          </div>
          <h4>Pendiente para fases siguientes</h4>
          <p className="muted small">Disparar eventos de ciudad y generar combates de prueba se suman cuando existan esos sistemas (Fases 2 y 4).</p>
          <button className="btn danger" onClick={() => { setDebugPersisted(false); store.closePanel(); }}>Desactivar debug</button>
        </div>
      </section>
    </Panel>
  );
}
