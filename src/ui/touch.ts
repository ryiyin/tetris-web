// Botones en pantalla: traducen toques (eventos pointer) a las mismas acciones del teclado.
import type { KeyAction } from './keyboard';

export const REPEAT_DELAY_MS = 300;
export const REPEAT_INTERVAL_MS = 100;

// Acciones que se repiten al mantener el botón pulsado.
const REPEATABLE: readonly KeyAction[] = ['left', 'right', 'softDrop'];
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

  function stop(): void {
    if (delayId !== null) timers.clearTimeout(delayId);
    if (intervalId !== null) timers.clearInterval(intervalId);
    delayId = null;
    intervalId = null;
  }

  root.addEventListener('pointerdown', ((event: PointerLike) => {
    const target = event.target as { closest?: (selector: string) => unknown } | null;
    const button = target?.closest?.('[data-action]') as { dataset: { action?: string } } | null | undefined;
    const action = button?.dataset.action as KeyAction | undefined;
    if (!action || !ACTIONS.includes(action)) return;
    // Evita doble toque, selección de texto y zoom.
    event.preventDefault();
    stop();
    onAction(action);
    if (!REPEATABLE.includes(action)) return;
    delayId = timers.setTimeout(() => {
      delayId = null;
      onAction(action);
      intervalId = timers.setInterval(() => onAction(action), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }) as EventListener);

  root.addEventListener('pointerup', stop);
  root.addEventListener('pointercancel', stop);
  // pointerleave no burbujea: se escucha en captura para ver el de cada botón.
  root.addEventListener('pointerleave', stop, true);
  win?.addEventListener('blur', stop);
}
