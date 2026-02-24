# Changelog

All notable changes to Spell Tome are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.3.0] — 2026-02-24

### Added
- **Multi-tool hub** — `index.html` landing page linking all six tools: Spell Tome, Condition Codex, Wildshape & Familiar, Monster Codex, Magic Item Compendium
- **2024 edition class data** — all 405 SPELLS_2024 entries now have correct `classes[]` arrays, making the 2024 edition fully functional
- **Mobile accordion expand** — on touch devices, a single tap expands a spell card to full-width below its grid row; second tap collapses. Only one card open at a time. No modal overlay.
- **Keyboard accessibility** — all filter pills converted to `<button>` elements with `aria-pressed`; all search/filter inputs have `<label for>` associations; comprehensive `:focus-visible` gold outline styles added
- **Flavor text** added to 8 iconic spells (one per school): Eldritch Blast, Charm Person, Silent Image, Detect Magic, Misty Step, Animate Dead, Counterspell, Fireball, Polymorph
- **CSS variables** — added `--gold-rgb`, `--input-bg`, `--overlay-bg`, `--z-header`, `--z-nav`, `--z-overlay`, `--z-modal`, `--transition-fast`, `--transition-normal`, `--title-size`; card.css now uses scoped variables for all hardcoded colors
- **Empty state standardized** — all tool pages now use an SVG rune icon (consistent with conditions.html pattern)

### Fixed
- **2024 edition non-functional** — `SPELLS_2024` class arrays were all empty; class filter returned zero results for any class selection
- **build.py output target** — was writing to `index.html` (the hub/landing page); corrected to `spelltome.html`
- **SCAG source book** — already registered in SOURCE_BOOKS; confirmed no fix needed
- **Earthbind placement** — entry was under `// LEVEL 1` comment in `_src/data/spells.js` despite being `level:2`; moved to after `// LEVEL 2`
- **Duplicate constants** — removed identical `ranger` sub-table from `spellSlots.js` (was a duplicate of `halfCaster`); removed unused `isSpellAvailable()` function; updated `CLASS_TYPE` to map Ranger to `halfCaster`
- **nul artifact** — deleted Windows directory listing artifact from repo root
- **Modal overlay z-index** — standardized to `1000` across all pages (was `500` in conditions, wildshape, monsters, magic-items)
- **Modal overlay opacity** — standardized to `rgba(0,0,0,0.88)` across all pages

### Changed
- **App title font size** — standardized to `1.3rem` across all six pages (was `1.4–1.5rem`)
- **Pill font size** — standardized to `0.62rem` across all pages (was `0.58–0.62rem`)
- **Mobile print UI** — print button, selection badge, clear button, and select indicators hidden on `(hover: none) and (pointer: coarse)` devices
- **index.html tool card hover** — `translateY` standardized to `-4px` (was `-5px`)

---

## [1.2.0] — 2026-02-22

### Added
- Source book filter pills (PHB / XGE) — toggle individual sourcebooks on or off
- Coloured dot in card source footer indicating which book a spell comes from
- Infrastructure for future sourcebooks (TCE, FTD, SCC) — adding spells is sufficient, no UI changes needed

### Fixed
- Full-width duplicate cards appearing below the page after printing — `#print-output` DOM is now cleared 1.5 seconds after `window.print()` is called
- Dropdown contrast — class and level selects now use a solid dark background (`#0d1a30`) with light text, overriding OS-default grey-on-white rendering

### Changed
- Filter logic refactored into a single `passesFilters()` helper for clarity and DRY

---

## [1.1.0] — 2026-02-22

### Added
- 336 spells across PHB and Xanathar's Guide to Everything
- Spell level, school, and free-text search filters
- Print preview modal with paginated layout before committing to PDF export
- Chrome "Background graphics" reminder in print preview
- Accurate spell slot progressions for all 8 classes (full caster, half caster, Warlock pact magic)
- School-coloured card headers with SVG sigil icons
- Component icons (V/S/M) with Ritual and Concentration badges
- Class access list on each card, with current class highlighted
- Higher-levels upcast text where applicable

---

## [1.0.0] — 2026-02-22

### Added
- Initial release — project scaffold, data schema, core UI
