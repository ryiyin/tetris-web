// Piezas clásicas y sus rotaciones (lógica pura, sin DOM).

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// 0 = aparición, cada paso es un giro horario de 90 grados.
export type Rotation = 0 | 1 | 2 | 3;

// [col, row] relativo a la esquina superior izquierda de la matriz de la pieza.
export type Cell = readonly [number, number];

// Tamaño de la matriz SRS de cada pieza.
const SIZE: Record<PieceType, number> = { I: 4, O: 2, T: 3, S: 3, Z: 3, J: 3, L: 3 };

// Formas en rotación 0 (SRS).
const SHAPES: Record<PieceType, readonly Cell[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

// Gira las celdas 90 grados en sentido horario dentro de una matriz n x n.
function rotateCw(cells: readonly Cell[], n: number): Cell[] {
  return cells.map(([c, r]) => [n - 1 - r, c] as Cell);
}

// Devuelve las 4 celdas de la pieza en la rotación dada.
export function getCells(type: PieceType, rotation: Rotation): readonly Cell[] {
  let cells: readonly Cell[] = SHAPES[type];
  for (let i = 0; i < rotation; i++) cells = rotateCw(cells, SIZE[type]);
  return cells;
}

// Calcula el índice de rotación (módulo 4). No mueve ninguna pieza.
export function rotate(rotation: Rotation, direction: 1 | -1): Rotation {
  return ((rotation + direction + 4) % 4) as Rotation;
}
