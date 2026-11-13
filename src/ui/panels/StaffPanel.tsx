import { useState } from 'react';
import { BALANCE } from '../../config/balance';
import {
  addOrder, assignStaff, cancelOrder, fireWorker, joinBlock, learnWorkTrait, loyaltyRateLabel, oficioLevel, orderableBlueprints, orderLabel, peekProgress,
  peekShop, pickOrderMaterials, priceRatio, removeStaff, setStaffRole, staffCandidates, staffSlots, staffWages, workerName, xpForLevel,
} from '../../core/staff/staff';
import { OFICIO_NAMES, OFICIOS, ORDER_MODE_NAMES, ROLE_NAMES, ROLE_OFICIO, STAFF_ROLES, type OrderMode, type StaffMember } from '../../core/staff/types';
import { ART, isHd } from '../../game/render/assets';
import { relationLevel } from '../../core/state';
import { cityOfLocation } from '../../core/city';
import { HOME_SHOP, ownedShops, shopHere, shopName } from '../../core/economy/shops';
import { Panel } from '../components/Panel';
import { Portrait } from '../components/Swatch';
import { store, useGame } from '../hooks';

/** Qué hace cada puesto (para la ayuda del panel). */
const ROLE_HELP: Record<string, string> = {
  vendedor: 'atiende el mostrador y vende lo exhibido, sin regatear',
  encargado: 'arma la vidriera: pone lo que más se va a vender y saca lo que no sale',
  aprendiz: 'forja los pedidos que le dejes, con los materiales del inventario',
};

