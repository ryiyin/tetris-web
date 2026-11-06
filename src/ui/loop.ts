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
  let running = true;

  const frame = (ts: number): void => {
    const delta = last === null ? 0 : Math.min(ts - last, MAX_DELTA_MS);
    last = ts;
    state = advance(state, delta, random);
    onFrame(state);
    // En pausa se sigue pidiendo frames: así se redibuja y `last` se mantiene al día,
    // y al reanudar el delta es de ~1 frame. Solo 'stopped' (fin) detiene el bucle.
    if (state.status !== 'stopped') requestAnimationFrame(frame);
    else running = false;
  };

  requestAnimationFrame(frame);

  return {
    apply(action) {
      state = action(state);
      // Si el bucle estaba detenido (fin de juego) y la acción lo revive, se reanuda
      // con delta 0 (last = null) y sin duplicar bucles.
      if (!running && state.status !== 'stopped') {
        running = true;
        last = null;
        requestAnimationFrame(frame);
      }
    },
  };
}
