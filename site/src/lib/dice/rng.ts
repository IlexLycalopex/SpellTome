/** Injectable RNG so engines are deterministic under test. */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

/** Integer in [1, sides]. */
export const rollDie = (sides: number, rng: Rng = defaultRng): number =>
  Math.floor(rng() * sides) + 1;

export const rollDice = (count: number, sides: number, rng: Rng = defaultRng): number[] =>
  Array.from({ length: count }, () => rollDie(sides, rng));
