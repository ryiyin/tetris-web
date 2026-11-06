import { describe, expect, it } from 'vitest';
import { collides, createBoard, getPieceCells, placePiece, type Board, type Piece } from '../src/game/board';
import { WALL_KICKS, moveDown, moveLeft, moveRight, rotatePiece } from '../src/game/movement';

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

describe('rotación', () => {
  it('rota +1 y -1 en espacio libre sin cambiar x, y', () => {
    const b = createBoard();
    expect(rotatePiece(b, free)).toEqual({ ...free, rotation: 1 });
    expect(rotatePiece(b, free, -1)).toEqual({ ...free, rotation: 3 });
    expect(rotatePiece(b, { ...free, rotation: 3 })).toEqual({ ...free, rotation: 0 });
  });

  it('O cambia el índice y devuelve pieza nueva', () => {
    const o: Piece = { type: 'O', rotation: 0, x: 4, y: 5 };
    const r = rotatePiece(createBoard(), o);
    expect(r).not.toBe(o);
    expect(r.rotation).toBe(1);
  });

  it('funciona con filas negativas', () => {
    const p: Piece = { type: 'T', rotation: 0, x: 3, y: -2 };
    expect(rotatePiece(createBoard(), p)).toEqual({ ...p, rotation: 1 });
  });

  it('WALL_KICKS tiene el orden esperado', () => {
    expect([...WALL_KICKS]).toEqual([0, -1, 1, -2, 2]);
  });

  it('wall kick de 1 columna en pared izquierda (T)', () => {
    const b = createBoard();
    const p: Piece = { type: 'T', rotation: 1, x: -1, y: 5 };
    expect(collides(b, p)).toBe(false);
    expect(collides(b, { ...p, rotation: 2 })).toBe(true);
    const r = rotatePiece(b, p);
    expect(r).toEqual({ ...p, rotation: 2, x: 0 });
    expect(collides(b, r)).toBe(false);
  });

  it('wall kick de 1 columna en pared derecha (T)', () => {
    const b = createBoard();
    const p: Piece = { type: 'T', rotation: 3, x: 8, y: 5 };
    expect(collides(b, p)).toBe(false);
    expect(collides(b, { ...p, rotation: 0 })).toBe(true);
    const r = rotatePiece(b, p);
    expect(r).toEqual({ ...p, rotation: 0, x: 7 });
    expect(collides(b, r)).toBe(false);
  });

  it('I vertical necesita kick de 2 columnas (derecha)', () => {
    const b = createBoard();
    const p: Piece = { type: 'I', rotation: 3, x: 8, y: 5 };
    expect(collides(b, p)).toBe(false);
    const r = rotatePiece(b, p);
    expect(r).toEqual({ ...p, rotation: 0, x: 6 });
    expect(collides(b, r)).toBe(false);
  });

  it('I vertical necesita kick de 2 columnas (izquierda)', () => {
    const b = createBoard();
    const p: Piece = { type: 'I', rotation: 1, x: -2, y: 5 };
    expect(collides(b, p)).toBe(false);
    const r = rotatePiece(b, p);
    expect(r).toEqual({ ...p, rotation: 2, x: 0 });
    expect(collides(b, r)).toBe(false);
  });

  it('devuelve la misma referencia si ninguna variante cabe', () => {
    // I vertical (rot 1, col 4) encajonada: las filas 6 y 7 están llenas salvo la columna de la pieza
    const p: Piece = { type: 'I', rotation: 1, x: 2, y: 5 };
    const cells: [number, number][] = [];
    for (let c = 0; c < 10; c++) if (c !== 4) cells.push([c, 6], [c, 7]);
    const b = boardWith(cells);
    expect(collides(b, p)).toBe(false);
    expect(rotatePiece(b, p)).toBe(p);
    expect(rotatePiece(b, p, -1)).toBe(p);
  });
});

describe('inmutabilidad', () => {
  it('no muta piece ni board', () => {
    const b = boardWith([[0, 19]]);
    const snapshot = JSON.stringify(b);
    const p = Object.freeze({ ...free });
    const fb = Object.freeze(b.map((r) => Object.freeze(r)));
    for (const fn of [moveLeft, moveRight, moveDown, rotatePiece]) {
      expect(() => fn(fb, p)).not.toThrow();
    }
    expect(JSON.stringify(b)).toBe(snapshot);
    expect(p).toEqual(free);
  });
});
