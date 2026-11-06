// Botones táctiles: traducen eventos pointer a acciones del juego.
import type { GameStatus } from '../game/game';
import { isRepeatable, type KeyAction } from './keyboard';

export const REPEAT_DELAY_MS = 170;
export const REPEAT_INTERVAL_MS = 60;

const ACTIONS: readonly KeyAction[] = ['left', 'right', 'rotate', 'softDrop', 'hardDrop', 'pause', 'restart'];

// Lee el valor de data-action; null si no es una acción válida.
export function buttonAction(value: string | undefined): KeyAction | null {
  return ACTIONS.find((a) => a === value) ?? null;
}

// Reiniciar solo al terminar; pausa no se usa al terminar. El resto siempre activo.
export function isActionEnabled(action: KeyAction, status: GameStatus): boolean {
  if (action === 'restart') return status === 'stopped';
  if (action === 'pause') return status !== 'stopped';
  return true;
}

export function pauseButtonLabel(status: GameStatus): string {
  return status === 'paused' ? 'Continuar' : 'Pausa';
}

export interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
  setInterval: (fn: () => void, ms: number) => unknown;
  clearInterval: (id: unknown) => void;
}

const defaultTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id as ReturnType<typeof setInterval>),
};

export interface Repeater {
  start: () => void;
  stop: () => void;
}

// Dispara una vez al iniciar y, si es repetible, repite tras un retraso.
export function createRepeater(fire: () => void, timers: Timers = defaultTimers, repeatable = true): Repeater {
  let timeoutId: unknown = null;
  let intervalId: unknown = null;

  function stop(): void {
    if (timeoutId !== null) timers.clearTimeout(timeoutId);
    if (intervalId !== null) timers.clearInterval(intervalId);
    timeoutId = null;
    intervalId = null;
  }

  function start(): void {
    stop();
    fire();
    if (!repeatable) return;
    timeoutId = timers.setTimeout(() => {
      timeoutId = null;
      fire();
      intervalId = timers.setInterval(fire, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }

  return { start, stop };
}

// Solo Pointer Events: sin click/touchstart/mousedown para evitar doble disparo.
export function attachTouchControls(
  root: HTMLElement,
  onAction: (action: KeyAction) => void,
  win: Pick<Window, 'addEventListener'> = window,
  doc: Pick<Document, 'addEventListener' | 'hidden'> = document,
): void {
  const repeaters: Repeater[] = [];
  const buttons = root.querySelectorAll<HTMLElement>('[data-action]');

  buttons.forEach((button) => {
    const action = buttonAction(button.dataset.action);
    if (action === null) return;
    const repeater = createRepeater(() => onAction(action), undefined, isRepeatable(action));
    repeaters.push(repeater);

    button.addEventListener('pointerdown', (event) => {
      // Evita foco y eventos de ratón de compatibilidad.
      event.preventDefault();
      if (event.button !== 0) return;
      repeater.start();
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      button.addEventListener(type, () => repeater.stop());
    }
  });

  const stopAll = () => repeaters.forEach((r) => r.stop());
  win.addEventListener('blur', stopAll);
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) stopAll();
  });
  // Evita el menú contextual de la pulsación larga, solo dentro de la botonera.
  root.addEventListener('contextmenu', (event) => event.preventDefault());
}
