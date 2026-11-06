import { describe, it, expect, vi, afterEach } from 'vitest';
import { RECORD_KEY, getLocalStorage, loadRecord, saveRecord, type RecordStorage } from '../src/ui/recordStorage';

function fakeStorage(initial?: string): RecordStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(RECORD_KEY, initial);
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
}

describe('loadRecord', () => {
  it('devuelve el entero guardado', () => {
    expect(loadRecord(fakeStorage('1200'))).toBe(1200);
  });
  it('0 sin almacenamiento o sin clave', () => {
    expect(loadRecord(null)).toBe(0);
    expect(loadRecord(fakeStorage())).toBe(0);
  });
  it.each(['abc', '', '-5', '1.5', '1e3', 'NaN', '99999999999999999999'])('0 con valor inválido %j', (v) => {
    expect(loadRecord(fakeStorage(v))).toBe(0);
  });
  it('0 sin lanzar si getItem lanza', () => {
    const s: RecordStorage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {},
    };
    expect(() => loadRecord(s)).not.toThrow();
    expect(loadRecord(s)).toBe(0);
  });
});

describe('saveRecord', () => {
  it('escribe el puntaje bajo la clave y devuelve true', () => {
    const s = fakeStorage();
    expect(saveRecord(s, 1200)).toBe(true);
    expect(s.data.get('tetris-web:record')).toBe('1200');
  });
  it('devuelve false sin lanzar si setItem lanza', () => {
    const s: RecordStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('cuota');
      },
    };
    expect(() => saveRecord(s, 10)).not.toThrow();
    expect(saveRecord(s, 10)).toBe(false);
  });
  it('no escribe con almacenamiento null', () => {
    expect(saveRecord(null, 10)).toBe(false);
  });
  it.each([-1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])('no llama a setItem con %s', (score) => {
    const setItem = vi.fn();
    expect(saveRecord({ getItem: () => null, setItem }, score)).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('getLocalStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('devuelve el objeto si existe', () => {
    const s = fakeStorage();
    vi.stubGlobal('localStorage', s);
    expect(getLocalStorage()).toBe(s);
  });
  it('devuelve null si acceder lanza', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(getLocalStorage()).toBeNull();
    } finally {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
  it('devuelve null si no existe', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getLocalStorage()).toBeNull();
  });
});
