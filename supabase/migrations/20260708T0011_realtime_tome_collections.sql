-- During the transition the new site still syncs whole-collection blobs via
-- tome_collections (see site/src/lib/sync.svelte.ts). Adding it to the
-- realtime publication lets the new combat tracker react instantly to other
-- members' changes; postgres_changes respects the table's RLS.
alter publication supabase_realtime add table public.tome_collections;
