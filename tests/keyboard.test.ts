import { describe, it, expect, vi } from 'vitest';
import { attachKeyboard, keyToAction, type KeyAction } from '../src/ui/keyboard';

type FakeEvent = {
  key: string;
  repeat?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault: () => void;
};

// Objetivo falso: captura el callback de 'keydown' (sin DOM real).
function setup() {
  let handler: ((e: FakeEvent) => void) | null = null;
  const target = {
    addEventListener: (_type: string, cb: unknown) => {
      handler = cb as (e: FakeEvent) => void;
    },
  } as unknown as Pick<Window, 'addEventListener'>;
  const actions: KeyAction[] = [];
  attachKeyboard(target, (a) => actions.push(a));
  const press = (key: string, mods: Partial<FakeEvent> = {}) => {
    const preventDefault = vi.fn();
    handler!({ key, preventDefault, ...mods });
    return preventDefault;
  };
  return { actions, press };
}

describe('attachKeyboard', () => {
  it('sin modificadores llama a onAction y preventDefault', () => {
    const { actions, press } = setup();
    const prevent = press('ArrowLeft');
    expect(actions).toEqual(['left']);
    expect(prevent).toHaveBeenCalledOnce();
  });

  it.each(['ctrlKey', 'altKey', 'metaKey'] as const)(
    'con %s activo ignora la tecla',
    (mod) => {
      const { actions, press } = setup();
      const prevent = press('ArrowLeft', { [mod]: true });
      expect(actions).toEqual([]);
      expect(prevent).not.toHaveBeenCalled();
    },
  );
});

describe('tecla P (pausa)', () => {
  it.each(['p', 'P'])('keyToAction(%s) es pause', (k) => {
    expect(keyToAction(k)).toBe('pause');
  });

  it('llama a onAction y preventDefault', () => {
    const { actions, press } = setup();
    const prevent = press('p');
    expect(actions).toEqual(['pause']);
    expect(prevent).toHaveBeenCalledOnce();
  });

  it('con repeat no llama a onAction', () => {
    const { actions, press } = setup();
    press('P', { repeat: true });
    expect(actions).toEqual([]);
  });

  it.each(['ctrlKey', 'altKey', 'metaKey'] as const)('con %s se ignora', (mod) => {
    const { actions, press } = setup();
    const prevent = press('p', { [mod]: true });
    expect(actions).toEqual([]);
    expect(prevent).not.toHaveBeenCalled();
  });
});
