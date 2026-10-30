import type { GameState } from '../core/types';

/**
 * Qué tema suena según dónde está el jugador. Devuelve candidatos en orden: se usa el primero que tenga archivo
 * (src/assets/audio/musica/<clave>.mp3). Así un lugar sin tema propio usa el de su grupo, y si no hay ninguno, silencio.
 */
export function musicCandidates(screen: 'loading' | 'title' | 'game', view: 'map' | 'location' | 'world', s: GameState | null): string[] {
  if (screen !== 'game' || !s) return ['titulo'];
  const e = s.expedition;
  if (e?.combat) return e.combat.boss ? ['jefe', 'combate'] : ['combate'];
  if (e?.dungeon) return [e.dungeon.id, 'mazmorra'];
  if (e) return [e.regionId, 'mundo'];
  if (view === 'world') return ['mundo'];
  if (view === 'map') return [s.city];
  return [s.location, s.city];
}
