import { useMemo, useState } from 'react';
import { forgeBegin, saveDesign } from '../../../core/forge/commands';
import { allowedMaterials, computeDesign } from '../../../core/forge/design';
import type { Blueprint, GameState } from '../../../core/types';
import { AffinityList, StatList } from '../../components/ItemView';
import { CATEGORY_LABEL } from '../../format';
import { store, useGame, useSnapshot } from '../../hooks';
import { Swatch } from '../../components/Swatch';

/** Para cada parte, el material permitido que más tenés (o el más barato si no alcanza ninguno). */
function defaultMaterials(bp: Blueprint, s: GameState): Record<string, string> {
  const c = store.content;
  const out: Record<string, string> = {};
  for (const part of bp.parts) {
    const options = allowedMaterials(c, part).sort((a, b) => a.price - b.price);
    const owned = [...options]
      .filter((m) => (s.materials[m.id] ?? 0) >= part.qty)
      .sort((a, b) => (s.materials[b.id] ?? 0) - (s.materials[a.id] ?? 0))[0];
    out[part.slot] = (owned ?? options[0]).id;
  }
  return out;
}

/** ¿El plano se trabaja en este puesto? La mesa de joyería tiene sus planos; el resto sale del yunque. */
export function onStation(bp: Blueprint, station: 'yunque' | 'joyeria') {
  return station === 'joyeria' ? bp.station === 'joyeria' : bp.station !== 'joyeria';
}

export function DesignStep({ station }: { station: 'yunque' | 'joyeria' }) {
  const s = useGame();
  const { ui } = useSnapshot();
  const c = store.content;
  const known = s.knownBlueprints.map((id) => c.blueprints[id]).filter((b) => onStation(b, station));
  const draft = ui.forgeDraft && onStation(c.blueprints[ui.forgeDraft.blueprintId], station) ? ui.forgeDraft : null;
  const [bpId, setBpId] = useState(draft?.blueprintId ?? known[0].id);
  const [materials, setMaterials] = useState<Record<string, string>>(() => draft?.materials ?? defaultMaterials(c.blueprints[draft?.blueprintId ?? known[0].id], s));
  const bp = c.blueprints[bpId];
  const preview = useMemo(() => computeDesign(c, bpId, materials), [c, bpId, materials]);
  const visibleSynergies = preview.synergies.filter((x) => !x.secret || s.discoveredSynergies.includes(x.id));
  const hiddenActive = preview.synergies.length - visibleSynergies.length;
  const missing = Object.entries(preview.needs).filter(([id, q]) => (s.materials[id] ?? 0) < q);

  const pickBlueprint = (id: string) => {
    setBpId(id);
    setMaterials(defaultMaterials(c.blueprints[id], s));
    if (draft) store.setUi({ forgeDraft: null });
  };

  const designs = s.designs.filter((d) => onStation(c.blueprints[d.blueprintId], station));

  const begin = () => {
    if (store.run(forgeBegin, bpId, materials)) store.setUi({ forgeDraft: null });
  };

  const save = () => {
    const main = c.materials[materials[bp.parts[0].slot]];
    store.run(saveDesign, `${bp.name} de ${main.name.toLowerCase()}`, bpId, materials);
  };

  return (
    <div className="forge-design">
      <aside className="bp-list">
        <h4>Planos</h4>
        {known.map((b) => (
          <button key={b.id} className={`bp ${b.id === bpId ? 'on' : ''}`} onClick={() => pickBlueprint(b.id)}>
            <b>{b.name}</b>
            <small>{CATEGORY_LABEL[b.category]} · {b.slots} franja{b.slots > 1 ? 's' : ''}{b.batch ? ` · lote ×${b.batch}` : ''}</small>
          </button>
        ))}
        {designs.length > 0 && <h4>Diseños propios</h4>}
        {designs.map((d) => (
          <button key={d.id} className="bp design" onClick={() => { setBpId(d.blueprintId); setMaterials({ ...d.materials }); }}>
            <b>★ {d.name}</b>
          </button>
        ))}
      </aside>

      <div className="parts">
        <p className="muted">{bp.description}</p>
        {bp.parts.map((part) => (
          <div key={part.slot} className="part">
            <h4>{part.label} <small className="muted">×{part.qty}</small></h4>
            <div className="chips">
              {allowedMaterials(c, part).map((m) => {
                const owned = s.materials[m.id] ?? 0;
                const enough = owned >= part.qty;
                return (
                  <button
                    key={m.id}
                    className={`mat ${materials[part.slot] === m.id ? 'on' : ''} ${enough ? '' : 'lack'}`}
                    title={m.description}
                    onClick={() => setMaterials({ ...materials, [part.slot]: m.id })}
                  >
                    <Swatch icon={`icon.${m.id}`} color={m.color} />
                    {m.name} <small>{owned}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="preview">
        <div className="row tight">
          <button className="btn primary grow" data-key="enter" disabled={missing.length > 0} onClick={begin}>
            {station === 'joyeria' ? '💍 Engarzar' : '🔨 Forjar'} · {bp.slots} franja{bp.slots > 1 ? 's' : ''}
          </button>
          <button className="btn" onClick={save} title="Guardar esta combinación en el libro" aria-label="Guardar diseño">★</button>
        </div>
        <div className="cost">
          {Object.entries(preview.needs).map(([id, q]) => (
            <span key={id} className={(s.materials[id] ?? 0) < q ? 'bad-text' : ''}>{q}× {c.materials[id].name} ({s.materials[id] ?? 0})</span>
          ))}
          {missing.length > 0 && <small className="muted">Faltan materiales: compralos en el mercado.</small>}
        </div>
        <h4>Vista previa</h4>
        <StatList stats={preview.stats} category={bp.category} />
        <AffinityList affinities={preview.affinities} />
        {visibleSynergies.map((x) => (
          <div key={x.id} className="syn-active" title={x.description}>✦ {x.name}<small>{x.description}</small></div>
        ))}
        {hiddenActive > 0 && <div className="syn-hidden">… algo en esta mezcla vibra distinto.</div>}
        {preview.instability > 0 && <div className="bad-text">⚠ Inestable: más riesgo de defecto.</div>}
      </div>
    </div>
  );
}
