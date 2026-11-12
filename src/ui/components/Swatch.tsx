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

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * Retrato de un personaje o NPC: el dibujo si existe; si no, un círculo con los colores de su ropa y su pelo.
 * Tamaños: tiny (botones), small (listas), y el normal (diálogo, ficha).
 */
export function Portrait({ id, look, size }: { id: string; look?: { body: number; hair: number; accent: number }; size?: 'tiny' | 'small' }) {
  const url = portraitUrl(id);
  const style = look ? { background: hex(look.body), borderColor: hex(look.accent) } : undefined;
  return (
    <span className={`portrait${size ? ` ${size}` : ''}`} style={style}>
      {url ? <img className="art-portrait" src={url} alt="" /> : look && <span style={{ background: hex(look.hair) }} />}
    </span>
  );
}
