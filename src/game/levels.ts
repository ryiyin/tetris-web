// Niveles y velocidad de caída (funciones puras, sin DOM).
import {
  GRAVITY_MS,
  GRAVITY_STEP_MS,
  INITIAL_LEVEL,
  LINES_PER_LEVEL,
  MIN_GRAVITY_MS,
} from './constants';

// Nivel según las líneas totales borradas (0-9 = nivel 1, 10-19 = nivel 2...).
export function levelForLines(lines: number): number {
  return INITIAL_LEVEL + Math.floor(lines / LINES_PER_LEVEL);
}

// Milisegundos entre caídas para un nivel; baja con el nivel y nunca pasa del mínimo.
export function gravityMs(level: number): number {
  return Math.max(MIN_GRAVITY_MS, GRAVITY_MS - (level - INITIAL_LEVEL) * GRAVITY_STEP_MS);
}
