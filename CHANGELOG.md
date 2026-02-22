# Changelog

All notable changes to Spell Tome are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
