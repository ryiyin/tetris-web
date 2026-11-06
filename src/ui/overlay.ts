// Texto del aviso sobre el tablero según el estado (puro, sin DOM).
import type { GameStatus } from '../game/game';

export function overlayText(status: GameStatus): string {
  switch (status) {
    case 'paused':
      return 'Pausa\nP para continuar';
    case 'stopped':
      return 'Fin del juego\nEnter para reiniciar';
    default:
      return '';
  }
}
