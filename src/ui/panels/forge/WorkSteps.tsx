import { useMemo, useState } from 'react';
import { BALANCE } from '../../../config/balance';
import { forgeComplete, forgeFinish, forgeQuench, forgeStop, forgeStrike } from '../../../core/forge/commands';
import { hitOdds } from '../../../core/forge/forging';
import { buildItem, enchantSlotsFor, qualityLabel } from '../../../core/forge/item';
import { skillLevel } from '../../../core/state';
import type { FinishOption, ForgeSession } from '../../../core/types';
import { AffinityList, StatList } from '../../components/ItemView';
import { pct, RARITY_CLASS } from '../../format';
import { store, useGame } from '../../hooks';

function costText(cost: { gold?: number; material?: string; qty?: number }) {
  const parts: string[] = [];
  if (cost.gold) parts.push(`🪙 ${cost.gold}`);
  if (cost.material) parts.push(`${cost.qty ?? 1}× ${store.content.materials[cost.material].name}`);
  return parts.join(' + ') || 'Gratis';
}

function canPay(cost: { gold?: number; material?: string; qty?: number }) {
  const s = store.state;
  return s.gold >= (cost.gold ?? 0) && (!cost.material || (s.materials[cost.material] ?? 0) >= (cost.qty ?? 1));
}

function PreviewBox({ session, enchantments = [] }: { session: ForgeSession; enchantments?: string[] }) {
  const item = useMemo(() => buildItem(store.content, session, enchantments), [session, enchantments]);
  return (
    <div className={`preview-box ${RARITY_CLASS[item.rarity]}`}>
      <b>{item.name}</b>
      <div className="muted"><span className="rarity-label">{item.rarity}</span> · calidad {item.quality} · 🪙 {Math.round(item.value * item.quantity)}</div>
      <StatList stats={item.stats} category={item.category} />
      <AffinityList affinities={item.affinities} />
    </div>
  );
}

// ── Etapa 2: forjado ──
export function ForgingStep() {
  const s = useGame();
  const f = s.forge!;
  const level = skillLevel(s.skills.herreria);
  const odds = hitOdds(f, level);
  const hitText = { bueno: '¡Buen golpe!', perfecto: '¡GOLPE PERFECTO!', defecto: '¡Crack! Apareció un defecto.' };

  return (
    <div className="forging">
      <div className="forging-main">
        <div className="meter-label"><span>Calidad</span><b>{Math.round(f.quality)} · {qualityLabel(f.quality)}</b></div>
        <div className="meter"><span style={{ width: `${f.quality}%` }} /></div>
        <div className="defects" aria-label={`Defectos ${f.defects} de ${BALANCE.forge.maxDefects}`}>
          Defectos:{' '}
          {Array.from({ length: BALANCE.forge.maxDefects }, (_, i) => <span key={i} className={i < f.defects ? 'pip bad' : 'pip'} />)}
          <small className="muted"> (al llegar a {BALANCE.forge.maxDefects} la pieza se arruina)</small>
        </div>
        <div className="hit-slot">{f.lastHit && <div key={f.hits} className={`hit-msg ${f.lastHit}`}>{hitText[f.lastHit]}</div>}</div>
        <div className="odds">
          <div><span>Riesgo de defecto del próximo golpe</span><b className={odds.defect > 0.3 ? 'bad-text' : ''}>{pct(odds.defect)}</b></div>
          <div><span>Golpe perfecto</span><b>{pct(odds.perfect)}</b></div>
          <div><span>Calidad por golpe</span><b>+{odds.gain[0].toFixed(0)}–{odds.gain[1].toFixed(0)}</b></div>
          <div>
            <span>Rasgo pasivo al frenar</span>
            <b>{odds.traitTier ? `Tier ${odds.traitTier} · ${pct(odds.traitChance)}` : '—'}</b>
          </div>
          <small className="muted">
            {odds.hitsToNextTier !== null ? `Faltan ${odds.hitsToNextTier} golpe(s) para rasgos tier ${odds.traitTier + 1}. ` : ''}
            Herrería nv {level}: más nivel, menos riesgo.
          </small>
        </div>
        <div className="row">
          <button className="btn primary huge" onClick={() => store.run(forgeStrike)}>🔨 ¡Golpe! <small>#{f.hits + 1}</small></button>
          <button className="btn big" disabled={f.hits === 0} onClick={() => store.run(forgeStop)}>✋ Frenar</button>
        </div>
      </div>
      <PreviewBox session={f} />
    </div>
  );
}

// ── Etapa 3: temple ──
export function QuenchStep() {
  const s = useGame();
  const c = store.content;
  return (
    <div className="step-grid">
      <div>
        <p className="muted">Elegí el medio de temple: define el balance entre dureza y flexibilidad, y puede sumar una afinidad.</p>
        <div className="option-cards">
          {Object.values(c.quench).map((q) => (
            <button key={q.id} className="option-card" disabled={!canPay(q.cost)} onClick={() => store.run(forgeQuench, q.id)}>
              <b>{q.name}</b>
              <span className="muted">{q.description}</span>
              <span className="hardness">{q.hardness > 0 ? `Dureza ${'▲'.repeat(q.hardness)}` : q.hardness < 0 ? `Flexibilidad ${'▲'.repeat(-q.hardness)}` : 'Equilibrado'}</span>
              <small>{costText(q.cost)}</small>
            </button>
          ))}
        </div>
      </div>
      <PreviewBox session={s.forge!} />
    </div>
  );
}

