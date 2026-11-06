import { describe, expect, it } from 'vitest';
import { BOARD_COLS, BOARD_ROWS } from '../src/game/constants';
import {
  collides,
  createBoard,
  getPieceCells,
  placePiece,
  type Board,
  type Piece,
} from '../src/game/board';
import { PIECE_TYPES } from '../src/game/pieces';

// Crea un tablero con celdas ocupadas (sin mutar createBoard).
const withCells = (cells: [number, number][]): Board =>
  createBoard().map((row, r) =>
    row.map((v, c) => (cells.some(([cc, rr]) => cc === c && rr === r) ? 'I' : v)),
  );

describe('createBoard', () => {
  it('tiene 20 filas x 10 columnas, todas vacías', () => {
    const b = createBoard();
    expect(b).toHaveLength(BOARD_ROWS);
    for (const row of b) {
      expect(row).toHaveLength(BOARD_COLS);
      expect(row.every((v) => v === null)).toBe(true);
    }
  });

  it('dos llamadas devuelven objetos independientes', () => {
    const a = createBoard();
    const b = createBoard();
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});

describe('getPieceCells', () => {
  it('devuelve celdas absolutas', () => {
    const p: Piece = { type: 'T', rotation: 0, x: 3, y: 5 };
    expect(getPieceCells(p).map(([c, r]) => `${c},${r}`).sort()).toEqual(
      ['4,5', '3,6', '4,6', '5,6'].sort(),
    );
  });
});

describe('collides', () => {
  it('es falso para cada pieza en el centro del tablero vacío', () => {
    for (const type of PIECE_TYPES) {
      expect(collides(createBoard(), { type, rotation: 0, x: 3, y: 5 })).toBe(false);
    }
  });

  it('es verdadero al salirse por la izquierda', () => {
    expect(collides(createBoard(), { type: 'I', rotation: 0, x: -1, y: 5 })).toBe(true);
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: -3, y: 5 })).toBe(true);
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: -2, y: 5 })).toBe(false);
  });

  it('es verdadero al salirse por la derecha', () => {
    expect(collides(createBoard(), { type: 'I', rotation: 0, x: 7, y: 5 })).toBe(true);
    expect(collides(createBoard(), { type: 'I', rotation: 0, x: 6, y: 5 })).toBe(false);
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: 8, y: 5 })).toBe(true);
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: 7, y: 5 })).toBe(false);
  });

  it('es verdadero al salirse por abajo (fila 20)', () => {
    // I horizontal ocupa la fila y+1
    expect(collides(createBoard(), { type: 'I', rotation: 0, x: 3, y: 19 })).toBe(true);
    expect(collides(createBoard(), { type: 'I', rotation: 0, x: 3, y: 18 })).toBe(false);
    // I vertical ocupa filas y..y+3
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: 3, y: 17 })).toBe(true);
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: 3, y: 16 })).toBe(false);
    expect(collides(createBoard(), { type: 'O', rotation: 0, x: 3, y: 19 })).toBe(true);
  });

  it('es verdadero al solaparse con una celda ocupada y falso si es adyacente', () => {
    const board = withCells([[4, 10]]);
    // O en (3,9) ocupa cols 3-4, filas 9-10 -> toca (4,10)
    expect(collides(board, { type: 'O', rotation: 0, x: 3, y: 9 })).toBe(true);
    // O en (5,9) ocupa cols 5-6 -> adyacente
    expect(collides(board, { type: 'O', rotation: 0, x: 5, y: 9 })).toBe(false);
    // O en (3,11) ocupa filas 11-12 -> justo debajo
    expect(collides(board, { type: 'O', rotation: 0, x: 3, y: 11 })).toBe(false);
  });

  it('filas < 0 no colisionan con columnas válidas', () => {
    expect(collides(createBoard(), { type: 'O', rotation: 0, x: 3, y: -1 })).toBe(false);
    expect(collides(createBoard(), { type: 'I', rotation: 1, x: 3, y: -3 })).toBe(false);
  });

  it('filas < 0 con columna fuera de rango colisionan', () => {
    expect(collides(createBoard(), { type: 'O', rotation: 0, x: -1, y: -1 })).toBe(true);
    expect(collides(createBoard(), { type: 'O', rotation: 0, x: 9, y: -2 })).toBe(true);
  });
});

describe('placePiece', () => {
  it('escribe el tipo en las 4 celdas y devuelve un tablero nuevo', () => {
    const board = createBoard();
    const copy = JSON.parse(JSON.stringify(board));
    const piece: Piece = { type: 'T', rotation: 0, x: 3, y: 5 };
    const result = placePiece(board, piece);
    expect(result).not.toBe(board);
    expect(board).toEqual(copy);
    for (const [c, r] of getPieceCells(piece)) expect(result[r][c]).toBe('T');
    expect(result.flat().filter((v) => v === 'T')).toHaveLength(4);
  });

  it('ignora celdas con fila < 0', () => {
    const result = placePiece(createBoard(), { type: 'O', rotation: 0, x: 3, y: -1 });
    expect(result.flat().filter((v) => v === 'O')).toHaveLength(2);
    expect(result[0][3]).toBe('O');
    expect(result[0][4]).toBe('O');
  });
});
