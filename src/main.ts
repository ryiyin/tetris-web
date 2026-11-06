// Arranque: une la lógica del juego con el dibujo en el canvas.
import { hardDrop, restartGame, rotateCurrent, shiftLeft, shiftRight, softDrop, togglePause } from './game/actions';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from './game/constants';
import { createGame, type GameStatus } from './game/game';
import { attachKeyboard, type KeyAction } from './ui/keyboard';
import { attachGestures } from './ui/gestures';
import { attachTouchControls, buttonAction, isActionEnabled, pauseButtonLabel } from './ui/touch';
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
if (!controlsEl) {
  throw new Error('No se encontró el elemento "controls".');
}
const controlButtons = Array.from(controlsEl.querySelectorAll<HTMLButtonElement>('button[data-action]'));

// Debe coincidir con la consulta de la botonera en style.css.
const TOUCH_QUERY = '(pointer: coarse), (hover: none)';
const touchQuery = window.matchMedia?.(TOUCH_QUERY);

// Actualiza botones (deshabilitado y texto de pausa) solo si cambió el valor.
function updateControls(status: GameStatus): void {
  for (const button of controlButtons) {
    const action = buttonAction(button.dataset.action);
    if (action === null) continue;
    const disabled = !isActionEnabled(action, status);
    if (button.disabled !== disabled) button.disabled = disabled;
    if (action === 'pause') {
      const label = pauseButtonLabel(status);
      if (button.getAttribute('aria-label') !== label) {
        button.setAttribute('aria-label', label);
        const text = button.querySelector('span');
        if (text) text.textContent = label;
      }
    }
  }
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
    updateControls(s.status);
    setText(overlayEl, overlayText(s.status, { best, isNew: newRecord }, touchQuery?.matches ?? false));
  },
  Math.random,
);

// Único despacho de acciones: lo usan el teclado y los botones táctiles.
function dispatch(action: KeyAction): void {
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

attachKeyboard(window, dispatch);
attachTouchControls(controlsEl, dispatch);
attachGestures(canvas, dispatch);
