// Líneas y puntaje (lógica pura, sin DOM).
import type { Board } from './board';
import { BOARD_COLS } from './constants';

// Puntos base según las líneas borradas (el índice es la cantidad de líneas).
export const LINE_POINTS: readonly number[] = [0, 100, 300, 500, 800];

// Puntos por cada celda que baja la pieza con la caída suave (sin multiplicar por nivel).
export const SOFT_DROP_POINTS_PER_CELL = 1;

// Quita las filas completas y añade filas vacías arriba.
// Si no hay líneas devuelve la MISMA referencia del tablero.
export function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => cell === null));
  const cleared = board.length - kept.length;
  if (cleared === 0) return { board, cleared: 0 };
  const empty = Array.from({ length: cleared }, () =>
    Array.from({ length: BOARD_COLS }, () => null),
  );
  return { board: [...empty, ...kept], cleared };
}

export function lineScore(cleared: number, level: number): number {
  return (LINE_POINTS[cleared] ?? 0) * level;
}
