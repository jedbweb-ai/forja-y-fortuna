import type { MarketEventDef } from '../core/world/types';

// Noticias del mercado: cada día salen 1 o 2 y mueven el stock y el precio de las partes de monstruo.
// Sin `materials` ni `tags`, afectan a todas.
export const MARKET_EVENTS: MarketEventDef[] = [
  { id: 'calma', text: 'Día tranquilo en el mercado.', weight: 3, materials: [], priceMult: 1, stockMult: 1 },
  { id: 'cazadores', text: 'Volvió una partida de cazadores del bosque: sobran cueros y colmillos.', weight: 2, tags: ['bestia'], priceMult: 0.7, stockMult: 2 },
  { id: 'plaga_gelines', text: 'Plaga de gelines en los trigales: el gel está casi regalado.', weight: 2, tags: ['slime'], priceMult: 0.6, stockMult: 2.2 },
  { id: 'asalto_goblin', text: 'Los goblins asaltaron una caravana: escasean las partes de monstruo.', weight: 1, priceMult: 1.4, stockMult: 0.4 },
  { id: 'curtidores', text: 'Feria de curtidores en el valle vecino: se llevan toda la piel.', weight: 1, tags: ['bestia'], priceMult: 1.3, stockMult: 0.5 },
  { id: 'alquimista', text: 'Pasó un alquimista viajero comprando ascuas y glándulas.', weight: 1, materials: ['ascua_salamandrilla', 'glandula_veneno'], priceMult: 1.5, stockMult: 0.3 },
  { id: 'guardia_campamento', text: 'La guardia limpió un campamento goblin: hay chatarra y tótems de sobra.', weight: 2, tags: ['goblin'], priceMult: 0.75, stockMult: 2 },
  { id: 'helada', text: 'Helada temprana: el gel de escarcha se consigue fácil.', weight: 1, materials: ['gel_escarcha'], priceMult: 0.6, stockMult: 2.5 },
  { id: 'tejedores', text: 'Los tejedores pagan fortunas por seda de araña.', weight: 1, materials: ['seda_arana'], priceMult: 1.5, stockMult: 0.5 },
  { id: 'salamandras', text: 'Un pastor encontró un nido de salamandrillas: hay ascuas en el puesto.', weight: 1, materials: ['ascua_salamandrilla'], priceMult: 0.7, stockMult: 2.5 },
];
