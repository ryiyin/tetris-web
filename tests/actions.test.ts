import { describe, it, expect } from 'vitest';
import {
  hardDrop,
  rotateCurrent,
  shiftLeft,
  shiftRight,
  softDrop,
} from '../src/game/actions';
import { createGame, type GameState } from '../src/game/game';
import { createBoard, placePiece } from '../src/game/board';
import type { Piece } from '../src/game/board';

const random = () => 0;

function withPiece(piece: Piece | null, extra: Partial<GameState> = {}): GameState {
  return { ...createGame(random), piece, ...extra };
}

describe('shiftLeft / shiftRight', () => {
  it('mueven una columna', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 5 });
    expect(shiftLeft(s).piece!.x).toBe(3);
    expect(shiftRight(s).piece!.x).toBe(5);
  });

  it('contra la pared devuelven el mismo estado', () => {
    const left = withPiece({ type: 'O', rotation: 0, x: 0, y: 5 });
    const right = withPiece({ type: 'O', rotation: 0, x: 8, y: 5 });
    expect(shiftLeft(left)).toBe(left);
    expect(shiftRight(right)).toBe(right);
  });

  it('contra la pila devuelven el mismo estado', () => {
    const board = placePiece(createBoard(), { type: 'O', rotation: 0, x: 2, y: 5 });
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 5 }, { board });
    expect(shiftLeft(s)).toBe(s);
  });

  it('no mutan el estado recibido', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 5 });
    const copy = structuredClone(s);
    shiftLeft(s);
    shiftRight(s);
    expect(s).toEqual(copy);
  });
});

describe('rotateCurrent', () => {
  it('rota la pieza', () => {
    const s = withPiece({ type: 'T', rotation: 0, x: 3, y: 5 });
    expect(rotateCurrent(s).piece!.rotation).toBe(1);
  });

  it('rotación pegada a la pared usa wall kick', () => {
    const s = withPiece({ type: 'I', rotation: 1, x: 7, y: 5 });
    const r = rotateCurrent(s);
    expect(r.piece!.rotation).toBe(2);
    expect(r.piece!.x).toBeLessThanOrEqual(6);
  });

  it('si no puede rotar devuelve el mismo estado', () => {
    // Tablero lleno alrededor: ninguna rotación cabe.
    const full = createBoard().map((row) => row.map(() => 'I' as const));
    const piece: Piece = { type: 'T', rotation: 0, x: 3, y: 5 };
    const board = full.map((row, r) =>
      row.map((c, col) =>
        r === 5 && col >= 3 && col <= 5 ? null : r === 6 && col === 4 ? null : c,
      ),
    );
    const s = withPiece(piece, { board });
    expect(rotateCurrent(s)).toBe(s);
  });
});

describe('softDrop', () => {
  it('baja una fila y pone dropTimer en 0', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 5 }, { dropTimer: 700 });
    const r = softDrop(s, random);
    expect(r.piece!.y).toBe(6);
    expect(r.dropTimer).toBe(0);
  });

  it('apoyada: bloquea y aparece pieza nueva', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 18 }, { dropTimer: 500 });
    const r = softDrop(s, random);
    expect(r.board[19][4]).toBe('O');
    expect(r.board[18][5]).toBe('O');
    expect(r.piece!.y).toBe(0);
    expect(r.dropTimer).toBe(0);
  });

  it('apoyada en pila bloquea encima', () => {
    const board = placePiece(createBoard(), { type: 'O', rotation: 0, x: 4, y: 18 });
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 16 }, { board });
    const r = softDrop(s, random);
    expect(r.board[16][4]).toBe('O');
    expect(r.board[17][5]).toBe('O');
  });

  it('no muta el estado', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 18 });
    const copy = structuredClone(s);
    softDrop(s, random);
    expect(s).toEqual(copy);
  });
});

describe('hardDrop', () => {
  it('tablero vacío: la pieza queda en el fondo y aparece otra', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 0 }, { dropTimer: 300 });
    const r = hardDrop(s, random);
    expect(r.board[18][4]).toBe('O');
    expect(r.board[19][5]).toBe('O');
    expect(r.piece!.y).toBe(0);
    expect(r.status).toBe('playing');
    expect(r.dropTimer).toBe(0);
  });

  it('sobre pila: queda encima', () => {
    const board = placePiece(createBoard(), { type: 'O', rotation: 0, x: 4, y: 18 });
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 0 }, { board });
    const r = hardDrop(s, random);
    expect(r.board[16][4]).toBe('O');
    expect(r.board[17][5]).toBe('O');
  });

  it('si la pieza nueva no cabe: stopped y piece null', () => {
    // Pila que llega hasta la fila 1 en las columnas de aparición.
    let board = createBoard();
    for (let y = 2; y < 20; y += 2) {
      board = placePiece(board, { type: 'O', rotation: 0, x: 4, y });
    }
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 0 }, { board });
    const r = hardDrop(s, random);
    expect(r.status).toBe('stopped');
    expect(r.piece).toBeNull();
  });

  it('no muta el estado', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 0 });
    const copy = structuredClone(s);
    hardDrop(s, random);
    expect(s).toEqual(copy);
  });
});

describe('estado detenido o sin pieza', () => {
  it('las 5 acciones devuelven el mismo estado', () => {
    const stopped = withPiece({ type: 'O', rotation: 0, x: 4, y: 5 }, { status: 'stopped' });
    const noPiece = withPiece(null);
    for (const s of [stopped, noPiece]) {
      expect(shiftLeft(s)).toBe(s);
      expect(shiftRight(s)).toBe(s);
      expect(rotateCurrent(s)).toBe(s);
      expect(softDrop(s, random)).toBe(s);
      expect(hardDrop(s, random)).toBe(s);
    }
  });
});
