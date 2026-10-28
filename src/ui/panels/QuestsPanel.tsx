import { useState, type ReactNode } from 'react';
import { currentCity, homeCity } from '../../core/state';
import { cityLocation } from '../../core/city';
import { BALANCE } from '../../config/balance';
import { checkAll } from '../../core/dialogue';
import { isAuctionDay } from '../../core/town/auction';
import { chooseEventOption } from '../../core/town/cityEvents';
import { acceptContract, contractTotal, deliverContract, nextDeadline } from '../../core/town/contracts';
import { describeReward, describeSpec, unitsAvailable } from '../../core/town/craft';
import { abandonQuest, acceptQuest, deliverQuest, questGiverName, questProgress } from '../../core/town/quests';
import type { QuestDef, QuestObjective } from '../../core/town/types';
import type { Content } from '../../core/content';
import { Panel, Tabs } from '../components/Panel';
import { store, useGame } from '../hooks';

type Tab = 'news' | 'offers' | 'contracts' | 'journal';

function objectiveText(c: Content, o: QuestObjective): string {
  switch (o.kind) {
    case 'craft': return `Entregar ${o.qty > 1 ? `${o.qty} × ` : ''}${describeSpec(c, o)}`;
    case 'materials': return `Conseguir ${o.qty} × ${c.materials[o.material].name}`;
    case 'hunt': return `Cazar ${o.count} × ${o.monster ? c.monsters[o.monster].name : `de la familia ${o.family}`}${o.region ? ` en ${c.regions[o.region].name}` : ''}`;
    case 'boss': return `Vencer al jefe de ${c.regions[o.region].name}`;
    case 'dungeon': return o.floor ? `Dejar atrás el piso ${o.floor} de ${c.dungeons[o.dungeon].name}` : `Vencer a ${c.dungeons[o.dungeon].boss.name} en ${c.dungeons[o.dungeon].name}`;
  }
}

function days(n: number) {
  return n <= 0 ? 'vence hoy' : n === 1 ? 'queda 1 día' : `quedan ${n} días`;
}

/** Encargos y contratos. En el tablón muestra además los avisos de la ciudad; en el gremio, los contratos. */
export function QuestsPanel() {
  const s = useGame();
  const c = store.content;
  const loc = cityLocation(c, s.location);
  const home = currentCity(s) === homeCity();
  // En las ciudades sin tablón, los avisos están en el gremio.
  const here = loc?.kind === 'gremio' && !home ? 'gremio' : loc?.kind;
  const news = loc?.kind === 'tablon' || (!home && loc?.kind === 'gremio');
  const tabs: { id: Tab; label: string }[] = [
    ...(news ? [{ id: 'news' as Tab, label: '📢 Avisos' }] : []),
    ...(here === 'tablon' || here === 'gremio' ? [{ id: 'offers' as Tab, label: here === 'gremio' ? 'Encargos del gremio' : 'Encargos del tablón' }] : []),
    { id: 'contracts', label: `Contratos (${s.contracts.active.length})` },
    { id: 'journal', label: `Mis encargos (${s.quests.active.length})` },
  ];
  const [tab, setTab] = useState<Tab>(tabs[0].id);
  const title = loc && (here === 'gremio' || here === 'tablon') ? loc.name : 'Encargos y contratos';

  return (
    <Panel title={title} subtitle={`Encargos ${s.quests.active.length}/${BALANCE.quests.maxActive} · Contratos ${s.contracts.active.length}/${BALANCE.contracts.maxActive}`} wide>
      <Tabs value={tab} onChange={setTab} options={tabs} />
      {tab === 'news' && <News />}
      {tab === 'offers' && <Offers board={here === 'gremio' ? 'gremio' : 'tablon'} />}
      {tab === 'contracts' && <Contracts />}
      {tab === 'journal' && <Journal />}
    </Panel>
  );
}

