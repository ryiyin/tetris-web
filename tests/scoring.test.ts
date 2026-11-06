import { describe, it, expect } from 'vitest';
import { clearLines, lineScore } from '../src/game/scoring';
import { createBoard, type Board } from '../src/game/board';
import { BOARD_COLS, BOARD_ROWS } from '../src/game/constants';
import type { PieceType } from '../src/game/pieces';

type Row = (PieceType | null)[];

// Fila llena salvo (opcionalmente) una columna.
function fullRow(hole: number | null = null): Row {
  return Array.from({ length: BOARD_COLS }, (_, c) => (c === hole ? null : ('I' as const)));
}

// Tablero vacío con las filas indicadas reemplazadas.
function withRows(rows: Record<number, Row>): Board {
  return createBoard().map((row, r) => rows[r] ?? row);
}

describe('clearLines', () => {
  it('una fila llena: se borra, las de arriba bajan y aparece una vacía arriba', () => {
    const marker: Row = Array.from({ length: BOARD_COLS }, (_, c) => (c === 0 ? ('T' as const) : null));
    const board = withRows({ 18: marker, 19: fullRow() });
    const { board: result, cleared } = clearLines(board);
    expect(cleared).toBe(1);
    expect(result).toHaveLength(BOARD_ROWS);
    expect(result[19]).toEqual(marker);
    expect(result[0]).toEqual(createBoard()[0]);
  });

  it('2, 3 y 4 filas contiguas', () => {
    for (const n of [2, 3, 4]) {
      const rows: Record<number, Row> = {};
      for (let i = 0; i < n; i++) rows[19 - i] = fullRow();
      const { board, cleared } = clearLines(withRows(rows));
      expect(cleared).toBe(n);
      expect(board).toEqual(createBoard());
    }
  });

  it('filas no contiguas conservan el orden relativo del resto', () => {
    const a = fullRow(0); // incompleta
    const b = fullRow(1); // incompleta
    const board = withRows({ 16: a, 17: fullRow(), 18: b, 19: fullRow() });
    const { board: result, cleared } = clearLines(board);
    expect(cleared).toBe(2);
    expect(result).toHaveLength(BOARD_ROWS);
    expect(result[18]).toEqual(a);
    expect(result[19]).toEqual(b);
    expect(result[0]).toEqual(createBoard()[0]);
    expect(result[1]).toEqual(createBoard()[0]);
    for (const row of result) expect(row).toHaveLength(BOARD_COLS);
  });

  it('3 filas llenas no contiguas (15, 17, 19) conservan el orden del resto', () => {
    const a = fullRow(0);
    const b = fullRow(1);
    const board = withRows({ 14: fullRow(5), 15: fullRow(), 16: a, 17: fullRow(), 18: b, 19: fullRow() });
    const { board: result, cleared } = clearLines(board);
    expect(cleared).toBe(3);
    expect(result).toHaveLength(BOARD_ROWS);
    expect(result[17]).toEqual(fullRow(5));
    expect(result[18]).toEqual(a);
    expect(result[19]).toEqual(b);
    for (let r = 0; r < 17; r++) expect(result[r]).toEqual(createBoard()[0]);
    for (const row of result) expect(row).toHaveLength(BOARD_COLS);
  });

  it('4 filas llenas no contiguas (14, 16, 18, 19) conservan el orden del resto', () => {
    const a = fullRow(0);
    const b = fullRow(1);
    const c = fullRow(2);
    const board = withRows({ 13: a, 14: fullRow(), 15: b, 16: fullRow(), 17: c, 18: fullRow(), 19: fullRow() });
    const { board: result, cleared } = clearLines(board);
    expect(cleared).toBe(4);
    expect(result).toHaveLength(BOARD_ROWS);
    expect(result[17]).toEqual(a);
    expect(result[18]).toEqual(b);
    expect(result[19]).toEqual(c);
    for (let r = 0; r < 17; r++) expect(result[r]).toEqual(createBoard()[0]);
    for (const row of result) expect(row).toHaveLength(BOARD_COLS);
  });

  it('sin filas llenas devuelve la misma referencia y 0', () => {
    const board = withRows({ 19: fullRow(3) });
    const result = clearLines(board);
    expect(result.board).toBe(board);
    expect(result.cleared).toBe(0);
  });

  it('no muta el tablero de entrada', () => {
    const board = withRows({ 18: fullRow(2), 19: fullRow() });
    const copy = structuredClone(board);
    clearLines(board);
    expect(board).toEqual(copy);
  });
});

describe('lineScore', () => {
  it('nivel 1: 100/300/500/800', () => {
    expect([1, 2, 3, 4].map((n) => lineScore(n, 1))).toEqual([100, 300, 500, 800]);
  });

  it('se multiplica por el nivel', () => {
    expect([1, 2, 3, 4].map((n) => lineScore(n, 3))).toEqual([300, 900, 1500, 2400]);
  });

  it('0 líneas = 0 puntos', () => {
    expect(lineScore(0, 5)).toBe(0);
  });
});
