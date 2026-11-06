// Bolsa aleatoria de 7 piezas (lógica pura; el azar se inyecta).
import { PIECE_TYPES, type PieceType } from './pieces';

// Devuelve un número en [0, 1), como Math.random.
export type Random = () => number;

// Mezcla las 7 piezas con Fisher-Yates sin mutar PIECE_TYPES.
export function shuffleBag(random: Random): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// Toma la primera pieza; si la bolsa está vacía, genera una nueva. No muta la entrada.
export function takeFromBag(
  bag: readonly PieceType[],
  random: Random,
): { type: PieceType; bag: PieceType[] } {
  const source = bag.length === 0 ? shuffleBag(random) : bag;
  return { type: source[0], bag: source.slice(1) };
}
