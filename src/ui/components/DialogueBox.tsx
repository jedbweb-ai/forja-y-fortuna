import { visibleOptions } from '../../core/dialogue';
import { relationLevel } from '../../core/state';
import { canGiftToday } from '../../core/town/relations';
import { store, useSnapshot } from '../hooks';
import { portraitUrl } from './Swatch';

function hex(n: number) {
  return `#${n.toString(16).padStart(6, '0')}`;
}

export function DialogueBox() {
  const { state, ui } = useSnapshot();
  const d = ui.dialogue;
  if (!d || !state) return null;
  const c = store.content;
  const npc = c.npcs[d.npcId];
  const node = d.dialogueId && d.nodeId ? c.dialogues[d.dialogueId].nodes[d.nodeId] : null;
  const relation = state.npcs[d.npcId]?.relation ?? 0;
  const speaker = node?.speaker === 'player' ? 'Vos' : npc.name;
  const options = node ? visibleOptions(state, node) : [];

  return (
    <div className="dialogue-wrap">
      <section className="dialogue" aria-live="polite">
        <div className="portrait" style={{ background: hex(npc.look.body), borderColor: hex(npc.look.accent) }}>
          {portraitUrl(d.npcId) ? <img className="art-portrait" src={portraitUrl(d.npcId)} alt="" /> : <span style={{ background: hex(npc.look.hair) }} />}
        </div>
        <div className="dialogue-main">
          <header>
            <b>{speaker}</b>
            <small className="muted">{npc.role} · {relationLevel(relation)} ({relation})</small>
          </header>
          <p>{node ? node.text : d.busyLine}</p>
          <div className="dialogue-options">
            {options.map(({ option, index, enabled }) => (
              <button key={index} className="btn" data-key={String(index + 1)} disabled={!enabled} onClick={() => store.chooseDialogueOption(index)}>{option.text}</button>
            ))}
            {!options.length && (
              <button className="btn primary" data-key="enter" onClick={() => (node?.next ? store.continueDialogue() : store.closeDialogue())}>
                {node?.next ? 'Continuar' : 'Despedirse'}
              </button>
            )}
            {!options.length && !node?.next && canGiftToday(state, d.npcId) && (
              <button className="btn" onClick={() => store.openContacts(d.npcId)}>🎁 Regalar</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
