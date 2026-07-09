/**
 * Call of Cthulhu 7e percentile rolls: d100 built from a tens die and a
 * units die, bonus/penalty dice (extra tens dice, keep best/worst), success
 * levels against a skill value, and pushed rolls.
 */
import { rollDie, type Rng, defaultRng } from './rng';

export type SuccessLevel = 'critical' | 'extreme' | 'hard' | 'regular' | 'failure' | 'fumble';

export interface PercentileResult {
  total: number;
  tensCandidates: number[]; // all tens dice rolled (00-90)
  tensUsed: number;
  units: number;
  level: SuccessLevel | null; // null when no skill value supplied
  pushed: boolean;
}

/** Combine a tens (0, 10 … 90) and units (0-9) die; 0+0 reads as 100. */
function combine(tens: number, units: number): number {
  const total = tens + units;
  return total === 0 ? 100 : total;
}

export function successLevel(total: number, skill: number): SuccessLevel {
  const fumbleFrom = skill < 50 ? 96 : 100;
  if (total >= fumbleFrom) return 'fumble';
  if (total === 1) return 'critical';
  if (total <= Math.floor(skill / 5)) return 'extreme';
  if (total <= Math.floor(skill / 2)) return 'hard';
  if (total <= skill) return 'regular';
  return 'failure';
}

/**
 * @param bonus  net bonus (+n) or penalty (-n) dice; extra tens dice are
 *               rolled and the lowest (bonus) / highest (penalty) result kept
 */
export function rollPercentile(skill?: number, bonus = 0, rng: Rng = defaultRng): PercentileResult {
  const units = rollDie(10, rng) - 1; // 0-9
  const tensCount = 1 + Math.abs(bonus);
  const tensCandidates = Array.from({ length: tensCount }, () => (rollDie(10, rng) - 1) * 10);
  const totals = tensCandidates.map((t) => combine(t, units));
  const best = bonus >= 0 ? Math.min(...totals) : Math.max(...totals);
  const tensUsed = tensCandidates[totals.indexOf(best)]!;
  return {
    total: best,
    tensCandidates,
    tensUsed,
    units,
    level: skill === undefined ? null : successLevel(best, skill),
    pushed: false,
  };
}

/** A pushed roll is a plain re-roll; failing a pushed roll has dire narrative costs. */
export function pushPercentile(skill: number | undefined, rng: Rng = defaultRng): PercentileResult {
  return { ...rollPercentile(skill, 0, rng), pushed: true };
}
