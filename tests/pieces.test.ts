import { describe, expect, it } from 'vitest';
import { PIECE_TYPES, getCells, rotate, type Cell, type Rotation } from '../src/game/pieces';

const ROTATIONS: Rotation[] = [0, 1, 2, 3];

// Ordena y normaliza celdas para comparar formas sin depender del orden.
const sorted = (cells: readonly Cell[]): string[] =>
  cells.map(([c, r]) => `${c},${r}`).sort();

const normalized = (cells: readonly Cell[]): string[] => {
  const minC = Math.min(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  return sorted(cells.map(([c, r]) => [c - minC, r - minR] as Cell));
};

const EXPECTED_ROTATION_0: Record<string, Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

describe('getCells', () => {
  it('hay 7 piezas', () => {
    expect(PIECE_TYPES).toHaveLength(7);
  });

  it('devuelve 4 celdas distintas en cada rotación', () => {
    for (const type of PIECE_TYPES) {
      for (const rot of ROTATIONS) {
        const cells = getCells(type, rot);
        expect(cells).toHaveLength(4);
        expect(new Set(sorted(cells)).size).toBe(4);
      }
    }
  });

  it('la rotación 0 coincide con la forma SRS', () => {
    for (const type of PIECE_TYPES) {
      expect(sorted(getCells(type, 0))).toEqual(sorted(EXPECTED_ROTATION_0[type]));
    }
  });

  it('la I en rotación 1 es vertical', () => {
    expect(sorted(getCells('I', 1))).toEqual(sorted([[2, 0], [2, 1], [2, 2], [2, 3]]));
  });

  it('la T en rotación 1 apunta a la derecha', () => {
    expect(sorted(getCells('T', 1))).toEqual(sorted([[1, 0], [1, 1], [2, 1], [1, 2]]));
  });

  it('la O es igual en sus 4 rotaciones', () => {
    for (const rot of ROTATIONS) {
      expect(normalized(getCells('O', rot))).toEqual(normalized(getCells('O', 0)));
    }
  });

  it('cada rotación se obtiene girando 90 grados la anterior (4 giros = inicio)', () => {
    for (const type of PIECE_TYPES) {
      let rot: Rotation = 0;
      for (let i = 0; i < 4; i++) rot = rotate(rot, 1);
      expect(sorted(getCells(type, rot))).toEqual(sorted(getCells(type, 0)));
    }
  });
});

describe('rotate', () => {
  it('suma módulo 4', () => {
    expect(rotate(3, 1)).toBe(0);
    expect(rotate(0, 1)).toBe(1);
  });

  it('resta módulo 4', () => {
    expect(rotate(0, -1)).toBe(3);
    expect(rotate(2, -1)).toBe(1);
  });
});
