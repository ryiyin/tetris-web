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

describe('overlayText con récord', () => {
  it('nuevo récord', () => {
    expect(overlayText('stopped', { best: 500, isNew: true })).toBe(
      'Fin del juego\n¡Nuevo récord!\nEnter para reiniciar',
    );
  });
  it('récord existente', () => {
    expect(overlayText('stopped', { best: 500, isNew: false })).toBe(
      'Fin del juego\nRécord: 500\nEnter para reiniciar',
    );
  });
  it('sin récord', () => {
    expect(overlayText('stopped', { best: 0, isNew: false })).toBe('Fin del juego\nEnter para reiniciar');
  });
  it('pausa y jugando no cambian', () => {
    const r = { best: 500, isNew: true };
    expect(overlayText('paused', r)).toBe('Pausa\nP para continuar');
    expect(overlayText('playing', r)).toBe('');
  });
});
