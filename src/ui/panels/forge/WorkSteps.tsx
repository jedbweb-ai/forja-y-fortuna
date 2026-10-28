import { useMemo, useState } from 'react';
import { BALANCE } from '../../../config/balance';
import { forgeComplete, forgeFinish, forgeQuench, forgeStop, forgeStrike, type EnchantPick, forgeMods } from '../../../core/forge/commands';
import { hitOdds } from '../../../core/forge/forging';
import { buildItem, enchantSlotsFor, qualityLabel } from '../../../core/forge/item';
import { skillLevel } from '../../../core/state';
import { RARITIES, type Enchantment, type FinishOption, type ForgeSession } from '../../../core/types';
import { AbilityList, AffinityList, StatList } from '../../components/ItemView';
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

const NO_RUNES: Record<string, number> = {};
const NO_ENCHANTS: string[] = [];

function PreviewBox({ session, enchantments = NO_ENCHANTS, runeQuality = NO_RUNES }: { session: ForgeSession; enchantments?: string[]; runeQuality?: Record<string, number> }) {
  if (session.kind === 'runa') return <RunePreview session={session} />;
  return <ItemPreview session={session} enchantments={enchantments} runeQuality={runeQuality} />;
}

function ItemPreview({ session, enchantments, runeQuality }: { session: ForgeSession; enchantments: string[]; runeQuality: Record<string, number> }) {
  const item = useMemo(() => buildItem(store.content, session, enchantments, runeQuality), [session, enchantments, runeQuality]);
  return (
    <div className={`preview-box ${RARITY_CLASS[item.rarity]}`}>
      <b>{item.name}</b>
      <div className="muted"><span className="rarity-label">{item.rarity}</span> · calidad {item.quality} · 🪙 {Math.round(item.value * item.quantity)}</div>
      <StatList stats={item.stats} category={item.category} />
      <AffinityList affinities={item.affinities} />
      <AbilityList abilities={item.abilities} />
    </div>
  );
}

function RunePreview({ session }: { session: ForgeSession }) {
  const e = store.content.enchantments[session.blueprintId];
  const q = Math.round(session.quality);
  return (
    <div className="preview-box">
      <b>ᚱ {e.name}</b>
      <div className="muted">calidad {q} · {qualityLabel(q)}</div>
      <p className="small">{e.description}</p>
      <p className="small muted">Cuanto mejor grabada, más potencia tendrá la habilidad que dé al encantar.</p>
    </div>
  );
}

// ── Etapa 2: forjado ──
export function ForgingStep() {
  const s = useGame();
  const f = s.forge!;
  const level = skillLevel(s.skills[f.kind === 'runa' ? 'runas' : store.content.blueprints[f.blueprintId]?.station === 'joyeria' ? 'joyeria' : 'herreria']);
  const odds = hitOdds(f, level, forgeMods(store.content, s));
  const rune = f.kind === 'runa';
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
          {!rune && (
            <div>
              <span>Rasgo pasivo al frenar</span>
              <b>{odds.traitTier ? `Tier ${odds.traitTier} · ${pct(odds.traitChance)}` : '—'}</b>
            </div>
          )}
          <small className="muted">
            {!rune && odds.hitsToNextTier !== null ? `Faltan ${odds.hitsToNextTier} golpe(s) para rasgos tier ${odds.traitTier + 1}. ` : ''}
            Nivel {level}: más nivel, menos riesgo.
          </small>
        </div>
        <div className="row">
          <button className="btn primary huge" data-key="espacio" onClick={() => store.run(forgeStrike)}>{rune ? '✒️ Trazo' : '🔨 ¡Golpe!'} <small>#{f.hits + 1}</small></button>
          <button className="btn big" data-key="f" disabled={f.hits === 0} onClick={() => store.run(forgeStop)}>✋ Frenar</button>
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
  const all = Object.values(c.finishes).filter((o) => !o.categories || o.categories.includes(bp.category));
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
        {bp.grip && group('grip', bp.category === 'armadura' ? 'Forro' : 'Empuñadura', grip, setGrip)}
        {group('polish', 'Pulido', polish, setPolish)}
        {bp.engrave && group('engraving', 'Grabado', engraving, setEngraving)}
      </div>
      <div className="side">
        <button className="btn primary big" data-key="enter" disabled={s.gold < gold} onClick={() => store.run(forgeFinish, { grip, polish, engraving })}>
          Continuar {gold ? `· 🪙 ${gold}` : ''}
        </button>
        <PreviewBox session={sim} />
      </div>
    </div>
  );
}

// ── Etapa 5: encantamiento ──
/** La mejor runa grabada de ese encantamiento que haya en el arcón. */
function bestRune(id: string) {
  return store.state.items.filter((i) => i.category === 'runa' && i.blueprintId === id).sort((a, b) => b.quality - a.quality)[0];
}

