import { describe, it, expect, vi } from 'vitest';
import {
  attachTouchControls,
  REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
  type TouchTimers,
} from '../src/ui/touch';
import type { KeyAction } from '../src/ui/keyboard';

type Handler = (e: unknown) => void;

// Reloj falso: temporizadores controlados a mano.
function fakeClock() {
  let now = 0;
  let nextId = 1;
  const timeouts = new Map<number, { at: number; fn: () => void }>();
  const intervals = new Map<number, { every: number; next: number; fn: () => void }>();
  const timers: TouchTimers = {
    setTimeout: ((fn: () => void, ms: number) => {
      const id = nextId++;
      timeouts.set(id, { at: now + ms, fn });
      return id;
    }) as unknown as TouchTimers['setTimeout'],
    clearTimeout: ((id: number) => {
      timeouts.delete(id);
    }) as unknown as TouchTimers['clearTimeout'],
    setInterval: ((fn: () => void, ms: number) => {
      const id = nextId++;
      intervals.set(id, { every: ms, next: now + ms, fn });
      return id;
    }) as unknown as TouchTimers['setInterval'],
    clearInterval: ((id: number) => {
      intervals.delete(id);
    }) as unknown as TouchTimers['clearInterval'],
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      let best: { at: number; run: () => void } | null = null;
      for (const [id, t] of timeouts) {
        if (t.at <= end && (!best || t.at < best.at)) {
          best = { at: t.at, run: () => { timeouts.delete(id); t.fn(); } };
        }
      }
      for (const t of intervals.values()) {
        if (t.next <= end && (!best || t.next < best.at)) {
          best = { at: t.next, run: () => { t.next += t.every; t.fn(); } };
        }
      }
      if (!best) break;
      now = best.at;
      best.run();
    }
    now = end;
  };
  return { timers, advance, pending: () => timeouts.size + intervals.size };
}

function setup() {
  const handlers: Record<string, Handler> = {};
  const root = {
    addEventListener: (type: string, cb: unknown) => {
      handlers[type] = cb as Handler;
    },
  };
  const winHandlers: Record<string, Handler> = {};
  const win = {
    addEventListener: (type: string, cb: unknown) => {
      winHandlers[type] = cb as Handler;
    },
  };
  const clock = fakeClock();
  const actions: KeyAction[] = [];
  attachTouchControls(
    root as unknown as HTMLElement,
    (a) => actions.push(a),
    clock.timers,
    win as unknown as Pick<Window, 'addEventListener'>,
  );
  const down = (action: string | null) => {
    const preventDefault = vi.fn();
    const target = {
      closest: (sel: string) =>
        sel === '[data-action]' && action !== null
          ? { dataset: { action } }
          : null,
    };
    handlers.pointerdown({ target, preventDefault });
    return preventDefault;
  };
  return { actions, clock, down, handlers, winHandlers };
}

const REPEATABLE: KeyAction[] = ['left', 'right', 'softDrop'];
const SINGLE: KeyAction[] = ['rotate', 'hardDrop', 'pause', 'restart'];

describe('attachTouchControls', () => {
  it.each([...REPEATABLE, ...SINGLE])('pointerdown en %s llama a onAction', (a) => {
    const { actions, down } = setup();
    down(a);
    expect(actions).toEqual([a]);
  });

  it('pointerdown fuera de un [data-action] no hace nada', () => {
    const { actions, down, clock } = setup();
    const prevent = down(null);
    clock.advance(1000);
    expect(actions).toEqual([]);
    expect(prevent).not.toHaveBeenCalled();
  });

  it('ignora un data-action desconocido', () => {
    const { actions, down } = setup();
    down('foo');
    expect(actions).toEqual([]);
  });

  it('llama a preventDefault en pointerdown', () => {
    const { down } = setup();
    expect(down('left')).toHaveBeenCalledOnce();
  });

  it.each(REPEATABLE)('%s repite tras el retraso y luego por intervalo', (a) => {
    const { actions, down, clock } = setup();
    down(a);
    clock.advance(REPEAT_DELAY_MS - 1);
    expect(actions).toHaveLength(1);
    clock.advance(1);
    expect(actions).toHaveLength(2);
    clock.advance(REPEAT_INTERVAL_MS * 3);
    expect(actions).toHaveLength(5);
  });

  it.each(['pointerup', 'pointercancel'])('%s detiene la repetición', (type) => {
    const { actions, down, clock, handlers } = setup();
    down('left');
    clock.advance(REPEAT_DELAY_MS + REPEAT_INTERVAL_MS);
    const n = actions.length;
    handlers[type]({});
    clock.advance(2000);
    expect(actions).toHaveLength(n);
    expect(clock.pending()).toBe(0);
  });

  it('pointerleave detiene la repetición', () => {
    const { actions, down, clock, handlers } = setup();
    down('right');
    handlers.pointerleave({});
    clock.advance(2000);
    expect(actions).toEqual(['right']);
    expect(clock.pending()).toBe(0);
  });

  it('blur de la ventana detiene la repetición', () => {
    const { actions, down, clock, winHandlers } = setup();
    down('softDrop');
    clock.advance(REPEAT_DELAY_MS);
    winHandlers.blur({});
    clock.advance(2000);
    expect(actions).toHaveLength(2);
    expect(clock.pending()).toBe(0);
  });

  it.each(SINGLE)('%s no repite aunque pase el tiempo', (a) => {
    const { actions, down, clock } = setup();
    down(a);
    clock.advance(5000);
    expect(actions).toEqual([a]);
    expect(clock.pending()).toBe(0);
  });

  it('un segundo pointerdown sin soltar no duplica temporizadores', () => {
    const { actions, down, clock, handlers } = setup();
    down('left');
    down('left');
    clock.advance(REPEAT_DELAY_MS);
    // 2 pointerdown + 1 repetición (no 2)
    expect(actions).toHaveLength(3);
    handlers.pointerup({});
    expect(clock.pending()).toBe(0);
  });
});
