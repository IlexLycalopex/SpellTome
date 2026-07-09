# SpellTome v2 — Migration Status & Cutover Runbook

The new site lives in `site/` (Astro 5 + Svelte 5 islands) and deploys to
GitHub Pages **alongside** the old site: old pages stay at `/`, the new site
is served under `/next/` (see `.github/workflows/deploy.yml`). Nothing about
the old site changes until cutover.

## What's built

| Area | Route(s) | Notes |
|---|---|---|
| Hub | `/` | Bento grid, skin-preview chips, AuthWidget (magic link, invites, admin vault switch) |
| Spells | `/compendium/dnd5e/spells` | 2014/2024 toggle, class/level/school/source filters, search |
| Reference | `/compendium/dnd5e/{monsters,conditions,magic-items,equipment,feats,backgrounds,wildshape}`, `/reference/dnd5e/{quick-reference,level-up}` | All data extracted to `site/src/data/dnd5e/` by `scripts/extract-data.mjs` |
| Dice | `/tools/dice` | d20 / Year Zero pools (Vaesen & TFTL pushes) / CoC percentile / Daggerheart duality |
| Tools | `/tools/{combat,encounter-builder,npc,loot}` | Combat tracker is multi-system + realtime via the vault |
| Chronicle | `/chronicle` (public), `/campaigns/logs` (GM editor) | play_logs table; import script for the 17 SKT files |
| Campaigns | `/campaigns`, `/party`, `/map` | Same synced tomeStore collections as the old site |
| Gated content | `/compendium/{vaesen,tftl,coc7e,daggerheart}`, `/admin/content` | compendium_entries, member-only RLS, admin CRUD + bulk JSON import |

Ruleset registry: `site/src/rulesets/` — each system contributes dice engine,
conditions, sheet schema (zod), log template, compendium types and a skin
(`site/src/styles/skins/*.css`). Theming is token-based (`styles/tokens/base.css`).

## Licensing guardrails

- Public bundle (`site/src/data/`) contains ONLY content the old public site
  already shipped (D&D) — Daggerheart SRD may be added later.
- Free League (Vaesen/TFTL) and Chaosium (CoC) expressive content is never
  bundled: it lives in `compendium_entries` behind member RLS, entered by the
  site admin at `/admin/content`.
- The Sword Coast map jpg moves to the private `campaign-media` bucket at
  cutover.

## Live-project status (2026-07-09)

- ✅ Migrations 0005–0012 applied to `edmeogmkquhslpvjelyq` via MCP.
- ✅ "Storm King's Thunder" campaign row created
  (`4d01492d-1535-4293-9eab-8feff459ad62`, site owner as GM) and all 17
  playlog sessions imported as published — verified readable as `anon`.
- ✅ Security advisors run; `touch_updated_at` search_path pinned (0012).
  The `chronicle_campaigns` SECURITY DEFINER lint is intentional (narrow
  3-column public view). `scripts/import-playlogs.mjs` remains for re-runs.
- ⚠️ Two duplicate "Vault — …" rows exist in `campaigns` (same owner, same
  day). The one with more data is `b936667e-e18c-40fe-b7c2-36743fa0b4ee`;
  `815c4868-…` holds only an identical mapMarkers blob. Candidate for
  deletion after confirming which vault the owner's devices are pinned to.

## Pending user actions

1. **Switch GitHub Pages to "GitHub Actions"** in repo settings (it currently
   builds via the branch/Jekyll path) so `deploy.yml` takes over. The workflow
   preserves the CNAME custom domain.

## Remaining work (v2 follow-ups)

- Per-ruleset character sheet islands using the registry `sheetSchema`s and
  the `characters` table (party page currently uses the legacy roster).
- `scripts/migrate-tool-state.ts` (tome_collections → characters/tool_state)
  — write and run at cutover only.
- Live dice sharing via `dice_rolls` (table + realtime already migrated).
- Playwright link-crawl test to guard the `/next/` → `/` base-path flip.

## Cutover checklist (Phase 10 — do when /next/ is trusted)

1. Flip sync to the normalized tables: point `sync.svelte.ts` at `tool_state`,
   run `migrate-tool-state`, verify, then stop writing `tome_collections`.
2. Upload the map jpg to `campaign-media/<campaign>/maps/`, switch
   `CampaignMap.svelte` to a signed URL, delete the jpg from git.
3. Build with `SITE_BASE=/`, publish only `site/dist` + `CNAME` + `.nojekyll`.
4. Add meta-refresh redirect stubs for every old `*.html` URL (keep forever).
5. Delete old HTML/CSS/JS, `_src/`, `_config.yml`; archive `playlog/` to a
   branch after confirming the DB import.
6. Final migration: drop `tome_collections` and `campaigns.ruleset` (text).
7. Full Playwright run against production; click old bookmarks.
