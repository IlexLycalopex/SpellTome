-- RLS behaviour tests, run against a fresh database that has shim.sql and
-- every migration applied (see run-local.sh). Uses session-level JWT GUCs to
-- impersonate users the way PostgREST does. Any failed assertion raises.

\set ON_ERROR_STOP on

-- ---------- fixtures (as superuser) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'gm@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'player@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'outsider@example.com'),
  ('00000000-0000-0000-0000-00000000000d', 'alexander.jameswatts@gmail.com');

-- helper: impersonate a user (or anon) for the rest of the transaction
create or replace procedure test_as(uid text, email text) language plpgsql as $$
begin
  if uid is null then
    execute 'set local role anon';
    perform set_config('request.jwt.claims', '', true);
  else
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'email', email, 'role', 'authenticated')::text, true);
  end if;
end $$;

-- ============================================================
-- campaign creation: creator auto-becomes GM via trigger
-- ============================================================
begin;
call test_as('00000000-0000-0000-0000-00000000000a', 'gm@example.com');
insert into campaigns (name, ruleset_id) values ('SKT Test', 'dnd5e');
do $$
declare r text;
begin
  select role into r from campaign_members m
    join campaigns c on c.id = m.campaign_id and c.name = 'SKT Test'
    where m.user_id = '00000000-0000-0000-0000-00000000000a';
  if r is distinct from 'gm' then
    raise exception 'creator was not added as gm (got %)', r;
  end if;
end $$;
commit;

-- add the player as a member (as GM), seed a published + a draft log
begin;
call test_as('00000000-0000-0000-0000-00000000000a', 'gm@example.com');
insert into campaign_members (campaign_id, user_id, role)
  select id, '00000000-0000-0000-0000-00000000000b', 'player' from campaigns where name = 'SKT Test';
insert into play_logs (campaign_id, session_number, title, published, body_md)
  select id, 1, 'The Published One', true, 'body' from campaigns where name = 'SKT Test';
insert into play_logs (campaign_id, session_number, title, published, body_md)
  select id, 2, 'The Secret Draft', false, 'body' from campaigns where name = 'SKT Test';
commit;

-- ============================================================
-- play_logs: anon reads ONLY published
-- ============================================================
begin;
call test_as(null, null);
do $$
declare n int;
begin
  select count(*) into n from play_logs;
  if n <> 1 then raise exception 'anon should see 1 published log, saw %', n; end if;
  select count(*) into n from play_logs where title = 'The Secret Draft';
  if n <> 0 then raise exception 'anon can see a draft'; end if;
end $$;
rollback;

-- member sees drafts too
begin;
call test_as('00000000-0000-0000-0000-00000000000b', 'player@example.com');
do $$
declare n int;
begin
  select count(*) into n from play_logs;
  if n <> 2 then raise exception 'member should see both logs, saw %', n; end if;
end $$;
rollback;

-- outsider sees only the published one
begin;
call test_as('00000000-0000-0000-0000-00000000000c', 'outsider@example.com');
do $$
declare n int;
begin
  select count(*) into n from play_logs;
  if n <> 1 then raise exception 'outsider should see only published, saw %', n; end if;
end $$;
rollback;

-- player (not GM) cannot write logs
begin;
call test_as('00000000-0000-0000-0000-00000000000b', 'player@example.com');
do $$
begin
  insert into play_logs (campaign_id, session_number, title)
    select campaign_id, 99, 'forged' from campaign_members limit 1;
  raise exception 'player was able to insert a play log';
exception when insufficient_privilege or check_violation then
  null; -- expected: RLS blocks
end $$;
rollback;

-- GM can update their log
begin;
call test_as('00000000-0000-0000-0000-00000000000a', 'gm@example.com');
update play_logs set synopsis = 'edited' where session_number = 1;
do $$
declare s text;
begin
  select synopsis into s from play_logs where session_number = 1;
  if s is distinct from 'edited' then raise exception 'gm update did not apply'; end if;
end $$;
rollback;

-- ============================================================
-- compendium_entries: site members read, outsiders don't, admin writes
-- ============================================================
begin;
call test_as('00000000-0000-0000-0000-00000000000d', 'alexander.jameswatts@gmail.com');
insert into compendium_entries (ruleset_id, entry_type, slug, name, data)
  values ('vaesen', 'vaesen', 'nacken', 'Näcken', '{"summary":"the fiddler in the weir"}');
