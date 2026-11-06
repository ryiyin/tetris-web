// Estado del juego: aparición, caída y bloqueo (lógica pura, sin DOM).
import { takeFromBag, type Random } from './bag';
import { collides, placePiece, createBoard, type Board, type Piece } from './board';
import { INITIAL_LEVEL } from './constants';
import { gravityMs, levelForLines } from './levels';
import { moveDown } from './movement';
import type { PieceType } from './pieces';
import { clearLines, lineScore } from './scoring';

// 'stopped' = fin (no cabe la pieza nueva; T11 lo ampliará). 'paused' = pausa reanudable.
export type GameStatus = 'playing' | 'paused' | 'stopped';

export type GameState = {
  readonly board: Board;
  readonly piece: Piece | null;
  readonly bag: readonly PieceType[];
  readonly status: GameStatus;
  // Milisegundos acumulados desde la última caída.
  readonly dropTimer: number;
  readonly score: number;
  readonly lines: number;
  // Sube cada LINES_PER_LEVEL líneas (levelForLines). Multiplica los puntos y acelera la caída.
  readonly level: number;
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
    {
      board: createBoard(),
      piece: null,
      bag: [],
      status: 'playing',
      dropTimer: 0,
      score: 0,
      lines: 0,
      level: INITIAL_LEVEL,
    },
    random,
  );
}

// Punto único de bloqueo: fija la pieza, borra líneas, suma puntos y saca la siguiente.
export function lockPiece(state: GameState, piece: Piece, random: Random): GameState {
  const placed = placePiece(state.board, piece);
  const { board, cleared } = clearLines(placed);
  const lines = state.lines + cleared;
  return spawnNext(
    {
      ...state,
      board,
      lines,
      // El puntaje usa el nivel previo; el nuevo aplica desde la siguiente pieza.
      score: state.score + lineScore(cleared, state.level),
      level: levelForLines(lines),
    },
    random,
  );
}

// Un paso de gravedad: baja la pieza o la bloquea al instante si no puede bajar.
export function tick(state: GameState, random: Random): GameState {
  if (state.status !== 'playing' || state.piece === null) return state;
  const moved = moveDown(state.board, state.piece);
  if (moved !== state.piece) return { ...state, piece: moved };
  return lockPiece(state, state.piece, random);
}

// Suma tiempo y aplica las caídas que correspondan.
export function advance(state: GameState, deltaMs: number, random: Random): GameState {
  if (state.status !== 'playing') return state;
  let current: GameState = { ...state, dropTimer: state.dropTimer + Math.max(0, deltaMs) };
  while (current.status === 'playing') {
    const interval = gravityMs(current.level);
    if (current.dropTimer < interval) break;
    current = tick({ ...current, dropTimer: current.dropTimer - interval }, random);
  }
  return current;
}
