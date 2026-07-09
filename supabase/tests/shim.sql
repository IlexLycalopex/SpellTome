-- Local-Postgres shim emulating enough of the Supabase runtime to replay the
-- project's migrations and exercise RLS. Test-only — never apply to the
-- real project (Supabase provides all of this natively).

-- roles are cluster-wide; keep re-runs idempotent
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
-- Supabase grants execute on new functions to these roles by default; the
-- migrations rely on that (they revoke selectively afterwards).
alter default privileges
  grant execute on functions to anon, authenticated, service_role;

-- ---------- auth schema ----------
create schema auth;

create table auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text unique
);

-- Supabase resolves these from the request JWT; locally we read a GUC that
-- tests set per session/transaction.
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt()->>'sub', '')::uuid
$$;

grant usage on schema auth to anon, authenticated;

-- ---------- storage schema ----------
create schema storage;

create table storage.buckets (
  id     text primary key,
  name   text not null,
  public boolean not null default false
);

create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets(id),
  name       text not null,
  owner      uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;

create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;

grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to authenticated;

-- ---------- realtime ----------
create publication supabase_realtime;

-- ---------- quirks of the live project ----------
-- Existed on the real DB before the migration mirror started; migration
-- 0002 revokes on it, so it must exist locally too.
create function public.rls_auto_enable() returns event_trigger language plpgsql as $$
begin
end $$;
