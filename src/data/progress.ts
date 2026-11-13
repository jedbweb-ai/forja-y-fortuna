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
  t('herreria', 'temple_paciente', 'Temple paciente', 2, 8, { forjaCalidadInicial: 5 }, 'Cada pieza arranca con +5 de calidad por rango.', 'fuego_parejo'),
  t('herreria', 'maestro_forjador', 'Maestro forjador', 1, 10, { forjaDefecto: 0.01, forjaPerfecto: 0.03 }, 'Menos defectos y más golpes perfectos a la vez.', 'golpe_maestro'),
  // Armería
  t('armeria', 'filos_vivos', 'Filos vivos', 3, 2, { armaAtaque: 4 }, 'Las armas que forjás pegan un 4% más por rango.'),
  t('armeria', 'placas_firmes', 'Placas firmes', 3, 2, { armaduraDefensa: 4 }, 'Escudos y armaduras protegen un 4% más por rango.'),
  t('armeria', 'filo_leyenda', 'Filo de leyenda', 2, 6, { armaAtaque: 6 }, 'Las armas que forjás pegan otro 6% más por rango.', 'filos_vivos'),
  t('armeria', 'bastion', 'Bastión', 2, 6, { armaduraDefensa: 6 }, 'Escudos y armaduras protegen otro 6% más por rango.', 'placas_firmes'),
  t('armeria', 'equilibrio_perfecto', 'Equilibrio perfecto', 1, 9, { armaAtaque: 3, armaduraDefensa: 3 }, 'Armas un 3% más fuertes y armaduras un 3% más firmes.', 'filo_leyenda'),
  // Flechería
  t('flecheria', 'lotes_grandes', 'Lotes grandes', 3, 2, { loteExtra: 10 }, 'Un 10% más de unidades por lote de flechas y arrojadizos.'),
  t('flecheria', 'mano_rapida', 'Mano rápida', 2, 5, { loteExtra: 10 }, 'Otro 10% más por lote.', 'lotes_grandes'),
  t('flecheria', 'puntas_templadas', 'Puntas templadas', 3, 3, { distanciaAtaque: 4 }, 'Arcos, ballestas, flechas y arrojadizos pegan un 4% más por rango.'),
  t('flecheria', 'plumas_parejas', 'Plumas parejas', 2, 5, { distanciaAtaque: 4 }, 'Otro 4% más de daño a distancia por rango.', 'puntas_templadas'),
  t('flecheria', 'carcaj_sin_fondo', 'Carcaj sin fondo', 2, 8, { loteExtra: 15 }, 'Un 15% más de unidades por lote, por rango.', 'mano_rapida'),
  // Joyería
  t('joyeria', 'engaste_preciso', 'Engaste preciso', 3, 2, { joyaCalidad: 4 }, 'Las joyas arrancan con +4 de calidad por rango.'),
  t('joyeria', 'pulso_orfebre', 'Pulso de orfebre', 3, 3, { joyaDefecto: 0.008 }, 'Menos riesgo de defecto al trabajar joyas.', 'engaste_preciso'),
  t('joyeria', 'ojo_gemas', 'Ojo para las gemas', 2, 5, { joyaRasgo: 0.03 }, 'Más chance de que la joya salga con un rasgo.', 'pulso_orfebre'),
  t('joyeria', 'gema_perfecta', 'Gema perfecta', 2, 7, { joyaPerfecto: 0.03 }, 'Más golpes perfectos en la mesa de joyería.', 'ojo_gemas'),
  t('joyeria', 'engaste_maestro', 'Engaste maestro', 2, 9, { joyaCalidad: 6 }, 'Las joyas arrancan con +6 de calidad por rango.', 'gema_perfecta'),
  // Runas
  t('runas', 'trazo_firme', 'Trazo firme', 3, 2, { runaCalidad: 4 }, 'Las runas arrancan con +4 de calidad por rango.'),
  t('runas', 'cincel_seguro', 'Cincel seguro', 3, 3, { runaDefecto: 0.008 }, 'Menos riesgo de defecto al grabar runas.', 'trazo_firme'),
  t('runas', 'grabado_profundo', 'Grabado profundo', 2, 5, { runaCalidad: 6 }, 'Las runas arrancan con +6 de calidad por rango.', 'trazo_firme'),
  t('runas', 'reactivos_justos', 'Reactivos justos', 2, 6, { grimorioAhorro: 15 }, 'Los reactivos de los grimorios cuestan un 15% menos de oro por rango.'),
  t('runas', 'runa_perfecta', 'Runa perfecta', 2, 7, { runaPerfecto: 0.03 }, 'Más golpes perfectos en la mesa de runas.', 'cincel_seguro'),
  // Alquimia
  t('alquimia', 'pulso_firme', 'Pulso firme', 3, 2, { alquimiaFalla: 0.04 }, 'Menos chance de arruinar una tanda.'),
  t('alquimia', 'tanda_generosa', 'Tanda generosa', 1, 4, { alquimiaExtra: 1 }, 'Cada tanda da una unidad más.', 'pulso_firme'),
  t('alquimia', 'ojo_herbolario', 'Ojo de herbolario', 2, 3, { siegaExtra: 0.1 }, 'Sabés qué hierba sirve: más chance de una unidad extra al cortar hierbas.'),
  t('alquimia', 'fuego_medido', 'Fuego medido', 2, 5, { alquimiaFalla: 0.04 }, 'Todavía menos chance de arruinar una tanda.', 'pulso_firme'),
  t('alquimia', 'caldero_grande', 'Caldero grande', 1, 8, { alquimiaExtra: 1 }, 'Cada tanda da otra unidad más.', 'tanda_generosa'),
  // Recolección
  t('mineria', 'veta_generosa', 'Veta generosa', 3, 2, { mineriaExtra: 0.1 }, 'Más chance de sacar una unidad extra de vetas y gemas.'),
  t('mineria', 'conoces_el_metal', 'Conocés el metal', 3, 3, { forjaCalidadInicial: 2 }, 'Sabés elegir el mineral: cada pieza arranca con +2 de calidad por rango.'),
  t('mineria', 'ojo_gemologo', 'Ojo de gemólogo', 2, 5, { joyaCalidad: 3 }, 'Reconocés una buena piedra: las joyas arrancan con +3 de calidad por rango.'),
  t('mineria', 'veta_madre', 'Veta madre', 2, 6, { mineriaExtra: 0.1 }, 'Todavía más chance de una unidad extra de vetas y gemas.', 'veta_generosa'),
  t('mineria', 'espalda_minero', 'Espalda de minero', 1, 8, { carga: 5 }, '+5 de carga en expediciones y mazmorras.', 'veta_madre'),
  t('tala', 'corte_limpio', 'Corte limpio', 3, 2, { talaExtra: 0.1 }, 'Más chance de una unidad extra al talar.'),
  t('tala', 'madera_elegida', 'Madera elegida', 2, 3, { loteExtra: 5 }, 'Buenos astiles: un 5% más de unidades por lote de flechas y arrojadizos.'),
  t('tala', 'astil_derecho', 'Astil derecho', 2, 5, { distanciaAtaque: 3 }, 'Arcos, ballestas, flechas y arrojadizos pegan un 3% más por rango.'),
  t('tala', 'lenador_oficio', 'Leñador de oficio', 2, 6, { talaExtra: 0.1 }, 'Todavía más chance de una unidad extra al talar.', 'corte_limpio'),
  t('tala', 'pulmones_bosque', 'Pulmones de bosque', 1, 8, { energia: 2 }, '+2 de energía en expediciones y mazmorras.', 'lenador_oficio'),
  t('siega', 'mano_verde', 'Mano verde', 3, 2, { siegaExtra: 0.1 }, 'Más chance de una unidad extra al cortar hierbas.'),
  t('siega', 'hierba_fresca', 'Hierba fresca', 3, 3, { alquimiaFalla: 0.02 }, 'Ingredientes frescos: menos chance de arruinar una tanda.'),
  t('siega', 'paso_liviano', 'Paso liviano', 2, 5, { energia: 1 }, '+1 de energía en expediciones y mazmorras por rango.'),
  t('siega', 'herbolaria', 'Herbolaria', 2, 6, { siegaExtra: 0.1 }, 'Todavía más chance de una unidad extra al cortar hierbas.', 'mano_verde'),
  t('siega', 'raiz_entera', 'Raíz entera', 1, 9, { alquimiaExtra: 1 }, 'Sacás la planta entera: cada tanda de alquimia da una unidad más.', 'herbolaria'),
  t('desuello', 'cuchillo_fino', 'Cuchillo fino', 3, 2, { desuelloExtra: 0.15 }, 'Más chance de sacar un cuero o una parte extra al desollar.'),
  t('desuello', 'cuero_bien_curtido', 'Cuero bien curtido', 3, 3, { armaduraDefensa: 3 }, 'Escudos y armaduras protegen un 3% más por rango.'),
  t('desuello', 'ojo_cazador', 'Ojo de cazador', 2, 5, { ventaRapida: 4 }, 'La venta rápida del mercado paga un 4% más por rango.'),
  t('desuello', 'despiece_experto', 'Despiece experto', 2, 6, { desuelloExtra: 0.15 }, 'Todavía más chance de un cuero o una parte extra al desollar.', 'cuchillo_fino'),
  t('desuello', 'rastreador', 'Rastreador', 1, 8, { energia: 2 }, '+2 de energía en expediciones y mazmorras.', 'despiece_experto'),
  // Comercio
  t('comercio', 'labia', 'Labia', 3, 2, { regateo: 3 }, 'Los clientes aceptan pagar un 3% más por rango.'),
  t('comercio', 'mayorista', 'Mayorista', 2, 3, { ventaRapida: 6 }, 'La venta rápida del mercado paga un 6% más por rango.'),
  t('comercio', 'ojo_comprador', 'Ojo de comprador', 3, 3, { compraBarata: 4 }, 'Los materiales del mercado te cuestan un 4% menos por rango.'),
  t('comercio', 'clientela_fiel', 'Clientela fiel', 2, 6, { regateo: 5 }, 'Los clientes aceptan pagar otro 5% más por rango.', 'labia'),
  t('comercio', 'buena_vidriera', 'Buena vidriera', 1, 8, { atractivo: 1 }, 'Tu tienda atrae más nobles, coleccionistas y magos.', 'clientela_fiel'),
  // Combate (del herrero)
  t('combate', 'brazo_fuerte', 'Brazo fuerte', 3, 2, { combateAtaque: 4 }, 'El herrero pega un 4% más por rango.'),
  t('combate', 'piel_curtida', 'Piel curtida', 3, 2, { combateDefensa: 4 }, 'El herrero se defiende un 4% mejor por rango.'),
  t('combate', 'mochila_grande', 'Mochila grande', 2, 3, { carga: 5 }, '+5 de carga en expediciones y mazmorras.'),
  t('combate', 'aliento_largo', 'Aliento largo', 2, 4, { energia: 3 }, '+3 de energía en expediciones y mazmorras.', 'mochila_grande'),
  t('combate', 'golpe_martillo', 'Golpe de martillo', 2, 6, { combateAtaque: 6 }, 'El herrero pega otro 6% más por rango.', 'brazo_fuerte'),
  t('combate', 'guardia_hierro', 'Guardia de hierro', 2, 6, { combateDefensa: 6 }, 'El herrero se defiende otro 6% mejor por rango.', 'piel_curtida'),
  t('combate', 'caminante', 'Caminante', 2, 7, { energia: 3 }, '+3 de energía en expediciones y mazmorras por rango.', 'aliento_largo'),
  t('combate', 'espalda_ancha', 'Espalda ancha', 2, 8, { carga: 5 }, '+5 de carga en expediciones y mazmorras por rango.', 'mochila_grande'),
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
    id: 'personal', name: 'Puestos de trabajo', icon: '🧑‍🏭', description: 'Lugar para que trabaje más gente en la herrería.',
    levels: [
      { cost: { gold: 150, materials: [{ id: 'roble', qty: 6 }] }, effect: { personal: 1 }, description: 'Mostrador grande: 2 puestos de trabajo.' },
      { cost: { gold: 350, materials: [{ id: 'hierro', qty: 10 }, { id: 'acero', qty: 4 }] }, effect: { personal: 1 }, description: 'Segundo yunque: 3 puestos.' },
      { cost: { gold: 600, materials: [{ id: 'roble', qty: 10 }, { id: 'cuero_curtido', qty: 4 }] }, effect: { personal: 1 }, description: 'Trastienda: 4 puestos.', reputationMin: 50 },
    ],
  },
  {
    id: 'cuarto', name: 'Cuarto para compañeros', icon: '🛏️', description: 'Un lugar para que viva un compañero más: el grupo pasa a ser de 5.',
    levels: [
      { cost: { gold: 600, materials: [{ id: 'roble', qty: 10 }, { id: 'cuero_curtido', qty: 6 }] }, effect: { grupo: 1 }, description: 'El grupo puede ser de 5.', reputationMin: 70 },
    ],
  },
];
