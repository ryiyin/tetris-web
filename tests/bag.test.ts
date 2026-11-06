import { describe, it, expect } from 'vitest';
import { shuffleBag, takeFromBag } from '../src/game/bag';
import { PIECE_TYPES, type PieceType } from '../src/game/pieces';

// Generador determinista simple (LCG).
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('shuffleBag', () => {
  it('devuelve una permutación de las 7 piezas', () => {
    const bag = shuffleBag(seeded(1));
    expect(bag).toHaveLength(7);
    expect([...bag].sort()).toEqual([...PIECE_TYPES].sort());
  });

  it('es determinista con el mismo random', () => {
    expect(shuffleBag(seeded(5))).toEqual(shuffleBag(seeded(5)));
  });

  it('da órdenes distintos con valores distintos', () => {
    expect(shuffleBag(() => 0)).not.toEqual(shuffleBag(() => 0.99));
  });

  it('no muta PIECE_TYPES', () => {
    const copy = [...PIECE_TYPES];
    shuffleBag(seeded(3));
    expect(PIECE_TYPES).toEqual(copy);
  });
});

describe('takeFromBag', () => {
  it('14 tomas consecutivas dan cada bloque de 7 como permutación', () => {
    const random = seeded(42);
    let bag: PieceType[] = [];
    const taken: PieceType[] = [];
    for (let i = 0; i < 14; i++) {
      const r = takeFromBag(bag, random);
      taken.push(r.type);
      bag = r.bag;
    }
    for (const block of [taken.slice(0, 7), taken.slice(7)]) {
      expect([...block].sort()).toEqual([...PIECE_TYPES].sort());
    }
  });

  it('no muta la bolsa recibida', () => {
    const input: PieceType[] = ['T', 'I'];
    const r = takeFromBag(input, () => 0);
    expect(input).toEqual(['T', 'I']);
    expect(r.type).toBe('T');
    expect(r.bag).toEqual(['I']);
  });

  it('con bolsa vacía genera una nueva y quedan 6', () => {
    const r = takeFromBag([], seeded(7));
    expect(r.bag).toHaveLength(6);
  });
});
