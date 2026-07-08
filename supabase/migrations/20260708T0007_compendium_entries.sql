-- v2: gated compendium content. Free League (Vaesen/TFTL) and Chaosium (CoC)
-- material cannot ship in the public bundle, so the owner enters it here and
-- RLS restricts reading to signed-in members of at least one campaign.

create table public.compendium_entries (
  id         uuid primary key default gen_random_uuid(),
  ruleset_id text not null references public.rulesets(id),
  entry_type text not null,
  slug       text not null,
  name       text not null,
  data       jsonb not null default '{}'::jsonb,
  is_public  boolean not null default false,
  search     tsvector generated always as (
    to_tsvector('english', name || ' ' || coalesce(data->>'summary', ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, entry_type, slug)
);

create index compendium_search_idx on public.compendium_entries using gin (search);
create index compendium_browse_idx on public.compendium_entries (ruleset_id, entry_type, name);

-- Member of any campaign = member of the group's site.
create or replace function tome_private.is_site_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from campaign_members m where m.user_id = auth.uid()
  );
$$;
revoke execute on function tome_private.is_site_member() from public, anon;
grant execute on function tome_private.is_site_member() to authenticated;

alter table public.compendium_entries enable row level security;

create policy compendium_member_read on public.compendium_entries
  for select to authenticated
  using (tome_private.is_site_member());

-- Only the app admin curates content.
create policy compendium_admin_write on public.compendium_entries
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());

create trigger compendium_touch before update on public.compendium_entries
  for each row execute function tome_private.touch_updated_at();
