import type { ForgeStation } from '../../../bridge/GameStore';
import { quenchApplies } from '../../../core/forge/design';
import type { ForgeSession } from '../../../core/types';
import { Panel } from '../../components/Panel';
import { store, useSnapshot } from '../../hooks';
import { DesignStep, onStation } from './DesignStep';
import { RuneStep } from './RuneStep';
import { EnchantStep, FinishStep, ForgingStep, QuenchStep } from './WorkSteps';

const STAGES = ['Diseño', 'Forjado', 'Temple', 'Acabado', 'Encantamiento'] as const;
const RUNE_STAGES = ['Runa', 'Grabado'] as const;
const STATION_NAME: Record<ForgeStation, string> = { yunque: 'Forja', joyeria: 'Mesa de joyería', runas: 'Mesa de runas' };

/** Puesto en el que se está haciendo un trabajo en curso. */
function stationOf(f: ForgeSession): ForgeStation {
  if (f.kind === 'runa') return 'runas';
  return store.content.blueprints[f.blueprintId]?.station === 'joyeria' ? 'joyeria' : 'yunque';
}

export function ForgePanel() {
  const { state, ui } = useSnapshot();
  if (!state) return null;
  const f = state.forge;
  const c = store.content;
  const station = f ? stationOf(f) : ui.forgeStation;

  if (state.location !== 'herreria') {
    return <Panel title="Forja"><p>Para trabajar tenés que estar en tu herrería.</p></Panel>;
  }

  const rune = station === 'runas';
  const stages = rune ? RUNE_STAGES : STAGES;
  const stageIdx = !f ? 0 : rune ? 1 : { forging: 1, quench: 2, finish: 3, enchant: 4 }[f.stage];
  const skipsQuench = f && !rune && !quenchApplies(c, c.blueprints[f.blueprintId], f.materials);
  const workName = f ? (f.kind === 'runa' ? c.enchantments[f.blueprintId].name : c.blueprints[f.blueprintId].name) : '';
  const busyElsewhere = f && station !== ui.forgeStation;
  const hasPlans = rune || state.knownBlueprints.some((id) => onStation(c.blueprints[id], station as 'yunque' | 'joyeria'));

  return (
    <Panel
      wide
      title={f ? `${rune ? 'Grabando' : 'Forjando'}: ${workName}` : STATION_NAME[station]}
      subtitle={
        <ol className="stepper">
          {stages.map((s, i) => (
            <li key={s} className={`${i === stageIdx ? 'on' : ''} ${i < stageIdx ? 'done' : ''} ${i === 2 && skipsQuench ? 'skip' : ''}`}>{s}</li>
          ))}
        </ol>
      }
    >
      {busyElsewhere && <p className="small muted">Hay un trabajo sin terminar en {STATION_NAME[station].toLowerCase()}: terminalo antes de empezar otro.</p>}
      {!f && rune && <RuneStep />}
      {!f && !rune && (hasPlans ? <DesignStep key={station} station={station as 'yunque' | 'joyeria'} /> : <p className="muted">No conocés planos para este puesto.</p>)}
      {f?.stage === 'forging' && <ForgingStep />}
      {f?.stage === 'quench' && <QuenchStep />}
      {f?.stage === 'finish' && <FinishStep />}
      {f?.stage === 'enchant' && <EnchantStep />}
    </Panel>
  );
}
