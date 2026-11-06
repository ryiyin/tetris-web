// Arranque: une la lógica del juego con el dibujo en el canvas.
import { createBoard, placePiece, type Piece } from './game/board';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from './game/constants';
import { drawBoard } from './ui/render';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('No se encontró el canvas con id "game".');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('No se pudo obtener el contexto 2D del canvas.');
}

canvas.width = BOARD_COLS * CELL_SIZE;
canvas.height = BOARD_ROWS * CELL_SIZE;

// Demostración temporal (se reemplaza en T06): una pieza de cada tipo en el fondo.
const demoPieces: Piece[] = [
  { type: 'I', rotation: 0, x: 0, y: 18 },
  { type: 'O', rotation: 0, x: 4, y: 18 },
  { type: 'T', rotation: 0, x: 7, y: 18 },
  { type: 'J', rotation: 0, x: 0, y: 16 },
  { type: 'S', rotation: 0, x: 3, y: 16 },
  { type: 'Z', rotation: 0, x: 6, y: 16 },
  { type: 'L', rotation: 0, x: 7, y: 14 },
];
const board = demoPieces.reduce(placePiece, createBoard());

// Pieza fija de ejemplo.
const piece: Piece = { type: 'T', rotation: 0, x: 3, y: 0 };

drawBoard(ctx, board, piece);
