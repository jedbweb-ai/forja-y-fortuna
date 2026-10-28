import type { ContractDef } from '../core/town/types';

// Contratos de mercaderes: volumen fijo, entregas cada tantos días y precio garantizado por unidad.
// El precio no depende de la demanda: conviene cuando el mercado está saturado.
export const CONTRACTS: ContractDef[] = [
  {
    id: 'k_flechas', title: 'Flechas para la costa', merchant: 'odalrico', weight: 3,
    text: 'Odalrico revende flechas en los puertos. Pide lotes regulares y paga parejo.',
    item: { category: 'municion', minQuality: 25, qty: 20 }, deliveries: 3, everyDays: 3, pricePerUnit: 2.5,
    bonus: { gold: 40, reputation: 3, relation: 6 }, penalty: { reputation: 4, relation: 10 },
  },
  {
    id: 'k_cuchillos', title: 'Cuchillos para escoltas', merchant: 'odalrico', weight: 2,
    text: 'Las caravanas del sur llevan escoltas con cuchillos arrojadizos. Siempre faltan.',
    item: { category: 'arrojadizo', minQuality: 25, qty: 10 }, deliveries: 3, everyDays: 3, pricePerUnit: 4,
    bonus: { gold: 45, reputation: 3, relation: 6 }, penalty: { reputation: 4, relation: 10 },
  },
  {
    id: 'k_picos', title: 'Picos para la Cantera Gris', merchant: 'odalrico', weight: 2,
    text: 'La cantera rompe picos más rápido de lo que los compra. Dos por entrega.',
    item: { blueprints: ['pico'], minQuality: 30, qty: 2 }, deliveries: 2, everyDays: 4, pricePerUnit: 55,
    bonus: { gold: 50, reputation: 3, relation: 6 }, penalty: { reputation: 4, relation: 10 },
  },
  {
    id: 'k_dagas', title: 'Dagas para la caravana del sur', merchant: 'odalrico', weight: 1.5, minReputation: 10,
    text: 'Una caravana armada sale en una semana. Necesita dagas parejas, sin sorpresas.',
    item: { blueprints: ['daga'], minQuality: 35, qty: 2 }, deliveries: 3, everyDays: 3, pricePerUnit: 52,
    bonus: { gold: 80, reputation: 4, relation: 8 }, penalty: { reputation: 5, relation: 10 },
  },
  {
    id: 'k_escudos_guardia', title: 'Escudos para la guardia', merchant: 'braulio', weight: 1.5, minReputation: 10,
    text: 'El capitán Tizón consiguió presupuesto: escudos para renovar la guardia entera.',
    item: { category: 'escudo', minQuality: 40, qty: 2 }, deliveries: 2, everyDays: 4, pricePerUnit: 75,
    bonus: { gold: 60, reputation: 6, relation: 10 }, penalty: { reputation: 6, relation: 12 },
  },
  {
    id: 'k_pociones', title: 'Pociones para el gremio', merchant: 'odalrico', weight: 1.5,
    text: 'El gremio compra pociones de curación por cajón para sus expediciones.',
    item: { category: 'pocion', blueprints: ['pocion_curacion', 'pocion_curacion_mayor'], qty: 3 }, deliveries: 3, everyDays: 3, pricePerUnit: 16,
    bonus: { gold: 40, reputation: 3, relation: 6 }, penalty: { reputation: 4, relation: 10 },
  },
  {
    id: 'k_materiales_ilse', title: 'Herramientas para Ilse', merchant: 'ilse', weight: 1,
    text: 'Ilse revende herramientas a los mineros de las colinas. Quiere un proveedor fijo.',
    item: { category: 'herramienta', minQuality: 30, qty: 1 }, deliveries: 3, everyDays: 3, pricePerUnit: 55,
    bonus: { gold: 50, reputation: 2, relation: 12 }, penalty: { reputation: 3, relation: 12 },
  },
];
