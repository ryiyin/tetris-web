import { describe, it, expect } from 'vitest';
import { advance, createGame, spawnPiece, tick, type GameState } from '../src/game/game';
import { createBoard, placePiece } from '../src/game/board';
import { GRAVITY_MS } from '../src/game/constants';
import { PIECE_TYPES } from '../src/game/pieces';

const random = () => 0;

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
