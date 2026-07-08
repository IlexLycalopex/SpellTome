-- v2: ruleset registry table + typed FK on campaigns.
-- The old free-text campaigns.ruleset column stays until post-cutover cleanup.

create table public.rulesets (
  id   text primary key,
  name text not null,
  meta jsonb not null default '{}'::jsonb
);

alter table public.rulesets enable row level security;

-- The registry is public reference data (ids/names only).
create policy rulesets_read on public.rulesets
  for select to anon, authenticated using (true);

insert into public.rulesets (id, name) values
  ('dnd5e',       'D&D 5e'),
  ('daggerheart', 'Daggerheart'),
  ('tftl',        'Tales from the Loop'),
  ('vaesen',      'Vaesen'),
  ('coc7e',       'Call of Cthulhu 7e');

alter table public.campaigns
  add column ruleset_id text references public.rulesets(id);

-- Backfill from the free-text label; anything unrecognized defaults to dnd5e.
update public.campaigns set ruleset_id = case
  when ruleset ilike '%daggerheart%'          then 'daggerheart'
  when ruleset ilike '%loop%'                 then 'tftl'
  when ruleset ilike '%vaesen%'               then 'vaesen'
  when ruleset ilike '%cthulhu%' or ruleset ilike '%coc%' then 'coc7e'
  else 'dnd5e'
end;

alter table public.campaigns
  alter column ruleset_id set not null,
  alter column ruleset_id set default 'dnd5e';
