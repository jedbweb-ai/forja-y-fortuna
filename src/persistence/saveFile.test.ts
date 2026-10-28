import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { createInitialState, syncWithContent } from '../core/state';
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

  it('migra un guardado de la Fase 1 (v1) a la v2', () => {
    const v1 = makeSaveFile(createInitialState(CONTENT, 1)) as unknown as { version: number; state: Record<string, unknown> };
    v1.version = 1;
    for (const k of ['characters', 'party', 'expedition', 'market']) delete v1.state[k];
    v1.state.skills = { herreria: 40, armeria: 0, flecheria: 0, comercio: 5, runas: 0 };
    const out = migrateSave(JSON.parse(JSON.stringify(v1)));
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.state.grimoires).toEqual([]);
    expect(out.state.party).toEqual(['herrero']);
    expect(out.state.characters.herrero.hp).toBeGreaterThan(0);
    expect(out.state.skills.herreria).toBe(40);
    expect(out.state.skills.mineria).toBe(0);
    expect(out.state.knownBlueprints).toContain('hacha_tala');
  });

  it('migra un guardado de la Fase 3 (v3) a la v4 con la vida de la ciudad vacía', () => {
    const v3 = makeSaveFile(createInitialState(CONTENT, 1)) as unknown as { version: number; state: Record<string, unknown> };
    v3.version = 3;
    for (const k of ['quests', 'contracts', 'demand', 'cityEvents', 'auction', 'servantMarket']) delete v3.state[k];
    delete (v3.state.npcs as Record<string, unknown>).yago;
    const out = migrateSave(JSON.parse(JSON.stringify(v3)));
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.state.quests.active).toEqual([]);
    expect(out.state.auction.day).toBeGreaterThan(0);
    syncWithContent(out.state, CONTENT);
    expect(out.state.npcs.yago.relation).toBe(CONTENT.mercenaries.yago.startRelation);
  });

  it('migra un guardado de la Fase 4 (v4) a la v5 con las mazmorras sin recorrer', () => {
    const v4 = makeSaveFile(createInitialState(CONTENT, 1)) as unknown as { version: number; state: Record<string, unknown> };
    v4.version = 4;
    delete v4.state.dungeons;
    const out = migrateSave(JSON.parse(JSON.stringify(v4)));
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.state.dungeons).toEqual({ progress: {}, uniques: [] });
  });

  it('migra un guardado de la Fase 5 (v5) a la v6 con talentos y mejoras vacíos', () => {
    const v5 = makeSaveFile(createInitialState(CONTENT, 1)) as unknown as { version: number; state: Record<string, unknown> };
    v5.version = 5;
    for (const k of ['talents', 'workshop', 'assistant']) delete v5.state[k];
    delete (v5.state.settings as Record<string, unknown>).permadeath;
    const out = migrateSave(JSON.parse(JSON.stringify(v5)));
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.state.talents).toEqual({});
    expect(out.state.workshop).toEqual({});
    expect(out.state.assistant).toBeNull();
    expect(out.state.settings.permadeath).toBe(false);
  });

  it('rechaza saves inválidos o de versiones futuras', () => {
    expect(() => migrateSave(null)).toThrow();
    expect(() => migrateSave({ version: SAVE_VERSION + 1, state: {} })).toThrow();
    expect(() => migrateSave({ version: 0, state: {} }, {}, 1)).toThrow();
  });

  it('una partida vieja recibe los NPC y recetas que se sumaron al contenido', () => {
    const s = createInitialState(CONTENT, 1);
    delete s.npcs.teodora;
    s.discoveredPotions = [];
    syncWithContent(s, CONTENT);
    expect(s.npcs.teodora).toEqual({ relation: 0, lastTalkDay: 0, seenDialogues: [] });
    expect(s.discoveredPotions).toContain('pocion_curacion');
    expect(s.discoveredPotions.every((id) => !CONTENT.potions[id].secret)).toBe(true);
  });
});
