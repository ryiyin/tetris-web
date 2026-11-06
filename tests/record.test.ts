import { describe, it, expect } from 'vitest';
import { isNewRecord } from '../src/game/record';

describe('isNewRecord', () => {
  it('0 puntos nunca es récord', () => {
    expect(isNewRecord(0, 0)).toBe(false);
  });
  it('primer puntaje positivo es récord', () => {
    expect(isNewRecord(0, 10)).toBe(true);
  });
  it('empate no es récord', () => {
    expect(isNewRecord(100, 100)).toBe(false);
  });
  it('superar el récord lo es', () => {
    expect(isNewRecord(100, 101)).toBe(true);
  });
  it('menor no es récord', () => {
    expect(isNewRecord(100, 50)).toBe(false);
  });
});
