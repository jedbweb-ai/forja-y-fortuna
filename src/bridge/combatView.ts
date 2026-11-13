/**
 * Cámara del combate: la interfaz pide girar o reencuadrar y la escena lo hace.
 * El giro elegido se recuerda entre peleas (mientras dure la sesión).
 */
export type CameraRequest = { kind: 'rotate'; dir: 1 | -1 } | { kind: 'fit' };

const listeners = new Set<(r: CameraRequest) => void>();

export const combatView = {
  /** Cuartos de vuelta de la última vista (0 a 3). */
  quarter: 0,
  request(r: CameraRequest) {
    listeners.forEach((l) => l(r));
  },
  listen(l: (r: CameraRequest) => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};
