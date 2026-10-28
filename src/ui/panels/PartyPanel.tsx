import { useState } from 'react';
import { maxPartySize } from '../../core/progress/progress';
import { BALANCE } from '../../config/balance';
import { beltTotal, fieldPotion, setBelt } from '../../core/magic/alchemy';
import { equipItem, slotsFor, unequipItem } from '../../core/party/equipment';
import { dismissMercenary } from '../../core/party/mercenaries';
import { isInjured, xpToNext } from '../../core/party/progression';
import { characterProfile, itemRequirements } from '../../core/party/stats';
import { ATTRIBUTES, EQUIP_SLOTS, type EquipSlot } from '../../core/party/types';
import { relationLevel } from '../../core/state';
import { freeServant, loyaltyWarning, ownedServants, rejoinServant, wageFor } from '../../core/town/servants';
import { Panel } from '../components/Panel';
import { RARITY_CLASS } from '../format';
import { store, useGame } from '../hooks';
import { Swatch, itemIcon, portraitUrl } from '../components/Swatch';

const SLOT_LABEL: Record<EquipSlot, string> = {
  arma: 'Arma', escudo: 'Escudo', cuerpo: 'Armadura', anillo1: 'Anillo', anillo2: 'Anillo', amuleto: 'Amuleto', cinturon: 'Cinturón',
};
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
    ? s.items.filter((i) => slotsFor(c, i).includes(picking) && (i.quantity === 1 || i.category === 'arrojadizo') && i.equippedBy !== ch.id)
    : [];

  return (
    <Panel title="Grupo" subtitle={`${s.party.length} de ${maxPartySize(c, s)} · Las habilidades de combate salen del equipo que les forjás`} wide>
      <div className="tabs">
        {s.party.map((id) => (
          <button key={id} className={`tab ${id === ch.id ? 'on' : ''}`} onClick={() => { setSel(id); setPicking(null); }}>
            {s.characters[id].name}{isInjured(s, s.characters[id]) ? ' 🤕' : ''}
          </button>
        ))}
      </div>

      <div className="party-grid">
        <section>
          <h3>{portraitUrl(ch.id) && <img className="art-portrait portrait-inline" src={portraitUrl(ch.id)} alt="" />}{ch.name} <small className="muted">· {SPECIALTY[ch.specialty]} · nivel {ch.level}</small></h3>
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
            {p.skills.map((id) => {
              const ab = p.abilities[id];
              return (
                <li key={id}>
                  {ab ? '✨' : '⚔️'} <b>{c.skills[id].name}</b>
                  {ab && <span className="small"> · {ab.uses} uso{ab.uses === 1 ? '' : 's'} · recarga {ab.cooldown} · potencia ×{ab.power.toFixed(2)}</span>}
                  <span className="muted"> — {c.skills[id].description}</span>
                </li>
              );
            })}
          </ul>
          {p.weaponKind === 'arco' && <p className={arrows ? 'small' : 'bad-text'}>🏹 Flechas en el inventario: {arrows}</p>}
          {p.warnings.map((w) => <p key={w} className="bad-text small">⚠ {w}</p>)}
          {ch.wage !== undefined && (
            <p className="small muted">
              {ch.bond === 'esclavo' ? 'No cobra sueldo' : `Sueldo: 🪙 ${wageFor(s, ch)}/día${wageFor(s, ch) < (ch.wage ?? 0) ? ` (rebaja por buena relación, antes ${ch.wage})` : ''}`}
              {' · '}{ch.bond ? 'Lealtad' : 'Relación'}: {relationLevel(s.npcs[ch.id]?.relation ?? 0)} ({s.npcs[ch.id]?.relation ?? 0})
              {(ch.unpaidDays ?? 0) > 0 && <b className="bad-text"> · Le debés {ch.unpaidDays} día(s)</b>}
            </p>
          )}
          {loyaltyWarning(s, ch) && <p className="bad-text small">⚠ {loyaltyWarning(s, ch)}</p>}
          {ch.id !== 'herrero' && !s.expedition && (
            <div className="row">
              <button className="btn" onClick={() => store.talkTo(ch.id)}>💬 Charlar</button>
              <button className="btn" onClick={() => store.openContacts(ch.id)}>🎁 Regalar</button>
              {ch.bond === 'esclavo' && <button className="btn good" onClick={() => store.run(freeServant, ch.id)}>Liberar</button>}
              <button className="btn danger" onClick={() => { if (store.run(dismissMercenary, ch.id)) setSel('herrero'); }}>
                {ch.bond ? 'Dejar en la herrería' : 'Despedir'}
              </button>
            </div>
          )}
        </section>

        <section>
          <h4>Equipo</h4>
          {EQUIP_SLOTS.map((slot) => {
            const item = ch.equipment[slot] ? s.items.find((i) => i.uid === ch.equipment[slot]) : undefined;
            return (
              <div key={slot} className={`equip-slot ${item ? RARITY_CLASS[item.rarity] : ''}`}>
                <span className="slot-name">{SLOT_LABEL[slot]}</span>
                {item ? (
                  <span className="grow">
                    <b>{item.name}</b>
                    <small className="muted block">
                      {item.category === 'arrojadizo' ? `Quedan ${item.quantity}` : item.category === 'joyeria' ? jewelLine(item) : `Durabilidad ${item.durability}/${item.maxDurability}${item.durability <= 0 ? ' · ROTA' : ''}`}
                    </small>
                  </span>
                ) : <span className="grow muted">— vacío —</span>}
                <button className="btn" disabled={!!s.expedition?.combat} onClick={() => setPicking(picking === slot ? null : slot)}>{item ? 'Cambiar' : 'Poner'}</button>
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
                    <li key={i.uid} className={`clickable ${RARITY_CLASS[i.rarity]}`} onClick={() => { if (store.run(equipItem, ch.id, i.uid, picking)) setPicking(null); }}>
                      <Swatch icon={itemIcon(i)} color={i.color} />
                      <span className="grow">
                        <b>{i.name}</b>
                        <small className="muted block">
                          {i.category === 'joyeria' ? jewelLine(i) : i.category === 'escudo' || i.category === 'armadura' ? `Def ${i.stats.def}` : `Daño ${i.stats.atk}`}
                          {i.category === 'arrojadizo' ? ` · ${i.quantity} unidades` : ` · Peso ${i.stats.wgt}`}
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
          <BeltSection charId={ch.id} />
        </section>
      </div>
      <WaitingCompanions />
    </Panel>
  );
}

function jewelLine(item: { affinities: Record<string, number | undefined>; stats: { def: number }; abilities?: unknown[] }) {
  const aff = Object.entries(item.affinities).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(', ');
  return [aff || 'sin gema', item.stats.def ? `Def ${item.stats.def}` : '', item.abilities?.length ? `${item.abilities.length} habilidad(es)` : ''].filter(Boolean).join(' · ');
}

/** Compañeros comprados que esperan en la herrería. */
function WaitingCompanions() {
  const s = useGame();
  const waiting = ownedServants(s).filter((ch) => !s.party.includes(ch.id));
  if (!waiting.length) return null;
  return (
    <section>
      <h4>Esperando en la herrería</h4>
      <ul className="item-rows">
        {waiting.map((ch) => (
          <li key={ch.id}>
            <span className="grow"><b>{ch.name}</b> <small className="muted">nivel {ch.level} · lealtad {relationLevel(s.npcs[ch.id]?.relation ?? 0)}</small></span>
            <button className="btn" disabled={s.party.length >= maxPartySize(store.content, s) || s.location !== 'herreria' || !!s.expedition} onClick={() => store.run(rejoinServant, ch.id)}>
              Sumar al grupo
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Cinturón de pociones que comparte todo el grupo. */
function BeltSection({ charId }: { charId: string }) {
  const s = useGame();
  const c = store.content;
  const potions = s.items.filter((i) => i.potion);
  const total = beltTotal(s);
  const max = BALANCE.alchemy.beltSize;
  return (
    <div className="belt">
      <h4>Cinturón del grupo <small className="muted">· {total}/{max} pociones</small></h4>
      {!potions.length && <p className="muted small">No tenés pociones. Se destilan en la mesa de alquimia de tu herrería.</p>}
      <ul className="item-rows">
        {potions.map((i) => {
          const def = c.potions[i.potion!.recipe];
          const inBelt = s.belt[i.uid] ?? 0;
          return (
            <li key={i.uid}>
              <Swatch icon={itemIcon(i)} color={i.color} />
              <span className="grow">
                <b>{i.name}</b>
                <small className="muted block">{def?.description} · tenés {i.quantity}</small>
              </span>
              <span className="qty-stepper">
                <button className="btn" disabled={inBelt <= 0 || !!s.expedition?.combat} onClick={() => store.run(setBelt, i.uid, inBelt - 1)}>−</button>
                <b>{inBelt}</b>
                <button className="btn" disabled={inBelt >= i.quantity || total >= max || !!s.expedition?.combat} onClick={() => store.run(setBelt, i.uid, inBelt + 1)}>+</button>
              </span>
              {s.expedition && !s.expedition.combat && inBelt > 0 && (
                <button className="btn" onClick={() => store.run(fieldPotion, i.uid, charId)}>Usar</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
