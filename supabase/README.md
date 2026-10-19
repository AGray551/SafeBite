# supabase/

Supabase CLI project for SafeBite.

| Path                  | What                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| `migrations/`         | Database schema, applied in filename order. Never edit one that's applied.      |
| `config.toml`         | Settings for the local Supabase stack (`npx supabase start`)                    |
| `tests/rls_check.sql` | Checks that row level security blocks what it should. Run it in the SQL Editor. |

Setup steps: [docs/supabase-setup.md](../docs/supabase-setup.md). Tables: [docs/database.md](../docs/database.md). Access rules: [docs/rls.md](../docs/rls.md).
