import { ART } from '../../game/render/assets';
import type { ItemInstance } from '../../core/types';

/** Clave del ícono de un objeto: el de su plano, su receta de poción o su runa. */
export function itemIcon(item: ItemInstance): string {
  return `icon.${item.potion?.recipe ?? item.blueprintId}`;
}

/** Ícono de arte definitivo si existe (icon.<id>); si no, el cuadradito de color de siempre. */
export function Swatch({ icon, color, big }: { icon: string; color: string; big?: boolean }) {
  const url = ART[icon];
  const cls = big ? 'item-swatch' : 'swatch';
  if (url) return <img className={`${cls} art-icon`} src={url} alt="" />;
  return <span className={cls} style={{ background: color }} />;
}

/** Retrato de arte definitivo (retrato.<id>), si existe. */
export function portraitUrl(id: string): string | undefined {
  return ART[`retrato.${id}`];
}
