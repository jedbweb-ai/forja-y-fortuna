import { quenchApplies } from '../../../core/forge/design';
import { Panel } from '../../components/Panel';
import { store, useSnapshot } from '../../hooks';
import { DesignStep } from './DesignStep';
import { EnchantStep, FinishStep, ForgingStep, QuenchStep } from './WorkSteps';

const STAGES = ['Diseño', 'Forjado', 'Temple', 'Acabado', 'Encantamiento'] as const;

export function ForgePanel() {
  const { state } = useSnapshot();
  if (!state) return null;
  const f = state.forge;
  const c = store.content;
  const stageIdx = !f ? 0 : { forging: 1, quench: 2, finish: 3, enchant: 4 }[f.stage];
  const skipsQuench = f && !quenchApplies(c, c.blueprints[f.blueprintId], f.materials);

  if (state.location !== 'herreria') {
    return <Panel title="Forja"><p>Para forjar tenés que estar en tu herrería.</p></Panel>;
  }

  return (
    <Panel
      wide
      title={f ? `Forjando: ${c.blueprints[f.blueprintId].name}` : 'Forja'}
      subtitle={
        <ol className="stepper">
          {STAGES.map((s, i) => (
            <li key={s} className={`${i === stageIdx ? 'on' : ''} ${i < stageIdx ? 'done' : ''} ${i === 2 && skipsQuench ? 'skip' : ''}`}>{s}</li>
          ))}
        </ol>
      }
    >
      {!f && <DesignStep />}
      {f?.stage === 'forging' && <ForgingStep />}
      {f?.stage === 'quench' && <QuenchStep />}
      {f?.stage === 'finish' && <FinishStep />}
      {f?.stage === 'enchant' && <EnchantStep />}
    </Panel>
  );
}
