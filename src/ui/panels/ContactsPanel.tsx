import { useState } from 'react';
import { BALANCE } from '../../config/balance';
import {
  canGiftToday, giftPoints, giveGift, knownNpcs, levelReached, npcLevel, npcReachable, type GiftRef,
} from '../../core/town/relations';
import { currentCity, reputationLevel } from '../../core/state';
import { RELATION_LEVELS, type GiftTaste } from '../../core/types';
import { Panel } from '../components/Panel';
import { RARITY_CLASS } from '../format';
import { store, useGame, useSnapshot } from '../hooks';
import { Swatch, itemIcon } from '../components/Swatch';

const TASTE_LABEL: Record<GiftTaste, string> = { ama: '❤️ ama', gusta: '🙂 le gusta', indiferente: '😐', disgusta: '😖 no le gusta' };
const LEVEL_ICON: Record<string, string> = { hostil: '😠', desconfiado: '🤨', neutral: '😐', conocido: '🙂', amigo: '😊', aliado: '🤝' };

function hex(n: number) {
  return `#${n.toString(16).padStart(6, '0')}`;
}

/** Relaciones: a quién conocés, qué le gusta, qué te da y regalos. */
export function ContactsPanel() {
  const s = useGame();
  const { ui } = useSnapshot();
  const c = store.content;
  const known = knownNpcs(c, s);
  const [sel, setSel] = useState<string | null>(ui.contactNpc ?? known[0] ?? null);
  const rep = s.reputation[currentCity(s)] ?? 0;
  const npc = sel ? c.npcs[sel] : null;

  return (
    <Panel title="Contactos" subtitle={`⭐ Reputación en ${c.cities[currentCity(s)].name}: ${rep} (${reputationLevel(rep)}) · un regalo y una charla por persona por día`} wide>
      {!known.length && <p className="muted">Todavía no conocés a nadie. Recorré la ciudad y charlá con la gente.</p>}
      <div className="contacts">
        <ul className="contact-list">
          {known.map((id) => {
            const rel = s.npcs[id]?.relation ?? 0;
            return (
              <li key={id}>
                <button className={`contact ${id === sel ? 'on' : ''}`} onClick={() => setSel(id)}>
                  <span className="portrait small" style={{ background: hex(c.npcs[id].look.body), borderColor: hex(c.npcs[id].look.accent) }} />
                  <span className="grow">
                    <b>{c.npcs[id].name}</b>
                    <small className="muted block">{LEVEL_ICON[npcLevel(s, id)]} {npcLevel(s, id)} ({rel})</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {npc && sel && <ContactDetail npcId={sel} />}
      </div>
    </Panel>
  );
}

function ContactDetail({ npcId }: { npcId: string }) {
  const s = useGame();
  const c = store.content;
  const npc = c.npcs[npcId];
  const st = s.npcs[npcId];
  const rel = st?.relation ?? 0;
  const lvl = npcLevel(s, npcId);
  const pct = ((rel - BALANCE.relations.min) / (BALANCE.relations.max - BALANCE.relations.min)) * 100;
  const tastes = st?.knownTastes ?? [];
  const here = npcReachable(c, s, npcId);
  const canGift = here && canGiftToday(s, npcId);

  return (
    <section className="contact-detail">
      <h3>{npc.name} <small className="muted">· {npc.role}</small></h3>
      <p className="small">{npc.description}</p>
      {npc.personality.length > 0 && <p className="small muted">Carácter: {npc.personality.join(', ')}</p>}
      <div className="rel-bar" aria-label={`Relación ${rel}`}>
        <span style={{ width: `${pct}%` }} />
        {BALANCE.relations.levelThresholds.slice(1).map((t, i) => (
          <i key={t} style={{ left: `${((t - BALANCE.relations.min) / (BALANCE.relations.max - BALANCE.relations.min)) * 100}%` }} title={RELATION_LEVELS[i + 1]} />
        ))}
      </div>
      <p className="small">{LEVEL_ICON[lvl]} <b>{lvl}</b> ({rel})</p>

      {!!npc.unlocks?.length && (
        <>
          <h4>Lo que cambia con la relación</h4>
          <ul className="tag-list">
            {npc.unlocks.map((u) => {
              const on = levelReached(u.level, lvl);
              return (
                <li key={u.level} className={on ? '' : 'muted'}>
                  {on ? '✔' : '🔒'} <b>{u.level}</b> — {u.description}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h4>Gustos que descubriste</h4>
      {tastes.length ? (
        <div className="chips">
          {tastes.map((t) => {
            const [taste, key] = t.split(':') as [GiftTaste, string];
            return <span key={t} className={`aff taste-${taste}`}>{TASTE_LABEL[taste]}: {c.materials[key]?.name ?? c.blueprints[key]?.name ?? key}</span>;
          })}
        </div>
      ) : <p className="muted small">Regalale cosas para descubrir qué le gusta.</p>}

      <h4>Regalar</h4>
      {!here && <p className="muted small">Para regalarle algo tiene que estar donde estás vos (o andar en tu grupo).</p>}
      {here && !canGiftToday(s, npcId) && <p className="muted small">Ya le regalaste algo hoy.</p>}
      {canGift && <GiftPicker npcId={npcId} />}
    </section>
  );
}

function GiftPicker({ npcId }: { npcId: string }) {
  const s = useGame();
  const c = store.content;
  const known = new Set(s.npcs[npcId]?.knownTastes ?? []);
  const items = s.items.filter((i) => !i.equippedBy && i.quantity > 0);
  const mats = Object.entries(s.materials).filter(([, q]) => q > 0).map(([id]) => c.materials[id]).filter(Boolean);
  const hint = (ref: GiftRef) => {
    const g = giftPoints(c, s, npcId, ref);
    return g.key && known.has(`${g.taste}:${g.key}`) ? TASTE_LABEL[g.taste] : '';
  };
  return (
    <div className="gift-picker">
      <p className="muted small">Una pieza forjada por vos vale más que un material suelto, y más si es de buena calidad.</p>
      <ul className="item-rows">
        {items.map((i) => (
          <li key={i.uid} className={RARITY_CLASS[i.rarity]}>
            <Swatch icon={itemIcon(i)} color={i.color} />
            <span className="grow"><b>{i.name}</b> <small className="muted">{hint({ kind: 'item', uid: i.uid })}</small></span>
            <button className="btn" onClick={() => store.run(giveGift, npcId, { kind: 'item', uid: i.uid })}>🎁 Regalar</button>
          </li>
        ))}
        {mats.map((m) => (
          <li key={m.id}>
            <Swatch icon={`icon.${m.id}`} color={m.color} />
            <span className="grow"><b>{m.name}</b> <small className="muted">tenés {s.materials[m.id]} {hint({ kind: 'material', id: m.id })}</small></span>
            <button className="btn" onClick={() => store.run(giveGift, npcId, { kind: 'material', id: m.id })}>🎁 1</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
