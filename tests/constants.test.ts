import { describe, it, expect } from 'vitest';
import { BOARD_COLS, BOARD_ROWS } from '../src/game/constants';

describe('constantes del tablero', () => {
  it('el tablero es de 10x20', () => {
    expect(BOARD_COLS).toBe(10);
    expect(BOARD_ROWS).toBe(20);
  });
});
