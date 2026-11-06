import { describe, it, expect } from 'vitest';
import { advance, createGame, spawnPiece, tick, type GameState } from '../src/game/game';
import { createBoard, placePiece, type Board } from '../src/game/board';
import { GRAVITY_MS } from '../src/game/constants';
import { PIECE_TYPES } from '../src/game/pieces';

const random = () => 0;

// Filas indicadas llenas salvo la columna 9 (la pieza I vertical en x=7 la completa).
function boardWithGap(rows: number[]): Board {
  return createBoard().map((row, r) =>
    rows.includes(r) ? row.map((_, c) => (c === 9 ? null : ('J' as const))) : row,
  );
}

describe('spawnPiece', () => {
  it('O en x=4 y el resto en x=3, y=0', () => {
    expect(spawnPiece('O')).toEqual({ type: 'O', rotation: 0, y: 0, x: 4 });
    for (const t of PIECE_TYPES.filter((p) => p !== 'O')) {
      expect(spawnPiece(t)).toEqual({ type: t, rotation: 0, y: 0, x: 3 });
    }
  });
});

describe('createGame', () => {
  it('estado inicial', () => {
    const g = createGame(random);
    expect(g.board).toEqual(createBoard());
    expect(g.status).toBe('playing');
    expect(g.dropTimer).toBe(0);
    expect(g.piece).toEqual(spawnPiece(g.piece!.type));
    expect(g.bag).toHaveLength(6);
  });

  it('puntaje, líneas y nivel iniciales', () => {
    const g = createGame(random);
    expect(g.score).toBe(0);
    expect(g.lines).toBe(0);
    expect(g.level).toBe(1);
  });
});

describe('tick', () => {
  it('baja 1 fila una pieza libre sin tocar el tablero', () => {
    const g = createGame(random);
    const t = tick(g, random);
    expect(t.piece!.y).toBe(1);
    expect(t.board).toBe(g.board);
  });

  it('bloquea en el fondo y aparece otra pieza de la bolsa', () => {
    const g = createGame(random);
    const landed: GameState = { ...g, piece: { type: 'O', rotation: 0, x: 4, y: 18 } };
    const t = tick(landed, random);
    expect(t.board[18][4]).toBe('O');
    expect(t.board[19][5]).toBe('O');
    expect(t.piece).toEqual(spawnPiece(t.piece!.type));
    expect(t.bag).toHaveLength(5);
    expect(t.status).toBe('playing');
  });

  it('bloquea sobre la pila', () => {
    const g = createGame(random);
    const board = placePiece(createBoard(), { type: 'O', rotation: 0, x: 4, y: 18 });
    const s: GameState = { ...g, board, piece: { type: 'O', rotation: 0, x: 4, y: 16 } };
    const t = tick(s, random);
    expect(t.board[16][4]).toBe('O');
    expect(t.board[17][5]).toBe('O');
    expect(t.board[18][4]).toBe('O');
  });

  it('la caída automática no cambia el puntaje', () => {
    const t = tick(createGame(random), random);
    expect(t.score).toBe(0);
    expect(t.lines).toBe(0);
  });

  it('completar una línea la borra, suma 100 y aparece la pieza siguiente', () => {
    const s: GameState = {
      ...createGame(random),
      board: boardWithGap([19]),
      piece: { type: 'I', rotation: 1, x: 7, y: 16 },
    };
    const t = tick(s, random);
    expect(t.lines).toBe(1);
    expect(t.score).toBe(100);
    // La fila 19 es ahora la antigua 18: solo la I en la columna 9.
    expect(t.board[19].filter((c) => c !== null)).toHaveLength(1);
    expect(t.board[19][9]).toBe('I');
    expect(t.piece).toEqual(spawnPiece(t.piece!.type));
  });

  it('una I vertical que completa 4 filas da 4 líneas y 800 puntos', () => {
    const s: GameState = {
      ...createGame(random),
      board: boardWithGap([16, 17, 18, 19]),
      piece: { type: 'I', rotation: 1, x: 7, y: 16 },
    };
    const t = tick(s, random);
    expect(t.lines).toBe(4);
    expect(t.score).toBe(800);
    expect(t.board).toEqual(createBoard());
  });

  it('puntaje y líneas se acumulan y usan el nivel del estado', () => {
    const s: GameState = {
      ...createGame(random),
      level: 2,
      score: 50,
      lines: 3,
      board: boardWithGap([19]),
      piece: { type: 'I', rotation: 1, x: 7, y: 16 },
    };
    const t = tick(s, random);
    expect(t.lines).toBe(4);
    expect(t.score).toBe(250);
  });

  it('no muta el estado recibido', () => {
    const g = createGame(random);
    const snapshot = JSON.stringify(g);
    tick(g, random);
    advance(g, 5 * GRAVITY_MS, random);
    expect(JSON.stringify(g)).toBe(snapshot);
  });
});

describe('advance', () => {
  it('con delta menor acumula y no baja', () => {
    const g = createGame(random);
    const a = advance(g, GRAVITY_MS - 1, random);
    expect(a.piece!.y).toBe(0);
    expect(a.dropTimer).toBe(GRAVITY_MS - 1);
  });

  it('con GRAVITY_MS baja 1 fila', () => {
    const a = advance(createGame(random), GRAVITY_MS, random);
    expect(a.piece!.y).toBe(1);
    expect(a.dropTimer).toBe(0);
  });

  it('con 3 * GRAVITY_MS baja 3 filas y conserva el resto', () => {
    const a = advance(createGame(random), 3 * GRAVITY_MS + 250, random);
    expect(a.piece!.y).toBe(3);
    expect(a.dropTimer).toBe(250);
  });

  it('delta negativo cuenta como 0', () => {
    const g = createGame(random);
    expect(advance(g, -500, random).dropTimer).toBe(0);
  });
});

describe('fin: la pieza nueva no cabe', () => {
  function almostFull(): GameState {
    const g = createGame(random);
    // Pila que ocupa la zona de aparición; la pieza actual apoyada encima no puede bajar.
    const board = placePiece(createBoard(), { type: 'O', rotation: 0, x: 4, y: 2 });
    return { ...g, board, piece: { type: 'O', rotation: 0, x: 4, y: 0 } };
  }

  it('queda stopped, piece null y sin errores', () => {
    const s = tick(almostFull(), random);
    expect(s.status).toBe('stopped');
    expect(s.piece).toBeNull();
    expect(s.board[0][4]).toBe('O');
    expect(tick(s, random)).toBe(s);
    expect(advance(s, 5 * GRAVITY_MS, random)).toEqual(s);
  });

  it('advance se detiene al pasar a stopped', () => {
    const s = advance(almostFull(), 5 * GRAVITY_MS, random);
    expect(s.status).toBe('stopped');
    expect(s.piece).toBeNull();
  });
});
