-- Applied to project edmeogmkquhslpvjelyq on 2026-06-12 (via MCP).
-- Multi-tenancy + platform admin role.

alter table public.campaigns drop constraint campaigns_name_key;

create table tome_private.app_admins (
  email text primary key,
  note  text not null default ''
);
insert into tome_private.app_admins (email, note)
values ('alexander.jameswatts@gmail.com', 'site owner');

create or replace function tome_private.is_app_admin()
returns boolean language sql stable security definer set search_path = tome_private as $$
  select exists (
    select 1 from app_admins a
    where a.email = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;
revoke execute on function tome_private.is_app_admin() from public, anon;
grant execute on function tome_private.is_app_admin() to authenticated;

create or replace function public.am_i_admin()
returns boolean language sql stable security invoker set search_path = public as $$
  select tome_private.is_app_admin();
$$;
revoke execute on function public.am_i_admin() from public, anon;
grant execute on function public.am_i_admin() to authenticated;

create policy admins_all_campaigns on public.campaigns
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());
create policy admins_all_members on public.campaign_members
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());
create policy admins_all_collections on public.tome_collections
  for all to authenticated
  using (tome_private.is_app_admin()) with check (tome_private.is_app_admin());
