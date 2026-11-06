// Bucle de animación: único lugar donde se usa el reloj real.
import { advance, type GameState } from '../game/game';
import type { Random } from '../game/bag';

// Máximo de ms por frame, para no encadenar caídas al volver a la pestaña.
const MAX_DELTA_MS = 1000;

export type LoopHandle = {
  // Aplica una acción al estado interno; se dibuja en el siguiente frame.
  apply(action: (state: GameState) => GameState): void;
};

export function startLoop(
  initial: GameState,
  onFrame: (state: GameState) => void,
  random: Random,
): LoopHandle {
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

  return {
    apply(action) {
      state = action(state);
    },
  };
}
