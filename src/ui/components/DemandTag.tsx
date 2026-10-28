import { demandOf } from '../../core/town/demand';
import type { ItemCategory } from '../../core/types';
import { useGame } from '../hooks';

/** Etiqueta de demanda de una categoría: solo aparece si se aleja de lo normal. */
export function DemandTag({ category }: { category: ItemCategory }) {
  const s = useGame();
  const d = demandOf(s, category);
  if (Math.abs(d - 1) < 0.08) return null;
  const high = d > 1;
  return (
    <span className={`tag ${high ? 'demand-high' : 'demand-low'}`} title={`Demanda ${Math.round(d * 100)}%`}>
      {high ? '▲' : '▼'} demanda {Math.round(d * 100)}%
    </span>
  );
}
