import { describe, it, expect } from 'vitest';
import { createGestureTracker } from '../src/ui/gestures';

const M = { cellW: 30, cellH: 30 };

describe('tracker: toque y cancel', () => {
  it('toque rápido rota', () => {
    const t = createGestureTracker(M);
    t.start(50, 50, 0);
    expect(t.end(50, 50, 100)).toEqual(['rotate']);
  });
  it('pulsación larga no hace nada', () => {
    const t = createGestureTracker(M);
    t.start(50, 50, 0);
    expect(t.end(50, 50, 400)).toEqual([]);
  });
  it('movimiento menor al umbral sigue siendo toque', () => {
    const t = createGestureTracker(M);
    t.start(50, 50, 0);
    expect(t.move(55, 50)).toEqual([]);
    expect(t.end(55, 50, 100)).toEqual(['rotate']);
  });
  it('cancel no emite y move/end sin start devuelven []', () => {
    const t = createGestureTracker(M);
    expect(t.move(10, 10)).toEqual([]);
    expect(t.end(10, 10, 50)).toEqual([]);
    t.start(0, 0, 0);
    t.move(40, 0);
    t.cancel();
    expect(t.end(40, 0, 100)).toEqual([]);
  });
});
