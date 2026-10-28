import { useState } from 'react';
import { learnTalent, talentBlock, talentPoints } from '../../core/progress/progress';
import { skillLevel } from '../../core/state';
import type { SkillId } from '../../core/types';
import { Panel } from '../components/Panel';
import { store, useGame } from '../hooks';

export const SKILL_LABEL: Record<SkillId, string> = {
  herreria: 'Herrería', armeria: 'Armería', flecheria: 'Flechería', joyeria: 'Joyería', runas: 'Runas', alquimia: 'Alquimia',
  mineria: 'Minería', tala: 'Tala', siega: 'Siega', desuello: 'Desuello', comercio: 'Comercio', combate: 'Combate',
};

/** Árbol de talentos por habilidad: cada nivel de la habilidad (después del primero) da un punto. */
export function TalentsPanel() {
  const s = useGame();
  const c = store.content;
  const skills = (Object.keys(SKILL_LABEL) as SkillId[]).filter((k) => Object.values(c.talents).some((t) => t.skill === k));
  const [sel, setSel] = useState<SkillId>(skills.find((k) => talentPoints(c, s, k).free > 0) ?? 'herreria');
  const pts = talentPoints(c, s, sel);
  const list = Object.values(c.talents).filter((t) => t.skill === sel);

  return (
    <Panel title="Talentos" subtitle="Cada nivel de una habilidad da un punto para su árbol. Las habilidades suben usándolas." wide>
      <div className="talent-layout">
        <ul className="talent-skills">
          {skills.map((k) => {
            const p = talentPoints(c, s, k);
            return (
              <li key={k}>
                <button className={`contact ${k === sel ? 'on' : ''}`} onClick={() => setSel(k)}>
                  <span className="grow"><b>{SKILL_LABEL[k]}</b> <small className="muted">nv {skillLevel(s.skills[k])}</small></span>
                  {p.free > 0 && <span className="badge-inline">{p.free}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <section>
          <h3>{SKILL_LABEL[sel]} <small className="muted">· nivel {skillLevel(s.skills[sel])} · {pts.free} punto(s) libre(s)</small></h3>
          <div className="quest-grid">
            {list.map((t) => {
              const rank = s.talents[t.id] ?? 0;
              const block = talentBlock(c, s, t.id);
              return (
                <article key={t.id} className={`quest-card ${rank ? 'talent-on' : ''}`}>
                  <header><b>{t.name}</b> <small className="muted">{rank}/{t.maxRank}</small></header>
                  <p className="small">{t.description}</p>
                  <p className="small muted">
                    Desde nivel {t.minLevel}{t.requires ? ` · pide «${c.talents[t.requires].name}»` : ''}
                  </p>
                  <div className="row">
                    <button className="btn primary" disabled={!!block} onClick={() => store.run(learnTalent, t.id)}>
                      {rank ? 'Subir rango' : 'Aprender'}
                    </button>
                    {block && rank < t.maxRank && <small className="muted">{block}</small>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </Panel>
  );
}
