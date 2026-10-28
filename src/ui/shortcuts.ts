/**
 * Atajos de teclado (opcionales: todo se puede hacer con toques).
 * Cada botón que acepta un atajo lleva `data-key` con la tecla en minúscula ("esc", "enter", "1"...).
 * Se dispara el botón visible y habilitado de la capa de arriba: tarjeta, panel o pantalla.
 */
export const SHORTCUTS: { keys: string; text: string }[] = [
  { keys: 'G · I · L · E · C', text: 'Grupo, inventario, libro, encargos y contactos' },
  { keys: 'F · T · D', text: 'Forjar, tienda y descansar o dormir (en el taller)' },
  { keys: 'Espacio · F', text: 'En el yunque: golpear y frenar' },
  { keys: 'Enter · A · N', text: 'En la tienda: pedir o siguiente cliente, aceptar la oferta y no vender' },
  { keys: 'X · M', text: 'Mapa del mundo y mapa de la ciudad' },
  { keys: 'B · V', text: 'Bolsa y volver (de expedición)' },
  { keys: 'M · 1-9 · T', text: 'En combate: mover, acciones y terminar turno' },
  { keys: '1-9 · Enter', text: 'Elegir respuesta y continuar en diálogos' },
  { keys: 'Enter · Esc', text: 'Confirmar y cerrar o cancelar' },
];

const LAYERS = '.card-backdrop, .panel-backdrop';

function keyName(e: KeyboardEvent): string {
  if (e.key === 'Escape') return 'esc';
  if (e.key === 'Enter') return 'enter';
  if (e.key === ' ') return 'espacio';
  return e.key.toLowerCase();
}

export function installShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const layers = document.querySelectorAll<HTMLElement>(LAYERS);
    const root = layers[layers.length - 1] ?? document.getElementById('ui');
    if (!root) return;
    const selector = `[data-key="${CSS.escape(keyName(e))}"]`;
    const target = root.matches(selector) ? root : root.querySelector<HTMLElement>(`${selector}:not(:disabled)`);
    if (!target) return;
    e.preventDefault();
    target.click();
  });
}
