import { gather } from '../../core/world/expedition';
import { dangerFor } from '../../core/world/expedition';
import { chooseEventOption, closeEvent, harvest, harvestInfo, openEvent, optionBlocked, restAtCamp, routeFight, routeTravel } from '../../core/world/explore';
import { stopAt } from '../../core/world/routes';
import type { ResourceNode, RouteStop } from '../../core/world/types';
import { BALANCE } from '../../config/balance';
import { store, useSnapshot } from '../hooks';
import { Swatch } from './Swatch';

// Interfaz de exploración de la etapa 3: tarjeta de un lugar (recolectar, abrir, descansar), cartel de evento y,
// en el formato A, la vista del recorrido por paradas.

const KIND_NAME: Record<string, string> = { veta: 'Veta', arbol: 'Árbol', hierba: 'Hierbas', gema: 'Depósito de gemas', cofre: 'Cofre', campamento: 'Campamento' };

/** Acciones de un lugar. Sirve en la tarjeta (formato B y mazmorras) y en el panel de la parada (formato A). */
function NodeActions({ node, onDone }: { node: ResourceNode; onDone?: () => void }) {
  const { state } = useSnapshot();
  const c = store.content;
  if (!state) return null;
  const run = (fn: () => void) => {
    fn();
    onDone?.();
  };
  if (node.kind === 'cofre') {
    return <button className="btn primary" onClick={() => run(() => store.run(gather, node.id))}>📦 Abrir el cofre <small>⚡1</small></button>;
  }
  if (node.kind === 'campamento') {
    const camp = BALANCE.expedition.camp;
    return (
      <button className="btn primary" onClick={() => run(() => store.run(restAtCamp, node.id))}>
        🔥 Descansar <small>+{camp.energy}⚡ · cura un poco · pasa {camp.slots === 1 ? 'una franja' : `${camp.slots} franjas`}</small>
      </button>
    );
  }
  if (node.kind === 'evento') {
    return <button className="btn primary" onClick={() => store.run(openEvent, node.id)}>❓ Ver qué pasa</button>;
  }
  const info = harvestInfo(c, state, node);
  if (info.blocked) return <p className="bad-text small">{info.blocked}</p>;
  const range = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);
  return (
    <div className="harvest-choices">
      <button className="btn" data-key="1" onClick={() => run(() => store.run(harvest, node.id, 'rapido'))}>
        ⚡ Rápido <small>⚡{info.rapido.energy} · ~{range(info.rapido.qty)}</small>
      </button>
      <button className="btn primary" data-key="2" onClick={() => run(() => store.run(harvest, node.id, 'cuidado'))}>
        🔍 Con cuidado <small>⚡{info.cuidado.energy} · ~{range(info.cuidado.qty)} · {Math.round(info.cuidado.rare * 100)}% algo raro</small>
      </button>
    </div>
  );
}

function nodeTitle(node: ResourceNode) {
  const c = store.content;
  const mat = c.materials[node.material];
  if (!mat) return KIND_NAME[node.kind] ?? 'Lugar';
  return `${KIND_NAME[node.kind] ?? ''}: ${mat.name}${node.night ? ' (de noche)' : ''}`;
}

/** Tarjeta de un lugar del mapa (formato B y mazmorras). */
export function NodeCard() {
  const { state, ui } = useSnapshot();
  const e = state?.expedition;
  const node = e?.nodes.find((n) => n.id === ui.harvest);
  const close = () => store.setUi({ harvest: null });
  if (!e || !node || e.combat) return null;
  const mat = store.content.materials[node.material];
  return (
    <div className="card-backdrop" data-key="esc" onClick={close}>
      <article className="explore-card" onClick={(ev) => ev.stopPropagation()}>
        <header className="explore-head">
          {mat && <Swatch icon={`icon.${mat.id}`} color={mat.color} />}
          <div>
            <h3>{nodeTitle(node)}</h3>
            {mat && node.uses > 1 && <small className="muted">Da para {node.uses} tandas: se trabaja todo de una vez.</small>}
          </div>
        </header>
        <NodeActions node={node} onDone={close} />
        <button className="btn" onClick={close}>Dejar</button>
      </article>
    </div>
  );
}

