import type { GameState } from '../core/types';

/** Versión actual del formato de guardado. Subirla junto con una migración. */
export const SAVE_VERSION = 1;

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
  // 1: (save) => ({ ...save, version: 2, state: { ...save.state, nuevoCampo: valor } }),
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
