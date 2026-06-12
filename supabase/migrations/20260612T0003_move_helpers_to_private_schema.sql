-- Applied to project edmeogmkquhslpvjelyq on 2026-06-12 (via MCP).
-- PostgREST exposes only the public schema; moving helpers removes the
-- /rpc surface entirely. RLS policies follow the functions by OID.
create schema if not exists tome_private;
grant usage on schema tome_private to authenticated;
alter function public.is_campaign_member(uuid) set schema tome_private;
alter function public.is_campaign_gm(uuid) set schema tome_private;
alter function public.add_campaign_creator() set schema tome_private;
revoke execute on function public.rls_auto_enable() from public;
