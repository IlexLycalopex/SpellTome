#!/usr/bin/env node
/**
 * One-time (idempotent) import of playlog/*.md into the play_logs table.
 *
 * Usage:
 *   node scripts/import-playlogs.mjs --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-playlogs.mjs --campaign-id <uuid>
 *
 * --dry-run parses and prints what would be upserted, no network.
 * The campaign id is the SKT campaign's row in public.campaigns; upserts
 * conflict on (campaign_id, session_number) so re-runs are safe.
 * Requires the service-role key because play_logs writes are GM-gated and
 * this script runs outside any user session. NEVER ship this key to the site.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaylog } from './playlog-parse.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const campaignId = args[args.indexOf('--campaign-id') + 1];

const SUPABASE_URL = 'https://edmeogmkquhslpvjelyq.supabase.co';

const files = readdirSync(join(root, 'playlog'))
  .filter((f) => f.endsWith('.md'))
  .sort();

const rows = files.map((f) => {
  const parsed = parsePlaylog(readFileSync(join(root, 'playlog', f), 'utf8'), f);
  const { campaign, ruleset, ...row } = parsed; // campaign/ruleset come from the campaigns row
  return { file: f, campaign, row };
});

console.log(`Parsed ${rows.length} session logs:`);
for (const { file, row } of rows) {
  console.log(
    `  ${file} → #${row.session_number} "${row.title}" (${row.session_date ?? 'no date'},` +
      ` ${row.players_present.length} players, ${row.body_md.length} chars,` +
      ` ${row.published ? 'published' : 'draft'})`,
  );
}

if (dryRun) {
  console.log('\nDry run — nothing written.');
  process.exit(0);
}

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required (or use --dry-run).');
  process.exit(1);
}
if (!campaignId) {
  console.error('--campaign-id <uuid> is required: the campaigns row these sessions belong to.');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const client = createClient(SUPABASE_URL, key);

const payload = rows.map(({ row }) => ({ ...row, campaign_id: campaignId }));
const { error, count } = await client
  .from('play_logs')
  .upsert(payload, { onConflict: 'campaign_id,session_number', count: 'exact' });
if (error) {
  console.error('Upsert failed:', error.message);
  process.exit(1);
}
console.log(`\nUpserted ${count ?? payload.length} rows into play_logs for campaign ${campaignId}.`);
