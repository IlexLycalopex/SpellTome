# Changelog

All notable changes to Spell Tome are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.3.0] — 2026-06-11

### Added
- **Per-campaign maps** — the Campaign Map gains a campaign selector (kept in step with the site-wide active campaign from the Party Manager). The bundled Sword Coast map and its pins now belong to Storm King's Thunder; any other campaign can set its own map via an image URL/path or a browser upload (≤2.5 MB, included in hub backups — committing the image to `assets/img/` is recommended for permanence). Markers are stored per campaign, and existing v1 marker data migrates to Storm King's Thunder automatically.

---

## [2.2.0] — 2026-06-11

### Added
- **Central storage adapter** (`assets/js/store.js`) — every tool now reads and writes through `tomeStore` instead of raw `localStorage`. The registry inventories all 13 data collections and marks which are campaign data destined for the future shared backend vs device-local state. The planned Supabase backend slots in behind this one module without touching any page.
- **Whole-site backup & restore** — the hub gains a data bar: "Back Up All Data" downloads every collection as one JSON file; "Restore" loads it back (unknown keys ignored, invalid files rejected). Until a backend exists, this is the safety net against cleared browser data and the way to move data between devices.
- **Backend migration plan** (`docs/BACKEND_PLAN.md`) — Supabase target architecture: magic-link auth, collection-mirror schema with row-level security, local-first sync driver, and a scheduled GitHub Action to keep the free-tier project from pausing.

---

## [2.1.0] — 2026-06-11

