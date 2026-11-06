// Gestos táctiles sobre el canvas: la lógica pura (tracker) y el pegamento con Pointer Events.
import type { KeyAction } from './keyboard';

export const SLOP_PX = 10;
export const FLICK_MIN_PX = 60;
export const FLICK_MAX_MS = 300;
export const TAP_MAX_MS = 250;

export interface GestureMetrics {
  cellW: number;
  cellH: number;
}

export interface GestureTracker {
  start: (x: number, y: number, t: number) => void;
  move: (x: number, y: number) => KeyAction[];
  end: (x: number, y: number, t: number) => KeyAction[];
  cancel: () => void;
}

// Lógica pura: sin DOM ni reloj (el tiempo entra como argumento).
export function createGestureTracker(metrics: GestureMetrics): GestureTracker {
  let active = false;
  let sx = 0;
  let sy = 0;
  let st = 0;

  function cancel(): void {
    active = false;
  }

  function start(x: number, y: number, t: number): void {
    active = true;
    sx = x;
    sy = y;
    st = t;
  }

  function move(_x: number, _y: number): KeyAction[] {
    return [];
  }

  function end(_x: number, _y: number, t: number): KeyAction[] {
    if (!active) return [];
    active = false;
    return t - st <= TAP_MAX_MS ? ['rotate'] : [];
  }

  void metrics;
  void sx;
  void sy;
  return { start, move, end, cancel };
}
