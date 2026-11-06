// Arranque: une la lógica del juego con el dibujo en el canvas.
import { hardDrop, rotateCurrent, shiftLeft, shiftRight, softDrop } from './game/actions';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from './game/constants';
import { createGame } from './game/game';
import { attachKeyboard } from './ui/keyboard';
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

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
if (!scoreEl || !linesEl) {
  throw new Error('No se encontraron los elementos "score" y "lines".');
}

const state = createGame(Math.random);
const loop = startLoop(
  state,
  (s) => {
    drawBoard(ctx, s.board, s.piece);
    scoreEl.textContent = String(s.score);
    linesEl.textContent = String(s.lines);
  },
  Math.random,
);

attachKeyboard(window, (action) => {
  switch (action) {
    case 'left':
      loop.apply(shiftLeft);
      break;
    case 'right':
      loop.apply(shiftRight);
      break;
    case 'rotate':
      loop.apply(rotateCurrent);
      break;
    case 'softDrop':
      loop.apply((s) => softDrop(s, Math.random));
      break;
    case 'hardDrop':
      loop.apply((s) => hardDrop(s, Math.random));
      break;
  }
});
