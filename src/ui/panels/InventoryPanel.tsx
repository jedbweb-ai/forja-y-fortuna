import { useState } from 'react';
import type { ItemInstance, MaterialType } from '../../core/types';
import { ItemCard } from '../components/ItemCard';
import { Panel, Tabs } from '../components/Panel';
import { MATERIAL_TYPE_LABEL, money, RARITY_CLASS } from '../format';
import { store, useGame } from '../hooks';
import { Swatch, itemIcon } from '../components/Swatch';

export function InventoryPanel() {
  const s = useGame();
  const c = store.content;
  const [tab, setTab] = useState<'items' | 'materials'>('items');
  const [open, setOpen] = useState<ItemInstance | null>(null);
  const mats = Object.entries(s.materials).filter(([, q]) => q > 0).map(([id, q]) => ({ m: c.materials[id], q }));
  const groups = [...new Set(mats.map(({ m }) => m.type))] as MaterialType[];

  return (
    <Panel title="Inventario" subtitle={`${s.items.length} objetos · ${mats.length} materiales`}>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'items', label: 'Objetos' }, { id: 'materials', label: 'Materiales' }]} />
      {tab === 'items' && (
        <>
          {!s.items.length && <p className="muted">Todavía no forjaste nada.</p>}
          <ul className="item-rows">
            {s.items.map((i) => (
              <li key={i.uid} className={`clickable ${RARITY_CLASS[i.rarity]}`} onClick={() => setOpen(i)}>
                <Swatch icon={itemIcon(i)} color={i.color} />
                <span className="grow"><b>{i.name}</b> <small className="muted">{i.rarity} · calidad {i.quality}{i.quantity > 1 ? ` · ×${i.quantity}` : ''}</small></span>
                <span>🪙 {money(i.value)}{i.quantity > 1 ? ' c/u' : ''}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'materials' && groups.map((g) => (
        <section key={g}>
          <h4>{MATERIAL_TYPE_LABEL[g]}</h4>
          <ul className="item-rows">
            {mats.filter(({ m }) => m.type === g).map(({ m, q }) => (
              <li key={m.id}>
                <Swatch icon={`icon.${m.id}`} color={m.color} />
                <span className="grow"><b>{m.name}</b> <small className="muted block">{m.description}</small></span>
                <b>×{q}</b>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {open && <ItemCard item={open} onClose={() => setOpen(null)} />}
    </Panel>
  );
}
