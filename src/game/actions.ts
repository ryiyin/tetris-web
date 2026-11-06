// Acciones del jugador sobre el estado (lógica pura, sin DOM).
// Si la acción no cambia nada, devuelven el MISMO estado (misma referencia).
import type { Random } from './bag';
import { placePiece, type Piece } from './board';
import { spawnNext, tick, type GameState } from './game';
import { moveDown, moveLeft, moveRight, rotatePiece } from './movement';

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

// Caída suave: un paso de gravedad (baja o bloquea al instante).
export function softDrop(state: GameState, random: Random): GameState {
  if (!isActive(state)) return state;
  return { ...tick(state, random), dropTimer: 0 };
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

// Caída dura: al fondo, bloquea y aparece la siguiente pieza.
export function hardDrop(state: GameState, random: Random): GameState {
  if (!isActive(state)) return state;
  const landed = dropToBottom(state, state.piece as Piece);
  const board = placePiece(state.board, landed);
  return spawnNext({ ...state, board, dropTimer: 0 }, random);
}