function QuestCard({ q, children }: { q: QuestDef; children?: ReactNode }) {
  const c = store.content;
  return (
    <article className="quest-card">
      <header>
        <b>{q.title}</b> <small className="muted">· {questGiverName(c, q)}</small>
      </header>
      <p className="small">{q.text}</p>
      <p className="small">🎯 {objectiveText(c, q.objective)}</p>
      <p className="small good-text">🏆 {describeReward(c, q.reward) || 'Agradecimiento'}</p>
      {children}
    </article>
  );
}

function Offers({ board }: { board: 'gremio' | 'tablon' }) {
  const s = useGame();
  const c = store.content;
  const offers = s.quests.offers.filter((o) => o.board === board && o.city === currentCity(s));
  return (
    <>
      <p className="muted small">Los avisos se renuevan cada {BALANCE.quests.refreshDays} días. Entregar a tiempo sube tu reputación; fallar o abandonar la baja.</p>
      {!offers.length && <p className="muted">No hay avisos nuevos. Volvé en un par de días.</p>}
      <div className="quest-grid">
        {offers.map((o) => {
          const q = c.quests[o.id];
          return (
            <QuestCard key={o.id} q={q}>
              <div className="row">
                <button className="btn primary" disabled={s.quests.active.length >= BALANCE.quests.maxActive} onClick={() => store.run(acceptQuest, q.id)}>
                  Aceptar · {q.days} días
                </button>
                <small className="muted">Aviso hasta el día {o.until}</small>
              </div>
            </QuestCard>
          );
        })}
      </div>
    </>
  );
}

function Journal() {
  const s = useGame();
  const c = store.content;
  if (!s.quests.active.length) return <p className="muted">No tenés encargos en curso. Buscalos en el gremio, en el tablón o charlando con la gente.</p>;
  return (
    <div className="quest-grid">
      {s.quests.active.map((aq) => {
        const q = c.quests[aq.id];
        const { have, need } = questProgress(c, s, aq);
        const ready = have >= need;
        return (
          <QuestCard key={aq.uid} q={q}>
            <div className="meter thin"><span style={{ width: `${(have / need) * 100}%` }} /></div>
            <p className="small">{have}/{need} · <span className={aq.deadline - s.day <= 1 ? 'bad-text' : 'muted'}>{days(aq.deadline - s.day)} (día {aq.deadline})</span></p>
            <div className="row">
              <button className="btn primary" disabled={!ready || !!s.expedition} onClick={() => store.run(deliverQuest, aq.uid)}>✔ Entregar</button>
              <button className="btn danger" onClick={() => store.run(abandonQuest, aq.uid)}>Abandonar</button>
            </div>
          </QuestCard>
        );
      })}
    </div>
  );
}

