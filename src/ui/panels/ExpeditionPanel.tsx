import { BALANCE } from '../../config/balance';
import { bestTool, toolTier } from '../../core/combat/result';
import { isInjured, partyMembers } from '../../core/party/progression';
import { characterProfile } from '../../core/party/stats';
import { expeditionCapacity, expeditionEnergy, readyMembers, startExpedition } from '../../core/world/expedition';
import { Panel } from '../components/Panel';
import { store, useGame, useSnapshot } from '../hooks';

const FAMILY_LABEL: Record<string, string> = {
  gelines: 'Gelines', goblins: 'Goblins', bestias: 'Bestias', no_muertos: 'No muertos', constructos: 'Constructos',
  gigantes: 'Gigantes', elementales: 'Elementales', demonios: 'Demonios', draconidos: 'Dracónidos',
};

export function ExpeditionPanel() {
  const s = useGame();
  const { ui } = useSnapshot();
  const c = store.content;
  const r = ui.regionId ? c.regions[ui.regionId] : undefined;
  if (!r) return null;
  const members = readyMembers(s);
  const injured = partyMembers(s).filter((ch) => isInjured(s, ch));
  const tools = (['mineria', 'tala', 'desuello'] as const).map((tag) => {
    const t = bestTool(s, tag);
    return { tag, item: t, tier: t ? toolTier(t.stats.atk) : 0 };
  });
  const TOOL_NAME = { mineria: 'Pico (vetas)', tala: 'Hacha (árboles)', desuello: 'Cuchillo de desuello (cueros)' };
  const unarmed = members.filter((id) => characterProfile(c, s, s.characters[id]).weaponKind === 'punos');
  const days = Math.ceil((r.travelSlots * 2 + expeditionEnergy(s, members, c) / BALANCE.expedition.energyPerSlot) / 3);

  return (
    <Panel
      title={r.name}
      subtitle={`${'★'.repeat(r.danger)} · Viaje: ${r.travelSlots} franja${r.travelSlots > 1 ? 's' : ''} de ida y ${r.travelSlots} de vuelta · ~${days} día(s)`}
      onClose={() => store.setUi({ panel: null, regionId: null })}
      footer={
        <button className="btn primary big" onClick={() => store.run(startExpedition, r.id)}>
          🧭 Partir con {members.length} {members.length === 1 ? 'persona' : 'personas'}
        </button>
      }
      wide
    >
      <p>{r.description}</p>
      <div className="zone-grid">
        {r.zoneDefs.map((z) => (
          <article key={z.id} className="zone-card">
            <b>{z.name}</b> <span className="danger">{'★'.repeat(z.danger)}</span>
            <small className="muted block">Monstruos: {Object.keys(z.families).map((f) => FAMILY_LABEL[f] ?? f).join(', ')}</small>
            <small className="muted block">Vetas: {[...new Set(z.vetas.map((v) => c.materials[v.material].name))].join(', ')}</small>
            <small className="muted block">Árboles: {[...new Set(z.arboles.map((v) => c.materials[v.material].name))].join(', ')}</small>
          </article>
        ))}
      </div>
      {r.boss && <p className="small">👑 En {r.zoneDefs[r.boss.zone - 1]?.name ?? 'lo más hondo'} espera <b>{c.monsters[r.boss.monsters[0]].name}</b>. Es un desafío para un grupo bien equipado.</p>}

      <h4>Preparación</h4>
      <ul className="tag-list">
        <li>⚡ Energía: {expeditionEnergy(s, members, c)} (cada {BALANCE.expedition.energyPerSlot} gastados pasa una franja)</li>
        <li>🎒 Carga: {expeditionCapacity(s, members, c)} unidades</li>
        {tools.map((t) => (
          <li key={t.tag} className={t.item ? '' : 'bad-text'}>
            🔧 {TOOL_NAME[t.tag]}: {t.item ? `${t.item.name} (nivel ${t.tier})` : 'no tenés'}
          </li>
        ))}
        {unarmed.map((id) => <li key={id} className="bad-text">⚠ {s.characters[id].name} no tiene arma equipada.</li>)}
        {injured.map((ch) => <li key={ch.id} className="muted">🤕 {ch.name} se queda: herido hasta el día {ch.injuredUntilDay}.</li>)}
      </ul>
      <p className="muted small">Si el grupo cae, perdés la mitad de lo juntado y despertás en la ciudad. Al volver, todos recuperan la vida.</p>
    </Panel>
  );
}
