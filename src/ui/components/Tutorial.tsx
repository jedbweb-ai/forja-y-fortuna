import { useState } from 'react';
import { currentStep, setGuide } from '../../core/tutorial/tutorial';
import { store, useSnapshot } from '../hooks';

/** La tarjeta de la guía de primeros pasos: el próximo paso, con lo que dice el maestro. */
export function TutorialCard() {
  const { state } = useSnapshot();
  const [open, setOpen] = useState(true);
  if (!state) return null;
  const c = store.content;
  const step = currentStep(c, state);
  if (!step) return null;
  const total = c.tutorial.steps.length;
  const done = state.tutorial.done.length;

  return (
    <aside className={`tut-card${open ? '' : ' closed'}`} aria-label="Guía de primeros pasos">
      <button className="tut-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>📖 Notas del maestro · {done}/{total}</span>
        <b>{step.title}</b>
      </button>
      {open && (
        <>
          <p>{step.text}</p>
          <div className="tut-actions">
            <button className="btn" onClick={() => setOpen(false)}>Ocultar</button>
            <button className="btn" onClick={() => store.run(setGuide, false)}>Saltar la guía</button>
          </div>
        </>
      )}
    </aside>
  );
}

/** Un consejo del maestro (la primera vez que se entra a algo), o su despedida al terminar la guía. */
export function TipModal() {
  const { ui } = useSnapshot();
  if (!ui.tip) return null;
  const c = store.content;
  const tip = ui.tip === 'fin' ? { title: 'Lo básico, aprendido', text: c.tutorial.end } : c.tutorial.tips[ui.tip];
  if (!tip) return null;
  return (
    <div className="card-backdrop tip-backdrop" onClick={() => store.closeTip()}>
      <article className="tip-card" role="dialog" aria-label={tip.title} onClick={(e) => e.stopPropagation()}>
        <header>📖 {tip.title}</header>
        <p>{tip.text}</p>
        <button className="btn primary" data-key="enter" onClick={() => store.closeTip()}>Entendido</button>
      </article>
    </div>
  );
}
