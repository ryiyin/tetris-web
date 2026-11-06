// Arranque: une la lógica del juego con el dibujo en el canvas.
import { createBoard, placePiece, type Piece } from './game/board';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from './game/constants';
import { createGame } from './game/game';
import { drawBoard } from './ui/render';
import { startLoop } from './ui/loop';

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

const state = createGame(Math.random);
startLoop(state, (s) => drawBoard(ctx, s.board, s.piece), Math.random);
