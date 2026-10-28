import { useState } from 'react';
import { equipItem, slotFor, unequipItem } from '../../core/party/equipment';
import { dismissMercenary } from '../../core/party/mercenaries';
import { isInjured, xpToNext } from '../../core/party/progression';
import { characterProfile, itemRequirements } from '../../core/party/stats';
import { ATTRIBUTES, type EquipSlot } from '../../core/party/types';
import { relationLevel } from '../../core/state';
import { Panel } from '../components/Panel';
import { RARITY_CLASS } from '../format';
import { store, useGame } from '../hooks';

const SLOT_LABEL: Record<EquipSlot, string> = { arma: 'Arma', escudo: 'Escudo', cuerpo: 'Armadura' };
const SPECIALTY: Record<string, string> = { herrero: 'Herrero', guerrero: 'Guerrera/o', arquero: 'Arquera/o', explorador: 'Exploradora/or', porteador: 'Porteador/a' };
const ATTR_LABEL: Record<string, string> = { fuerza: 'Fuerza', agilidad: 'Agilidad', resistencia: 'Resistencia', voluntad: 'Voluntad' };

export function PartyPanel() {
  const s = useGame();
  const c = store.content;
  const [sel, setSel] = useState(s.party[0]);
  const [picking, setPicking] = useState<EquipSlot | null>(null);
  const ch = s.characters[sel] ?? s.characters.herrero;
  const p = characterProfile(c, s, ch);
  const injured = isInjured(s, ch);
  const arrows = s.items.filter((i) => i.category === 'municion').reduce((a, i) => a + i.quantity, 0);

  const candidates = picking
    ? s.items.filter((i) => slotFor(i.category) === picking && i.quantity === 1 && i.equippedBy !== ch.id)
    : [];

  return (
    <Panel title="Grupo" subtitle={`${s.party.length} de ${3} · Las habilidades de combate salen del equipo que les forjás`} wide>
      <div className="tabs">
        {s.party.map((id) => (
          <button key={id} className={`tab ${id === ch.id ? 'on' : ''}`} onClick={() => { setSel(id); setPicking(null); }}>
            {s.characters[id].name}{isInjured(s, s.characters[id]) ? ' 🤕' : ''}
          </button>
        ))}
      </div>

      <div className="party-grid">
        <section>
          <h3>{ch.name} <small className="muted">· {SPECIALTY[ch.specialty]} · nivel {ch.level}</small></h3>
          <div className="meter-label small"><span>Experiencia</span><span>{ch.xp}/{xpToNext(ch.level)}</span></div>
          <div className="meter thin"><span style={{ width: `${(ch.xp / xpToNext(ch.level)) * 100}%` }} /></div>
          <p className="small">❤️ Vida {ch.hp}/{p.maxHp}{injured ? <b className="bad-text"> · Herido hasta el día {ch.injuredUntilDay}</b> : null}</p>
          <dl className="attrs">
            {ATTRIBUTES.map((a) => <div key={a}><dt>{ATTR_LABEL[a]}</dt><dd>{Math.floor(ch.attributes[a])}</dd></div>)}
          </dl>
          <h4>En combate</h4>
          <dl className="attrs">
            <div><dt>Ataque</dt><dd>{p.atk}</dd></div>
            <div><dt>Defensa</dt><dd>{p.def}</dd></div>
            <div><dt>Velocidad</dt><dd>{p.spd}</dd></div>
            <div><dt>Movimiento</dt><dd>{p.move}</dd></div>
            <div><dt>Crítico</dt><dd>{Math.round(p.crit * 100)}%</dd></div>
            <div><dt>Daño</dt><dd>{p.damageType}</dd></div>
          </dl>
          <h4>Acciones (del equipo)</h4>
          <ul className="tag-list">
            {p.skills.map((id) => <li key={id}>⚔️ <b>{c.skills[id].name}</b> <span className="muted">— {c.skills[id].description}</span></li>)}
          </ul>
          {p.weaponKind === 'arco' && <p className={arrows ? 'small' : 'bad-text'}>🏹 Flechas en el inventario: {arrows}</p>}
          {p.warnings.map((w) => <p key={w} className="bad-text small">⚠ {w}</p>)}
          {ch.wage !== undefined && (
            <p className="small muted">
              Sueldo: 🪙 {ch.wage}/día · Relación: {relationLevel(s.npcs[ch.id]?.relation ?? 0)}
              {(ch.unpaidDays ?? 0) > 0 && <b className="bad-text"> · Le debés {ch.unpaidDays} día(s)</b>}
            </p>
          )}
          {ch.id !== 'herrero' && !s.expedition && (
            <button className="btn danger" onClick={() => { if (store.run(dismissMercenary, ch.id)) setSel('herrero'); }}>Despedir</button>
          )}
        </section>

        <section>
          <h4>Equipo</h4>
          {(['arma', 'escudo', 'cuerpo'] as EquipSlot[]).map((slot) => {
            const item = ch.equipment[slot] ? s.items.find((i) => i.uid === ch.equipment[slot]) : undefined;
            return (
              <div key={slot} className={`equip-slot ${item ? RARITY_CLASS[item.rarity] : ''}`}>
                <span className="slot-name">{SLOT_LABEL[slot]}</span>
                {item ? (
                  <span className="grow">
                    <b>{item.name}</b>
                    <small className="muted block">Durabilidad {item.durability}/{item.maxDurability}{item.durability <= 0 ? ' · ROTA' : ''}</small>
                  </span>
                ) : <span className="grow muted">— vacío —</span>}
                <button className="btn" disabled={!!s.expedition?.combat} onClick={() => setPicking(picking === slot ? null : slot)}>Cambiar</button>
                {item && <button className="btn" disabled={!!s.expedition?.combat} onClick={() => store.run(unequipItem, ch.id, slot)}>Quitar</button>}
              </div>
            );
          })}
          {picking && (
            <div className="pick-list">
              <h4>Elegí: {SLOT_LABEL[picking]}</h4>
              {!candidates.length && <p className="muted small">No tenés nada para este lugar. ¡Forjalo!</p>}
              <ul className="item-rows">
                {candidates.map((i) => {
                  const req = itemRequirements(i);
                  const weak = Math.floor(ch.attributes.fuerza) < req.fuerza || Math.floor(ch.attributes.voluntad) < req.voluntad;
                  const other = i.equippedBy ? s.characters[i.equippedBy]?.name : null;
                  return (
                    <li key={i.uid} className={`clickable ${RARITY_CLASS[i.rarity]}`} onClick={() => { if (store.run(equipItem, ch.id, i.uid)) setPicking(null); }}>
                      <span className="swatch" style={{ background: i.color }} />
                      <span className="grow">
                        <b>{i.name}</b>
                        <small className="muted block">
                          {i.category === 'escudo' || i.category === 'armadura' ? `Def ${i.stats.def}` : `Daño ${i.stats.atk}`} · Peso {i.stats.wgt}
                          {req.fuerza ? ` · Fuerza ${req.fuerza}` : ''}{req.voluntad ? ` · Voluntad ${req.voluntad}` : ''}
                          {other ? ` · lo tiene ${other}` : ''}
                        </small>
                      </span>
                      {weak && <span className="bad-text small">⚠</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Panel>
  );
}
