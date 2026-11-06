// Movimiento y rotación de la pieza (lógica pura, sin DOM).
// Contrato: si el movimiento es posible devuelve una Piece nueva; si no, la MISMA referencia recibida.
import { collides, type Board, type Piece } from './board';
import { rotate } from './pieces';

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

// Desplazamientos horizontales que se prueban al rotar (wall kick simple, sin tablas SRS).
export const WALL_KICKS: readonly number[] = [0, -1, 1, -2, 2];

// Rota la pieza probando los kicks en orden; si ninguno cabe, devuelve la misma pieza.
export function rotatePiece(board: Board, piece: Piece, direction: 1 | -1 = 1): Piece {
  const rotation = rotate(piece.rotation, direction);
  for (const dx of WALL_KICKS) {
    const candidate: Piece = { ...piece, rotation, x: piece.x + dx };
    if (!collides(board, candidate)) return candidate;
  }
  return piece;
}
