import { useState } from 'react';
import { BALANCE } from '../../config/balance';
import { brew, brewSlots, failChance, matchRecipe, mixProps, potencyFor, type Heat } from '../../core/magic/alchemy';
import { ALCHEMY_PROPS, type AlchemyProp } from '../../core/magic/types';
import { skillLevel } from '../../core/state';
import { bonus } from '../../core/progress/progress';
import { Panel, Tabs } from '../components/Panel';
import { pct } from '../format';
import { store, useGame } from '../hooks';
import { Swatch } from '../components/Swatch';

const PROP_LABEL: Record<AlchemyProp, string> = {
  curacion: 'Curación', antidoto: 'Antídoto', vigor: 'Vigor', proteccion: 'Protección', celeridad: 'Celeridad', humo: 'Humo',
  fuego: 'Fuego', hielo: 'Hielo', rayo: 'Rayo', sagrado: 'Sagrado', veneno: 'Veneno',
};
const HEAT_LABEL: Record<Heat, string> = { suave: 'Suave', medio: 'Medio', fuerte: 'Fuerte' };
/** Cuántas tandas seguidas se ofrecen. */
const REPEATS = [1, 5, 10] as const;

/** Mesa de alquimia: se mezclan 2 o 3 ingredientes; sus propiedades eligen la receta. */
export function AlchemyPanel() {
  const s = useGame();
  const c = store.content;
  const [tab, setTab] = useState<'mix' | 'recipes'>('mix');
  const [mix, setMix] = useState<string[]>([]);
  const [heat, setHeat] = useState<Heat>('suave');
  const usable = Object.values(c.materials).filter((m) => m.alchemy && (s.materials[m.id] ?? 0) > 0);
  const count = (id: string) => mix.filter((x) => x === id).length;
  const props = mixProps(c, mix);
  const recipe = mix.length >= 2 ? matchRecipe(c, props) : null;
  const known = recipe && s.discoveredPotions.includes(recipe.id);
  const potency = recipe ? potencyFor(recipe, props, BALANCE.alchemy.heat[heat].potency) : 0;
  const away = s.location !== 'herreria';
  // Cuántas veces se puede repetir la mezcla con los ingredientes que hay.
  const maxTimes = mix.length ? Math.min(...[...new Set(mix)].map((id) => Math.floor((s.materials[id] ?? 0) / count(id)))) : 0;

  return (
    <Panel title="Mesa de alquimia" subtitle={`Alquimia nv ${skillLevel(s.skills.alquimia)} · una tanda lleva una franja; en serie, media franja cada una`} wide>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'mix', label: 'Destilar' }, { id: 'recipes', label: 'Recetas conocidas' }]} />
      {away && <p className="bad-text">La mesa de alquimia está en tu herrería.</p>}
      {tab === 'mix' && (
        <div className="step-grid">
          <div>
            <p className="muted small">Tocá un ingrediente para sumarlo (hasta 3; se puede repetir). Cada uno aporta sus propiedades.</p>
            {!usable.length && <p className="muted">No tenés ingredientes. Juntá hierbas con la hoz o compralas en la tienda de Bastián.</p>}
            <ul className="item-rows">
              {usable.map((m) => {
                const left = (s.materials[m.id] ?? 0) - count(m.id);
                return (
                  <li key={m.id} className={left > 0 && mix.length < 3 ? 'clickable' : 'dim'} onClick={() => { if (left > 0 && mix.length < 3) setMix([...mix, m.id]); }}>
                    <Swatch icon={`icon.${m.id}`} color={m.color} />
                    <span className="grow">
                      <b>{m.name}</b> <small className="muted">tenés {s.materials[m.id]}</small>
                      <small className="muted block">
                        {Object.entries(m.alchemy!).map(([k, v]) => `${PROP_LABEL[k as AlchemyProp]} ${v}`).join(' · ')}
                      </small>
                    </span>
                    {count(m.id) > 0 && <b>×{count(m.id)}</b>}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="side">
            <div className="brew-buttons">
              {REPEATS.map((n) => {
                const enough = n <= maxTimes;
                return (
                  <button
                    key={n}
                    className={`btn ${n === 1 ? 'primary big' : ''}`}
                    data-key={n === 1 ? 'enter' : undefined}
                    disabled={away || mix.length < 2 || !enough}
                    title={!enough && mix.length >= 2 ? `Alcanza para ${maxTimes} ${maxTimes === 1 ? 'tanda' : 'tandas'}` : undefined}
                    // La mezcla queda en el caldero: así se puede volver a destilar sin armarla de nuevo.
                    onClick={() => store.run(brew, mix, heat, n)}
                  >
                    ⚗️ {n === 1 ? 'Destilar' : `×${n}`} <small>· {brewSlots(n)} franja{brewSlots(n) > 1 ? 's' : ''}</small>
                  </button>
                );
              })}
            </div>
            {mix.length >= 2 && <small className="muted">Con lo que tenés alcanza para {maxTimes} {maxTimes === 1 ? 'tanda' : 'tandas'}. En serie, cada tanda lleva media franja.</small>}
            <div className="row tight" role="radiogroup" aria-label="Fuego">
              {(['suave', 'medio', 'fuerte'] as Heat[]).map((h) => (
                <button
                  key={h}
                  role="radio"
                  aria-checked={heat === h}
                  className={`btn ${heat === h ? 'on' : ''}`}
                  title={`+${BALANCE.alchemy.heat[h].potency} potencia · riesgo ${pct(failChance(s, h, bonus(c, s, 'alquimiaFalla')))}`}
                  onClick={() => setHeat(h)}
                >
                  {HEAT_LABEL[h]}
                </button>
              ))}
            </div>
            <small className="muted">Fuego {heat}: +{BALANCE.alchemy.heat[heat].potency} potencia · riesgo de arruinarla {pct(failChance(s, heat, bonus(c, s, 'alquimiaFalla')))}</small>
            <h4>Caldero</h4>
            <div className="chips">
              {mix.map((id, i) => (
                <button key={`${id}${i}`} className="mat on" onClick={() => setMix(mix.filter((_, j) => j !== i))} title="Sacar">
                  <Swatch icon={`icon.${id}`} color={c.materials[id].color} />{c.materials[id].name} ✕
                </button>
              ))}
              {!mix.length && <span className="muted small">Vacío</span>}
            </div>
            {mix.length > 0 && (
              <p className="small">
                {ALCHEMY_PROPS.filter((k) => props[k]).map((k) => `${PROP_LABEL[k]} ${props[k]}`).join(' · ')}
              </p>
            )}
            <div className="preview-box">
              {mix.length < 2 && <span className="muted">Sumá al menos dos ingredientes.</span>}
              {mix.length >= 2 && !recipe && <span className="muted">Esta mezcla no parece llevar a nada útil.</span>}
              {recipe && known && (
                <>
                  <b>{recipe.name}</b>
                  <div className="muted small">{recipe.description}</div>
                  <div className="small">×{recipe.qty}{recipe.output.kind === 'pocion' ? ` · potencia ${potency}` : ''}</div>
                </>
              )}
              {recipe && !known && <span>✦ Algo distinto burbujea… no conocés esta receta.</span>}
            </div>
          </div>
        </div>
      )}
      {tab === 'recipes' && (
        <ul className="item-rows">
          {s.discoveredPotions.map((id) => c.potions[id]).filter(Boolean).map((p) => (
            <li key={p.id}>
              <Swatch icon={`icon.${p.id}`} color={p.color} />
              <span className="grow">
                <b>{p.name}</b> {p.secret && <span className="tag secret">secreta</span>}
                <small className="muted block">{p.description}</small>
                <small className="block">Pide: {Object.entries(p.requires).map(([k, v]) => `${PROP_LABEL[k as AlchemyProp]} ${v}`).join(' + ')}</small>
              </span>
            </li>
          ))}
          <p className="muted small">Hay recetas secretas: probá mezclas nuevas y escuchá a los que saben.</p>
        </ul>
      )}
    </Panel>
  );
}
