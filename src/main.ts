// Arranque: une la lógica del juego con el dibujo en el canvas.
import { hardDrop, restartGame, rotateCurrent, shiftLeft, shiftRight, softDrop, togglePause } from './game/actions';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from './game/constants';
import { createGame } from './game/game';
import { attachKeyboard, type KeyAction } from './ui/keyboard';
import { attachTouchControls } from './ui/touch';
import { drawBoard } from './ui/render';
import { startLoop } from './ui/loop';
import { overlayText } from './ui/overlay';
import { isNewRecord } from './game/record';
import { getLocalStorage, loadRecord, saveRecord } from './ui/recordStorage';

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

const recordEl = document.getElementById('record');
if (!recordEl) {
  throw new Error('No se encontró el elemento "record".');
}

const overlayEl = document.getElementById('overlay');
if (!overlayEl) {
  throw new Error('No se encontró el elemento "overlay".');
}

const controlsEl = document.getElementById('controls');
const pauseBtn = controlsEl?.querySelector<HTMLElement>('[data-action="pause"]');
const restartBtn = controlsEl?.querySelector<HTMLElement>('[data-action="restart"]');
if (!controlsEl || !pauseBtn || !restartBtn) {
  throw new Error('No se encontraron los controles táctiles ni sus botones de pausa y reinicio.');
}

// Escribe solo si cambió, para no saturar al lector de pantalla.
function setText(el: HTMLElement, value: number | string): void {
  const text = String(value);
  if (el.textContent !== text) el.textContent = text;
}

// El récord se lee una vez y vive en memoria; se guarda solo al terminar la partida.
const storage = getLocalStorage();
let best = loadRecord(storage);
let newRecord = false;

const state = createGame(Math.random);
const loop = startLoop(
  state,
  (s) => {
    if (s.status === 'stopped') {
      newRecord = isNewRecord(best, s.score);
      if (newRecord) {
        best = s.score;
        saveRecord(storage, best);
      }
    } else {
      newRecord = false;
    }
    drawBoard(ctx, s.board, s.piece);
    setText(scoreEl, s.score);
    setText(recordEl, best === 0 ? '—' : best);
    setText(levelEl, s.level);
    setText(linesEl, s.lines);
    const stopped = s.status === 'stopped';
    if (restartBtn.hidden !== !stopped) restartBtn.hidden = !stopped;
    if (pauseBtn.hidden !== stopped) pauseBtn.hidden = stopped;
    setText(pauseBtn, s.status === 'paused' ? 'Seguir' : 'Pausa');
    setText(overlayEl, overlayText(s.status, { best, isNew: newRecord }));
  },
  Math.random,
);

function handleAction(action: KeyAction): void {
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
}

attachKeyboard(window, handleAction);
attachTouchControls(controlsEl, handleAction);
