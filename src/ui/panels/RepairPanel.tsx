import { useState } from 'react';
import { damagedItems, repairCost, repairItems } from '../../core/forge/repair';
import { Panel } from '../components/Panel';
import { RARITY_CLASS } from '../format';
import { store, useGame } from '../hooks';

export function RepairPanel() {
  const s = useGame();
  const items = damagedItems(s);
  const [sel, setSel] = useState<string[]>(() => items.map((i) => i.uid));
  const chosen = items.filter((i) => sel.includes(i.uid));
  const total = chosen.reduce((a, i) => a + repairCost(i), 0);
  return (
    <Panel
      title="Reparar en la forja"
      subtitle="El equipo se desgasta en cada combate. Reparar varias piezas juntas lleva una franja."
      footer={
        <button className="btn primary big" disabled={!chosen.length || s.gold < total} onClick={() => store.run(repairItems, chosen.map((i) => i.uid))}>
          🛠️ Reparar {chosen.length} · 🪙 {total} · 1 franja
        </button>
      }
    >
      {!items.length && <p className="muted">Todo tu equipo está en buen estado.</p>}
      <ul className="item-rows">
        {items.map((i) => (
          <li key={i.uid} className={RARITY_CLASS[i.rarity]}>
            <label className="check">
              <input type="checkbox" checked={sel.includes(i.uid)} onChange={() => setSel(sel.includes(i.uid) ? sel.filter((x) => x !== i.uid) : [...sel, i.uid])} />
              <span className="grow">
                <b>{i.name}</b>
                <small className="muted block">
                  Durabilidad {i.durability}/{i.maxDurability}{i.durability <= 0 ? ' · ROTA (rinde la mitad)' : ''}{i.equippedBy ? ` · equipada por ${s.characters[i.equippedBy]?.name}` : ''}
                </small>
              </span>
              <span>🪙 {repairCost(i)}</span>
            </label>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
