import type { GrimoireDef } from '../core/magic/types';

// Grimorios: enseñan encantamientos para siempre (nunca hechizos para el herrero) y revelan combinaciones.
export const GRIMOIRES: GrimoireDef[] = [
  { id: 'tratado_fuego_vivo', name: 'Tratado del Fuego Vivo', tier: 2, price: 140, teaches: ['abanico_brasas', 'lluvia_ascuas'], reveals: ['brasa_viva', 'punta_ignea'], description: 'Un manual chamuscado de un herrero de las forjas viejas. Huele a humo.' },
  { id: 'codice_escarcha', name: 'Códice de la Escarcha', tier: 2, price: 140, teaches: ['nova_escarcha', 'flecha_glacial', 'escudo_glacial'], reveals: ['corazon_escarcha', 'forro_helado'], description: 'Tapas heladas al tacto. Escrito por alguien que odiaba el verano.' },
  { id: 'cantos_marea', name: 'Cantos de la Marea', tier: 2, price: 120, teaches: ['ola', 'nube_toxica'], reveals: ['forro_viscoso'], description: 'Canciones de pescadores convertidas en recetas de encantamiento.' },
  { id: 'salterio_alba', name: 'Salterio del Alba', tier: 2, price: 160, teaches: ['castigo_sagrado', 'regeneracion'], reveals: ['plata_consagrada', 'arco_luna'], description: 'Un libro de oraciones con márgenes llenos de notas de forja.' },
  { id: 'manual_guardian', name: 'Manual del Guardián', tier: 2, price: 150, teaches: ['bastion', 'sismo'], reveals: ['escudo_goblin', 'peto_jabali'], description: 'El manual de un viejo capitán de la guardia. Subrayado con furia.' },
  { id: 'libro_tormentas', name: 'Libro de las Tormentas', tier: 3, price: 260, teaches: ['lanza_rayo', 'tormenta'], reveals: ['chispa_cobre'], description: 'Las páginas chisporrotean. No se vende en ninguna librería decente.' },
  { id: 'cuaderno_odon', name: 'Cuaderno de Odón', tier: 3, price: 0, teaches: ['drenar', 'reserva_arcana'], reveals: ['garra_desgarro', 'pomo_corona'], description: 'Las notas de tu maestro. Hay cosas que nunca te contó.' },
];
