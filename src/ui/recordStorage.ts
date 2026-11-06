// Récord en localStorage con almacenamiento inyectado. Nunca lanza; 0 = sin récord.
export const RECORD_KEY = 'tetris-web:record';

export type RecordStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function loadRecord(storage: RecordStorage | null): number {
  try {
    if (!storage) return 0;
    const raw = storage.getItem(RECORD_KEY);
    if (raw === null || !/^\d+$/.test(raw)) return 0;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveRecord(storage: RecordStorage | null, score: number): boolean {
  try {
    if (!storage || !Number.isSafeInteger(score) || score < 0) return false;
    storage.setItem(RECORD_KEY, String(score));
    return true;
  } catch {
    return false;
  }
}

// Acceder a localStorage ya puede lanzar (SecurityError), por eso el try/catch.
export function getLocalStorage(): RecordStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