/** Cartel de un evento: la situación, las opciones y, después de elegir, lo que pasó. */
export function EventCard() {
  const { state } = useSnapshot();
  const e = state?.expedition;
  const active = e?.event;
  if (!state || !e || !active || e.combat) return null;
  const c = store.content;
  const def = c.expeditionEvents[active.id];
  return (
    <div className="card-backdrop">
      <article className="explore-card event-card">
        <h3>❓ {def.title}</h3>
        <p>{def.text}</p>
        {active.result ? (
          <>
            <p className="event-result">{active.result}</p>
            <button className="btn primary big" data-key="enter" onClick={() => store.run(closeEvent)}>Seguir</button>
          </>
        ) : (
          <div className="event-options">
            {def.options.map((opt, i) => {
              const reason = optionBlocked(c, state, active.id, i);
              return (
                <button key={i} className="btn" data-key={String(i + 1)} disabled={!!reason} title={reason} onClick={() => store.run(chooseEventOption, i)}>
                  {opt.text}{reason ? <small> · {reason}</small> : null}
                </button>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}

// ───────────────────────── Formato A ─────────────────────────

const STOP_ICON: Record<string, string> = {
  entrada: '🚩', monstruos: '👹', desafio: '💀', evento: '❓', cofre: '📦', campamento: '🔥', hallazgo: '🗿', jefe: '👑',
  veta: '⛏️', arbol: '🪓', hierba: '🌿', gema: '💎',
};
const DANGER_CLASS: Record<string, string> = { 'fácil': 'easy', parejo: 'even', 'difícil': 'hard', mortal: 'deadly' };
const COL_W = 116;
const ROW_H = 62;
const PAD = 40;

/** Qué hay en una parada (texto corto, ícono y peligro si hay monstruos). */
function describeStop(st: RouteStop) {
  const snap = store.getSnapshot();
  const s = snap.state!;
  const e = s.expedition!;
  const c = store.content;
  const group = e.groups.find((g) => g.id === st.ref);
  const node = e.nodes.find((n) => n.id === st.ref);
  if (st.kind === 'entrada') return { icon: STOP_ICON.entrada, label: 'Entrada' };
  if (st.kind === 'hallazgo') return { icon: STOP_ICON.hallazgo, label: 'Ruinas escondidas' };
  if (group) {
    const danger = group.boss ? 'mortal' : dangerFor(c, s, group.threat, e.members);
    const lead = c.monsters[group.monsters[0]];
    return { icon: STOP_ICON[group.boss ? 'jefe' : group.challenge ? 'desafio' : 'monstruos'], label: group.boss ? lead.name.split(',')[0] : `${lead.name} ×${group.monsters.length}`, danger };
  }
  if (['monstruos', 'desafio', 'jefe'].includes(st.kind)) return { icon: '✔️', label: 'Despejado' };
  if (!node) return { icon: '·', label: 'Vacío' };
  if (node.kind === 'evento') return { icon: STOP_ICON.evento, label: 'Algo pasa…' };
  if (node.kind === 'cofre') return { icon: STOP_ICON.cofre, label: 'Cofre' };
  if (node.kind === 'campamento') return { icon: STOP_ICON.campamento, label: 'Campamento' };
  return { icon: STOP_ICON[node.kind] ?? '•', label: c.materials[node.material]?.name ?? node.kind };
}

/** El recorrido por paradas (formato A): columnas de izquierda a derecha, de la entrada a la guarida del jefe. */
export function RouteView() {
  const { state } = useSnapshot();
  const e = state?.expedition;
  const route = e?.route;
  if (!state || !e || !route || e.combat) return null;
  const c = store.content;
  const r = c.regions[e.regionId];
  const here = stopAt(route);
  const pos = (st: RouteStop) => ({ x: PAD + st.col * COL_W, y: PAD - 8 + st.row * ROW_H });
  const width = PAD * 2 + (route.cols - 1) * COL_W;
  const height = PAD * 2 + 2 * ROW_H;
  const reachable = new Set(here.links);
  const zoneCols = BALANCE.expedition.route.colsPerZone;
  return (
    <div className="route-view">
      <div className="route-scroll">
        <div className="route-map" style={{ width, height }}>
          {r.zoneDefs.map((z, i) => (
            <div key={z.id} className={`route-zone zone-${i}`} style={{ left: PAD + (1 + i * zoneCols) * COL_W - COL_W / 2, width: zoneCols * COL_W }}>
              <span>{z.name}</span>
            </div>
          ))}
          <svg className="route-lines" width={width} height={height}>
            {route.stops.flatMap((st) => st.links.map((to) => {
              const a = pos(st);
              const b = pos(stopAt(route, to));
              const live = st.id === here.id;
              const walked = st.visited && stopAt(route, to).visited;
              return <line key={`${st.id}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={live ? 'live' : walked ? 'walked' : ''} />;
            }))}
          </svg>
          {route.stops.map((st) => {
            const p = pos(st);
            const d = describeStop(st);
            const can = reachable.has(st.id);
            const cls = ['route-stop', st.id === here.id ? 'here' : '', can ? 'next' : '', st.visited && st.id !== here.id ? 'visited' : '', d.danger ? `danger-${DANGER_CLASS[d.danger]}` : ''].filter(Boolean).join(' ');
            return (
              <button key={st.id} className={cls} style={{ left: p.x, top: p.y }} disabled={!can}
                title={d.danger ? `${d.label} · ${d.danger}` : d.label}
                onClick={() => store.run(routeTravel, st.id)}>
                <span className="route-icon">{d.icon}</span>
                <span className="route-label">{d.label}{d.danger ? <em> · {d.danger}</em> : null}</span>
              </button>
            );
          })}
        </div>
      </div>
      <StopPanel />
    </div>
  );
}

/** Lo que se puede hacer en la parada actual. */
function StopPanel() {
  const { state } = useSnapshot();
  const e = state!.expedition!;
  const route = e.route!;
  const here = stopAt(route);
  const group = e.groups.find((g) => g.id === here.ref);
  const node = e.nodes.find((n) => n.id === here.ref);
  const d = describeStop(here);
  const step = BALANCE.expedition.route.stepEnergy;
  return (
    <div className="stop-panel">
      <div className="stop-title">
        <span className="route-icon">{d.icon}</span>
        <b>{node && node.kind !== 'evento' ? nodeTitle(node) : d.label}</b>
        {d.danger && <span className={`chip danger-${DANGER_CLASS[d.danger]}`}>{d.danger}</span>}
      </div>
      <div className="stop-actions">
        {group && <button className="btn danger" onClick={() => store.run(routeFight)}>⚔️ Pelear{group.boss ? ' con el jefe' : ''}</button>}
        {node && <NodeActions node={node} />}
        {here.links.length > 0 && <span className="muted small">Elegí la próxima parada (⚡{step} cada tramo).</span>}
        {!here.links.length && !group && <span className="muted small">Llegaste al fondo de la región. Volvé cuando quieras.</span>}
      </div>
    </div>
  );
}
