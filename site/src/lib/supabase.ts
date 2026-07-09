import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Public by design — RLS is the protection layer (docs/BACKEND_PLAN.md).
// Same live project the old site syncs with.
export const SUPABASE_URL = 'https://edmeogmkquhslpvjelyq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbWVvZ21rcXVoc2xwdmplbHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDc4NDAsImV4cCI6MjA5Njc4Mzg0MH0.xOnV3Jt8CI3owyUMhFrpoKfQz7VLG2vRI63iCu6CvaU';

let client: SupabaseClient | null = null;

/** Lazy singleton — never constructed during SSR/build. */
export function getSupabase(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
