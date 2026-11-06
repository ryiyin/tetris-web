// Tablero y colisiones (lógica pura, sin DOM).
import { BOARD_COLS, BOARD_ROWS } from './constants';
import { getCells, type Cell, type PieceType, type Rotation } from './pieces';

// Filas x columnas; null = celda vacía, si no, el tipo de pieza (para colorear).
export type Board = readonly (readonly (PieceType | null)[])[];

// x, y = esquina superior izquierda de la matriz de la pieza, en coordenadas del tablero.
export type Piece = {
  readonly type: PieceType;
  readonly rotation: Rotation;
  readonly x: number;
  readonly y: number;
};

// Crea un tablero vacío de 10x20.
export function createBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null),
  );
}

// Celdas absolutas [col, row] de la pieza.
export function getPieceCells(piece: Piece): Cell[] {
  return getCells(piece.type, piece.rotation).map(
    ([c, r]) => [piece.x + c, piece.y + r] as Cell,
  );
}

// Verdadero si alguna celda sale por los lados o por abajo, o pisa una celda ocupada.
// Las celdas con fila < 0 no colisionan (la pieza puede aparecer parcialmente arriba).
export function collides(board: Board, piece: Piece): boolean {
  return getPieceCells(piece).some(([c, r]) => {
    if (c < 0 || c >= BOARD_COLS || r >= BOARD_ROWS) return true;
    if (r < 0) return false;
    return board[r][c] !== null;
  });
}

// Devuelve un tablero nuevo con la pieza escrita. No valida colisión ni muta el original.
export function placePiece(board: Board, piece: Piece): Board {
  const cells = getPieceCells(piece);
  return board.map((row, r) =>
    row.map((value, c) =>
      cells.some(([pc, pr]) => pc === c && pr === r) ? piece.type : value,
    ),
  );
}
