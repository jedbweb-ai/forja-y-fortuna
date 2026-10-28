import { createHerrero } from '../core/party/progression';
import { EMPTY_SKILLS } from '../core/state';
import type { GameState } from '../core/types';

/** Versión actual del formato de guardado. Subirla junto con una migración. */
export const SAVE_VERSION = 3;

/**
 * Formato del guardado. Es JSON plano para que el mismo archivo pueda subirse
 * más adelante a la nube (Supabase) sin cambios.
 */
export interface SaveFile {
  version: number;
  slot: string;
  savedAt: string;
  /** Resumen legible para listar partidas sin deserializar todo. */
  summary: { day: number; gold: number };
  state: GameState;
}

/** Una migración recibe un save de la versión N y devuelve uno de la N+1. */
export type Migration = (save: { version: number; state: Record<string, unknown> } & Record<string, unknown>) => typeof save;

/** Migraciones registradas, indexadas por versión de origen. */
export const MIGRATIONS: Record<number, Migration> = {
  // Fase 2: personajes, grupo, expediciones, mercado diario y herramientas nuevas.
  1: (save) => {
    const st = save.state as Record<string, unknown> & { skills?: Record<string, number>; knownBlueprints?: string[]; knownEnchantments?: string[] };
    const add = (list: string[] | undefined, ids: string[]) => [...new Set([...(list ?? []), ...ids])];
    return {
      ...save,
      version: 2,
      state: {
        ...st,
        skills: { ...EMPTY_SKILLS, ...(st.skills ?? {}) },
        characters: { herrero: createHerrero() },
        party: ['herrero'],
        expedition: null,
        market: null,
        knownBlueprints: add(st.knownBlueprints, ['hacha_tala', 'cuchillo_desuello']),
        knownEnchantments: add(st.knownEnchantments, ['runa_totem', 'runa_nucleo']),
      },
    };
  },
  // Fase 3: grimorios, cinturón de pociones, alquimia, joyería, arrojadizos y runas nuevas.
  2: (save) => {
    type Exp = { combat?: { terrainFx?: unknown; burnt?: unknown; units?: { abilities?: unknown }[] } | null } | null;
    const st = save.state as Record<string, unknown> & {
      skills?: Record<string, number>; knownBlueprints?: string[]; knownEnchantments?: string[]; expedition?: Exp;
    };
    const add = (list: string[] | undefined, ids: string[]) => [...new Set([...(list ?? []), ...ids])];
    const combat = st.expedition?.combat;
    if (combat) {
      combat.terrainFx ??= {};
      combat.burnt ??= [];
      for (const u of combat.units ?? []) u.abilities ??= {};
    }
    return {
      ...save,
      version: 3,
      state: {
        ...st,
        skills: { ...EMPTY_SKILLS, ...(st.skills ?? {}) },
        grimoires: [],
        belt: {},
        discoveredPotions: ['pocion_curacion', 'antidoto', 'tonico_fuerza', 'elixir_piel_hierro', 'bomba_humo', 'r_agua_bendita', 'r_aceite_alquimico'],
        knownBlueprints: add(st.knownBlueprints, ['anillo', 'amuleto', 'talisman', 'cuchillos_arrojadizos', 'hoz']),
        knownEnchantments: add(st.knownEnchantments, [
          'runa_llama', 'runa_escarcha', 'runa_chispa', 'runa_marea', 'runa_vendaval', 'runa_roca', 'runa_alivio', 'runa_paso',
        ]),
      },
    };
  },
};

export function migrateSave(raw: unknown, migrations: Record<number, Migration> = MIGRATIONS, target = SAVE_VERSION): SaveFile {
  if (!raw || typeof raw !== 'object' || typeof (raw as { version?: unknown }).version !== 'number') {
    throw new Error('Guardado inválido.');
  }
  let save = raw as Parameters<Migration>[0];
  if (save.version > target) throw new Error(`Guardado de una versión más nueva (${save.version}).`);
  while (save.version < target) {
    const step = migrations[save.version];
    if (!step) throw new Error(`Falta la migración desde la versión ${save.version}.`);
    save = step(save);
  }
  return save as unknown as SaveFile;
}

export function makeSaveFile(state: GameState, slot = 'auto'): SaveFile {
  return {
    version: SAVE_VERSION,
    slot,
    savedAt: new Date().toISOString(),
    summary: { day: state.day, gold: state.gold },
    state,
  };
}

/** Repositorio de partidas. Hoy IndexedDB; mañana se suma uno en la nube con la misma interfaz. */
export interface SaveRepository {
  load(slot: string): Promise<SaveFile | null>;
  save(file: SaveFile): Promise<void>;
  remove(slot: string): Promise<void>;
  list(): Promise<Pick<SaveFile, 'slot' | 'savedAt' | 'summary' | 'version'>[]>;
}
