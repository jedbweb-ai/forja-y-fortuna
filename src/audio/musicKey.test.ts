import { describe, expect, it } from 'vitest';
import { createInitialState } from '../core/state';
import { CONTENT } from '../data';
import { musicCandidates } from './musicKey';
import { SFX_IDS } from './sfx';

describe('música por lugar', () => {
  const s = createInitialState(CONTENT);

  it('pantalla de título, herrería, ciudad y mapa del mundo', () => {
    expect(musicCandidates('title', 'location', null)).toEqual(['titulo']);
    expect(musicCandidates('game', 'location', { ...s, location: 'herreria' })).toEqual(['herreria', 'valdebrasa']);
    expect(musicCandidates('game', 'location', { ...s, location: 'taberna' })).toEqual(['taberna', 'valdebrasa']);
    expect(musicCandidates('game', 'map', s)).toEqual(['valdebrasa']);
    expect(musicCandidates('game', 'world', s)).toEqual(['mundo']);
  });

  it('expedición, mazmorra y combate (con jefe)', () => {
    const exp = { regionId: 'pantano_niebla' } as NonNullable<typeof s.expedition>;
    expect(musicCandidates('game', 'location', { ...s, expedition: exp })).toEqual(['pantano_niebla', 'mundo']);
    expect(musicCandidates('game', 'location', { ...s, expedition: { ...exp, dungeon: { id: 'cripta_vigia' } } as typeof exp })).toEqual(['cripta_vigia', 'mazmorra']);
    expect(musicCandidates('game', 'location', { ...s, expedition: { ...exp, combat: { boss: false } } as typeof exp })).toEqual(['combate']);
    expect(musicCandidates('game', 'location', { ...s, expedition: { ...exp, combat: { boss: true } } as typeof exp })).toEqual(['jefe', 'combate']);
  });

  it('cada lugar tiene un nombre de archivo posible', () => {
    // Las claves de la guía de sonido son ids reales del contenido.
    for (const id of ['valdebrasa', 'puertoseco', 'fuerte_ceniza']) expect(CONTENT.cities[id]).toBeDefined();
    for (const id of ['linde_brezal', 'montanas_grises', 'pantano_niebla', 'ruinas_vigia', 'tierras_dragon']) expect(CONTENT.regions[id]).toBeDefined();
    expect(SFX_IDS.length).toBeGreaterThanOrEqual(20);
  });
});
