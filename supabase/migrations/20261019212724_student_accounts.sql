-- Student account data: dietary profiles, favorites and incorrect-information reports.
--
-- Accounts themselves live in auth.users (Supabase Auth: email + password, Google, Microsoft).
-- The web app talks to these tables directly with the publishable key, so row level security is
-- what keeps each student's data private: every policy below limits a student to their own rows.
--
-- Dining data (halls, menus, items) isn't in the database yet; the scraper will own it. Until
-- then item and hall ids are plain text that match the ids in web/src/api/mock/fixtures.ts.
-- Add foreign keys once those tables exist.
--
-- Column shapes mirror the zod schemas in web/src/api/schemas.ts. Change both together.

-- Keeps updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dietary profiles: one per student
-- ---------------------------------------------------------------------------

create table public.dietary_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- [{ "allergen": "peanuts", "severity": "allergy" }, ...]
  avoid jsonb not null default '[]' check (jsonb_typeof(avoid) = 'array'),
  -- Dietary tags such as 'vegan' or 'halal'.
  preferences text[] not null default '{}',
  other_preference text check (char_length(other_preference) <= 200),
  acknowledged_safety_notice boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dietary_profiles is
  'Each student''s allergies, intolerances and dietary preferences.';

create trigger dietary_profiles_set_updated_at
  before update on public.dietary_profiles
  for each row execute function public.set_updated_at();

alter table public.dietary_profiles enable row level security;

create policy "Students can read their own dietary profile"
  on public.dietary_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can create their own dietary profile"
  on public.dietary_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update their own dietary profile"
  on public.dietary_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Students can delete their own dietary profile"
  on public.dietary_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Favorites: saved menu items and dining halls
-- ---------------------------------------------------------------------------

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('item', 'hall')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, target_id)
);

comment on table public.favorites is 'Menu items and dining halls a student saved.';

alter table public.favorites enable row level security;

create policy "Students can read their own favorites"
  on public.favorites for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can add their own favorites"
  on public.favorites for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can remove their own favorites"
  on public.favorites for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Reports: incorrect menu information, reviewed by the SafeBite team
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  -- Null when a guest (no account) sent the report.
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  item_id text not null,
  reason text not null check (
    reason in (
      'incorrect-allergen',
      'incorrect-ingredient',
      'item-unavailable',
      'wrong-nutrition',
      'other'
    )
  ),
  notes text check (char_length(notes) <= 1000),
  allow_contact boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.reports is
  'Incorrect-information reports from students. The team reviews them in the dashboard.';

create index reports_user_id_idx on public.reports (user_id);

alter table public.reports enable row level security;

-- Guests can report too, but only anonymously; signed-in students only as themselves.
create policy "Anyone can send a report as themselves"
  on public.reports for insert to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));

create policy "Students can read their own reports"
  on public.reports for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Privileges: least privilege on top of RLS
-- ---------------------------------------------------------------------------

revoke all on public.dietary_profiles, public.favorites, public.reports from anon, authenticated;

grant select, insert, update, delete on public.dietary_profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant insert on public.reports to anon, authenticated;
grant select on public.reports to authenticated;
