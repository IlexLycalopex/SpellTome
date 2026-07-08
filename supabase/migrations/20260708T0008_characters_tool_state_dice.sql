-- v2: normalized characters, per-tool state blobs (successor to
-- tome_collections), and a shared dice log for realtime table rolls.

-- ---------- characters ----------
create table public.characters (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  owner         uuid references auth.users(id),
  ruleset_id    text not null references public.rulesets(id),
  name          text not null,
  sheet         jsonb not null default '{}'::jsonb,
  portrait_path text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index characters_campaign_idx on public.characters (campaign_id);

alter table public.characters enable row level security;

create policy characters_member_read on public.characters
  for select to authenticated
  using (tome_private.is_campaign_member(campaign_id));

-- The sheet's owner or the campaign GM may write.
create policy characters_owner_write on public.characters
  for all to authenticated
  using (owner = auth.uid() or tome_private.is_campaign_gm(campaign_id))
  with check (
    tome_private.is_campaign_member(campaign_id)
    and (owner = auth.uid() or tome_private.is_campaign_gm(campaign_id))
  );

create policy admins_all_characters on public.characters
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());

create trigger characters_touch before update on public.characters
  for each row execute function tome_private.touch_updated_at();

-- ---------- tool_state ----------
create table public.tool_state (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  tool        text not null,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  primary key (campaign_id, tool)
);

alter table public.tool_state enable row level security;

create policy tool_state_member_read on public.tool_state
  for select to authenticated
  using (tome_private.is_campaign_member(campaign_id));
create policy tool_state_member_write on public.tool_state
  for insert to authenticated
  with check (tome_private.is_campaign_member(campaign_id));
create policy tool_state_member_update on public.tool_state
  for update to authenticated
  using (tome_private.is_campaign_member(campaign_id))
  with check (tome_private.is_campaign_member(campaign_id));
create policy tool_state_gm_delete on public.tool_state
  for delete to authenticated
  using (tome_private.is_campaign_gm(campaign_id));

create policy admins_all_tool_state on public.tool_state
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());

-- ---------- dice_rolls ----------
create table public.dice_rolls (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id     uuid references auth.users(id),
  ruleset_id  text references public.rulesets(id),
  label       text not null default '',
  spec        jsonb not null default '{}'::jsonb,
  result      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index dice_rolls_campaign_idx on public.dice_rolls (campaign_id, created_at desc);

alter table public.dice_rolls enable row level security;

create policy dice_rolls_member_read on public.dice_rolls
  for select to authenticated
  using (tome_private.is_campaign_member(campaign_id));
create policy dice_rolls_member_insert on public.dice_rolls
  for insert to authenticated
  with check (tome_private.is_campaign_member(campaign_id) and user_id = auth.uid());

-- ---------- realtime ----------
alter publication supabase_realtime add table public.tool_state;
alter publication supabase_realtime add table public.dice_rolls;
