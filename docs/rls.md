# Row level security (RLS)

How SafeBite's database decides who can read and change each row, and how to keep it that way when adding tables.

## Why it matters

The web app talks to Supabase straight from the browser using the **publishable** key, which anyone can find in the app's JavaScript. Anyone can therefore send requests to the database API directly, skipping the app entirely. RLS is what stops them from reading or changing other students' data. The app's own checks are only for a good user experience; the database is the real gatekeeper.

## How the database knows who's asking

Every request to Supabase carries a token, and Postgres runs the request as a database **role** based on it:

| Who                   | Role                        | `auth.uid()` returns           |
| --------------------- | --------------------------- | ------------------------------ |
| Guest (not signed in) | `anon`                      | `null`                         |
| Signed-in student     | `authenticated`             | the student's user id          |
| Dashboard, secret key | `service_role` / `postgres` | not used: these **bypass RLS** |

`auth.uid()` reads the user id from the signed-in session's token, which Supabase signs. A student can't fake it.

## Two layers

Access needs to pass both:

1. **Privileges (`grant`)** decide which operations a role may try at all on a table, such as `select` or `insert`. The migration first revokes everything from `anon` and `authenticated`, then grants back only what the app uses.
2. **Policies (`create policy`)** decide which **rows** an allowed operation may touch. With RLS enabled, a table with no matching policy returns no rows and accepts no writes.

Each policy has up to two conditions:

- `using (...)`: which existing rows the student can see, update or delete.
- `with check (...)`: what a new or updated row must look like to be saved.

## The rules, table by table

All of this is in [`supabase/migrations/20261019215226_student_accounts.sql`](../supabase/migrations/20261019215226_student_accounts.sql).

### `dietary_profiles`

| Role            | Privileges                     | Policy condition                                  |
| --------------- | ------------------------------ | ------------------------------------------------- |
| `authenticated` | select, insert, update, delete | `auth.uid() = user_id` (for both using and check) |
| `anon`          | none                           | none                                              |

A student can create, read, change and delete only their own profile. The update policy checks both conditions, so a student can't move their row onto someone else's id either.

### `favorites`

| Role            | Privileges             | Policy condition       |
| --------------- | ---------------------- | ---------------------- |
| `authenticated` | select, insert, delete | `auth.uid() = user_id` |
| `anon`          | none                   | none                   |

There's no update privilege: un-saving a favorite deletes the row.

### `reports`

| Role            | Privileges     | Policy condition                                                                  |
| --------------- | -------------- | --------------------------------------------------------------------------------- |
| `authenticated` | insert, select | insert: `user_id is not distinct from auth.uid()`; select: `auth.uid() = user_id` |
| `anon`          | insert         | insert: `user_id is not distinct from auth.uid()`                                 |

- `user_id` defaults to `auth.uid()`, so a student's report is signed with their id automatically and a guest's is `null`.
- `is not distinct from` is an equality check that also treats `null = null` as true. That's what lets a guest's `null` match a guest's `null` user id, while stopping a guest or student from sending a report under someone else's id.
- Guests have no select privilege, so they can't read reports back, not even their own. The app therefore creates the report's id in the browser and doesn't ask for the saved row back (`reports.submit` in `web/src/api/supabase/supabaseClient.ts`).
- Nobody can update or delete reports through the API. The team reviews them in the dashboard, which bypasses RLS.

## Choices worth knowing about

- **`(select auth.uid())` instead of `auth.uid()`** in policies: Postgres works out the subquery once per query instead of once per row. Supabase recommends this for performance.
- **`to authenticated` on student policies** means they never apply to guests, even by accident.
- **`on delete cascade`** on `dietary_profiles` and `favorites`: deleting an account deletes that student's data. Reports use `on delete set null`, so they stay for the team but no longer point at the deleted account.
- **The app also filters by `user_id`** (for example `.eq('user_id', id)`). That's for clarity and speed only; RLS would hide other students' rows anyway.

## Adding a table

Every new table in `public` needs RLS before the app uses it. Start from this:

```sql
create table public.example (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- ...
);

alter table public.example enable row level security;

create policy "Students can read their own examples"
  on public.example for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can add their own examples"
  on public.example for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.example from anon, authenticated;
grant select, insert on public.example to authenticated;
```

Then:

1. Add policies only for the operations the app needs. No policy means no access.
2. Add the attempts that must fail to [`supabase/tests/rls_check.sql`](../supabase/tests/rls_check.sql).
3. Apply the migration and run the checks below.

Tables of shared, public data (like future dining halls and menus) work differently: everyone may read, nobody may write through the API. For those, use a `for select to anon, authenticated using (true)` policy, grant only `select`, and let the scraper write with the secret key.

## Checking it

- **`supabase/tests/rls_check.sql`:** paste it into the dashboard's **SQL Editor** and click **Run**. It tries things students and guests must not be able to do, then deliberately ends with an error so nothing is saved. The message starts with **RLS CHECK PASSED** or **RLS CHECK FAILED**, followed by each attempt and whether it was blocked.
- **Advisors → Security Advisor** in the dashboard flags tables without RLS and other common mistakes.

Results from the last run are in [security.md](security.md).
