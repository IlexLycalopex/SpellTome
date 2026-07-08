-- v2: private storage bucket for campaign media (maps, portraits).
-- Paths are namespaced by campaign id: <campaign_id>/maps/..., <campaign_id>/portraits/...
-- Served to members via signed URLs; nothing is public.

insert into storage.buckets (id, name, public)
values ('campaign-media', 'campaign-media', false)
on conflict (id) do nothing;

create policy campaign_media_member_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'campaign-media'
    and tome_private.is_campaign_member(((storage.foldername(name))[1])::uuid)
  );

create policy campaign_media_gm_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'campaign-media'
    and tome_private.is_campaign_gm(((storage.foldername(name))[1])::uuid)
  );

create policy campaign_media_gm_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'campaign-media'
    and tome_private.is_campaign_gm(((storage.foldername(name))[1])::uuid)
  );

create policy campaign_media_gm_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'campaign-media'
    and tome_private.is_campaign_gm(((storage.foldername(name))[1])::uuid)
  );
