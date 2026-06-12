# Backend Plan — Supabase Migration

Status: **Phases 0–3 DONE** (2026-06-12). The site is live-synced.

Phase 3 shipped as `assets/js/sync.js` (tomeSync), loaded on every page:
magic-link sign-in from the hub, a shared "vault" campaign row holding the
group's collections (first sign-in creates it and becomes GM; GMs invite
players by email from the hub), local-first reads with debounced background
push and pull-on-load, last-write-wins with a dirty-local-wins guard.
Signed-out/offline the site behaves exactly as before. Remaining ideas:
Realtime subscriptions for live combat, per-D&D-campaign collection rows.

Live project: `edmeogmkquhslpvjelyq` (eu-west-1)
- API URL: `https://edmeogmkquhslpvjelyq.supabase.co`
- Anon key: in `.github/workflows/keep-supabase-awake.yml` (public by design)
- MCP server: configured project-wide in `.mcp.json` (authenticate locally
  with `claude /mcp`)
- Applied migrations are mirrored in `supabase/migrations/`
- Schema deployed: `campaigns`, `campaign_members` (gm/player roles,
  email-claim flow), `tome_collections` (jsonb mirror), `heartbeat`
  (anon-readable keep-awake target). RLS verified live: anon and
  non-member authenticated roles see zero campaign rows; the security
  advisor reports no findings. Helper predicates live in the
  `tome_private` schema so they expose no /rpc surface.
- Keep-awake: scheduled GitHub Action pings `heartbeat` Mon + Thu.

The Tome currently stores all tool data in browser `localStorage` — per
device, per browser, wiped by "clear site data". The target is a shared
Supabase (hosted Postgres) backend so the party roster, encounters, map
markers and combat state sync across the group's devices, while the site
remains a static GitHub Pages deployment and keeps working offline.

---

## Phase 0 — Storage adapter & backup (DONE)

Every page now reads and writes through `assets/js/store.js` (`tomeStore`)
instead of touching `localStorage` directly. The registry in that file is
the single inventory of Tome data and marks each collection:

| scope    | meaning                                            | collections |
|----------|----------------------------------------------------|-------------|
| `synced` | campaign data destined for the backend             | party, activeCampaign, combatState, encounters, mapMarkers, diceSaved |
| `device` | personal/transient state that stays local          | combatQueue, npcQueue, npcHistory, lootHistory, diceHistory, logDraft, theme |

The hub (index.html) offers whole-site **Back Up All Data / Restore** built
on the same registry. Session logs are not part of this plan — they already
live in the git repo (`playlog/*.md`) and that stays.

Because every caller goes through `tomeStore.get/set/remove`, the backend
can be introduced entirely inside `store.js` without touching the pages.

## Phase 1 — Supabase project & auth

1. Create a Supabase project (free tier). Note the project URL and the
   `anon` public key.
2. **Auth: email magic links** for the five group members. No passwords.
   Restrict sign-ups: either disable public sign-up and pre-create the five
   users, or keep an `allowed_members` table that RLS policies check.
3. Add the Supabase JS client to the site. Either the CDN bundle or a
   ~5 KB hand-rolled REST wrapper (the API is plain HTTP + the anon key);
   given the site's no-build philosophy, the small wrapper is preferable.

**Security note:** the `anon` key is *designed* to ship in public
client-side code — it grants nothing by itself; every row is protected by
RLS policies evaluated server-side against the signed-in user. This is
unlike a GitHub PAT (which is why the Log Builder deliberately delegates
commits to github.com instead). Never put the `service_role` key anywhere
near the site.

### Campaign registry (added v2.4.0)

The Campaign Manager page maintains a `campaigns` collection in the
adapter: `{ id, name, gm, ruleset, status, description, members:[{name,
role: 'gm'|'player'}] }`. This is the client-side precursor of the
`campaigns` and `campaign_members` tables below — when Supabase arrives,
each member gains a `user_id` (matched by invitation email at first
sign-in) and the local `role` becomes the RLS role: **gm = admin**
(manage campaign, members, delete), **player = write** (edit shared
collections). All campaign dropdowns site-wide already read from this
registry via `tomeStore.campaignNames()`.

