-- Immutable UC Dining snapshots and their normalized menu entries.
--
-- The importer is the only writer. The browser receives read-only public data;
-- student-owned tables remain protected by the earlier migration's RLS rules.
-- Source fields deliberately retain NULL/empty distinctions so the app never
-- mistakes missing allergen information for an allergen-free declaration.

create table public.dining_locations (
  id text primary key,
  name text not null,
  categories jsonb not null default '[]'::jsonb check (jsonb_typeof(categories) = 'array'),
  address jsonb,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  description text,
  telephone text,
  opening_hours jsonb,
  source_page text,
  directory_source text,
  source_location_id text,
  source_menu_id text,
  structured_menu_status text not null check (
    structured_menu_status in (
      'observed_with_items',
      'endpoint_discovered_no_items_observed',
      'no_structured_menu_observed',
      'page_unavailable'
    )
  ),
  source_retrieved_at timestamptz,
  source_http_status integer,
  source_error text,
  imported_at timestamptz not null default now()
);

create table public.menu_snapshots (
  id text primary key,
  location_id text not null references public.dining_locations(id) on delete restrict,
  service_date date not null,
  retrieved_at timestamptz not null,
  source_updated_at timestamptz,
  source_url text,
  date_evidence text,
  source_meal_periods jsonb not null default '[]'::jsonb check (jsonb_typeof(source_meal_periods) = 'array'),
  availability text not null check (
    availability in ('menu_entries_returned', 'empty_response_reason_unknown')
  ),
  source_item_count integer not null check (source_item_count >= 0),
  import_hash text not null check (import_hash ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz not null default now(),
  unique (location_id, service_date, retrieved_at)
);

create index menu_snapshots_location_date_idx
  on public.menu_snapshots (location_id, service_date desc, retrieved_at desc);

create table public.menu_items (
  id text primary key,
  snapshot_id text not null references public.menu_snapshots(id) on delete cascade,
  source_position integer not null check (source_position >= 0),
  source_item_id text,
  usable_item_id text,
  source_meal_period text,
  station text,
  name text,
  description text,
  ingredients text,
  serving_size text,
  allergens jsonb,
  allergen_data_status text not null check (
    allergen_data_status in ('missing', 'reported', 'reported_empty_not_safety_verified')
  ),
  diets jsonb not null default '{}'::jsonb check (jsonb_typeof(diets) = 'object'),
  nutrition jsonb,
  suspected_placeholder boolean not null default false,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz not null default now(),
  unique (snapshot_id, source_position)
);

create index menu_items_snapshot_period_idx
  on public.menu_items (snapshot_id, source_meal_period);
create index menu_items_usable_item_id_idx on public.menu_items (usable_item_id)
  where usable_item_id is not null;
create index menu_items_name_search_idx on public.menu_items
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(station, '')));

-- Change records are written by the importer after it compares two snapshots.
-- They are deliberately separate from the raw item data so alert generation is
-- auditable and a new comparison algorithm can be rerun without mutating history.
create table public.menu_item_changes (
  id uuid primary key default gen_random_uuid(),
  location_id text not null references public.dining_locations(id) on delete restrict,
  previous_item_id text references public.menu_items(id) on delete set null,
  current_item_id text not null references public.menu_items(id) on delete cascade,
  detected_at timestamptz not null default now(),
  change_kind text not null check (change_kind in ('new_item', 'ingredient_change', 'allergen_change')),
  added_allergens jsonb not null default '[]'::jsonb check (jsonb_typeof(added_allergens) = 'array'),
  before_content_hash text,
  after_content_hash text not null
);

create index menu_item_changes_current_item_idx on public.menu_item_changes (current_item_id);

create table public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  menu_item_change_id uuid not null references public.menu_item_changes(id) on delete cascade,
  item_id text not null references public.menu_items(id) on delete restrict,
  hall_id text not null references public.dining_locations(id) on delete restrict,
  allergen text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, menu_item_change_id, allergen)
);

create index safety_alerts_user_created_idx on public.safety_alerts (user_id, created_at desc);

-- Expose dining data as read-only data API resources. The scheduled importer
-- uses a server-only role and is never called by a browser.
alter table public.dining_locations enable row level security;
alter table public.menu_snapshots enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_changes enable row level security;
alter table public.safety_alerts enable row level security;

create policy "Anyone can read dining locations"
  on public.dining_locations for select to anon, authenticated using (true);
create policy "Anyone can read published menu snapshots"
  on public.menu_snapshots for select to anon, authenticated using (true);
create policy "Anyone can read published menu items"
  on public.menu_items for select to anon, authenticated using (true);
create policy "Students can read their own safety alerts"
  on public.safety_alerts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Students can mark their own safety alerts read"
  on public.safety_alerts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.dining_locations, public.menu_snapshots, public.menu_items,
  public.menu_item_changes, public.safety_alerts from anon, authenticated;
grant select on public.dining_locations, public.menu_snapshots, public.menu_items to anon, authenticated;
grant select, update (read_at) on public.safety_alerts to authenticated;
