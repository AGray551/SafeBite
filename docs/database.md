# Database

SafeBite's database is Supabase Postgres. The schema is defined by the migrations in [`supabase/migrations/`](../supabase/migrations/); this page explains what's there and how to change it.

## Tables

Accounts live in `auth.users`, managed by Supabase Auth. Every SafeBite table below references it.

### `dietary_profiles`

One row per student who saved a profile.

| Column                       | Type          | Notes                                                                                        |
| ---------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `user_id`                    | `uuid` (PK)   | → `auth.users.id`; deleted with the account                                                  |
| `avoid`                      | `jsonb`       | Array of `{ "allergen": "peanuts", "severity": "allergy" \| "intolerance" \| "preference" }` |
| `preferences`                | `text[]`      | Dietary tags, e.g. `vegan`, `halal`                                                          |
| `other_preference`           | `text`        | Free text, at most 200 characters                                                            |
| `acknowledged_safety_notice` | `boolean`     | The student saw the "confirm with dining staff" notice                                       |
| `created_at`, `updated_at`   | `timestamptz` | `updated_at` is set automatically on every change                                            |

### `favorites`

| Column       | Type          | Notes                                          |
| ------------ | ------------- | ---------------------------------------------- |
| `user_id`    | `uuid`        | → `auth.users.id`; deleted with the account    |
| `kind`       | `text`        | `item` (menu item) or `hall` (dining location) |
| `target_id`  | `text`        | The item or hall id                            |
| `created_at` | `timestamptz` |                                                |

Primary key: `(user_id, kind, target_id)`, so saving the same thing twice is a no-op.

### `reports`

Incorrect-information reports for the SafeBite team to review (in the dashboard's Table Editor for now).

| Column          | Type          | Notes                                                                                                  |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `id`            | `uuid` (PK)   |                                                                                                        |
| `user_id`       | `uuid`        | The student who sent it; null for guests, and set to null if the account is deleted (the report stays) |
| `item_id`       | `text`        | The menu item reported                                                                                 |
| `reason`        | `text`        | `incorrect-allergen`, `incorrect-ingredient`, `item-unavailable`, `wrong-nutrition` or `other`         |
| `notes`         | `text`        | At most 1000 characters                                                                                |
| `allow_contact` | `boolean`     | The team may email the student (look up the email from `user_id`)                                      |
| `created_at`    | `timestamptz` |                                                                                                        |

### Not in the database yet

Dining halls, menus, menu items and safety alerts. The scraper will own those tables. Until then, `item_id`, `target_id` and hall ids are plain text matching the ids in `web/src/api/mock/fixtures.ts`; add foreign keys once the dining tables exist.

## Who can access what

Every table has row level security (RLS) on. In short:

| Table              | Signed-in student                    | Guest (not signed in)          |
| ------------------ | ------------------------------------ | ------------------------------ |
| `dietary_profiles` | Read, create, update, delete own row | Nothing                        |
| `favorites`        | Read, add, remove own rows           | Nothing                        |
| `reports`          | Send as themselves; read own reports | Send anonymously; read nothing |

The exact policies, why they're written that way, and how to test them are in [rls.md](rls.md).

## Changing the schema

1. From the repo root: `npx supabase migration new <short_name>`. This creates `supabase/migrations/<timestamp>_<short_name>.sql`.
2. Write the SQL. **Every new table needs RLS and policies**; start from the template in [rls.md](rls.md#adding-a-table).
3. Update the zod schemas in `web/src/api/schemas.ts` and the row mapping in `web/src/api/supabase/rows.ts` to match.
4. Apply it: `npx supabase db push` (after `npx supabase link`, see [supabase-setup.md](supabase-setup.md)), or paste it into the dashboard's SQL Editor.
5. Add the new table to [`supabase/tests/rls_check.sql`](../supabase/tests/rls_check.sql) and run it.
6. Commit the migration file. Never edit a migration that has already been applied; add a new one instead.
