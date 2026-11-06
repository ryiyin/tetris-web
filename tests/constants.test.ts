import { describe, it, expect } from 'vitest';
import { BOARD_COLS, BOARD_ROWS,
  GRAVITY_MS,
  GRAVITY_STEP_MS,
  LINES_PER_LEVEL,
  MIN_GRAVITY_MS,
} from '../src/game/constants';

describe('constantes del tablero', () => {
  it('el tablero es de 10x20', () => {
    expect(BOARD_COLS).toBe(10);
    expect(BOARD_ROWS).toBe(20);
  });
});

describe('niveles y velocidad', () => {
  it('constantes de nivel y curva', () => {
    expect(LINES_PER_LEVEL).toBe(10);
    expect(GRAVITY_STEP_MS).toBe(80);
    expect(MIN_GRAVITY_MS).toBe(100);
  });
});

describe('gravedad', () => {
  it('GRAVITY_MS es 1000', () => {
    expect(GRAVITY_MS).toBe(1000);
  });
});
