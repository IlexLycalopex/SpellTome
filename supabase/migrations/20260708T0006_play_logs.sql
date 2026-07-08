-- v2: play logs move from playlog/*.md in git into the database.
-- Published sessions are the site's only anon-readable content (the public
-- chronicle); writing is campaign-GM or app-admin only.

create table public.play_logs (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.campaigns(id) on delete cascade,
  session_number  int  not null,
  title           text not null default '',
  session_date    date,
  gm              text not null default '',
  players_present text[] not null default '{}',
  synopsis        text not null default '',
  -- section bodies keyed by the ruleset's log template ids, plus free markdown
  body_md         text not null default '',
  published       boolean not null default false,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (campaign_id, session_number)
);

create index play_logs_campaign_idx on public.play_logs (campaign_id, session_number desc);

alter table public.play_logs enable row level security;

-- Anyone (signed in or not) can read published sessions: the public chronicle.
create policy play_logs_public_read on public.play_logs
  for select to anon, authenticated
  using (published);

-- Members also see unpublished drafts of their campaigns.
create policy play_logs_member_read on public.play_logs
  for select to authenticated
  using (tome_private.is_campaign_member(campaign_id));

-- Only the campaign GM writes.
create policy play_logs_gm_insert on public.play_logs
  for insert to authenticated
  with check (tome_private.is_campaign_gm(campaign_id));
create policy play_logs_gm_update on public.play_logs
  for update to authenticated
  using (tome_private.is_campaign_gm(campaign_id))
  with check (tome_private.is_campaign_gm(campaign_id));
create policy play_logs_gm_delete on public.play_logs
  for delete to authenticated
  using (tome_private.is_campaign_gm(campaign_id));

-- App admin override, consistent with the other tables.
create policy admins_all_play_logs on public.play_logs
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());

create or replace function tome_private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger play_logs_touch before update on public.play_logs
  for each row execute function tome_private.touch_updated_at();
