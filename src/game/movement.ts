// Movimiento y rotación de la pieza (lógica pura, sin DOM).
// Contrato: si el movimiento es posible devuelve una Piece nueva; si no, la MISMA referencia recibida.
import { collides, type Board, type Piece } from './board';

// Devuelve el candidato si no colisiona; si no, la pieza original (misma referencia).
function tryMove(board: Board, candidate: Piece, original: Piece): Piece {
  return collides(board, candidate) ? original : candidate;
}

export function moveLeft(board: Board, piece: Piece): Piece {
  return tryMove(board, { ...piece, x: piece.x - 1 }, piece);
}

export function moveRight(board: Board, piece: Piece): Piece {
  return tryMove(board, { ...piece, x: piece.x + 1 }, piece);
}

export function moveDown(board: Board, piece: Piece): Piece {
  return tryMove(board, { ...piece, y: piece.y + 1 }, piece);
}
