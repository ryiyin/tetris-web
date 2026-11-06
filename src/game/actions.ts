// Acciones del jugador sobre el estado (lógica pura, sin DOM).
// Si la acción no cambia nada, devuelven el MISMO estado (misma referencia).
import type { Random } from './bag';
import type { Piece } from './board';
import { createGame, lockPiece, type GameState } from './game';
import { moveDown, moveLeft, moveRight, rotatePiece } from './movement';
import { SOFT_DROP_POINTS_PER_CELL } from './scoring';

type PieceMove = (board: GameState['board'], piece: Piece) => Piece;

function isActive(state: GameState): boolean {
  return state.status === 'playing' && state.piece !== null;
}

function applyMove(state: GameState, move: PieceMove): GameState {
  if (!isActive(state)) return state;
  const piece = state.piece as Piece;
  const moved = move(state.board, piece);
  return moved === piece ? state : { ...state, piece: moved };
}

export const shiftLeft = (state: GameState): GameState => applyMove(state, moveLeft);
export const shiftRight = (state: GameState): GameState => applyMove(state, moveRight);
export const rotateCurrent = (state: GameState): GameState => applyMove(state, rotatePiece);

// Caída suave: baja una celda (+1 punto) o, si no puede, bloquea al instante (sin ese punto).
export function softDrop(state: GameState, random: Random): GameState {
  if (!isActive(state)) return state;
  const piece = state.piece as Piece;
  const moved = moveDown(state.board, piece);
  if (moved === piece) return { ...lockPiece(state, piece, random), dropTimer: 0 };
  return {
    ...state,
    piece: moved,
    score: state.score + SOFT_DROP_POINTS_PER_CELL,
    dropTimer: 0,
  };
}

// Pausa/reanuda. Solo cambia status; en 'stopped' (fin) devuelve el mismo estado.
export function togglePause(state: GameState): GameState {
  if (state.status === 'playing') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'playing' };
  return state;
}

// Baja la pieza hasta que no pueda más.
function dropToBottom(state: GameState, piece: Piece): Piece {
  let current = piece;
  for (;;) {
    const next = moveDown(state.board, current);
    if (next === current) return current;
    current = next;
  }
}

// Caída dura: al fondo, bloquea y aparece la siguiente pieza. No puntúa por celda.
export function hardDrop(state: GameState, random: Random): GameState {
  if (!isActive(state)) return state;
  const landed = dropToBottom(state, state.piece as Piece);
  return lockPiece({ ...state, dropTimer: 0 }, landed, random);
}

// Reinicio: solo en fin de juego devuelve una partida nueva; en otro caso, el mismo estado.
export function restartGame(state: GameState, random: Random): GameState {
  return state.status === 'stopped' ? createGame(random) : state;
}
