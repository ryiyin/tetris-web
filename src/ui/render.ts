// Dibujo del tablero en el canvas (sin lógica de juego).
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from '../game/constants';
import { getPieceCells, type Board, type Piece } from '../game/board';
import type { PieceType } from '../game/pieces';

// Colores clásicos por tipo de pieza.
export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00e5ff',
  O: '#ffd600',
  T: '#aa00ff',
  S: '#00c853',
  Z: '#ff1744',
  J: '#2962ff',
  L: '#ff9100',
};

const BACKGROUND_COLOR = '#0b0b14';
const GRID_COLOR = 'rgba(255, 255, 255, 0.08)';

// Dibuja una celda con relleno y un borde/brillo sencillo. Omite filas < 0.
function drawCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string): void {
  if (row < 0) return;
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  // Brillo en el borde superior e izquierdo.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(x, y, CELL_SIZE, 3);
  ctx.fillRect(x, y, 3, CELL_SIZE);
  // Sombra en el borde inferior y derecho.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(x, y + CELL_SIZE - 3, CELL_SIZE, 3);
  ctx.fillRect(x + CELL_SIZE - 3, y, 3, CELL_SIZE);
}

// Dibuja una cuadrícula tenue de 10x20.
function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 1; c < BOARD_COLS; c++) {
    ctx.moveTo(c * CELL_SIZE + 0.5, 0);
    ctx.lineTo(c * CELL_SIZE + 0.5, BOARD_ROWS * CELL_SIZE);
  }
  for (let r = 1; r < BOARD_ROWS; r++) {
    ctx.moveTo(0, r * CELL_SIZE + 0.5);
    ctx.lineTo(BOARD_COLS * CELL_SIZE, r * CELL_SIZE + 0.5);
  }
  ctx.stroke();
}

// Limpia el canvas y dibuja fondo, cuadrícula, celdas del tablero y la pieza (si hay).
export function drawBoard(ctx: CanvasRenderingContext2D, board: Board, piece: Piece | null): void {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE);
  drawGrid(ctx);

  board.forEach((row, r) => {
    row.forEach((type, c) => {
      if (type !== null) drawCell(ctx, c, r, PIECE_COLORS[type]);
    });
  });

  if (piece) {
    const color = PIECE_COLORS[piece.type];
    getPieceCells(piece).forEach(([c, r]) => drawCell(ctx, c, r, color));
  }
}
