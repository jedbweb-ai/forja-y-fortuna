import type { TalentDef, UpgradeDef } from '../core/progress/types';

// Talentos: cada nivel de una habilidad (después del primero) da un punto para su árbol.
const t = (skill: TalentDef['skill'], id: string, name: string, maxRank: number, minLevel: number, effect: TalentDef['effect'], description: string, requires?: string): TalentDef =>
  ({ id, skill, name, maxRank, minLevel, effect, description, requires });

export const TALENTS: TalentDef[] = [
  // Herrería
  t('herreria', 'fuego_parejo', 'Fuego parejo', 3, 2, { forjaCalidadInicial: 3 }, 'Cada pieza arranca con +3 de calidad por rango.'),
  t('herreria', 'golpe_firme', 'Golpe firme', 3, 2, { forjaDefecto: 0.008 }, 'Menos riesgo de defecto en cada golpe.'),
  t('herreria', 'ojo_experto', 'Ojo experto', 3, 3, { forjaRasgo: 0.03 }, 'Más chance de que la pieza salga con un rasgo.', 'golpe_firme'),
  t('herreria', 'golpe_maestro', 'Golpe maestro', 2, 5, { forjaPerfecto: 0.03 }, 'Más golpes perfectos.', 'ojo_experto'),
  t('herreria', 'intuicion', 'Intuición de herrero', 2, 6, { forjaIntuicion: 0.1 }, 'Al terminar una pieza, a veces se te ocurre una combinación nueva y la anotás en el libro.', 'ojo_experto'),
  // Armería
  t('armeria', 'filos_vivos', 'Filos vivos', 3, 2, { armaAtaque: 4 }, 'Las armas que forjás pegan un 4% más por rango.'),
  t('armeria', 'placas_firmes', 'Placas firmes', 3, 2, { armaduraDefensa: 4 }, 'Escudos y armaduras protegen un 4% más por rango.'),
  // Flechería
  t('flecheria', 'lotes_grandes', 'Lotes grandes', 3, 2, { loteExtra: 10 }, 'Un 10% más de unidades por lote de flechas y arrojadizos.'),
  t('flecheria', 'mano_rapida', 'Mano rápida', 2, 5, { loteExtra: 10 }, 'Otro 10% más por lote.', 'lotes_grandes'),
  // Joyería
  t('joyeria', 'engaste_preciso', 'Engaste preciso', 3, 2, { joyaCalidad: 4 }, 'Las joyas arrancan con +4 de calidad por rango.'),
  // Runas
  t('runas', 'trazo_firme', 'Trazo firme', 3, 2, { runaCalidad: 4 }, 'Las runas arrancan con +4 de calidad por rango.'),
  // Alquimia
  t('alquimia', 'pulso_firme', 'Pulso firme', 3, 2, { alquimiaFalla: 0.04 }, 'Menos chance de arruinar una tanda.'),
  t('alquimia', 'tanda_generosa', 'Tanda generosa', 1, 4, { alquimiaExtra: 1 }, 'Cada tanda da una unidad más.', 'pulso_firme'),
  // Recolección
  t('mineria', 'veta_generosa', 'Veta generosa', 3, 2, { mineriaExtra: 0.1 }, 'Más chance de sacar una unidad extra de vetas y gemas.'),
  t('tala', 'corte_limpio', 'Corte limpio', 3, 2, { talaExtra: 0.1 }, 'Más chance de una unidad extra al talar.'),
  t('siega', 'mano_verde', 'Mano verde', 3, 2, { siegaExtra: 0.1 }, 'Más chance de una unidad extra al cortar hierbas.'),
  t('desuello', 'cuchillo_fino', 'Cuchillo fino', 3, 2, { desuelloExtra: 0.15 }, 'Más chance de sacar un cuero o una parte extra al desollar.'),
  // Comercio
  t('comercio', 'labia', 'Labia', 3, 2, { regateo: 3 }, 'Los clientes aceptan pagar un 3% más por rango.'),
  t('comercio', 'mayorista', 'Mayorista', 2, 3, { ventaRapida: 6 }, 'La venta rápida del mercado paga un 6% más por rango.'),
  // Combate (del herrero)
  t('combate', 'brazo_fuerte', 'Brazo fuerte', 3, 2, { combateAtaque: 4 }, 'El herrero pega un 4% más por rango.'),
  t('combate', 'piel_curtida', 'Piel curtida', 3, 2, { combateDefensa: 4 }, 'El herrero se defiende un 4% mejor por rango.'),
  t('combate', 'mochila_grande', 'Mochila grande', 2, 3, { carga: 5 }, '+5 de carga en expediciones y mazmorras.'),
  t('combate', 'aliento_largo', 'Aliento largo', 2, 4, { energia: 3 }, '+3 de energía en expediciones y mazmorras.', 'mochila_grande'),
];

