/**
 * Daggerheart duality dice: 2d12 — one Hope die, one Fear die — plus an
 * optional advantage/disadvantage d6 and flat modifier. The higher die sets
 * the result's temper; matching dice are a critical success.
 */
import { rollDie, type Rng, defaultRng } from './rng';

export type Temper = 'hope' | 'fear' | 'critical';

export interface DualityResult {
  hope: number;
  fear: number;
  advantageDie: number | null; // positive adds, negative subtracts
  modifier: number;
  total: number;
  temper: Temper;
}

export function rollDuality(
  modifier = 0,
  advantage: 'none' | 'advantage' | 'disadvantage' = 'none',
  rng: Rng = defaultRng,
): DualityResult {
  const hope = rollDie(12, rng);
  const fear = rollDie(12, rng);
  let advantageDie: number | null = null;
  if (advantage !== 'none') {
    const d6 = rollDie(6, rng);
    advantageDie = advantage === 'advantage' ? d6 : -d6;
  }
  const total = hope + fear + (advantageDie ?? 0) + modifier;
  const temper: Temper = hope === fear ? 'critical' : hope > fear ? 'hope' : 'fear';
  return { hope, fear, advantageDie, modifier, total, temper };
}