commit;

begin;
call test_as('00000000-0000-0000-0000-00000000000b', 'player@example.com');
do $$
declare n int;
begin
  select count(*) into n from compendium_entries;
  if n <> 1 then raise exception 'campaign member should read compendium, saw %', n; end if;
end $$;
rollback;

begin;
call test_as('00000000-0000-0000-0000-00000000000c', 'outsider@example.com');
do $$
declare n int;
begin
  select count(*) into n from compendium_entries;
  if n <> 0 then raise exception 'outsider can read gated compendium'; end if;
  begin
    insert into compendium_entries (ruleset_id, entry_type, slug, name)
      values ('vaesen', 'vaesen', 'forged', 'Forged');
    raise exception 'outsider was able to write compendium';
  exception when insufficient_privilege or check_violation then null;
  end;
end $$;
rollback;

-- anon gets nothing
begin;
call test_as(null, null);
do $$
declare n int;
begin
  select count(*) into n from compendium_entries;
  if n <> 0 then raise exception 'anon can read gated compendium'; end if;
end $$;
rollback;

-- ============================================================
-- tool_state: members write, outsiders blocked
-- ============================================================
begin;
call test_as('00000000-0000-0000-0000-00000000000b', 'player@example.com');
insert into tool_state (campaign_id, tool, data, updated_by)
  select campaign_id, 'combat', '{"round":3}', '00000000-0000-0000-0000-00000000000b'
  from campaign_members where user_id = '00000000-0000-0000-0000-00000000000b' limit 1;
commit;

begin;
call test_as('00000000-0000-0000-0000-00000000000c', 'outsider@example.com');
do $$
declare n int;
begin
  select count(*) into n from tool_state;
  if n <> 0 then raise exception 'outsider can read tool_state'; end if;
end $$;
rollback;

-- ============================================================
-- characters: owner writes own, player cannot write another's
-- ============================================================
begin;
call test_as('00000000-0000-0000-0000-00000000000b', 'player@example.com');
insert into characters (campaign_id, owner, ruleset_id, name, sheet)
  select campaign_id, '00000000-0000-0000-0000-00000000000b', 'dnd5e', 'Sylvara', '{}'
  from campaign_members where user_id = '00000000-0000-0000-0000-00000000000b' limit 1;
commit;

begin;
call test_as('00000000-0000-0000-0000-00000000000c', 'outsider@example.com');
do $$
begin
  update characters set name = 'Hax';
  if found then raise exception 'outsider updated a character'; end if;
end $$;
rollback;

-- GM may edit the player's character
begin;
call test_as('00000000-0000-0000-0000-00000000000a', 'gm@example.com');
update characters set name = 'Sylvara the Bold';
do $$
declare s text;
begin
  select name into s from characters limit 1;
  if s is distinct from 'Sylvara the Bold' then raise exception 'gm could not edit member character'; end if;
end $$;
rollback;

-- ============================================================
-- dice_rolls: member inserts own rolls only
-- ============================================================
begin;
call test_as('00000000-0000-0000-0000-00000000000b', 'player@example.com');
insert into dice_rolls (campaign_id, user_id, ruleset_id, label, result)
  select campaign_id, '00000000-0000-0000-0000-00000000000b', 'dnd5e', 'attack', '{"total":17}'
  from campaign_members where user_id = '00000000-0000-0000-0000-00000000000b' limit 1;
do $$
begin
  begin
    insert into dice_rolls (campaign_id, user_id, label)
      select campaign_id, '00000000-0000-0000-0000-00000000000a', 'forged-as-gm'
      from campaign_members where user_id = '00000000-0000-0000-0000-00000000000b' limit 1;
    raise exception 'player inserted a roll as another user';
  exception when insufficient_privilege or check_violation then null;
  end;
end $$;
rollback;

-- ============================================================
-- app admin: cross-tenant read
-- ============================================================
begin;
call test_as('00000000-0000-0000-0000-00000000000d', 'alexander.jameswatts@gmail.com');
do $$
declare n int;
begin
  select count(*) into n from campaigns;
  if n < 1 then raise exception 'admin cannot see campaigns'; end if;
  if not am_i_admin() then raise exception 'am_i_admin() false for admin email'; end if;
end $$;
rollback;

select 'ALL RLS TESTS PASSED' as result;
