import { describe, it, expect } from 'vitest';
import {
  hardDrop,
  rotateCurrent,
  shiftLeft,
  shiftRight,
  softDrop,
  togglePause,
} from '../src/game/actions';
import { advance, tick, createGame, type GameState } from '../src/game/game';
import { createBoard, placePiece, type Board } from '../src/game/board';
import type { Piece } from '../src/game/board';

const random = () => 0;

// Filas indicadas llenas salvo la columna 9 (la pieza I vertical en x=7 la completa).
function boardWithGap(rows: number[]): Board {
  return createBoard().map((row, r) =>
    rows.includes(r) ? row.map((_, c) => (c === 9 ? null : ('J' as const))) : row,
  );
}

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

  it('si baja una celda suma 1 punto (sin multiplicar por nivel)', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 5 }, { score: 10, level: 3 });
    expect(softDrop(s, random).score).toBe(11);
  });

  it('si bloquea no suma el punto de caída', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 18 }, { score: 10 });
    expect(softDrop(s, random).score).toBe(10);
  });

  it('si bloquea y completa una línea suma lineScore', () => {
    const s = withPiece(
      { type: 'I', rotation: 1, x: 7, y: 16 },
      { board: boardWithGap([19]) },
    );
    const r = softDrop(s, random);
    expect(r.lines).toBe(1);
    expect(r.score).toBe(100);
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

  it('sin líneas el puntaje no cambia (no puntúa por celda)', () => {
    const s = withPiece({ type: 'O', rotation: 0, x: 4, y: 0 }, { score: 7 });
    const r = hardDrop(s, random);
    expect(r.score).toBe(7);
    expect(r.lines).toBe(0);
  });

  it('que completa líneas suma solo lineScore', () => {
    const s = withPiece(
      { type: 'I', rotation: 1, x: 7, y: 0 },
      { board: boardWithGap([16, 17, 18, 19]) },
    );
    const r = hardDrop(s, random);
    expect(r.lines).toBe(4);
    expect(r.score).toBe(800);
    expect(r.dropTimer).toBe(0);
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

describe('togglePause', () => {
  const piece: Piece = { type: 'T', rotation: 0, x: 3, y: 5 };

  it('alterna playing -> paused -> playing', () => {
    const s = withPiece(piece);
    const paused = togglePause(s);
    expect(paused.status).toBe('paused');
    expect(togglePause(paused).status).toBe('playing');
  });

  it('en stopped devuelve la misma referencia', () => {
    const s = withPiece(null, { status: 'stopped' });
    expect(togglePause(s)).toBe(s);
  });

  it('solo cambia status', () => {
    const s = withPiece(piece, { dropTimer: 450, score: 70, lines: 3, level: 1 });
    expect(togglePause(togglePause(s))).toEqual(s);
    expect(togglePause(s)).toEqual({ ...s, status: 'paused' });
  });

  it('en pausa nada cambia (misma referencia)', () => {
    const p = togglePause(withPiece(piece));
    expect(advance(p, 5_000_000, random)).toBe(p);
    expect(advance(p, 16, random)).toBe(p);
    expect(tick(p, random)).toBe(p);
    expect(shiftLeft(p)).toBe(p);
    expect(shiftRight(p)).toBe(p);
    expect(rotateCurrent(p)).toBe(p);
    expect(softDrop(p, random)).toBe(p);
    expect(hardDrop(p, random)).toBe(p);
  });

  it('tras reanudar un delta pequeño no hace caer la pieza', () => {
    const p = togglePause(withPiece(piece, { dropTimer: 0 }));
    advance(p, 30_000, random);
    const resumed = advance(togglePause(p), 16, random);
    expect(resumed.piece).toEqual(piece);
  });
});
