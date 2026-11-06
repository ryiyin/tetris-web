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
  // Eje fijado al superar SLOP_PX; null mientras sea un posible toque.
  let axis: 'h' | 'v' | null = null;
  let anchorX = 0;
  let anchorY = 0;

  function cancel(): void {
    active = false;
    axis = null;
  }

  function start(x: number, y: number, t: number): void {
    active = true;
    axis = null;
    sx = x;
    sy = y;
    st = t;
    anchorX = x;
    anchorY = y;
  }

  function move(x: number, y: number): KeyAction[] {
    if (!active) return [];
    if (axis === null) {
      const dx = x - sx;
      const dy = y - sy;
      if (Math.hypot(dx, dy) <= SLOP_PX) return [];
      axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    const actions: KeyAction[] = [];
    if (axis === 'h') {
      while (x - anchorX >= metrics.cellW) {
        actions.push('right');
        anchorX += metrics.cellW;
      }
      while (x - anchorX <= -metrics.cellW) {
        actions.push('left');
        anchorX -= metrics.cellW;
      }
    } else {
      while (y - anchorY >= metrics.cellH) {
        actions.push('softDrop');
        anchorY += metrics.cellH;
      }
    }
    return actions;
  }

  function end(x: number, y: number, t: number): KeyAction[] {
    if (!active) return [];
    const wasAxis = axis;
    cancel();
    const elapsed = t - st;
    if (wasAxis === null) return elapsed <= TAP_MAX_MS ? ['rotate'] : [];
    const dx = x - sx;
    const dy = y - sy;
    if (wasAxis === 'v' && dy >= FLICK_MIN_PX && elapsed <= FLICK_MAX_MS && dy > 2 * Math.abs(dx)) {
      return ['hardDrop'];
    }
    return [];
  }

  return { start, move, end, cancel };
}
