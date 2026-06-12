-- Applied to project edmeogmkquhslpvjelyq on 2026-06-12 (via MCP).
-- The Tome: campaigns, members (roles), collection mirror, heartbeat.

create table public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  gm          text not null default '',
  ruleset     text not null default 'D&D 5e',
  status      text not null default 'active' check (status in ('active','planned','hiatus','completed')),
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table public.campaign_members (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name  text not null default '',
  role          text not null default 'player' check (role in ('gm','player')),
  created_at    timestamptz not null default now(),
  unique (campaign_id, user_id),
  unique (campaign_id, invited_email),
  check (user_id is not null or invited_email is not null)
);

create table public.tome_collections (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  collection  text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  primary key (campaign_id, collection)
);

create or replace function public.is_campaign_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_campaign_gm(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid() and m.role = 'gm'
  );
$$;

alter table public.campaigns        enable row level security;
alter table public.campaign_members enable row level security;
alter table public.tome_collections enable row level security;

create policy campaigns_select on public.campaigns for select to authenticated
  using (public.is_campaign_member(id));
create policy campaigns_insert on public.campaigns for insert to authenticated
  with check (true);
create policy campaigns_update on public.campaigns for update to authenticated
  using (public.is_campaign_gm(id));
create policy campaigns_delete on public.campaigns for delete to authenticated
  using (public.is_campaign_gm(id));

create or replace function public.add_campaign_creator()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into campaign_members (campaign_id, user_id, role, display_name)
    values (new.id, auth.uid(), 'gm', coalesce(auth.jwt()->>'email', ''));
  end if;
  return new;
end $$;

create trigger campaigns_creator after insert on public.campaigns
  for each row execute function public.add_campaign_creator();

create policy members_select on public.campaign_members for select to authenticated
  using (
    public.is_campaign_member(campaign_id)
    or user_id = auth.uid()
    or invited_email = (auth.jwt()->>'email')
  );
create policy members_insert on public.campaign_members for insert to authenticated
  with check (public.is_campaign_gm(campaign_id));
create policy members_update_gm on public.campaign_members for update to authenticated
  using (public.is_campaign_gm(campaign_id));
create policy members_claim on public.campaign_members for update to authenticated
  using (user_id is null and invited_email = (auth.jwt()->>'email'))
  with check (user_id = auth.uid());
create policy members_delete on public.campaign_members for delete to authenticated
  using (public.is_campaign_gm(campaign_id));

create policy collections_select on public.tome_collections for select to authenticated
  using (public.is_campaign_member(campaign_id));
create policy collections_insert on public.tome_collections for insert to authenticated
  with check (public.is_campaign_member(campaign_id));
create policy collections_update on public.tome_collections for update to authenticated
  using (public.is_campaign_member(campaign_id));
create policy collections_delete on public.tome_collections for delete to authenticated
  using (public.is_campaign_gm(campaign_id));

create table public.heartbeat (
  id        int primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);
insert into public.heartbeat (id) values (1);
alter table public.heartbeat enable row level security;
create policy heartbeat_read on public.heartbeat for select to anon using (true);
