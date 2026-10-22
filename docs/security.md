# Security

How SafeBite keeps students' dietary data private, what has been checked, and what's still open.

## The approach

- **The database enforces access, not the app.** The browser talks to Supabase with the publishable key, which is public by design. Row level security and trimmed table privileges limit every student to their own rows and let guests only send anonymous reports. Details: [rls.md](rls.md).
- **Email codes and sessions are Supabase Auth's job.** SafeBite never stores or sees passwords. Sessions are signed tokens that Supabase issues and refreshes. Details: [authentication.md](authentication.md).
- **The secret key stays out of the app.** The secret key (or legacy `service_role` key) bypasses RLS. It belongs only in trusted server-side code like the future scraper, never in the web app or in git.
- **Only what's needed is stored:** an email, a name, the dietary profile, favorites and reports.

## What has been verified

On **2026-10-19**, on the team's Supabase project (`SafeBite`, ref `taljrvrqbfkqzbibaqba`):

- **Security Advisor:** no findings.
- **Policies and privileges** match [rls.md](rls.md) (checked from `pg_policies` and the table grants).
- **[`supabase/tests/rls_check.sql`](../supabase/tests/rls_check.sql): RLS CHECK PASSED.** All 11 attempts were blocked, and the check saved nothing:

| Attempt                                    | Result  |
| ------------------------------------------ | ------- |
| Student writes another student's profile   | Blocked |
| Student adds a favorite for someone else   | Blocked |
| Student sends a report as someone else     | Blocked |
| Student edits or deletes reports           | Blocked |
| Guest reads profiles, favorites or reports | Blocked |
| Guest sends a report as a student          | Blocked |
| Guest writes a profile or adds a favorite  | Blocked |

Before that, the migration was tested more fully on a local Postgres 16 with real rows for two students. That covered the cases that should succeed (students reading and changing their own data, guests sending anonymous reports) and confirmed that deleting an account removes the student's profile and favorites.

Re-run `rls_check.sql` and the Security Advisor after every schema change.

## Dashboard settings to confirm

These are Auth settings, set in the Supabase dashboard rather than in the database (see [supabase-setup.md](supabase-setup.md), step 2):

- [ ] **Email OTP** is enabled and its expiry remains short; the email template uses `{{ .Token }}` rather than a password or confirmation link.
- [ ] **Site URL** and **Redirect URLs** list only SafeBite's own addresses, so optional magic links can't send students to another site.

## Known limits

- **Report spam.** Anyone, signed in or not, can send reports of up to 1000 characters. Supabase's API rate limits are the only brake. If spam becomes a problem, require sign-in to report or add a CAPTCHA.
- **Guest data** stays in the browser's localStorage, where anyone using that browser can read it.
- **Allergen data accuracy** isn't a security property, but it's the biggest safety risk. The app shows when data was last updated and tells students with severe allergies to confirm with dining staff.

## Reporting a problem

If you find a way to read or change another student's data, tell the team privately (not in a public issue) so it can be fixed first.