// Mejoras de la herrería. Cada nivel suma su efecto al anterior.
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'yunque', name: 'Yunque', icon: '🔨', description: 'Un yunque mejor templa mejor: más calidad de entrada y menos defectos.',
    levels: [
      { cost: { gold: 150, materials: [{ id: 'hierro', qty: 10 }, { id: 'acero', qty: 4 }] }, effect: { forjaCalidadInicial: 4, forjaDefecto: 0.01 }, description: 'Yunque de acero: +4 de calidad inicial y menos defectos.' },
      { cost: { gold: 400, materials: [{ id: 'acero', qty: 8 }, { id: 'brasalita', qty: 4 }] }, effect: { forjaCalidadInicial: 4, forjaDefecto: 0.01 }, description: 'Yunque de maestro: otros +4 de calidad y aún menos defectos.' },
    ],
  },
  {
    id: 'banco_flechas', name: 'Banco de flechería', icon: '🏹', description: 'Moldes y plantillas: más unidades por lote.',
    levels: [
      { cost: { gold: 100, materials: [{ id: 'roble', qty: 6 }, { id: 'hierro', qty: 4 }] }, effect: { loteExtra: 20 }, description: 'Plantillas de astil: +20% de unidades por lote.' },
      { cost: { gold: 280, materials: [{ id: 'sauceluna', qty: 4 }, { id: 'acero', qty: 3 }] }, effect: { loteExtra: 20 }, description: 'Moldes de punta: otro +20% por lote.' },
    ],
  },
  {
    id: 'mesa_joyas', name: 'Mesa de joyería', icon: '💍', description: 'Lupas y pinzas finas: las joyas salen con más calidad.',
    levels: [
      { cost: { gold: 160, materials: [{ id: 'plata', qty: 4 }] }, effect: { joyaCalidad: 6 }, description: 'Lupa de cristal: +6 de calidad en joyas.' },
      { cost: { gold: 380, materials: [{ id: 'plata', qty: 6 }, { id: 'opalo_lunar', qty: 1 }] }, effect: { joyaCalidad: 6 }, description: 'Banco de orfebre: otros +6.' },
    ],
  },
  {
    id: 'mesa_runas', name: 'Mesa de runas', icon: 'ᚱ', description: 'Cinceles y una piedra de grabado mejor.',
    levels: [
      { cost: { gold: 160, materials: [{ id: 'piedra_runica', qty: 4 }] }, effect: { runaCalidad: 6 }, description: 'Cinceles finos: +6 de calidad en runas.' },
      { cost: { gold: 380, materials: [{ id: 'nucleo_runico', qty: 1 }, { id: 'piedra_encantada', qty: 3 }] }, effect: { runaCalidad: 6 }, description: 'Piedra de grabado viva: otros +6.' },
    ],
  },
  {
    id: 'mesa_alquimia', name: 'Mesa de alquimia', icon: '⚗️', description: 'Alambiques mejores: menos tandas arruinadas y más unidades.',
    levels: [
      { cost: { gold: 140, materials: [{ id: 'cobre', qty: 6 }] }, effect: { alquimiaFalla: 0.05 }, description: 'Alambique de cobre: menos chance de arruinar la tanda.' },
      { cost: { gold: 320, materials: [{ id: 'cobre', qty: 6 }, { id: 'cuarzo_igneo', qty: 2 }] }, effect: { alquimiaFalla: 0.05, alquimiaExtra: 1 }, description: 'Destilador doble: una unidad más por tanda.' },
    ],
  },
  {
    id: 'vitrinas', name: 'Vitrinas', icon: '🗄️', description: 'Más lugar para exhibir en la tienda.',
    levels: [
      { cost: { gold: 120, materials: [{ id: 'roble', qty: 6 }] }, effect: { exhibicion: 4 }, description: '12 lugares de exhibición.' },
      { cost: { gold: 300, materials: [{ id: 'roble', qty: 8 }, { id: 'plata', qty: 2 }] }, effect: { exhibicion: 4 }, description: '16 lugares de exhibición.' },
    ],
  },
  {
    id: 'decoracion', name: 'Decoración', icon: '🖼️', description: 'Un local lindo atrae a nobles, coleccionistas y magos.',
    levels: [
      { cost: { gold: 120, materials: [{ id: 'cuero_curtido', qty: 4 }] }, effect: { atractivo: 1 }, description: 'Tapices y una alfombra: más clientes de nivel alto.' },
      { cost: { gold: 280, materials: [{ id: 'plata', qty: 3 }] }, effect: { atractivo: 1 }, description: 'Candelabros de plata.' },
      { cost: { gold: 600, materials: [{ id: 'rubi', qty: 1 }, { id: 'zafiro', qty: 1 }] }, effect: { atractivo: 1 }, description: 'Vitral de gemas: el taller más lindo del valle.', reputationMin: 35 },
    ],
  },
  {
    id: 'cuarto', name: 'Cuarto para compañeros', icon: '🛏️', description: 'Un lugar para que viva un compañero más: el grupo pasa a ser de 4.',
    levels: [
      { cost: { gold: 600, materials: [{ id: 'roble', qty: 10 }, { id: 'cuero_curtido', qty: 6 }] }, effect: { grupo: 1 }, description: 'El grupo puede ser de 4.', reputationMin: 70 },
    ],
  },
];