## Phase 2 — Schema

Start with a **collection mirror**, not a normalized schema. It maps 1:1
onto the adapter, which makes the sync driver trivial and the migration
reversible:

```sql
create table tome_collections (
  campaign_id uuid not null references campaigns(id),
  collection  text not null,            -- 'party', 'mapMarkers', ...
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  primary key (campaign_id, collection)
);

create table campaigns (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique             -- matches playlog 'campaign:' frontmatter
);

create table campaign_members (
  campaign_id uuid references campaigns(id),
  user_id     uuid references auth.users(id),
  role        text not null default 'player',   -- 'gm' | 'player'
  primary key (campaign_id, user_id)
);
```

RLS sketch:

```sql
alter table tome_collections enable row level security;

create policy member_read on tome_collections for select
  using (exists (select 1 from campaign_members m
                 where m.campaign_id = tome_collections.campaign_id
                   and m.user_id = auth.uid()));

create policy member_write on tome_collections for insert, update
  using (exists (select 1 from campaign_members m
                 where m.campaign_id = tome_collections.campaign_id
                   and m.user_id = auth.uid()));
```

Normalize later only where it pays off (e.g. a `characters` table if
per-character permissions or queries are ever needed). The blob mirror is
fine at this data volume for years.

## Phase 3 — Sync driver in tomeStore

Local-first: localStorage stays the source of truth for reads, so every
tool keeps working offline at the table.

- `get()` — unchanged (reads local, synchronous, no spinners anywhere).
- `set()` — writes local immediately, then pushes the collection to
  Supabase in the background (debounced ~2s; combat tracker saves on every
  HP change).
- On page load — pull `synced` collections for the active campaign; if the
  server `updated_at` is newer than the local copy's recorded sync stamp,
  replace local and notify the page (a `tome:updated` event pages can
  listen for; initial version can simply apply before first render).
- Conflicts — last-write-wins on `updated_at`. With five users and one GM
  this is acceptable; the combat tracker is effectively single-writer (GM).
- Signed-out / offline — behaves exactly like today, with a "local only"
  indicator on the hub data bar.

## Phase 4 — Nice-to-haves once live

- Supabase Realtime subscription on `tome_collections` → players' phones
  follow initiative live during combat.
- The Campaign Chronicle filtering by the shared active campaign.
- Per-user `device`-scope data (dice presets) synced under `user_id`
  instead of `campaign_id`.

---

## Keeping the free tier awake

Supabase free-tier projects **pause after 7 days without API activity**.
A fortnightly game would hit this. Mitigation: a scheduled GitHub Action in
this repo pings the project twice a week with the anon key (stored as a
repo secret — it's public-by-design anyway, but secrets keep the workflow
tidy):

```yaml
# .github/workflows/keep-supabase-awake.yml  (add when the project exists)
name: Keep Supabase awake
on:
  schedule:
    - cron: '17 6 * * 1,4'   # Mon + Thu 06:17 UTC
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase REST API
        run: |
          curl --fail -s \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            "${{ secrets.SUPABASE_URL }}/rest/v1/campaigns?select=id&limit=1" \
            > /dev/null
          echo "pinged $(date -u +%FT%TZ)"
```

Caveats:

- GitHub disables scheduled workflows after **60 days of repo inactivity**.
  This repo gets playlog commits every session, so that's unlikely to bite;
  if the campaign goes on hiatus, an external pinger (UptimeRobot or
  cron-job.org, both free) on the same REST URL does the same job without
  the repo-activity dependency — or simply expect to unpause the project
  manually in the dashboard when play resumes (data is preserved while
  paused; unpausing takes a minute).
- The honest long-term answer if the group comes to rely on sync is
  Supabase's paid tier (~$10/mo), which doesn't pause at all.
