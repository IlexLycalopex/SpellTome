-- Applied to project edmeogmkquhslpvjelyq on 2026-06-12 (via MCP).
revoke execute on function public.is_campaign_member(uuid) from public, anon;
revoke execute on function public.is_campaign_gm(uuid) from public, anon;
revoke execute on function public.add_campaign_creator() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
drop policy campaigns_insert on public.campaigns;
create policy campaigns_insert on public.campaigns for insert to authenticated
  with check (auth.uid() is not null);
