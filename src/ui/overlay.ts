// Texto del aviso sobre el tablero según el estado (puro, sin DOM).
import type { GameStatus } from '../game/game';

export interface RecordInfo {
  best: number;
  isNew: boolean;
}

// Con touch=true el aviso habla de botones en vez de teclas.
export function overlayText(status: GameStatus, record?: RecordInfo, touch = false): string {
  const restart = touch ? 'Toca Reiniciar' : 'Enter para reiniciar';
  switch (status) {
    case 'paused':
      return touch ? 'Pausa\nToca Continuar' : 'Pausa\nP para continuar';
    case 'stopped':
      if (record?.isNew) return `Fin del juego\n¡Nuevo récord!\n${restart}`;
      if (record && record.best > 0) return `Fin del juego\nRécord: ${record.best}\n${restart}`;
      return `Fin del juego\n${restart}`;
    default:
      return '';
  }
}
