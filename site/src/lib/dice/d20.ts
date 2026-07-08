/** D&D-style dice: NdM+K expressions and d20 advantage/disadvantage. */
import { rollDice, rollDie, type Rng, defaultRng } from './rng';

export interface DiceTerm {
  count: number;
  sides: number;
}
export interface DiceSpec {
  terms: DiceTerm[];
  modifier: number;
}

/** Parse "2d6+1d4+3", "d20-1", "4d6". Whitespace tolerated. */
export function parseSpec(input: string): DiceSpec {
  const cleaned = input.replace(/\s+/g, '').toLowerCase();
  if (!cleaned) throw new Error('Empty dice expression');
  const tokens = cleaned.match(/[+-]?[^+-]+/g) ?? [];
  const spec: DiceSpec = { terms: [], modifier: 0 };
  for (const token of tokens) {
    const m = /^([+-]?)(?:(\d*)d(\d+)|(\d+))$/.exec(token);
    if (!m) throw new Error(`Bad dice term: ${token}`);
    const sign = m[1] === '-' ? -1 : 1;
    if (m[3]) {
      const count = sign * (m[2] ? parseInt(m[2], 10) : 1);
      spec.terms.push({ count, sides: parseInt(m[3], 10) });
    } else {
      spec.modifier += sign * parseInt(m[4]!, 10);
    }
  }
  return spec;
}

export interface D20Result {
  rolls: { sides: number; values: number[] }[];
  modifier: number;
  total: number;
}

export function rollSpec(spec: DiceSpec, rng: Rng = defaultRng): D20Result {
  const rolls = spec.terms.map((t) => ({
    sides: t.sides,
    values: rollDice(Math.abs(t.count), t.sides, rng).map((v) => (t.count < 0 ? -v : v)),
  }));
  const total = rolls.reduce((sum, r) => sum + r.values.reduce((a, b) => a + b, 0), spec.modifier);
  return { rolls, modifier: spec.modifier, total };
}

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export interface CheckResult {
  kept: number;
  dropped?: number;
  modifier: number;
  total: number;
  crit: 'hit' | 'miss' | null;
}

/** A d20 check with optional advantage/disadvantage and flat modifier. */
export function d20Check(modifier = 0, mode: AdvantageMode = 'normal', rng: Rng = defaultRng): CheckResult {
  const first = rollDie(20, rng);
  if (mode === 'normal') {
    return { kept: first, modifier, total: first + modifier, crit: first === 20 ? 'hit' : first === 1 ? 'miss' : null };
  }
  const second = rollDie(20, rng);
  const kept = mode === 'advantage' ? Math.max(first, second) : Math.min(first, second);
  const dropped = mode === 'advantage' ? Math.min(first, second) : Math.max(first, second);
  return { kept, dropped, modifier, total: kept + modifier, crit: kept === 20 ? 'hit' : kept === 1 ? 'miss' : null };
}
