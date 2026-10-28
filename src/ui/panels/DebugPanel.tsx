import { useState } from 'react';
import type { SkillId } from '../../core/types';
import { relationLevel, skillLevel } from '../../core/state';
import {
  dbgAdvance, dbgAuctionToday, dbgCityEvent, dbgCombat, dbgQuestProgress, dbgRefreshTown, dbgGold, dbgHealParty, dbgHire, dbgKit, dbgMagicKit, dbgLevelUp, dbgMaterials, dbgRelation, dbgReputation, dbgResetTalks, dbgRevealSynergies,
} from '../../debug/commands';
import { setDebugPersisted } from '../../bridge/store';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

const SKILLS: SkillId[] = ['herreria', 'armeria', 'flecheria', 'comercio', 'runas', 'combate', 'mineria', 'tala', 'desuello'];

export function DebugPanel() {
  const s = useGame();
  const c = store.content;
  const [mat, setMat] = useState(Object.keys(c.materials)[0]);
  const [ev, setEv] = useState(Object.keys(c.cityEvents)[0]);
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
          <h4>Combates de prueba</h4>
          <div className="row">
            <button className="btn" onClick={() => { if (store.run(dbgCombat, 'gelines')) store.closePanel(); }}>Gelines</button>
            <button className="btn" onClick={() => { if (store.run(dbgCombat, 'goblins')) store.closePanel(); }}>Goblins</button>
            <button className="btn" onClick={() => { if (store.run(dbgCombat, 'bestias')) store.closePanel(); }}>Bestias</button>
            <button className="btn" onClick={() => { if (store.run(dbgCombat, 'jefe')) store.closePanel(); }}>Jefe</button>
          </div>
          <div className="row">
            <button className="btn" onClick={() => store.run(dbgKit)}>Kit de prueba</button>
            <button className="btn" onClick={() => store.run(dbgMagicKit)}>Kit mágico</button>
            <button className="btn" onClick={() => store.run(dbgHealParty)}>Curar grupo / energía</button>
            {Object.keys(c.mercenaries).map((id) => <button key={id} className="btn" onClick={() => store.run(dbgHire, id)}>+ {c.mercenaries[id].name.split(' ')[0]}</button>)}
          </div>
          <h4>Ciudad</h4>
          <div className="row">
            <select value={ev} onChange={(e) => setEv(e.target.value)} aria-label="Evento">
              {Object.values(c.cityEvents).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <button className="btn" onClick={() => store.run(dbgCityEvent, ev)}>Disparar evento</button>
          </div>
          <div className="row">
            <button className="btn" onClick={() => store.run(dbgAuctionToday)}>Subasta hoy</button>
            <button className="btn" onClick={() => store.run(dbgRefreshTown)}>Renovar avisos</button>
            <button className="btn" onClick={() => store.run(dbgQuestProgress)}>Cumplir cacerías</button>
          </div>
          <button className="btn danger" onClick={() => { setDebugPersisted(false); store.closePanel(); }}>Desactivar debug</button>
        </div>
      </section>
    </Panel>
  );
}
