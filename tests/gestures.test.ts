import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { attachGestures, createGestureTracker } from '../src/ui/gestures';

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

type Handler = (e: any) => void;

function fakeTarget() {
  const handlers: Record<string, Handler[]> = {};
  return {
    handlers,
    addEventListener: (type: string, fn: Handler) => {
      (handlers[type] ??= []).push(fn);
    },
    fire(type: string, e: object = {}) {
      for (const fn of handlers[type] ?? []) fn(e);
    },
  };
}

function setup(captureThrows = false) {
  const canvas = Object.assign(fakeTarget(), {
    getBoundingClientRect: () => ({ width: 300, height: 600, left: 0, top: 0 }),
    setPointerCapture: vi.fn(() => {
      if (captureThrows) throw new Error('x');
    }),
  });
  const win = fakeTarget();
  const doc = Object.assign(fakeTarget(), { hidden: false });
  const onAction = vi.fn();
  attachGestures(canvas as any, onAction, win as any, doc as any);
  const ev = (o: object) => ({ pointerType: 'touch', pointerId: 1, clientX: 50, clientY: 50, timeStamp: 0, preventDefault: vi.fn(), ...o });
  return { canvas, win, doc, onAction, ev };
}

describe('attachGestures', () => {
  it('ignora el ratón', () => {
    const s = setup();
    const down = s.ev({ pointerType: 'mouse' });
    s.canvas.fire('pointerdown', down);
    s.canvas.fire('pointerup', s.ev({ pointerType: 'mouse', timeStamp: 50 }));
    expect(down.preventDefault).not.toHaveBeenCalled();
    expect(s.canvas.setPointerCapture).not.toHaveBeenCalled();
    expect(s.onAction).not.toHaveBeenCalled();
  });
  it('toque: preventDefault, captura y rotate una vez', () => {
    const s = setup();
    const down = s.ev({});
    s.canvas.fire('pointerdown', down);
    expect(down.preventDefault).toHaveBeenCalled();
    expect(s.canvas.setPointerCapture).toHaveBeenCalledWith(1);
    s.canvas.fire('pointerup', s.ev({ timeStamp: 100 }));
    expect(s.onAction).toHaveBeenCalledTimes(1);
    expect(s.onAction).toHaveBeenCalledWith('rotate');
  });
  it('acepta lápiz y usa celdas del tamaño en pantalla', () => {
    const s = setup();
    s.canvas.fire('pointerdown', s.ev({ pointerType: 'pen', clientX: 0 }));
    s.canvas.fire('pointermove', s.ev({ pointerType: 'pen', clientX: 31 }));
    expect(s.onAction.mock.calls).toEqual([['right']]);
  });
  it('un segundo pointerId se ignora', () => {
    const s = setup();
    s.canvas.fire('pointerdown', s.ev({}));
    s.canvas.fire('pointerdown', s.ev({ pointerId: 2 }));
    s.canvas.fire('pointerup', s.ev({ pointerId: 2, timeStamp: 50 }));
    expect(s.onAction).not.toHaveBeenCalled();
    s.canvas.fire('pointerup', s.ev({ timeStamp: 100 }));
    expect(s.onAction).toHaveBeenCalledTimes(1);
  });
  it('pointercancel no emite', () => {
    const s = setup();
    s.canvas.fire('pointerdown', s.ev({}));
    s.canvas.fire('pointercancel', s.ev({}));
    s.canvas.fire('pointerup', s.ev({ timeStamp: 50 }));
    expect(s.onAction).not.toHaveBeenCalled();
  });
  it('setPointerCapture que lanza no rompe el flujo', () => {
    const s = setup(true);
    s.canvas.fire('pointerdown', s.ev({}));
    s.canvas.fire('pointerup', s.ev({ timeStamp: 50 }));
    expect(s.onAction).toHaveBeenCalledWith('rotate');
  });
  it('blur y visibilitychange oculto cancelan', () => {
    const s = setup();
    s.canvas.fire('pointerdown', s.ev({}));
    s.win.fire('blur');
    s.canvas.fire('pointerup', s.ev({ timeStamp: 50 }));
    s.canvas.fire('pointerdown', s.ev({}));
    s.doc.hidden = true;
    s.doc.fire('visibilitychange');
    s.canvas.fire('pointerup', s.ev({ timeStamp: 50 }));
    expect(s.onAction).not.toHaveBeenCalled();
  });
  it('visibilitychange visible no cancela', () => {
    const s = setup();
    s.canvas.fire('pointerdown', s.ev({}));
    s.doc.fire('visibilitychange');
    s.canvas.fire('pointerup', s.ev({ timeStamp: 50 }));
    expect(s.onAction).toHaveBeenCalledWith('rotate');
  });
  it('contextmenu se cancela y no hay click/touchstart/mousedown', () => {
    const s = setup();
    const e = { preventDefault: vi.fn() };
    s.canvas.fire('contextmenu', e);
    expect(e.preventDefault).toHaveBeenCalled();
    for (const t of [s.canvas, s.win, s.doc]) {
      for (const type of ['click', 'touchstart', 'mousedown']) expect(t.handlers[type]).toBeUndefined();
    }
  });
});

describe('CSS del canvas', () => {
  it('conserva touch-action: none', () => {
    const css = readFileSync('src/style.css', 'utf-8');
    const rule = css.match(/(^|\n)canvas\s*\{([^}]*)\}/);
    expect(rule?.[2]).toMatch(/touch-action:\s*none/);
    expect(rule?.[2]).toMatch(/user-select:\s*none/);
    expect(rule?.[2]).toMatch(/-webkit-touch-callout:\s*none/);
    expect(rule?.[2]).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });
});

describe('tracker: fin tras gran desplazamiento sin move', () => {
  it('no rota si el dedo terminó lejos sin eventos move', () => {
    const t = createGestureTracker(M);
    t.start(50, 50, 0);
    expect(t.end(50, 150, 100)).toEqual([]);
  });
});