// ── Etapa 4: acabado ──
export function FinishStep() {
  const s = useGame();
  const f = s.forge!;
  const c = store.content;
  const bp = c.blueprints[f.blueprintId];
  const all = Object.values(c.finishes);
  const [grip, setGrip] = useState(bp.grip ? 'grip_ninguno' : undefined);
  const [polish, setPolish] = useState('pulido_basico');
  const [engraving, setEngraving] = useState(bp.engrave ? 'grabado_ninguno' : undefined);
  const picks = [grip, polish, engraving].filter((x): x is string => !!x);
  const gold = picks.reduce((a, id) => a + (c.finishes[id].cost.gold ?? 0), 0);
  const sim = { ...f, finish: picks };

  const group = (kind: FinishOption['kind'], label: string, value: string | undefined, set: (v: string) => void) => (
    <fieldset className="finish-group">
      <legend>{label}</legend>
      {all.filter((o) => o.kind === kind).map((o) => (
        <button key={o.id} className={`option-card small ${value === o.id ? 'on' : ''}`} disabled={!canPay(o.cost)} onClick={() => set(o.id)}>
          <b>{o.name}</b>
          <span className="muted">{o.description}</span>
          <small>{costText(o.cost)}</small>
        </button>
      ))}
    </fieldset>
  );

  return (
    <div className="step-grid">
      <div>
        {bp.grip && group('grip', 'Empuñadura / forro', grip, setGrip)}
        {group('polish', 'Pulido', polish, setPolish)}
        {bp.engrave && group('engraving', 'Grabado', engraving, setEngraving)}
      </div>
      <div className="side">
        <button className="btn primary big" disabled={s.gold < gold} onClick={() => store.run(forgeFinish, { grip, polish, engraving })}>
          Continuar {gold ? `· 🪙 ${gold}` : ''}
        </button>
        <PreviewBox session={sim} />
      </div>
    </div>
  );
}

// ── Etapa 5: encantamiento ──
export function EnchantStep() {
  const s = useGame();
  const f = s.forge!;
  const c = store.content;
  const bp = c.blueprints[f.blueprintId];
  const base = useMemo(() => buildItem(c, f, []), [c, f]);
  const slots = enchantSlotsFor(base.rarity);
  const [picked, setPicked] = useState<string[]>([]);
  const options = s.knownEnchantments.map((id) => c.enchantments[id]).filter((e) => e.categories.includes(bp.category));

  const needs = (ids: string[]) => {
    const out: Record<string, number> = {};
    ids.forEach((id) => c.enchantments[id].cost.forEach((k) => { out[k.material] = (out[k.material] ?? 0) + k.qty; }));
    return out;
  };
  const affordable = (ids: string[]) => Object.entries(needs(ids)).every(([m, q]) => (s.materials[m] ?? 0) >= q);
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  return (
    <div className="step-grid">
      <div>
        {bp.batch ? (
          <p className="muted">Los lotes de munición todavía no se pueden encantar.</p>
        ) : (
          <>
            <p className="muted">
              Las runas graban un encantamiento permanente. Esta pieza ({base.rarity}) admite <b>{slots}</b> encantamiento{slots > 1 ? 's' : ''}.
            </p>
            <div className="option-cards">
              {options.map((e) => {
                const on = picked.includes(e.id);
                const can = on || (picked.length < slots && affordable([...picked, e.id]));
                return (
                  <button key={e.id} className={`option-card ${on ? 'on' : ''}`} disabled={!can} onClick={() => toggle(e.id)}>
                    <b>ᚱ {e.name} <small className="muted">({e.kind})</small></b>
                    <span className="muted">{e.description}</span>
                    <small>{e.cost.map((k) => `${k.qty}× ${c.materials[k.material].name} (${s.materials[k.material] ?? 0})`).join(' + ')}</small>
                  </button>
                );
              })}
              {!options.length && <p className="muted">No conocés runas para este tipo de objeto.</p>}
            </div>
          </>
        )}
        {picked.length > 0 && <div className="row"><button className="btn" onClick={() => setPicked([])}>Quitar encantamientos</button></div>}
      </div>
      <div className="side">
        <button
          className="btn primary big"
          onClick={() => {
            // Al terminar, la forja queda lista con la misma receta para repetirla.
            const recipe = { blueprintId: f.blueprintId, materials: { ...f.materials } };
            if (store.run(forgeComplete, picked)) store.setUi({ forgeDraft: recipe });
          }}
        >
          ✨ Terminar {bp.batch ? 'lote' : 'pieza'}
        </button>
        <PreviewBox session={f} enchantments={picked} />
      </div>
    </div>
  );
}
