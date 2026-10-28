import type { ReactNode } from 'react';
import { store } from '../hooks';

interface Props {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  wide?: boolean;
}

/** Hoja modal estándar: encabezado fijo, cuerpo con scroll y pie opcional. */
export function Panel({ title, subtitle, children, footer, onClose, wide }: Props) {
  const close = onClose ?? (() => store.closePanel());
  return (
    <div className="panel-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <section className={`panel ${wide ? 'panel-wide' : ''}`} role="dialog" aria-label={title}>
        <header className="panel-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <div className="panel-sub">{subtitle}</div>}
          </div>
          <button className="btn-icon" data-key="esc" onClick={close} aria-label="Cerrar" title="Cerrar (Esc)">✕</button>
        </header>
        <div className="panel-body">{children}</div>
        {footer && <footer className="panel-foot">{footer}</footer>}
      </section>
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={value === o.id ? 'tab on' : 'tab'} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