function Contracts() {
  const s = useGame();
  const c = store.content;
  const atGuild = cityLocation(c, s.location)?.kind === 'gremio';
  return (
    <>
      <p className="muted small">Volumen fijo, precio garantizado por unidad (no depende de la demanda). Se cobra al entregar; si llega una fecha y no entregaste lo que corresponde, el contrato se rompe.</p>
      {s.contracts.active.length > 0 && <h4>En curso</h4>}
      <div className="quest-grid">
        {s.contracts.active.map((ac) => {
          const def = c.contracts[ac.id];
          const total = contractTotal(def);
          const next = nextDeadline(def, ac);
          const have = unitsAvailable(s, def.item);
          return (
            <article key={ac.uid} className="quest-card">
              <header><b>{def.title}</b> <small className="muted">· {c.npcs[def.merchant].name}</small></header>
              <p className="small">📦 {def.item.qty} × {describeSpec(c, def.item)} cada {def.everyDays} días · 🪙 {def.pricePerUnit} c/u</p>
              <div className="meter thin"><span style={{ width: `${(ac.delivered / total) * 100}%` }} /></div>
              <p className="small">Entregado {ac.delivered}/{total} · tener {next.required} entregadas para el día {next.day} ({days(next.day - s.day)})</p>
              <div className="row">
                <button className="btn primary" disabled={!have || !!s.expedition} onClick={() => store.run(deliverContract, ac.uid)}>
                  Entregar {Math.min(have, total - ac.delivered)} (tenés {have})
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <h4>Ofertas</h4>
      {!atGuild && <p className="muted small">Los contratos nuevos se firman en el gremio.</p>}
      {atGuild && !s.contracts.offers.some((o) => o.city === currentCity(s)) && <p className="muted">No hay contratos nuevos por ahora.</p>}
      {atGuild && (
        <div className="quest-grid">
          {s.contracts.offers.filter((o) => o.city === currentCity(s)).map((o) => {
            const def = c.contracts[o.id];
            return (
              <article key={o.id} className="quest-card">
                <header><b>{def.title}</b> <small className="muted">· {c.npcs[def.merchant].name}</small></header>
                <p className="small">{def.text}</p>
                <p className="small">📦 {def.item.qty} × {describeSpec(c, def.item)} cada {def.everyDays} días, {def.deliveries} entregas</p>
                <p className="small good-text">🪙 {def.pricePerUnit} por unidad · premio final {def.bonus.gold ?? 0} de oro</p>
                <div className="row">
                  <button className="btn primary" disabled={s.contracts.active.length >= BALANCE.contracts.maxActive} onClick={() => store.run(acceptContract, def.id)}>Firmar</button>
                  <small className="muted">Oferta hasta el día {o.until}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {s.contracts.lostToRival.length > 0 && (
        <p className="small bad-text">Ruperto se quedó con: {s.contracts.lostToRival.map((id) => c.contracts[id]?.title).join(', ')}.</p>
      )}
    </>
  );
}

function News() {
  const s = useGame();
  const c = store.content;
  const au = s.auction;
  const home = currentCity(s) === homeCity();
  const events = s.cityEvents.active.filter((a) => (a.city ?? homeCity()) === currentCity(s));
  return (
    <div className="news-board">
      <section hidden={!home}>
        <h4>🔨 Gran subasta</h4>
        {isAuctionDay(s)
          ? <p className="small good-text">¡Hoy es la subasta! Andá a la casa de subastas.</p>
          : <p className="small">Próxima subasta: día {au.day} ({days(au.day - s.day).replace('vence hoy', 'hoy')}).</p>}
        {au.lots.length > 0 && <p className="small muted">Lotes anunciados: {au.lots.map((l) => l.name).join(' · ')}</p>}
      </section>
      <section>
        <h4>📢 La ciudad</h4>
        {!events.length && <p className="muted small">Días tranquilos en {c.cities[currentCity(s)].name}.</p>}
        {events.map((a) => {
          const ev = c.cityEvents[a.id];
          return (
            <article key={a.id} className="quest-card">
              <header><b>{ev.name}</b> <small className="muted">· hasta el día {a.until}</small></header>
              <p className="small">{ev.text}</p>
              {ev.choice && a.chosen === undefined && (
                <>
                  <p className="small"><b>{ev.choice.prompt}</b></p>
                  <div className="row">
                    {ev.choice.options.map((o, i) => (
                      <button key={o.text} className="btn" disabled={!checkAll(s, o.conditions)} onClick={() => store.run(chooseEventOption, ev.id, i)}>{o.text}</button>
                    ))}
                  </div>
                </>
              )}
              {ev.choice && a.chosen !== undefined && <p className="small muted">Elegiste: {ev.choice.options[a.chosen].text}</p>}
            </article>
          );
        })}
      </section>
      <section>
        <h4>👂 Rumores</h4>
        {!s.cityEvents.rumors.length && <p className="muted small">Nadie te contó nada hoy. Con buena relación, la gente te cuenta cosas.</p>}
        {s.cityEvents.rumors.map((r) => <p key={r.npc + r.text} className="small">{r.text}</p>)}
      </section>
    </div>
  );
}
