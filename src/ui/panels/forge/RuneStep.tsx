import { runeBegin } from '../../../core/forge/commands';
import { skillLevel } from '../../../core/state';
import { RARITY_CLASS } from '../../format';
import { store, useGame } from '../../hooks';
import { Swatch, itemIcon } from '../../components/Swatch';

/** Mesa de runas: se graba una runa (consume materiales) que después se gasta al encantar una pieza. */
export function RuneStep() {
  const s = useGame();
  const c = store.content;
  const runes = s.knownEnchantments.map((id) => c.enchantments[id]).filter((e) => e.source === 'runa');
  const owned = s.items.filter((i) => i.category === 'runa');

  return (
    <div className="step-grid">
      <div>
        <p className="muted">
          Cada runa se graba una vez y se gasta al encantar una pieza. Una runa bien grabada da más potencia y, si es excelente, un uso extra.
          {' '}Runas nv {skillLevel(s.skills.runas)}.
        </p>
        <div className="option-cards">
          {runes.map((e) => {
            const can = e.cost.every((k) => (s.materials[k.material] ?? 0) >= k.qty);
            const ability = e.ability ? c.skills[e.ability.skill] : undefined;
            return (
              <button key={e.id} className="option-card" disabled={!can} onClick={() => store.run(runeBegin, e.id)}>
                <b>ᚱ {e.name} <small className="muted">({e.kind})</small></b>
                <span className="muted">{e.description}</span>
                {ability && <span className="small">✨ {ability.name}: {e.ability!.uses} uso(s) base · recarga {e.ability!.cooldown}</span>}
                <small>{e.cost.map((k) => `${k.qty}× ${c.materials[k.material].name} (${s.materials[k.material] ?? 0})`).join(' + ')}</small>
              </button>
            );
          })}
          {!runes.length && <p className="muted">No conocés runas todavía.</p>}
        </div>
      </div>
      <div className="side">
        <h4>Runas grabadas</h4>
        {!owned.length && <p className="muted small">Ninguna. Las que grabes quedan en el arcón hasta que encantes una pieza.</p>}
        <ul className="item-rows">
          {owned.map((i) => (
            <li key={i.uid} className={RARITY_CLASS[i.rarity]}>
              <Swatch icon={itemIcon(i)} color={i.color} />
              <span className="grow"><b>{i.name}</b> <small className="muted block">calidad {i.quality}</small></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
