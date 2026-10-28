import { qualityLabel } from '../../core/forge/item';
import type { ItemInstance } from '../../core/types';
import { CATEGORY_LABEL, money, RARITY_CLASS } from '../format';
import { store } from '../hooks';
import { AbilityList, AffinityList, StatList } from './ItemView';

/** Tarjeta liviana del objeto terminado. Se cierra con un toque. */
export function ItemCard({ item, newSynergies = [], onClose }: { item: ItemInstance; newSynergies?: string[]; onClose: () => void }) {
  const c = store.content;
  const lot = item.quantity > 1;
  return (
    <div className="card-backdrop" onClick={onClose}>
      <article className={`item-card ${RARITY_CLASS[item.rarity]}`} aria-label={item.name}>
        {newSynergies.length > 0 && <div className="new-badge">¡Nueva sinergia descubierta!</div>}
        <div className="item-card-head">
          <span className="item-swatch" style={{ background: item.color }} />
          <div>
            <h3>{item.name}</h3>
            <div className="muted">
              <span className="rarity-label">{item.rarity}</span> · {CATEGORY_LABEL[item.category]} · Calidad {item.quality} ({qualityLabel(item.quality)})
            </div>
          </div>
        </div>
        {lot && <p className="lot">Lote de {item.quantity} unidades · {money(item.value)} oro c/u</p>}
        <StatList stats={item.stats} category={item.category} />
        <AffinityList affinities={item.affinities} />
        <AbilityList abilities={item.abilities} />
        {item.traits.length > 0 && (
          <ul className="tag-list">
            {item.traits.map((t) => <li key={t} className="trait" title={c.traits[t]?.description}>◆ {c.traits[t]?.name}: <span className="muted">{c.traits[t]?.description}</span></li>)}
          </ul>
        )}
        {item.enchantments.length > 0 && (
          <ul className="tag-list">
            {item.enchantments.map((e) => <li key={e} className="ench">ᚱ {c.enchantments[e].name}: <span className="muted">{c.enchantments[e].description}</span></li>)}
          </ul>
        )}
        {item.synergies.length > 0 && (
          <div className="syn-list">
            {item.synergies.map((s) => (
              <span key={s} className={`syn ${newSynergies.includes(s) ? 'new' : ''}`}>{newSynergies.includes(s) ? '★ ' : ''}{c.synergies[s].name}</span>
            ))}
          </div>
        )}
        {item.defects > 0 && <p className="bad-text">Defectos: {item.defects}</p>}
        <p className="value">Valor estimado: <b>🪙 {money(lot ? item.value * item.quantity : item.value)}</b></p>
        <p className="tap-hint">Tocá para cerrar</p>
      </article>
    </div>
  );
}
