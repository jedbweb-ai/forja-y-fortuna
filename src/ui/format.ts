import type { Affinity, ItemCategory, MaterialType, Rarity, StatKey, TimeSlot } from '../core/types';

export const RARITY_CLASS: Record<Rarity, string> = {
  'común': 'r-comun',
  'poco común': 'r-poco',
  'raro': 'r-raro',
  'épico': 'r-epico',
  'legendario': 'r-legendario',
};

export const SLOT_ICON: Record<TimeSlot, string> = { 'mañana': '☀️', tarde: '🌇', noche: '🌙' };

export const AFFINITY_LABEL: Record<Affinity, string> = {
  fuego: '🔥 Fuego', hielo: '❄️ Hielo', rayo: '⚡ Rayo', agua: '💧 Agua', tierra: '🪨 Tierra',
  viento: '🌪️ Viento', sagrado: '✨ Sagrado', oscuro: '🌑 Oscuro', veneno: '☠️ Veneno',
};

export const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  metal: 'Metales', madera: 'Maderas', cuero: 'Cueros', fibra: 'Fibras', gema: 'Gemas', monstruo: 'Partes de monstruo', hierba: 'Hierbas', especial: 'Especiales y alquimia',
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  arma: 'Arma cuerpo a cuerpo', distancia: 'Arma a distancia', municion: 'Munición', arrojadizo: 'Arrojadizo',
  escudo: 'Escudo', armadura: 'Armadura', joyeria: 'Joyería', herramienta: 'Herramienta', pocion: 'Poción', runa: 'Runa',
};

const STAT_LABEL: Record<StatKey, string> = { atk: 'Daño', def: 'Defensa', spd: 'Velocidad', wgt: 'Peso', dur: 'Durabilidad' };

/** Stats relevantes y su etiqueta según la categoría. */
export function statsFor(category: ItemCategory): { key: StatKey; label: string }[] {
  const defensive = category === 'escudo' || category === 'armadura';
  const keys: StatKey[] = defensive ? ['def', 'spd', 'wgt', 'dur'] : ['atk', 'spd', 'wgt', 'dur'];
  return keys.map((key) => ({ key, label: key === 'atk' && category === 'herramienta' ? 'Potencia' : STAT_LABEL[key] }));
}

export function pct(p: number) {
  return `${Math.round(p * 100)}%`;
}

export function money(n: number) {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}
