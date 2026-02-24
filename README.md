# Spell Tome — D&D 5e Spell Card Viewer

A single-file, offline-capable browser application for browsing, filtering, and printing D&D 5e spell cards. Supports both the 2014 and 2024 Player's Handbook rulesets, switchable via a toggle in the header.

---

## Quick Start

Open `spelltome.html` in Chrome. No server, no dependencies, no installation required.

1. Select your class from the dropdown
2. Select your character level
3. Browse and filter the spell cards
4. On desktop: select cards and use **Print to PDF** to export an A4 landscape sheet (8 cards per page)

---

## Features

### Edition Toggle
A **2014 / 2024** switcher in the header swaps between the two complete spell datasets. All filters reset on switch. The subtitle updates to reflect the active edition.

### Filter Bar
- **Class** — filters to spells available to that class
- **Level** — filters to spells accessible at that character level (respects full-caster / half-caster / Warlock slot progressions)
- **Spell Level** — pill toggles for Cantrip through 9th level
- **School** — pill toggles for all eight schools
- **Source** — pill toggles by sourcebook (PHB, XGE, TCE, SCAG)
- **Search** — free-text search against spell name

All filters operate simultaneously with AND logic. Filter state resets when the edition is changed.

### Spell Cards
Each card displays:
- School-coloured header with school sigil, spell name, and level badge
- Stats block: Range, Duration, Casting Time, and class access list
- Component icons (V / S / M), Ritual and Concentration badges where applicable
- Flavour text band (where available)
- Full spell description
- **At Higher Levels** text (where the spell scales with slot level)
- Source reference

### Mobile
- Collapsible filter panel (expanded by default, collapses on scroll)
- Tap any card once to expand it into a full-width accordion strip below its grid row — tap again to collapse. Only one card open at a time.
- Selection and Print UI hidden on mobile (print is desktop-only)
- Responsive two-column card grid, single column on narrow screens
- Title and toggle remain on a single line at all screen widths

### Print to PDF (Desktop / Chrome)
- Select cards by clicking them (tick indicator appears)
- Click **Print to PDF** to open a print preview modal
- Preview shows paginated A4 landscape layout (4×2 grid, 8 cards per page)
- Click **Print** to trigger the browser print dialog — choose **Save as PDF**
- **Important:** enable *Background graphics* in Chrome's print dialog for school colours to appear in the output

---

## Spell Data

### 2014 Edition — 400 spells

| Source | Spells |
|---|---|
| Player's Handbook (PHB) | 312 |
| Xanathar's Guide to Everything (XGE) | 67 |
| Tasha's Cauldron of Everything (TCE) | 17 |
| Sword Coast Adventurer's Guide (SCAG) | 4 |
| **Total** | **400** |

Breakdown by spell level: 43 cantrips, 63 × 1st, 65 × 2nd, 52 × 3rd, 35 × 4th, 47 × 5th, 32 × 6th, 24 × 7th, 19 × 8th, 20 × 9th.

142 spells include At Higher Levels scaling text. 179 spells are concentration. 24 are rituals.

### 2024 Edition — 405 spells

Derived from the 2014 dataset with all documented 2024 Player's Handbook rules changes applied. Key differences:

**Concentration removed** from: Aid, Bless, Compelled Duel, Divine Favor, Flame Blade, Heroism, Hex, Hunter's Mark, Protection from Evil and Good, Spiritual Weapon, Stoneskin.

**School reassignments** — all healing and restoration spells (Cure Wounds, Healing Word, Heal, Lesser/Greater Restoration, Revivify, Raise Dead, Resurrection, etc.) moved to Necromancy. Several divination spells corrected.

**Mechanics rewrites** — Sleep (now Wisdom save / Unconscious condition, no HP pool), Thunderwave (push distance increased to 10 ft), Witch Bolt (Bonus Action for sustained damage), Color Spray (Constitution save / Blinded, not HP-based), Slow (40-foot Cube wording), Counterspell (Constitution saving throw), Conjure Animals / Conjure Elemental (unified summoning stat block), Hunter's Mark and Hex (long-duration upcast options), Spiritual Weapon (Bonus Action creation, no concentration), Dispel Magic (auto-dispel at equal or lower level).

**New 2024 spells** — Elementalism (cantrip), Starry Wisp (cantrip), plus 2024-revised versions of Shillelagh (Bonus Action cast) and Spare the Dying (15 ft range).

---

## Technical Notes

### Architecture
Six self-contained HTML files — `index.html` (hub), `spelltome.html` (spell tool), `conditions.html`, `wildshape.html`, `monsters.html`, `magic-items.html`. All CSS, JavaScript, SVG icons, and data inline. No external dependencies, no CDN calls, no backend. Works fully offline.

### Data Structure
Each spell object:
```
id, name, level, school, range, duration, casting_time,
components[], ritual, concentration, classes[],
description, higher_levels (optional), source
```

Both datasets (`SPELLS` and `SPELLS_2024`) are plain JavaScript arrays. The active dataset is selected via `getSpellList()`, which all filter and render functions use. Switching edition calls `setEdition()`, which resets state and re-renders without a page reload.

### Class Level Logic
The application enforces spell slot access per class and character level:
- **Full casters** (Bard, Cleric, Druid, Sorcerer, Wizard): standard progression, 9th-level spells at level 17
- **Half casters** (Paladin, Ranger): access begins at level 2, maximum 5th-level spells
- **Warlock**: Pact Magic progression, maximum 5th-level spells from level 9

### Browser Support
Chrome is the primary target (latest two versions). Firefox and Safari function correctly for browsing and filtering. The Print to PDF feature relies on Chrome's print-color-adjust and background-graphics support for accurate output.

### File Size
~539 KB (single file, including all 805 spell entries across both editions).

---

## Planned / Out of Scope

The following are noted for potential future development:

- Subclass spell lists (Arcane Trickster, Eldritch Knight, Oath spells, etc.)
- Unearthed Arcana and one-off release spells
- Spell slot tracker / character sheet integration
- Mobile print support
- 10-cards-per-page print option
- Dark mode
- Bookmark / share a filtered view via URL parameters

---

## Source Material

Spell rules text is derived from the D&D 5e Systems Reference Document (SRD) and cross-referenced against the Player's Handbook (2014), Xanathar's Guide to Everything, Tasha's Cauldron of Everything, and the 2024 Player's Handbook. This tool is intended for personal use at the table.