### Added
- **Campaign tags on characters** — Party Manager characters can be tagged with a campaign name (free text with suggestions, matching the Campaign Chronicle's `campaign:` frontmatter values). When more than zero campaigns are in use, a pill bar filters the roster; the selected campaign is persisted (`tome_active_campaign_v1`) and honoured by the Combat Tracker's party load and the Encounter Builder's party prefill. Untagged characters belong to every campaign, so existing rosters keep working unchanged. New characters default to the currently selected campaign.

---

## [2.0.2] — 2026-06-11

### Fixed
- **Ghost buttons hidden on mobile** — a shared responsive rule meant to hide the desktop-only print/selection controls was hiding *every* `.btn-ghost` on screens under 768px. On phones this removed the Party Manager's Edit/Export/Import/Cancel buttons, the Combat Tracker's Sort/Clear/Export/End/Cancel/Manage controls, and the Encounter Builder's Save/Delete. The rule is now scoped to the actual selection/print controls (`#btn-select-all`, `#btn-clear`, `#btn-combat`, `.btn-print`, `.selection-badge`, `.select-indicator`).
- **Party Manager empty state** — "No Adventurers Yet" could appear below an existing roster; its hiding is now enforced via inline style and a `[hidden]` CSS rule with `!important` on every render.

---

## [2.0.1] — 2026-06-11

### Changed
- **One party system** — removed the Combat Tracker's legacy name+initiative quick-save party editor; the Party Manager roster (`tome_party_v1`) is now the single source of party data. Existing legacy parties are migrated automatically on the Combat Tracker's next load. The party bar's "Manage" button links to the Party Manager.
- **Character status** — party members can be marked Active / Away / Dead from their card. Away and dead characters are dimmed (dead get a banner and strikethrough) and are excluded from the Combat Tracker's party load and the Encounter Builder's party prefill.
- **Clearer editing** — clicking anywhere on a character card opens the edit form (the ✎ Edit button remains), and the summary bar now shows an Active count alongside Members.

---

## [2.0.0] — 2026-06-10

### Added
- **Party Manager** (`party-manager.html`) — persistent character roster (HP, AC, initiative, passive perception, notes) with export/import. The Combat Tracker now prefers this roster over its legacy quick-save party and pre-fills HP/AC when loading the party into an encounter.
- **Encounter Builder** (`encounter-builder.html`) — DMG XP-budget encounter balancing against party size/level (pre-filled from the Party Manager), with a difficulty verdict meter, named saved encounters, and "Send to Combat Tracker" via the shared monster queue.
- **Equipment & Gear Compendium** (`equipment.html`) — all SRD weapons, armour, adventuring gear, tools, and packs with costs, weights, and property explanations.
- **Backgrounds & Races** (`backgrounds.html`) — all 13 PHB backgrounds and the nine core races with subraces and full trait text.
- **NPC Generator** (`npc-generator.html`) — names by race/gender, occupation, personality, mannerism, voice, and plot hook with per-field rerolls, history, and "Send to Log Builder" (the Log Builder absorbs the queue into its NPC section on load).
- **Loot Generator** (`loot-generator.html`) — DMG individual and hoard treasure by CR tier: coins, gems, art objects, and magic-item rarity results linking to the Magic Item Compendium.
- **Campaign Map** (`campaign-map.html`) — pannable/zoomable Sword Coast map with campaign pins (Waterdeep, Goldenfields, Nightstone, …) and user-added custom markers, editable and persisted locally.
- **Shared monster dataset** — the 251-monster array moved from monsters.html into `assets/js/monsters-data.js`, now shared with the Encounter Builder.
- All seven pages added to the site nav (via `_src/components/nav.html` + `build_nav.py`) and the hub.

---

## [1.5.0] — 2026-06-10

### Added
- **Monster Codex → Combat Tracker handoff** — every monster's stat-block modal has an "⚔ Add to Combat" button, and the header gains a "⚔ To Combat" action for the current selection. Queued creatures (name, HP, AC, DEX modifier) are picked up by the Combat Tracker on load: initiative is auto-rolled (d20 + DEX mod), HP/AC pre-filled, and duplicate names auto-numbered (Goblin, Goblin 2, …). A header badge on the Monster Codex shows the pending queue and links to the tracker.
- **Log Builder: edit existing sessions** — "Load Session…" lists the playlog vault via the GitHub API and loads any session note back into the form. The round-trip parser was verified stable against all 17 existing session files.
- **Log Builder: Submit to GitHub** — submits without holding any credentials: the markdown is copied to the clipboard and a github.com page opens under the user's own GitHub session (prefilled new-file page for new sessions, edit page for updates; fork/PR flow applies automatically for non-collaborators). No tokens are embedded or stored — see the security note in `campaign-log-builder.js`.

---

## [1.4.0] — 2026-06-10

### Fixed
- **Nav drawer broken on three pages** — `quick-reference.html`, `level-up-guide.html`, and `skills-feats.html` carried inline `openNav()`/`closeNav()` copies that toggled a `show` class the CSS never styled (`nav.css` styles `.nav-overlay.open`), so the overlay never appeared and the theme toggle/persisted theme were missing. All three now load the shared `assets/js/nav.js`.
- **Combat tracker zero-HP handling** — the edit modal displayed an empty field for a combatant at 0 HP and silently discarded an entered `0` on save (`||` falsy checks); both now treat 0 as a valid value.

### Changed
- **One HTML-escape implementation** — removed the four divergent inline `esc()`/`escapeHtml()` copies (two in `campaign-tracker.html`, one in `combat-tracker.html`, plus `escapeAttr()` in the log builder); pages now share the null-safe, full-entity `esc()` in `assets/js/utils.js`.
- **Shared modal module wired in** — `conditions.html`, `magic-items.html`, `monsters.html`, and `wildshape.html` now use `assets/js/modal.js` for close/overlay-click/Escape handling instead of per-page copies; `magic-items.html` tooltip positioning now uses `initTooltips()` from `utils.js`. The combat tracker keeps its own multi-modal system (different mechanism by design).
- **Per-page CSS extracted** — inline `<style>` blocks in `quick-reference.html`, `level-up-guide.html`, and `skills-feats.html` moved into their (previously orphaned, stale) files under `assets/css/`, matching the rest of the site.

### Removed
- **Stale spell-tome build layer** — `_src/build.py` regenerated `index.html` from `_src/scripts/app.js`, `_src/data/spells.js`/`spellSlots.js`, and `_src/styles/*`, all of which predate the current two-edition `spelltome.html`; running it would have overwritten the hub with an outdated single-edition build. The live root HTML files are the source of truth. `_src/build_nav.py` and `_src/components/nav.html` remain.
- **Dead shared JS** — `assets/js/filters.js`, `selection.js`, and `print.js` were loaded by no page (every page has its own inline variants).
- **Scratch/migration artifacts** — `test.txt`, `fix_spells.ps1`, `gen_fix.ps1`, `generate_fix.bat`, `spells2024_block.txt` (240 KB).

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
