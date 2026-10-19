-- Checks that row level security keeps students' data private.
--
-- How to run: paste this whole file into the Supabase dashboard's SQL Editor and click Run.
-- It always ends with an error on purpose: raising an error is what rolls everything back,
-- so nothing it tries is saved. Read the error message:
--
--   RLS CHECK PASSED ...   every attempt below was blocked, as it should be
--   RLS CHECK FAILED ...   at least one line says ALLOWED; fix the policies before shipping
--
-- When you add a table, add the attempts students and guests must NOT be able to make.

do $$
declare
  me uuid := gen_random_uuid();
  other uuid := gen_random_uuid();
  r text := '';
begin
  -- A signed-in student
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);

  begin insert into public.dietary_profiles (user_id) values (other); r := r || ' | student writes another profile: ALLOWED';
  exception when insufficient_privilege then r := r || ' | student writes another profile: blocked'; end;
  begin insert into public.favorites (user_id, kind, target_id) values (other, 'item', 'x'); r := r || ' | student adds another''s favorite: ALLOWED';
  exception when insufficient_privilege then r := r || ' | student adds another''s favorite: blocked'; end;
  begin insert into public.reports (item_id, reason, user_id) values ('x', 'other', other); r := r || ' | student reports as someone else: ALLOWED';
  exception when insufficient_privilege then r := r || ' | student reports as someone else: blocked'; end;
  begin update public.reports set notes = 'x'; r := r || ' | student edits reports: ALLOWED';
  exception when insufficient_privilege then r := r || ' | student edits reports: blocked'; end;
  begin delete from public.reports; r := r || ' | student deletes reports: ALLOWED';
  exception when insufficient_privilege then r := r || ' | student deletes reports: blocked'; end;

  -- A guest (not signed in)
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  begin perform 1 from public.dietary_profiles; r := r || ' | guest reads profiles: ALLOWED';
  exception when insufficient_privilege then r := r || ' | guest reads profiles: blocked'; end;
  begin perform 1 from public.favorites; r := r || ' | guest reads favorites: ALLOWED';
  exception when insufficient_privilege then r := r || ' | guest reads favorites: blocked'; end;
  begin perform 1 from public.reports; r := r || ' | guest reads reports: ALLOWED';
  exception when insufficient_privilege then r := r || ' | guest reads reports: blocked'; end;
  begin insert into public.reports (item_id, reason, user_id) values ('x', 'other', other); r := r || ' | guest reports as a student: ALLOWED';
  exception when insufficient_privilege then r := r || ' | guest reports as a student: blocked'; end;
  begin insert into public.dietary_profiles (user_id) values (other); r := r || ' | guest writes a profile: ALLOWED';
  exception when insufficient_privilege then r := r || ' | guest writes a profile: blocked'; end;
  begin insert into public.favorites (user_id, kind, target_id) values (other, 'item', 'x'); r := r || ' | guest adds a favorite: ALLOWED';
  exception when insufficient_privilege then r := r || ' | guest adds a favorite: blocked'; end;

  raise exception '%',
    case when r like '%ALLOWED%' then 'RLS CHECK FAILED' else 'RLS CHECK PASSED (nothing saved)' end || r;
end $$;
