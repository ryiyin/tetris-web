import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  attachTouchControls,
  buttonAction,
  createRepeater,
  isActionEnabled,
  pauseButtonLabel,
  REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
} from '../src/ui/touch';
import type { KeyAction } from '../src/ui/keyboard';
import type { GameStatus } from '../src/game/game';

const ACTIONS: KeyAction[] = ['left', 'right', 'rotate', 'softDrop', 'hardDrop', 'pause', 'restart'];
const STATUSES: GameStatus[] = ['playing', 'paused', 'stopped'];

describe('buttonAction', () => {
  it('devuelve la acción para los 7 valores', () => {
    for (const a of ACTIONS) expect(buttonAction(a)).toBe(a);
  });
  it('devuelve null para valores inválidos', () => {
    for (const v of [undefined, '', 'Left', 'foo']) expect(buttonAction(v)).toBeNull();
  });
});

describe('isActionEnabled', () => {
  it('restart solo en stopped', () => {
    expect(STATUSES.map((s) => isActionEnabled('restart', s))).toEqual([false, false, true]);
  });
  it('pause deshabilitado solo en stopped', () => {
    expect(STATUSES.map((s) => isActionEnabled('pause', s))).toEqual([true, true, false]);
  });
  it('el resto siempre habilitado', () => {
    for (const a of ACTIONS.filter((x) => x !== 'restart' && x !== 'pause')) {
      for (const s of STATUSES) expect(isActionEnabled(a, s)).toBe(true);
    }
  });
});

describe('pauseButtonLabel', () => {
  it('alterna según el estado', () => {
    expect(pauseButtonLabel('playing')).toBe('Pausa');
    expect(pauseButtonLabel('paused')).toBe('Continuar');
    expect(pauseButtonLabel('stopped')).toBe('Pausa');
  });
});

describe('createRepeater', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('dispara al iniciar, tras el retraso y luego cada intervalo', () => {
    const fire = vi.fn();
    const r = createRepeater(fire, undefined, true);
    r.start();
    expect(fire).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(REPEAT_DELAY_MS - 1);
    expect(fire).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(REPEAT_INTERVAL_MS * 3);
    expect(fire).toHaveBeenCalledTimes(5);
  });
  it('stop detiene todo, también durante el retraso', () => {
    const fire = vi.fn();
    const r = createRepeater(fire, undefined, true);
    r.start();
    r.stop();
    vi.advanceTimersByTime(5000);
    expect(fire).toHaveBeenCalledTimes(1);
    r.start();
    vi.advanceTimersByTime(REPEAT_DELAY_MS + REPEAT_INTERVAL_MS);
    expect(fire).toHaveBeenCalledTimes(4);
    r.stop();
    vi.advanceTimersByTime(5000);
    expect(fire).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('un start doble no crea dos temporizadores', () => {
    const fire = vi.fn();
    const r = createRepeater(fire, undefined, true);
    r.start();
    r.start();
    expect(fire).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(REPEAT_DELAY_MS + REPEAT_INTERVAL_MS);
    expect(fire).toHaveBeenCalledTimes(4);
    r.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('no repetible: solo una vez', () => {
    const fire = vi.fn();
    const r = createRepeater(fire, undefined, false);
    r.start();
    vi.advanceTimersByTime(5000);
    expect(fire).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('usa los timers inyectados', () => {
    const timers = {
      setTimeout: vi.fn(() => 1),
      clearTimeout: vi.fn(),
      setInterval: vi.fn(() => 2),
      clearInterval: vi.fn(),
    };
    const r = createRepeater(vi.fn(), timers, true);
    r.start();
    expect(timers.setTimeout).toHaveBeenCalledWith(expect.any(Function), REPEAT_DELAY_MS);
    r.stop();
    expect(timers.clearTimeout).toHaveBeenCalledWith(1);
  });
});

type Handler = (e: Record<string, unknown>) => void;
class FakeTarget {
  handlers = new Map<string, Handler[]>();
  addEventListener(type: string, cb: Handler) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), cb]);
  }
  emit(type: string, e: Record<string, unknown> = {}) {
    for (const h of this.handlers.get(type) ?? []) h(e);
  }
}

function setup() {
  vi.useFakeTimers();
  const buttons = ACTIONS.map((action) => Object.assign(new FakeTarget(), { dataset: { action } }));
  const root = Object.assign(new FakeTarget(), {
    querySelectorAll: () => buttons,
  });
  const win = new FakeTarget();
  const doc = Object.assign(new FakeTarget(), { hidden: false });
  const actions: KeyAction[] = [];
  attachTouchControls(root as never, (a) => actions.push(a), win as never, doc as never);
  const btn = (a: KeyAction) => buttons[ACTIONS.indexOf(a)];
  return { buttons, root, win, doc, actions, btn };
}

const down = () => ({ button: 0, preventDefault: vi.fn() });

describe('attachTouchControls', () => {
  afterEach(() => vi.useRealTimers());

  it('pointerdown dispara una vez y hace preventDefault', () => {
    const { btn, actions } = setup();
    const e = down();
    btn('rotate').emit('pointerdown', e);
    expect(actions).toEqual(['rotate']);
    expect(e.preventDefault).toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(actions).toEqual(['rotate']);
  });
  it('ignora pointerdown de ratón con button distinto de 0', () => {
    const { btn, actions } = setup();
    btn('left').emit('pointerdown', { button: 2, preventDefault: vi.fn() });
    expect(actions).toEqual([]);
  });
  it.each(['pointerup', 'pointercancel', 'pointerleave'])('repite al mantener y %s lo limpia', (end) => {
    const { btn, actions } = setup();
    btn('left').emit('pointerdown', down());
    vi.advanceTimersByTime(REPEAT_DELAY_MS);
    expect(actions).toEqual(['left', 'left']);
    btn('left').emit(end);
    vi.advanceTimersByTime(5000);
    expect(actions).toEqual(['left', 'left']);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('window blur limpia la repetición', () => {
    const { btn, win, actions } = setup();
    btn('softDrop').emit('pointerdown', down());
    win.emit('blur');
    vi.advanceTimersByTime(5000);
    expect(actions).toEqual(['softDrop']);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('visibilitychange limpia solo si el documento está oculto', () => {
    const { btn, doc, actions } = setup();
    btn('right').emit('pointerdown', down());
    doc.emit('visibilitychange');
    expect(vi.getTimerCount()).toBe(1);
    doc.hidden = true;
    doc.emit('visibilitychange');
    vi.advanceTimersByTime(5000);
    expect(actions).toEqual(['right']);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('un repetidor por botón: dos botones a la vez', () => {
    const { btn, actions } = setup();
    btn('left').emit('pointerdown', down());
    btn('rotate').emit('pointerdown', down());
    vi.advanceTimersByTime(REPEAT_DELAY_MS);
    expect(actions).toEqual(['left', 'rotate', 'left']);
    btn('rotate').emit('pointerup');
    vi.advanceTimersByTime(REPEAT_INTERVAL_MS);
    expect(actions).toEqual(['left', 'rotate', 'left', 'left']);
  });
  it('contextmenu en la raíz hace preventDefault', () => {
    const { root } = setup();
    const preventDefault = vi.fn();
    root.emit('contextmenu', { preventDefault });
    expect(preventDefault).toHaveBeenCalled();
  });
  it('no registra click, touchstart ni mousedown', () => {
    const { root, buttons, win, doc } = setup();
    for (const t of [root, win, doc, ...buttons]) {
      for (const type of ['click', 'touchstart', 'mousedown']) {
        expect(t.handlers.has(type)).toBe(false);
      }
    }
  });
});
