import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { createInitialState } from '../core/state';
import { makeSaveFile, migrateSave, SAVE_VERSION, type Migration } from './saveFile';

describe('guardado', () => {
  it('un save actual pasa sin cambios', () => {
    const file = makeSaveFile(createInitialState(CONTENT, 1));
    const roundTrip = migrateSave(JSON.parse(JSON.stringify(file)));
    expect(roundTrip.version).toBe(SAVE_VERSION);
    expect(roundTrip.state.gold).toBe(file.state.gold);
  });

  it('aplica migraciones encadenadas', () => {
    const migrations: Record<number, Migration> = {
      1: (s) => ({ ...s, version: 2, state: { ...s.state, campoNuevo: 'hola' } }),
      2: (s) => ({ ...s, version: 3, state: { ...s.state, otro: 5 } }),
    };
    const out = migrateSave({ version: 1, state: { gold: 3 } }, migrations, 3) as unknown as { version: number; state: Record<string, unknown> };
    expect(out.version).toBe(3);
    expect(out.state).toEqual({ gold: 3, campoNuevo: 'hola', otro: 5 });
  });

  it('rechaza saves inválidos o de versiones futuras', () => {
    expect(() => migrateSave(null)).toThrow();
    expect(() => migrateSave({ version: SAVE_VERSION + 1, state: {} })).toThrow();
    expect(() => migrateSave({ version: 0, state: {} }, {}, 1)).toThrow();
  });
});
