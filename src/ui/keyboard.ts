// Captura del teclado: traduce teclas a acciones del juego.
export type KeyAction = 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop' | 'pause';

// Teclas que se repiten al mantenerlas pulsadas.
const REPEATABLE: readonly KeyAction[] = ['left', 'right', 'softDrop'];

export function keyToAction(key: string): KeyAction | null {
  switch (key) {
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    case 'ArrowUp':
      return 'rotate';
    case 'ArrowDown':
      return 'softDrop';
    case ' ':
      return 'hardDrop';
    case 'p':
    case 'P':
      return 'pause';
    default:
      return null;
  }
}

export function attachKeyboard(
  target: Pick<Window, 'addEventListener'>,
  onAction: (action: KeyAction) => void,
): void {
  target.addEventListener('keydown', (event) => {
    // Con Ctrl/Alt/Meta se deja el atajo al navegador (p. ej. Alt+Flecha izquierda).
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const action = keyToAction(event.key);
    if (action === null) return;
    event.preventDefault();
    if (event.repeat && !REPEATABLE.includes(action)) return;
    onAction(action);
  });
}
