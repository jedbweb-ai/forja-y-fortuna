import { useState } from 'react';
import { deleteDesign } from '../../core/forge/commands';
import { Panel, Tabs } from '../components/Panel';
import { CATEGORY_LABEL } from '../format';
import { store, useGame } from '../hooks';

export function BookPanel() {
  const s = useGame();
  const c = store.content;
  const [tab, setTab] = useState<'syn' | 'designs' | 'bps'>('syn');
  const all = Object.values(c.synergies);
  const known = all.filter((x) => s.discoveredSynergies.includes(x.id));
  const craft = all.filter((x) => !x.secret && !s.discoveredSynergies.includes(x.id));
  const secrets = all.filter((x) => x.secret && !s.discoveredSynergies.includes(x.id)).length;

  return (
    <Panel title="Libro del herrero" subtitle={`Sinergias descubiertas: ${known.length}/${all.length}`}>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'syn', label: 'Combinaciones' }, { id: 'designs', label: 'Diseños propios' }, { id: 'bps', label: 'Planos' }]} />
      {tab === 'syn' && (
        <>
          {known.map((x) => (
            <article key={x.id} className="book-entry">
              <b>✦ {x.name}</b> {x.secret && <span className="tag secret">secreta</span>}
              <p>{x.description}</p>
            </article>
          ))}
          {craft.length > 0 && <h4>Saberes del oficio (sin probar)</h4>}
          {craft.map((x) => (
            <article key={x.id} className="book-entry dim">
              <b>{x.name}</b>
              <p className="muted">{x.hint}</p>
            </article>
          ))}
          {secrets > 0 && <p className="muted">Quedan {secrets} combinaciones secretas por descubrir. Experimentá, y escuchá lo que cuenta la gente.</p>}
        </>
      )}
      {tab === 'designs' && (
        <>
          {!s.designs.length && <p className="muted">Guardá una combinación desde la forja (★ Guardar) para repetirla.</p>}
          <ul className="item-rows">
            {s.designs.map((d) => (
              <li key={d.id}>
                <span className="grow">
                  <b>★ {d.name}</b>
                  <small className="muted block">{c.blueprints[d.blueprintId].parts.map((p) => `${p.label}: ${c.materials[d.materials[p.slot]]?.name}`).join(' · ')}</small>
                </span>
                <button className="btn primary" onClick={() => store.useDesign(d.blueprintId, d.materials)}>Usar</button>
                <button className="btn" onClick={() => store.run(deleteDesign, d.id)} aria-label="Borrar diseño">🗑️</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'bps' && (
        <ul className="item-rows">
          {s.knownBlueprints.map((id) => {
            const b = c.blueprints[id];
            return (
              <li key={id}>
                <span className="grow">
                  <b>{b.name}</b> <small className="muted">{CATEGORY_LABEL[b.category]}{b.batch ? ` · lote ×${b.batch}` : ''}</small>
                  <small className="muted block">{b.parts.map((p) => `${p.label} ×${p.qty}`).join(' · ')}</small>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
