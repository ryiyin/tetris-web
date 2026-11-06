// Texto del aviso sobre el tablero según el estado (puro, sin DOM).
import type { GameStatus } from '../game/game';

export interface RecordInfo {
  best: number;
  isNew: boolean;
}

export function overlayText(status: GameStatus, record?: RecordInfo): string {
  switch (status) {
    case 'paused':
      return 'Pausa\nP para continuar';
    case 'stopped':
      if (record?.isNew) return 'Fin del juego\n¡Nuevo récord!\nEnter para reiniciar';
      if (record && record.best > 0) return `Fin del juego\nRécord: ${record.best}\nEnter para reiniciar`;
      return 'Fin del juego\nEnter para reiniciar';
    default:
      return '';
  }
}
