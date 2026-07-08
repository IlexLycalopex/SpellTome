import { describe, expect, it } from 'vitest';
import { parseSpec, rollSpec, d20Check } from '../src/lib/dice/d20';
import { rollPool, pushPool } from '../src/lib/dice/year-zero';
import { rollPercentile, successLevel } from '../src/lib/dice/percentile';
import { rollDuality } from '../src/lib/dice/duality';
import type { Rng } from '../src/lib/dice/rng';

/** rng that yields a fixed sequence of die faces (per `sides` at call time) */
const seq = (faces: number[], sides: number): Rng => {
  let i = 0;
  return () => (faces[i++ % faces.length]! - 1) / sides;
};

describe('d20 engine', () => {
  it('parses compound expressions', () => {
    expect(parseSpec('2d6+1d4+3')).toEqual({
      terms: [
        { count: 2, sides: 6 },
        { count: 1, sides: 4 },
      ],
      modifier: 3,
    });
    expect(parseSpec('d20-1')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: -1 });
  });

  it('rejects garbage', () => {
    expect(() => parseSpec('2x6')).toThrow();
    expect(() => parseSpec('')).toThrow();
  });

  it('totals rolls plus modifier', () => {
    const r = rollSpec(parseSpec('3d6+2'), seq([4, 4, 4], 6));
    expect(r.total).toBe(14);
  });

  it('advantage keeps the higher die, disadvantage the lower', () => {
    const adv = d20Check(0, 'advantage', seq([5, 18], 20));
    expect(adv.kept).toBe(18);
    const dis = d20Check(0, 'disadvantage', seq([5, 18], 20));
    expect(dis.kept).toBe(5);
  });

  it('flags nat 20 and nat 1', () => {
    expect(d20Check(0, 'normal', seq([20], 20)).crit).toBe('hit');
    expect(d20Check(0, 'normal', seq([1], 20)).crit).toBe('miss');
  });
});

describe('year zero pools', () => {
  it('counts 6s as successes and 1s as banes', () => {
    const r = rollPool(5, seq([6, 6, 1, 3, 4], 6));
    expect(r.successes).toBe(2);
    expect(r.banes).toBe(1);
  });

  it('push re-rolls only non-6s (TFTL: 1s re-roll too)', () => {
    const r = rollPool(4, seq([6, 1, 2, 3], 6));
    const pushed = pushPool(r, false, seq([5, 6, 6], 6));
    expect(pushed.dice).toEqual([6, 5, 6, 6]);
    expect(pushed.successes).toBe(3);
  });

  it('vaesen push keeps 1s locked', () => {
    const r = rollPool(4, seq([6, 1, 2, 3], 6));
    const pushed = pushPool(r, true, seq([6, 6], 6));
    expect(pushed.dice).toEqual([6, 1, 6, 6]);
    expect(pushed.banes).toBe(1);
  });

  it('a roll pushes only once', () => {
    const pushed = pushPool(rollPool(2), false);
    expect(() => pushPool(pushed, false)).toThrow();
  });
});

describe('percentile (CoC 7e)', () => {
  it('grades success levels against the skill', () => {
    expect(successLevel(1, 60)).toBe('critical');
    expect(successLevel(12, 60)).toBe('extreme'); // ≤ 60/5
    expect(successLevel(30, 60)).toBe('hard'); // ≤ 60/2
    expect(successLevel(60, 60)).toBe('regular');
    expect(successLevel(61, 60)).toBe('failure');
    expect(successLevel(100, 60)).toBe('fumble');
    // skill < 50 fumbles from 96
    expect(successLevel(96, 40)).toBe('fumble');
    expect(successLevel(96, 60)).toBe('failure');
  });

  it('tens 0 + units 0 reads as 100', () => {
    // units die: 1 → 0 units; tens die: 1 → 00 tens
    const r = rollPercentile(50, 0, seq([1, 1], 10));
    expect(r.total).toBe(100);
  });

  it('bonus die keeps the lower tens, penalty the higher', () => {
    // units 5, then tens dice 70 and 20
    const bonus = rollPercentile(50, +1, seq([6, 8, 3], 10));
    expect(bonus.total).toBe(25);
    const penalty = rollPercentile(50, -1, seq([6, 8, 3], 10));
    expect(penalty.total).toBe(75);
  });
});

describe('duality (Daggerheart)', () => {
  it('reads hope/fear from the higher die and doubles as critical', () => {
    expect(rollDuality(0, 'none', seq([10, 4], 12)).temper).toBe('hope');
    expect(rollDuality(0, 'none', seq([4, 10], 12)).temper).toBe('fear');
    expect(rollDuality(0, 'none', seq([7, 7], 12)).temper).toBe('critical');
  });

  it('applies advantage d6 and modifier to the total', () => {
    const r = rollDuality(2, 'advantage', seq([10, 4, 5], 12));
    // 10 + 4 + 5(adv, rolled as d6 from same seq) + 2 — note seq scales by sides=12,
    // so the third face request maps to ceil(5/12*6)…
    expect(r.total).toBe(r.hope + r.fear + (r.advantageDie ?? 0) + 2);
    expect(r.advantageDie).not.toBeNull();
  });
});
