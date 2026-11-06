import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { restartGame } from '../src/game/actions';
import { GRAVITY_MS } from '../src/game/constants';
import { createGame, type GameState } from '../src/game/game';
import { startLoop } from '../src/ui/loop';

const random = () => 0;

// requestAnimationFrame simulado: guarda los callbacks y se ejecutan a mano.
let pending: Array<(ts: number) => void>;
let requests: number;

function runFrame(ts: number): void {
  const cbs = pending;
  pending = [];
  cbs.forEach((cb) => cb(ts));
}

beforeEach(() => {
  pending = [];
  requests = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
    requests++;
    pending.push(cb);
    return requests;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const stoppedState = (): GameState => ({ ...createGame(random), piece: null, status: 'stopped', score: 77 });

describe('startLoop', () => {
  it('pide un frame al arrancar y sigue pidiendo mientras no sea stopped', () => {
    const frames: GameState[] = [];
    startLoop(createGame(random), (s) => frames.push(s), random);
    expect(pending).toHaveLength(1);
    runFrame(0);
    expect(pending).toHaveLength(1);
    runFrame(16);
    expect(frames).toHaveLength(2);
  });

  it('tras stopped no quedan frames pendientes', () => {
    startLoop(stoppedState(), () => {}, random);
    runFrame(0);
    expect(pending).toHaveLength(0);
  });

  it('apply(restart) tras stopped pide exactamente un frame nuevo', () => {
    const loop = startLoop(stoppedState(), () => {}, random);
    runFrame(0);
    const before = requests;
    loop.apply((s) => restartGame(s, random));
    expect(requests - before).toBe(1);
    expect(pending).toHaveLength(1);
  });

  it('apply con el bucle en marcha no pide frames extra', () => {
    const loop = startLoop(createGame(random), () => {}, random);
    runFrame(0);
    const before = requests;
    loop.apply((s) => ({ ...s, score: 5 }));
    loop.apply((s) => s);
    expect(requests).toBe(before);
    expect(pending).toHaveLength(1);
  });

  it('apply que deja stopped (o ya stopped) no pide frames', () => {
    const loop = startLoop(stoppedState(), () => {}, random);
    runFrame(0);
    const before = requests;
    loop.apply((s) => s);
    loop.apply((s) => ({ ...s, score: 1 }));
    expect(requests).toBe(before);
    expect(pending).toHaveLength(0);
  });

  it('tras reiniciar el bucle queda marcado en marcha: no hay bucles duplicados', () => {
    const loop = startLoop(stoppedState(), () => {}, random);
    runFrame(0);
    loop.apply((s) => restartGame(s, random));
    runFrame(16);
    const before = requests;
    loop.apply((s) => ({ ...s, score: 5 }));
    loop.apply((s) => restartGame(s, random));
    expect(requests).toBe(before);
    expect(pending).toHaveLength(1);
  });

  it('carrera: apply a stopped con frame pendiente, restart y runFrame deja un solo frame', () => {
    const loop = startLoop(createGame(random), () => {}, random);
    loop.apply(() => stoppedState());
    loop.apply((s) => restartGame(s, random));
    runFrame(0);
    expect(pending).toHaveLength(1);
  });

  it('el primer frame tras reiniciar usa delta 0 y el bucle sigue', () => {
    const frames: GameState[] = [];
    const loop = startLoop(stoppedState(), (s) => frames.push(s), random);
    runFrame(0);
    loop.apply((s) => restartGame(s, random));
    runFrame(1_000_000);
    const first = frames[frames.length - 1];
    expect(first.status).toBe('playing');
    expect(first.piece!.y).toBe(0);
    expect(first.dropTimer).toBe(0);
    // sigue corriendo: un frame de GRAVITY_MS después la pieza cae
    expect(pending).toHaveLength(1);
    runFrame(1_000_000 + GRAVITY_MS);
    expect(frames[frames.length - 1].piece!.y).toBe(1);
    expect(pending).toHaveLength(1);
  });
});
