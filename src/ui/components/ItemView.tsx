import type { Affinities, ItemCategory, Stats } from '../../core/types';
import { AFFINITY_LABEL, statsFor } from '../format';

export function StatList({ stats, category, compare }: { stats: Stats; category: ItemCategory; compare?: Stats }) {
  return (
    <dl className="stats">
      {statsFor(category).map(({ key, label }) => {
        const v = stats[key];
        const diff = compare ? v - compare[key] : 0;
        return (
          <div key={key} className="stat">
            <dt>{label}</dt>
            <dd>
              <span className="bar"><span style={{ width: `${Math.min(100, (v / (key === 'dur' ? 80 : 40)) * 100)}%` }} /></span>
              <b>{v.toFixed(1)}</b>
              {compare && Math.abs(diff) >= 0.1 && <small className={diff > 0 ? 'up' : 'down'}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</small>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function AffinityList({ affinities }: { affinities: Affinities }) {
  const entries = Object.entries(affinities).filter(([, v]) => v) as [keyof typeof AFFINITY_LABEL, number][];
  if (!entries.length) return null;
  return (
    <div className="affinities">
      {entries.map(([a, v]) => <span key={a} className={`aff aff-${a}`}>{AFFINITY_LABEL[a]} {v}</span>)}
    </div>
  );
}
