// Arranque: une la lógica del juego con el dibujo en el canvas.
import { hardDrop, restartGame, rotateCurrent, shiftLeft, shiftRight, softDrop, togglePause } from './game/actions';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from './game/constants';
import { createGame } from './game/game';
import { attachKeyboard } from './ui/keyboard';
import { drawBoard } from './ui/render';
import { startLoop } from './ui/loop';
import { overlayText } from './ui/overlay';

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
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
if (!scoreEl || !levelEl || !linesEl) {
  throw new Error('No se encontraron los elementos "score", "level" y "lines".');
}

const overlayEl = document.getElementById('overlay');
if (!overlayEl) {
  throw new Error('No se encontró el elemento "overlay".');
}

// Escribe solo si cambió, para no saturar al lector de pantalla.
function setText(el: HTMLElement, value: number | string): void {
  const text = String(value);
  if (el.textContent !== text) el.textContent = text;
}

const state = createGame(Math.random);
const loop = startLoop(
  state,
  (s) => {
    drawBoard(ctx, s.board, s.piece);
    setText(scoreEl, s.score);
    setText(levelEl, s.level);
    setText(linesEl, s.lines);
    setText(overlayEl, overlayText(s.status));
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
    case 'pause':
      loop.apply(togglePause);
      break;
    case 'restart':
      loop.apply((s) => restartGame(s, Math.random));
      break;
  }
});
