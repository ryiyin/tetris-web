// Dimensiones del tablero (10 columnas x 20 filas) y tamaño de celda en píxeles.
export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const CELL_SIZE = 30;

// Milisegundos entre caídas en el nivel 1; los niveles siguientes la acortan (ver levels.ts).
export const GRAVITY_MS = 1000;

// Cuántos milisegundos menos por cada nivel por encima del 1, y el intervalo mínimo.
export const GRAVITY_STEP_MS = 80;
export const MIN_GRAVITY_MS = 100;

// Nivel con el que empieza la partida; sube cada LINES_PER_LEVEL líneas borradas.
export const INITIAL_LEVEL = 1;
export const LINES_PER_LEVEL = 10;
