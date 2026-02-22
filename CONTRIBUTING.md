# Contributing to Spell Tome

Thank you for wanting to improve Spell Tome. Contributions are welcome — this document explains how to help effectively.

---

## Ways to contribute

- **Add missing spells** — TCE, Fizban's, Strixhaven, and other sourcebooks are not yet included
- **Fix spell data errors** — wrong range, duration, class list, or description text
- **Bug reports** — print issues, filter bugs, rendering problems
- **Feature requests** — open an issue first to discuss before building

---

## Adding or correcting spell data

All spells live in `data/spells.js` as a single `const SPELLS = [...]` array.

### Spell object schema

```js
{
  id:            "spell-name-kebab-case",   // required — unique, URL-safe, lowercase
  name:          "Spell Name",              // required — title case
  level:         3,                         // required — 0 (cantrip) through 9
  school:        "Evocation",               // required — see valid values below
  range:         "150 ft",                  // required
  duration:      "Instantaneous",           // required
  casting_time:  "1 action",               // required
  components:    ["V", "S", "M"],           // required — any subset of V, S, M
  material:      "A tiny ball of bat guano and sulfur", // optional — material component text
  ritual:        false,                     // required — boolean
  concentration: false,                     // required — boolean
  classes:       ["Sorcerer", "Wizard"],    // required — see valid values below
  description:   "Full spell text...",      // required
  higher_levels: "When you cast this...",   // optional — upcast text, omit if not applicable
  flavor_text:   "",                        // optional — italic flavour line
  source:        "PHB 241"                 // required — book abbreviation + page number
}
```

### Valid school values

`Abjuration`, `Conjuration`, `Divination`, `Enchantment`, `Evocation`, `Illusion`, `Necromancy`, `Transmutation`

### Valid class values

`Bard`, `Cleric`, `Druid`, `Paladin`, `Ranger`, `Sorcerer`, `Warlock`, `Wizard`

### Valid source abbreviations

| Abbreviation | Book |
|---|---|
| `PHB` | Player's Handbook |
| `XGE` | Xanathar's Guide to Everything |
| `TCE` | Tasha's Cauldron of Everything |
| `FTD` | Fizban's Treasury of Dragons |
| `SCC` | Strixhaven: A Curriculum of Chaos |

### Sorting convention

Spells within `data/spells.js` are sorted by level ascending, then alphabetically by name within each level. Please maintain this order when adding entries.

### Validation

Run this before opening a pull request:

```bash
node -e "
const fs = require('fs');
eval(fs.readFileSync('data/spells.js', 'utf8').replace('const SPELLS', 'global.SPELLS'));

const VALID_SCHOOLS = ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
const VALID_CLASSES = ['Bard','Cleric','Druid','Paladin','Ranger','Sorcerer','Warlock','Wizard'];
const VALID_COMPS   = ['V','S','M'];

let errors = 0;
SPELLS.forEach((s, i) => {
  const tag = \`[\${i}] \${s.name || '(unnamed)'}\`;
  if (!s.id)            { console.error(tag, 'missing id');          errors++; }
  if (!s.name)          { console.error(tag, 'missing name');        errors++; }
  if (s.level == null)  { console.error(tag, 'missing level');       errors++; }
  if (!VALID_SCHOOLS.includes(s.school)) { console.error(tag, 'invalid school:', s.school); errors++; }
  if (!s.range)         { console.error(tag, 'missing range');       errors++; }
  if (!s.duration)      { console.error(tag, 'missing duration');    errors++; }
  if (!s.casting_time)  { console.error(tag, 'missing casting_time');errors++; }
  if (!Array.isArray(s.components) || s.components.some(c => !VALID_COMPS.includes(c))) {
    console.error(tag, 'invalid components:', s.components); errors++;
  }
  if (!Array.isArray(s.classes) || !s.classes.length) {
    console.error(tag, 'missing or empty classes'); errors++;
  }
  s.classes.forEach(c => {
    if (!VALID_CLASSES.includes(c)) { console.error(tag, 'invalid class:', c); errors++; }
  });
  if (!s.description)   { console.error(tag, 'missing description'); errors++; }
  if (!s.source)        { console.error(tag, 'missing source');      errors++; }
  if (typeof s.ritual !== 'boolean')        { console.error(tag, 'ritual must be boolean'); errors++; }
  if (typeof s.concentration !== 'boolean') { console.error(tag, 'concentration must be boolean'); errors++; }
});

const ids = SPELLS.map(s => s.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) { console.error('Duplicate IDs:', dupes); errors += dupes.length; }

console.log(errors === 0
  ? 'All ' + SPELLS.length + ' spells valid.'
  : errors + ' error(s) found.');
"
```

---

## Reporting bugs

Open a GitHub Issue and include:

- **Browser** and version (Spell Tome targets Chrome; other browsers work but are not the primary target)
- **Steps to reproduce** — be specific about class, level, and what you selected
- **Expected behaviour**
- **Actual behaviour**
- A screenshot if the issue is visual

---

## Pull request process

1. Fork the repository
2. Create a branch: `git checkout -b fix/fireball-description` or `git checkout -b feat/tce-spells`
3. Make your changes
4. Run the validation script above
5. Open a PR with a clear description of what changed and why
6. Link any related issues

PRs that only change spell data do not need a lengthy description — a one-line summary is fine.

---

## Code style

The project is intentionally dependency-free vanilla JS. Please keep it that way. No build tooling, no bundlers, no frameworks. If a change requires `npm install`, it will not be merged.

JS style:
- 2-space indentation
- `const` by default, `let` where mutation is required
- No semicolons are not required — the existing file uses them, so match the surrounding style
- Descriptive function names over comments
