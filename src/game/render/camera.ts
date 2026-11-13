import Phaser from 'phaser';

// Encuadre de las ilustraciones de pantalla completa (lugares y ciudades, 1280×720).
// Llenan todo el ancho, sin franjas vacías a los costados; si en la pantalla sobra alto (un celular apaisado, con las
// barras de arriba y abajo), la imagen queda más alta que la pantalla y se desliza con el dedo o la ruedita del mouse.

/** Lo que tapan las barras de la interfaz, en píxeles de pantalla: la de arriba (estado) y la de abajo (acciones). */
const BARS = { top: 48, bottom: 56 };

/**
 * Llena el ancho con la imagen (w × h) y centra el punto de interés (focusY) dentro de lo que se ve.
 * Los límites de la cámara dejan llegar hasta el borde de arriba y de abajo, aunque las barras los tapen.
 */
export function coverFit(scene: Phaser.Scene, w: number, h: number, focusY = h / 2) {
  const cam = scene.cameras.main;
  const { width, height } = scene.scale.gameSize;
  const zoom = Math.max(width / w, (height - BARS.top - BARS.bottom) / h);
  cam.setZoom(zoom);
  cam.setBounds(0, -BARS.top / zoom, w, h + (BARS.top + BARS.bottom) / zoom);
  // El centro de lo visible (entre las barras) va sobre el punto de interés.
  cam.centerOn(w / 2, focusY + (BARS.bottom - BARS.top) / 2 / zoom);
}

/**
 * Deslizar la imagen arrastrando (o con la ruedita). Devuelve si el último toque fue un arrastre, para que lo tocable
 * no se active al soltar un deslizamiento.
 */
export function installDragPan(scene: Phaser.Scene): { dragged: () => boolean } {
  let start: { x: number; y: number; sx: number; sy: number } | null = null;
  let moved = false;
  const cam = scene.cameras.main;
  scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
    start = { x: p.x, y: p.y, sx: cam.scrollX, sy: cam.scrollY };
    moved = false;
  });
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!start || !p.isDown) return;
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    if (!moved && Math.hypot(dx, dy) < 8) return;
    moved = true;
    cam.scrollX = start.sx - dx / cam.zoom;
    cam.scrollY = start.sy - dy / cam.zoom;
  });
  scene.input.on('pointerup', () => { start = null; });
  scene.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
    cam.scrollY += (dy * 0.6) / cam.zoom;
  });
  return { dragged: () => moved };
}
