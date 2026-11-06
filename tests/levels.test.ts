import { describe, it, expect } from 'vitest';
import { gravityMs, levelForLines } from '../src/game/levels';
import { MIN_GRAVITY_MS } from '../src/game/constants';

describe('levelForLines', () => {
  it('sube cada 10 líneas', () => {
    const casos: [number, number][] = [[0, 1], [9, 1], [10, 2], [19, 2], [20, 3], [99, 10], [100, 11]];
    for (const [lines, level] of casos) expect(levelForLines(lines)).toBe(level);
  });
});

describe('gravityMs', () => {
  it('valores de la curva', () => {
    const casos: [number, number][] = [[1, 1000], [2, 920], [5, 680], [10, 280], [11, 200], [12, 120], [13, 100], [50, 100]];
    for (const [level, ms] of casos) expect(gravityMs(level)).toBe(ms);
  });

  it('no crece con el nivel y nunca baja del mínimo', () => {
    let prev = Infinity;
    for (let level = 1; level <= 60; level++) {
      const ms = gravityMs(level);
      expect(ms).toBeLessThanOrEqual(prev);
      expect(ms).toBeGreaterThanOrEqual(MIN_GRAVITY_MS);
      prev = ms;
    }
  });
});
