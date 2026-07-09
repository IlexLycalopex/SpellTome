import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dataRoot = join(__dirname, '../src/data/dnd5e');
const load = (f: string) => JSON.parse(readFileSync(join(dataRoot, f), 'utf8'));

// Counts verified against the live site at extraction time. If an extraction
// re-run drops entries (parse regression, source edit), these fail loudly.
const EXPECTED = {
  'spells-2014.json': 400,
  'spells-2024.json': 405,
  'monsters.json': 251,
  'magic-items.json': 77,
  'equipment.json': 165,
  'conditions.json': 15,
  'skills.json': 18,
  'feats.json': 42,
  'backgrounds.json': 13,
  'races.json': 15,
  'beasts.json': 76,
  'familiars.json': 15,
} as const;

describe('extracted data parity', () => {
  for (const [f, count] of Object.entries(EXPECTED)) {
    it(`${f} has ${count} entries`, () => {
      expect(load(f)).toHaveLength(count);
    });
  }

  it('every spell has a unique id in both editions', () => {
    for (const f of ['spells-2014.json', 'spells-2024.json']) {
      const spells = load(f) as { id: string }[];
      expect(new Set(spells.map((s) => s.id)).size).toBe(spells.length);
    }
  });

  it('every 2024 spell has a non-empty class list (the 1.3.0 regression)', () => {
    const spells = load('spells-2024.json') as { classes: string[] }[];
    expect(spells.every((s) => s.classes.length > 0)).toBe(true);
  });
});
