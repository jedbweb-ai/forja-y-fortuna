import { isHd } from '../../game/render/assets';
import { useState } from 'react';
import { maxPartySize } from '../../core/progress/progress';
import { BALANCE } from '../../config/balance';
import { beltTotal, fieldPotion, setBelt } from '../../core/magic/alchemy';
import { equipItem, isTwoHanded, slotsFor, unequipItem } from '../../core/party/equipment';
import type { ItemInstance } from '../../core/types';
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

  return (
    <>
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
          <h3>{portraitUrl(ch.id) && <img className={`art-portrait portrait-inline${isHd(`retrato.${ch.id}`) ? ' hd' : ''}`} src={portraitUrl(ch.id)} alt="" />}{ch.name} <small className="muted">· {SPECIALTY[ch.specialty]} · nivel {ch.level}</small></h3>
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
                <button className="btn" disabled={!!s.expedition?.combat} onClick={() => setPicking(slot)}>{item ? 'Cambiar' : 'Poner'}</button>
                {item && <button className="btn" disabled={!!s.expedition?.combat} onClick={() => store.run(unequipItem, ch.id, slot)}>Quitar</button>}
              </div>
            );
          })}
          <BeltSection charId={ch.id} />
        </section>
      </div>
      <WaitingCompanions />
    </Panel>
    {picking && <EquipPicker charId={ch.id} slot={picking} onClose={() => setPicking(null)} />}
    </>
  );
}

type Item = ItemInstance;

/** Número principal para comparar: daño en armas, defensa en escudos y armaduras (null en joyas). */
function mainStat(i: Item | undefined): { label: string; value: number } | null {
  if (!i || i.category === 'joyeria') return null;
  if (i.category === 'escudo' || i.category === 'armadura') return { label: 'Defensa', value: i.stats.def };
  return { label: 'Daño', value: i.stats.atk };
}

/** Ventanita para elegir qué poner en un lugar del equipo, sin perder de vista el panel. */
function EquipPicker({ charId, slot, onClose }: { charId: string; slot: EquipSlot; onClose: () => void }) {
  const s = useGame();
  const c = store.content;
  const ch = s.characters[charId];
  const current = ch.equipment[slot] ? s.items.find((i) => i.uid === ch.equipment[slot]) : undefined;
  const now = mainStat(current);
  const twoHanded = slot === 'escudo' && isTwoHanded(c, s.items.find((i) => i.uid === ch.equipment.arma));
  const str = Math.floor(ch.attributes.fuerza);
  const will = Math.floor(ch.attributes.voluntad);

  const candidates = s.items
    .filter((i) => slotsFor(c, i).includes(slot) && (i.quantity === 1 || i.category === 'arrojadizo') && i.equippedBy !== ch.id)
    .map((i) => {
      const req = itemRequirements(i);
      return { i, req, weak: str < req.fuerza || will < req.voluntad, stat: mainStat(i) };
    })
    // Primero lo que puede usar sin problemas, y de eso lo más fuerte.
    .sort((a, b) => Number(a.weak) - Number(b.weak) || (b.stat?.value ?? 0) - (a.stat?.value ?? 0) || b.i.quality - a.i.quality);

  const pick = (uid: string) => { if (store.run(equipItem, ch.id, uid, slot)) onClose(); };

  return (
    <div className="card-backdrop picker-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="equip-picker" role="dialog" aria-label={`Elegir ${SLOT_LABEL[slot]}`}>
        <header className="picker-head">
          <div>
            <h3>{SLOT_LABEL[slot]} <small className="muted">· {ch.name}</small></h3>
            <small className="muted">
              Fuerza {str} · Voluntad {will}
              {current ? <> · Ahora: <b>{current.name}</b>{now ? ` (${now.label} ${now.value})` : ''}</> : ' · Ahora: vacío'}
            </small>
          </div>
          <button className="btn-icon" data-key="esc" onClick={onClose} aria-label="Cerrar" title="Cerrar (Esc)">✕</button>
        </header>
        <div className="picker-body">
          {twoHanded && <p className="bad-text small">El arma que tiene ocupa las dos manos: sacala para poder usar escudo.</p>}
          {!candidates.length && <p className="muted small">No tenés nada para este lugar. ¡Forjalo!</p>}
          <ul className="item-rows">
            {candidates.map(({ i, req, weak, stat }) => {
              const other = i.equippedBy ? s.characters[i.equippedBy]?.name : null;
              const diff = stat && now && now.label === stat.label ? Math.round((stat.value - now.value) * 10) / 10 : null;
              const broken = i.category !== 'joyeria' && i.category !== 'arrojadizo' && i.durability <= 0;
              return (
                <li key={i.uid} className={`clickable ${RARITY_CLASS[i.rarity]}`} onClick={() => pick(i.uid)}>
                  <Swatch icon={itemIcon(i)} color={i.color} />
                  <span className="grow">
                    <b>{i.name}</b> <small className="muted">{i.rarity} · calidad {i.quality}</small>
                    <small className="muted block">
                      {i.category === 'joyeria' ? jewelLine(i) : i.category === 'arrojadizo' ? `${i.quantity} unidades` : `Peso ${i.stats.wgt} · Durabilidad ${i.durability}/${i.maxDurability}`}
                      {broken && <b className="bad-text"> · ROTA</b>}
                      {isTwoHanded(c, i) && ' · Dos manos'}
                      {other && ` · lo tiene ${other}`}
                    </small>
                    {(req.fuerza > 0 || req.voluntad > 0) && (
                      <small className="block">
                        Pide{req.fuerza > 0 && <span className={str < req.fuerza ? 'bad-text' : 'good-text'}> Fuerza {req.fuerza}</span>}
                        {req.voluntad > 0 && <span className={will < req.voluntad ? 'bad-text' : 'good-text'}> Voluntad {req.voluntad}</span>}
                        {weak && <span className="bad-text"> · le cuesta usarlo</span>}
                      </small>
                    )}
                  </span>
                  {stat && (
                    <span className="picker-stat">
                      <b>{stat.value}</b>
                      <small className="muted">{stat.label}</small>
                      {diff !== null && diff !== 0 && <small className={diff > 0 ? 'good-text' : 'bad-text'}>{diff > 0 ? `▲ +${diff}` : `▼ ${diff}`}</small>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {current && (
          <footer className="picker-foot">
            <button className="btn" onClick={() => { if (store.run(unequipItem, ch.id, slot)) onClose(); }}>Quitar {current.name}</button>
          </footer>
        )}
      </section>
    </div>
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
