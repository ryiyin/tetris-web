// Estado del juego: aparición, caída y bloqueo (lógica pura, sin DOM).
import { takeFromBag, type Random } from './bag';
import { collides, placePiece, createBoard, type Board, type Piece } from './board';
import { GRAVITY_MS } from './constants';
import { moveDown } from './movement';
import type { PieceType } from './pieces';

// 'stopped' = no cabe la pieza nueva (T11 lo ampliará a fin de juego).
export type GameStatus = 'playing' | 'stopped';

export type GameState = {
  readonly board: Board;
  readonly piece: Piece | null;
  readonly bag: readonly PieceType[];
  readonly status: GameStatus;
  // Milisegundos acumulados desde la última caída.
  readonly dropTimer: number;
};

// Pieza en su posición de aparición (centrada en 10 columnas).
export function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, y: 0, x: type === 'O' ? 4 : 3 };
}

// Toma la siguiente pieza de la bolsa; si no cabe, el juego queda 'stopped'.
export function spawnNext(state: GameState, random: Random): GameState {
  const { type, bag } = takeFromBag(state.bag, random);
  const piece = spawnPiece(type);
  if (collides(state.board, piece)) {
    return { ...state, bag, piece: null, status: 'stopped' };
  }
  return { ...state, bag, piece };
}

export function createGame(random: Random): GameState {
  return spawnNext(
    { board: createBoard(), piece: null, bag: [], status: 'playing', dropTimer: 0 },
    random,
  );
}

// Un paso de gravedad: baja la pieza o la bloquea al instante si no puede bajar.
export function tick(state: GameState, random: Random): GameState {
  if (state.status !== 'playing' || state.piece === null) return state;
  const moved = moveDown(state.board, state.piece);
  if (moved !== state.piece) return { ...state, piece: moved };
  const board = placePiece(state.board, state.piece);
  return spawnNext({ ...state, board }, random);
}

// Suma tiempo y aplica las caídas que correspondan.
export function advance(state: GameState, deltaMs: number, random: Random): GameState {
  if (state.status !== 'playing') return state;
  let current: GameState = { ...state, dropTimer: state.dropTimer + Math.max(0, deltaMs) };
  while (current.dropTimer >= GRAVITY_MS && current.status === 'playing') {
    current = tick({ ...current, dropTimer: current.dropTimer - GRAVITY_MS }, random);
  }
  return current;
}
