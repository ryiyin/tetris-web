// Botones en pantalla: traducen toques (eventos pointer) a las mismas acciones del teclado.
import { REPEATABLE, type KeyAction } from './keyboard';

export const REPEAT_DELAY_MS = 300;
export const REPEAT_INTERVAL_MS = 100;

const ACTIONS: readonly KeyAction[] = ['left', 'right', 'rotate', 'softDrop', 'hardDrop', 'pause', 'restart'];

// Temporizadores inyectables para probar sin reloj real.
export type TouchTimers = {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
};

const REAL_TIMERS: TouchTimers = {
  setTimeout: (...args) => setTimeout(...args),
  clearTimeout: (...args) => clearTimeout(...args),
  setInterval: (...args) => setInterval(...args),
  clearInterval: (...args) => clearInterval(...args),
} as TouchTimers;

type Rect = { left: number; right: number; top: number; bottom: number };

type PointerLike = {
  target: unknown;
  preventDefault: () => void;
};

export function attachTouchControls(
  root: Pick<HTMLElement, 'addEventListener'>,
  onAction: (action: KeyAction) => void,
  timers: TouchTimers = REAL_TIMERS,
  win: Pick<Window, 'addEventListener'> | undefined = typeof window === 'undefined' ? undefined : window,
): void {
  let delayId: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let activeButton: { getBoundingClientRect: () => Rect } | null = null;

  function stop(): void {
    activeButton = null;
    if (delayId !== null) timers.clearTimeout(delayId);
    if (intervalId !== null) timers.clearInterval(intervalId);
    delayId = null;
    intervalId = null;
  }

  root.addEventListener('pointerdown', ((event: PointerLike) => {
    const target = event.target as { closest?: (selector: string) => unknown } | null;
    const button = target?.closest?.('[data-action]') as
      | { dataset: { action?: string }; getBoundingClientRect: () => Rect }
      | null | undefined;
    const action = button?.dataset.action as KeyAction | undefined;
    if (!action || !ACTIONS.includes(action)) return;
    // Evita doble toque, selección de texto y zoom.
    event.preventDefault();
    stop();
    activeButton = button ?? null;
    onAction(action);
    if (!REPEATABLE.includes(action)) return;
    delayId = timers.setTimeout(() => {
      delayId = null;
      onAction(action);
      intervalId = timers.setInterval(() => onAction(action), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }) as EventListener);

  // El navegador captura el puntero táctil y no emite pointerleave: se comprueba la posición.
  root.addEventListener('pointermove', ((event: PointerEvent) => {
    if (!activeButton) return;
    const r = activeButton.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) {
      stop();
    }
  }) as EventListener);
  root.addEventListener('pointerup', stop);
  root.addEventListener('pointercancel', stop);
  // pointerleave no burbujea: se escucha en captura para ver el de cada botón.
  root.addEventListener('pointerleave', stop, true);
  win?.addEventListener('blur', stop);
}