/** Quién trabaja en la herrería, en qué puesto, cómo viene aprendiendo y los pedidos del aprendiz. */
export function StaffPanel() {
  const s = useGame();
  const c = store.content;
  // El personal de la tienda donde estás (fuera de tus tiendas, el de la herrería).
  const shop = shopHere(c, s) ?? HOME_SHOP;
  const atShop = shopHere(c, s) === shop;
  const st = peekShop(s, shop);
  const slots = staffSlots(c, s, shop);
  const candidates = staffCandidates(s, shop);
  const others = ownedShops(s).filter((x) => x !== shop);

  return (
    <Panel title={shop === HOME_SHOP ? 'Personal de la herrería' : `Personal de ${shopName(c, shop)}`} subtitle={`${st.staff.length}/${slots} puestos · sueldos 🪙 ${staffWages(c, s)} por día · 🪙 ${Math.floor(s.gold)}`} wide>
      <p className="small muted">
        El personal trabaja solo en cada franja de la mañana y de la tarde, estés o no: el {ROLE_NAMES.vendedor.toLowerCase()} {ROLE_HELP.vendedor};
        el {ROLE_NAMES.encargado.toLowerCase()} {ROLE_HELP.encargado}; el {ROLE_NAMES.aprendiz.toLowerCase()} {ROLE_HELP.aprendiz}.
        Cada uno sube de nivel en su oficio trabajando y, al llegar a los niveles {BALANCE.staff.pickAtLevels.join(', ')}, aprende algo nuevo.
        Pueden trabajar los compañeros comprados en el mercado de esclavos y los empleados que se contratan en el tablón; los mercenarios solo pelean.
      </p>

      {st.staff.length === 0 && <p className="muted">Todavía no trabaja nadie {shop === HOME_SHOP ? 'en la herrería' : 'en este taller'}.</p>}
      <div className="quest-grid">
        {st.staff.map((m) => <MemberCard key={m.id} m={m} shop={shop} atShop={atShop} />)}
      </div>

      <ApprenticeOrders shop={shop} atShop={atShop} />

      {st.staff.length < slots && (
        <>
          <h4>Sumar a alguien</h4>
          <ul className="item-rows">
            {candidates.map((id) => {
              const block = joinBlock(c, s, id, shop);
              return (
                <li key={id}>
                  <Portrait id={id} look={c.npcs[id]?.look} size="small" />
                  <span className="grow">
                    <b>{workerName(c, s, id)}</b>{' '}
                    <small className="muted">{s.characters[id]?.bond === 'liberado' ? 'liberado' : 'esclavo'} · lealtad {relationLevel(s.npcs[id]?.relation ?? 0)}{s.party.includes(id) ? ' · deja el grupo' : ''}</small>
                    {block && <small className="muted block">{block}</small>}
                  </span>
                  <button className="btn" disabled={!!block || !atShop} onClick={() => store.run(assignStaff, id, undefined)}>Poner a trabajar</button>
                </li>
              );
            })}
          </ul>
          <p className="small muted">Para contratar empleados, andá al tablón de anuncios de cualquier ciudad (en Puertoseco, a la Casa de los Navegantes).</p>
        </>
      )}

      {others.length > 0 && (
        <>
          <h4>Tus otras tiendas</h4>
          <ul className="item-rows">
            {others.map((x) => (
              <li key={x}>
                <span className="grow">
                  <b>{shopName(c, x)}</b> <small className="muted">{c.cities[cityOfLocation(c, x) ?? '']?.name} · {peekShop(s, x).staff.length}/{staffSlots(c, s, x)} puestos{peekShop(s, x).staff.length ? `: ${peekShop(s, x).staff.map((m) => workerName(c, s, m.id).split(' ')[0]).join(', ')}` : ''}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="small muted">El personal de cada tienda se organiza ahí. Lo que hacen mientras no estás te lo cuentan cuando vas.</p>
        </>
      )}
    </Panel>
  );
}

function MemberCard({ m, shop, atShop }: { m: StaffMember; shop: string; atShop: boolean }) {
  const s = useGame();
  const c = store.content;
  const p = peekProgress(c, s, m.id);
  const def = c.workers[m.id];
  const ch = s.characters[m.id];
  const kind = def ? def.title : ch?.bond === 'liberado' ? 'Liberado' : 'Esclavo';
  const wage = def?.wage ?? ch?.wage ?? 0;
  const loyalty = loyaltyRateLabel(s, m.id);
  const order = m.piece ? peekShop(s, shop).orders.find((o) => o.id === m.piece!.order) : undefined;

  return (
    <article className="quest-card">
      <header className="row">
        <Portrait id={m.id} look={def?.look ?? c.npcs[m.id]?.look} size="small" />
        <span className="grow"><b>{workerName(c, s, m.id)}</b> <small className="muted block">{kind}{wage ? ` · 🪙 ${wage}/día` : ''}</small></span>
      </header>
      <div className="row">
        {STAFF_ROLES.map((r) => (
          <button key={r} className={`btn ${m.role === r ? 'primary' : ''}`} disabled={!atShop} onClick={() => store.run(setStaffRole, m.id, r)}>{ROLE_NAMES[r]}</button>
        ))}
      </div>
      <p className="small">
        {OFICIOS.map((o) => {
          const lvl = oficioLevel(p.xp[o]);
          const next = xpForLevel(lvl + 1);
          const pct = lvl >= BALANCE.staff.maxLevel ? 100 : Math.round(((p.xp[o] - xpForLevel(lvl)) / (next - xpForLevel(lvl))) * 100);
          return <span key={o} className={ROLE_OFICIO[m.role] === o ? 'good-text' : ''}>{OFICIO_NAMES[o]} {lvl} <small className="muted">({pct}%)</small>{o !== 'forja' ? ' · ' : ''}</span>;
        })}
      </p>
      {m.role === 'vendedor' && <p className="small muted">Cobra el {Math.round(priceRatio(c, s, m.id) * 100)}% de lo que pagaría el cliente.</p>}
      {m.role === 'aprendiz' && <p className="small muted">{order ? `Haciendo: ${order.name}${pieceMats(m) ? ` (${pieceMats(m)})` : ''}` : 'Esperando pedidos.'}</p>}
      {p.traits.length > 0 && (
        <ul className="tag-list">
          {p.traits.map((t) => (
            <li key={t} className={c.workTraits[t]?.negative ? 'bad-text' : 'trait'} title={c.workTraits[t]?.description}>
              ◆ {c.workTraits[t]?.name}: <span className="muted">{c.workTraits[t]?.description}</span>
            </li>
          ))}
        </ul>
      )}
      {p.picks.map((options, i) => (
        <div key={i}>
          <p className="small good-text">Puede aprender algo nuevo:</p>
          <div className="row">
            {options.map((t) => (
              <button key={t} className="btn" title={c.workTraits[t]?.description} onClick={() => store.run(learnWorkTrait, m.id, i, t)}>{c.workTraits[t]?.name}</button>
            ))}
          </div>
        </div>
      ))}
      {loyalty && <p className="small bad-text">{loyalty}</p>}
      <div className="row">
        {def ? (
          <button className="btn" disabled={!atShop} onClick={() => store.run(fireWorker, m.id)}>Despedir</button>
        ) : (
          <button className="btn" disabled={!atShop} onClick={() => store.run(removeStaff, m.id)}>Sacarlo del puesto</button>
        )}
      </div>
    </article>
  );
}

/** Materiales de la pieza que está haciendo alguien ("acero, roble"). */
function pieceMats(m: StaffMember): string {
  const c = store.content;
  return [...new Set(Object.values(m.piece?.materials ?? {}))].map((id) => c.materials[id]?.name.toLowerCase()).filter(Boolean).join(', ');
}

/** Ícono de un plano (el dibujo del objeto); si no tiene, su inicial. */
function BlueprintIcon({ id }: { id: string }) {
  const url = ART[`icon.${id}`];
  if (url) return <img className={`order-icon art-icon${isHd(`icon.${id}`) ? ' hd' : ''}`} src={url} alt="" />;
  return <span className="order-icon order-initial">{store.content.blueprints[id]?.name[0]}</span>;
}

/**
 * Pedidos del aprendiz: tocás el ícono de lo que querés que haga, elegís si usa el mejor material o el más barato
 * que tengas, y cuántas. En cada pieza elige solo los materiales del inventario.
 */
function ApprenticeOrders({ shop, atShop }: { shop: string; atShop: boolean }) {
  const s = useGame();
  const c = store.content;
  const st = peekShop(s, shop);
  const blueprints = orderableBlueprints(c, s);
  const [mode, setMode] = useState<OrderMode>('alto');
  const [qty, setQty] = useState(5);
  const [picked, setPicked] = useState<string | null>(null);
  const sel = picked && blueprints.includes(picked) ? picked : null;
  const preview = sel ? pickOrderMaterials(c, s, sel, mode) : null;
  const max = BALANCE.staff.maxOrderQty;
  const step = (d: number) => setQty((q) => Math.max(1, Math.min(max, q + d)));

  return (
    <section className="apprentice-orders">
      <h4>Pedidos del aprendiz</h4>
      {st.orders.length === 0 && <p className="small muted">Sin pedidos.</p>}
      <ul className="item-rows">
        {st.orders.map((o) => (
          <li key={o.id}>
            <BlueprintIcon id={o.blueprintId} />
            <span className="grow"><b>{orderLabel(o)}</b> <small className="muted">{o.done}/{o.qty} hechas</small></span>
            <button className="btn" onClick={() => store.run(cancelOrder, o.id)}>Cancelar</button>
          </li>
        ))}
      </ul>

      {blueprints.length ? (
        <div className="order-form">
          <div className="row">
            <span className="tabs order-mode">
              {(['alto', 'bajo'] as const).map((m) => (
                <button key={m} className={`tab ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>
                  {m === 'alto' ? '⬆ Mejor material' : '⬇ Más barato'}
                </button>
              ))}
            </span>
            <span className="qty-stepper">
              <button className="btn" disabled={qty <= 1} onClick={() => step(qty > 5 ? -5 : -1)}>−</button>
              <b>{qty}</b>
              <button className="btn" disabled={qty >= max} onClick={() => step(qty >= 5 ? 5 : 1)}>+</button>
            </span>
          </div>
          <div className="order-grid">
            {blueprints.map((id) => {
              const ok = 'materials' in pickOrderMaterials(c, s, id, mode);
              return (
                <button key={id} className={`order-tile ${sel === id ? 'on' : ''} ${ok ? '' : 'nomat'}`} title={c.blueprints[id].name} onClick={() => setPicked(id)}>
                  <BlueprintIcon id={id} />
                  <small>{c.blueprints[id].name}</small>
                </button>
              );
            })}
          </div>
          {sel && preview && (
            <div className="row">
              <span className="grow small">
                {'materials' in preview ? (
                  <>Con lo que tenés hoy: {c.blueprints[sel].parts.map((p) => `${p.label.toLowerCase()} de ${c.materials[preview.materials[p.slot]].name.toLowerCase()}`).join(', ')}.</>
                ) : (
                  <span className="bad-text">Hoy no tenés material para: {preview.missing.toLowerCase()}. Lo hace cuando consigas.</span>
                )}
                <small className="muted block">Elige el {ORDER_MODE_NAMES[mode]} que haya en cada pieza, así que puede variar.</small>
              </span>
              <button className="btn primary" disabled={!atShop} onClick={() => store.run(addOrder, sel, mode, qty)}>Encargar {qty}× {c.blueprints[sel].name}</button>
            </div>
          )}
          {!sel && <p className="small muted">Tocá lo que querés que forje. Los apagados no tienen material hoy.</p>}
        </div>
      ) : (
        <p className="small muted">El aprendiz repite piezas del yunque y del banco de flechería que ya forjaste vos: forjá alguna y aparece acá.</p>
      )}
    </section>
  );
}
