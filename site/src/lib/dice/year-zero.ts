/**
 * Year Zero Engine d6 dice pools (Vaesen, Tales from the Loop).
 * Roll a pool of d6; each 6 is a success. A failed roll may be pushed:
 * re-roll every die that isn't a 6 (Vaesen also keeps 1s aside — pushing
 * carries a Condition cost, which is the caller's concern, not the dice's).
 */
import { rollDice, type Rng, defaultRng } from './rng';

export interface PoolResult {
  dice: number[];
  successes: number;
  /** count of 1s — relevant to push costs in both games */
  banes: number;
  pushed: boolean;
}

export function rollPool(size: number, rng: Rng = defaultRng): PoolResult {
  if (size < 1 || size > 20) throw new Error('Pool size must be 1-20');
  const dice = rollDice(size, 6, rng);
  return {
    dice,
    successes: dice.filter((d) => d === 6).length,
    banes: dice.filter((d) => d === 1).length,
    pushed: false,
  };
}

/**
 * Push a roll: re-roll every non-6.
 * `keepBanes` (Vaesen preset) locks 1s in place as well — they stay and
 * count toward the push's toll.
 */
export function pushPool(result: PoolResult, keepBanes: boolean, rng: Rng = defaultRng): PoolResult {
  if (result.pushed) throw new Error('A roll can only be pushed once');
  const dice = result.dice.map((d) => {
    if (d === 6) return d;
    if (keepBanes && d === 1) return d;
    return rollDice(1, 6, rng)[0]!;
  });
  return {
    dice,
    successes: dice.filter((d) => d === 6).length,
    banes: dice.filter((d) => d === 1).length,
    pushed: true,
  };
}

export const YEAR_ZERO_PRESETS = {
  vaesen: { keepBanes: true, label: 'Vaesen' },
  tftl: { keepBanes: false, label: 'Tales from the Loop' },
} as const;