export function EnchantStep() {
  const s = useGame();
  const f = s.forge!;
  const c = store.content;
  const bp = c.blueprints[f.blueprintId];
  const base = useMemo(() => buildItem(c, f, []), [c, f]);
  const slots = enchantSlotsFor(base.rarity);
  const [picked, setPicked] = useState<string[]>([]);
  const options = s.knownEnchantments.map((id) => c.enchantments[id]).filter((e) => e.categories.includes(bp.category))
    .sort((a, b) => (a.source === b.source ? 0 : a.source === 'runa' ? -1 : 1));

  const picks: EnchantPick[] = picked.map((id) => (c.enchantments[id].source === 'runa' ? { id, rune: bestRune(id)?.uid } : { id }));
  const runeQuality = useMemo(() => {
    const out: Record<string, number> = {};
    picked.forEach((id) => { const r = bestRune(id); if (r) out[id] = r.quality; });
    return out;
  }, [picked]);

  const reagents = (ids: string[]) => {
    const out: Record<string, number> = {};
    let gold = 0;
    ids.map((id) => c.enchantments[id]).filter((e) => e.source === 'grimorio').forEach((e) => {
      e.cost.forEach((k) => { out[k.material] = (out[k.material] ?? 0) + k.qty; });
      gold += e.gold ?? 0;
    });
    return { out, gold };
  };
  const affordable = (ids: string[]) => {
    const { out, gold } = reagents(ids);
    return s.gold >= gold && Object.entries(out).every(([m, q]) => (s.materials[m] ?? 0) >= q);
  };
  const rarityOk = (e: Enchantment) => !e.minRarity || RARITIES.indexOf(base.rarity) >= RARITIES.indexOf(e.minRarity);
  const why = (e: Enchantment) => {
    if (!rarityOk(e)) return `Pide una pieza ${e.minRarity} o mejor.`;
    if (e.source === 'runa' && !bestRune(e.id)) return 'Grabala antes en la mesa de runas.';
    return null;
  };
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const total = reagents(picked);

  return (
    <div className="step-grid">
      <div>
        {bp.batch ? (
          <p className="muted">Los lotes todavía no se pueden encantar.</p>
        ) : (
          <>
            <p className="muted">
              Esta pieza ({base.rarity}) admite <b>{slots}</b> encantamiento{slots > 1 ? 's' : ''}.
              {' '}Las runas se gastan; lo aprendido en grimorios se aplica con reactivos y oro.
            </p>
            <div className="option-cards">
              {options.map((e) => {
                const on = picked.includes(e.id);
                const block = why(e);
                const can = on || (!block && picked.length < slots && affordable([...picked, e.id]));
                const rune = e.source === 'runa' ? bestRune(e.id) : undefined;
                const runeCount = s.items.filter((i) => i.category === 'runa' && i.blueprintId === e.id).length;
                return (
                  <button key={e.id} className={`option-card ${on ? 'on' : ''}`} disabled={!can} onClick={() => toggle(e.id)}>
                    <b>{e.source === 'runa' ? 'ᚱ' : '📖'} {e.name} <small className="muted">({e.kind})</small></b>
                    <span className="muted">{e.description}</span>
                    {e.ability && <span className="small">✨ {c.skills[e.ability.skill]?.name}: {e.ability.uses} uso(s) base · recarga {e.ability.cooldown}</span>}
                    {e.source === 'runa' ? (
                      <small>{rune ? `Runa: calidad ${rune.quality} (tenés ${runeCount})` : 'Sin runa grabada'}</small>
                    ) : (
                      <small>
                        {[...e.cost.map((k) => `${k.qty}× ${c.materials[k.material].name} (${s.materials[k.material] ?? 0})`), e.gold ? `🪙 ${e.gold}` : '']
                          .filter(Boolean).join(' + ')}
                      </small>
                    )}
                    {block && !on && <small className="bad-text">{block}</small>}
                  </button>
                );
              })}
              {!options.length && <p className="muted">No conocés encantamientos para este tipo de objeto.</p>}
            </div>
          </>
        )}
        {picked.length > 0 && <div className="row"><button className="btn" onClick={() => setPicked([])}>Quitar encantamientos</button></div>}
      </div>
      <div className="side">
        <button
          className="btn primary big"
          data-key="enter"
          onClick={() => {
            // Al terminar, la forja queda lista con la misma receta para repetirla.
            const recipe = { blueprintId: f.blueprintId, materials: { ...f.materials } };
            if (store.run(forgeComplete, picks)) store.setUi({ forgeDraft: recipe });
          }}
        >
          ✨ Terminar {bp.batch ? 'lote' : 'pieza'}{total.gold ? ` · 🪙 ${total.gold}` : ''}
        </button>
        <PreviewBox session={f} enchantments={picked} runeQuality={runeQuality} />
      </div>
    </div>
  );
}
