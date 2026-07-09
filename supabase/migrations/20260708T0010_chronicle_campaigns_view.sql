-- The public chronicle needs campaign names without exposing the campaigns
-- table (member-only RLS). This definer-security view surfaces only the id,
-- name and ruleset of campaigns that have at least one published session.

create view public.chronicle_campaigns as
  select c.id, c.name, c.ruleset_id
  from public.campaigns c
  where exists (
    select 1 from public.play_logs p
    where p.campaign_id = c.id and p.published
  );

-- Owner-privilege view (security_invoker off): bypasses campaigns RLS by
-- design, but only for the three columns and rows filtered above.
grant select on public.chronicle_campaigns to anon, authenticated;
