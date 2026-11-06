import { describe, expect, it } from 'vitest';
import { collides, createBoard, getPieceCells, placePiece, type Board, type Piece } from '../src/game/board';
import { moveDown, moveLeft, moveRight } from '../src/game/movement';

// Tablero con celdas ocupadas en las posiciones [col, row] dadas.
function boardWith(cells: [number, number][]): Board {
  return createBoard().map((row, r) =>
    row.map((v, c) => (cells.some(([cc, rr]) => cc === c && rr === r) ? 'Z' : v)),
  );
}

const free: Piece = { type: 'T', rotation: 0, x: 3, y: 5 };

describe('movimiento libre', () => {
  it('moveLeft/moveRight/moveDown devuelven pieza nueva', () => {
    const b = createBoard();
    expect(moveLeft(b, free)).toEqual({ ...free, x: 2 });
    expect(moveRight(b, free)).toEqual({ ...free, x: 4 });
    expect(moveDown(b, free)).toEqual({ ...free, y: 6 });
    expect(moveLeft(b, free)).not.toBe(free);
  });
});

describe('bordes', () => {
  it.each(['I', 'T'] as const)('pared izquierda y derecha bloquean (%s)', (type) => {
    const b = createBoard();
    const minCol = (p: Piece) => Math.min(...getPieceCells(p).map(([c]) => c));
    const maxCol = (p: Piece) => Math.max(...getPieceCells(p).map(([c]) => c));
    const base: Piece = { type, rotation: 0, x: 0, y: 5 };
    const left: Piece = { ...base, x: -minCol(base) };
    expect(minCol(left)).toBe(0);
    expect(moveLeft(b, left)).toBe(left);
    const right: Piece = { ...base, x: 9 - maxCol(base) };
    expect(maxCol(right)).toBe(9);
    expect(moveRight(b, right)).toBe(right);
  });

  it('el fondo bloquea moveDown', () => {
    const p: Piece = { type: 'T', rotation: 0, x: 3, y: 18 }; // celdas hasta fila 19
    expect(moveDown(createBoard(), p)).toBe(p);
  });
});

describe('celdas ocupadas', () => {
  it('bloquean izquierda, derecha y abajo', () => {
    // T rot 0 en x=3,y=5: celdas (4,5),(3,6),(4,6),(5,6)
    expect(moveLeft(boardWith([[2, 6]]), free)).toBe(free);
    expect(moveRight(boardWith([[6, 6]]), free)).toBe(free);
    expect(moveDown(boardWith([[4, 7]]), free)).toBe(free);
  });
});

describe('filas negativas', () => {
  it('se mueve según collides', () => {
    const p: Piece = { type: 'T', rotation: 0, x: 3, y: -1 };
    const b = createBoard();
    expect(moveLeft(b, p)).toEqual({ ...p, x: 2 });
    expect(moveRight(b, p)).toEqual({ ...p, x: 4 });
    expect(moveDown(b, p)).toEqual({ ...p, y: 0 });
    expect(collides(b, p)).toBe(false);
    expect(placePiece(b, p)).toHaveLength(20);
  });
});
