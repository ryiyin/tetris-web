// Bucle de animación: único lugar donde se usa el reloj real.
import { advance, type GameState } from '../game/game';
import type { Random } from '../game/bag';

// Máximo de ms por frame, para no encadenar caídas al volver a la pestaña.
const MAX_DELTA_MS = 1000;

export function startLoop(
  initial: GameState,
  onFrame: (state: GameState) => void,
  random: Random,
): void {
  let state = initial;
  let last: number | null = null;

  const frame = (ts: number): void => {
    const delta = last === null ? 0 : Math.min(ts - last, MAX_DELTA_MS);
    last = ts;
    state = advance(state, delta, random);
    onFrame(state);
    if (state.status === 'playing') requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
