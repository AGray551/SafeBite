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

## Who can access what (row level security)

The web app connects with the publishable key, so these policies are the only thing keeping data private. Every table has RLS enabled.

| Table              | Signed-in student                    | Guest (not signed in)          |
| ------------------ | ------------------------------------ | ------------------------------ |
| `dietary_profiles` | Read, create, update, delete own row | Nothing                        |
| `favorites`        | Read, add, remove own rows           | Nothing                        |
| `reports`          | Send as themselves; read own reports | Send anonymously; read nothing |

Nobody can edit or delete a report from the app. The SafeBite team works with reports through the dashboard, which bypasses RLS.

These rules were tested against Postgres 16 with stand-ins for Supabase's roles and `auth` schema, and again on the live project (see [security.md](security.md)): one student can't read or change another student's rows, a guest can't read anything or send a report under someone else's name, invalid values are rejected, and deleting an account removes the profile and favorites but keeps that student's reports, detached from the account.

## Changing the schema

1. From the repo root: `npx supabase migration new <short_name>`. This creates `supabase/migrations/<timestamp>_<short_name>.sql`.
2. Write the SQL. **Every new table needs `enable row level security` and policies**, or the app either can't read it or anyone can.
3. Update the zod schemas in `web/src/api/schemas.ts` and the row mapping in `web/src/api/supabase/rows.ts` to match.
4. Apply it: `npx supabase db push`, or paste it into the dashboard's SQL editor.
5. Commit the migration file. Never edit a migration that has already been applied; add a new one instead.
