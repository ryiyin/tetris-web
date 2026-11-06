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

describe('tracker: horizontal', () => {
  it('emite una acción por celda y acumula sin repetir', () => {
    const t = createGestureTracker(M);
    t.start(100, 100, 0);
    expect(t.move(131, 100)).toEqual(['right']);
    expect(t.move(131, 100)).toEqual([]);
    expect(t.move(195, 100)).toEqual(['right', 'right']);
    expect(t.move(100, 100)).toEqual(['left', 'left', 'left']);
  });
  it('95 px de una vez dan 3 right', () => {
    const t = createGestureTracker(M);
    t.start(0, 0, 0);
    expect(t.move(95, 0)).toEqual(['right', 'right', 'right']);
  });
  it('hacia la izquierda', () => {
    const t = createGestureTracker(M);
    t.start(200, 0, 0);
    expect(t.move(169, 0)).toEqual(['left']);
    expect(t.move(105, 0)).toEqual(['left', 'left']);
    expect(t.move(150, 0)).toEqual(['right']);
  });
  it('eje bloqueado: bajar después no emite softDrop ni rotate ni hardDrop', () => {
    const t = createGestureTracker(M);
    t.start(0, 0, 0);
    expect(t.move(40, 0)).toEqual(['right']);
    expect(t.move(40, 100)).toEqual([]);
    expect(t.end(40, 100, 100)).toEqual([]);
  });
});

describe('tracker: vertical', () => {
  it('bajar lento emite softDrop por celda y nada al soltar', () => {
    const t = createGestureTracker(M);
    t.start(0, 0, 0);
    expect(t.move(0, 65)).toEqual(['softDrop', 'softDrop']);
    expect(t.end(0, 65, 800)).toEqual([]);
  });
  it('hacia arriba no emite nada', () => {
    const t = createGestureTracker(M);
    t.start(0, 200, 0);
    expect(t.move(0, 100)).toEqual([]);
    expect(t.end(0, 100, 100)).toEqual([]);
  });
  it('flick rápido hacia abajo hace hardDrop', () => {
    const t = createGestureTracker(M);
    t.start(0, 0, 0);
    expect(t.move(5, 100)).toEqual(['softDrop', 'softDrop', 'softDrop']);
    expect(t.end(5, 100, 150)).toEqual(['hardDrop']);
  });
  it('lento no es flick', () => {
    const t = createGestureTracker(M);
    t.start(0, 0, 0);
    t.move(0, 100);
    expect(t.end(0, 100, 600)).toEqual([]);
  });
  it('diagonal no es flick', () => {
    const t = createGestureTracker(M);
    t.start(0, 0, 0);
    t.move(60, 100);
    expect(t.end(60, 100, 150)).toEqual([]);
  });
});
