import { describe, it, expect } from 'vitest';
import { overlayText } from '../src/ui/overlay';

describe('overlayText', () => {
  it('pausa', () => {
    expect(overlayText('paused')).toBe('Pausa\nP para continuar');
  });
  it('fin del juego', () => {
    expect(overlayText('stopped')).toBe('Fin del juego\nEnter para reiniciar');
  });
  it('jugando no muestra nada', () => {
    expect(overlayText('playing')).toBe('');
  });
});
