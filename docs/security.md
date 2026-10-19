# Security

How SafeBite keeps students' dietary data private, what has been checked, and what's still open.

## The model

The web app runs in the browser and talks to Supabase directly with the **publishable** key. That key is public by design: anyone can find it in the app's JavaScript. So the app itself can't be trusted to enforce anything. The database does it:

- **Row level security (RLS)** is on for every SafeBite table. Each policy limits a signed-in student to rows with their own user id, which Postgres reads from the student's signed-in session (`auth.uid()`). A student can't ask for someone else's rows, even by editing requests by hand.
- **Table privileges** are trimmed to what the app uses, so even a missing policy can't open up more. For example, nobody can update or delete reports through the API, and guests can only insert reports.
- **The secret key** (or legacy `service_role` key) bypasses RLS. It belongs only in trusted server-side code like the future scraper, never in the web app or in git.

| Table              | Signed-in student                    | Guest                          |
| ------------------ | ------------------------------------ | ------------------------------ |
| `dietary_profiles` | Read, create, update, delete own row | Nothing                        |
| `favorites`        | Read, add, remove own rows           | Nothing                        |
| `reports`          | Send as themselves; read their own   | Send anonymously; read nothing |

## What has been verified

On **2026-10-19**, on the team's Supabase project (`SafeBite`, ref `taljrvrqbfkqzbibaqba`):

- **Security Advisor:** no findings.
- **Policies and privileges** match the table above (checked from `pg_policies` and the table grants).
- **Live access tests**, run as a signed-in student and as a guest inside a transaction that was rolled back, so no test data was kept:

| Attempt                                    | Result  |
| ------------------------------------------ | ------- |
| Student writes another student's profile   | Blocked |
| Student adds a favorite for someone else   | Blocked |
| Student sends a report as someone else     | Blocked |
| Student edits a report                     | Blocked |
| Guest reads profiles, favorites or reports | Blocked |
| Guest sends a report as a student          | Blocked |
| Guest writes a profile                     | Blocked |

The same migration was also tested more fully against Postgres 16 with real rows for two students, plus the positive cases (students reading and changing their own data, guests sending anonymous reports, a student's data being deleted with their account).

Re-check after any schema change: run **Advisors → Security Advisor** in the dashboard, and add the new table to these tests.

## Dashboard settings to confirm

These are Auth settings, not database ones, so they're set in the Supabase dashboard (see [supabase-setup.md](supabase-setup.md), step 2):

- [ ] **Confirm email** is on, so nobody can create accounts under someone else's address.
- [ ] **Minimum password length** is 8 (Supabase's default is 6).
- [ ] **Site URL** and **Redirect URLs** list only SafeBite's own addresses, so confirmation links can't be sent to another site.

## Known limits

- **Report spam.** Anyone, signed in or not, can insert reports, up to 1000 characters each. Supabase's API rate limits are the only brake. If spam becomes a problem, require sign-in to report or add a CAPTCHA.
- **Guest data** stays in the browser's localStorage, readable by anyone using that browser.
- **Allergen data accuracy** isn't a security property, but it is the biggest safety risk. The app shows when data was last updated and tells students with severe allergies to confirm with dining staff.

## Reporting a problem

If you find a way to read or change another student's data, tell the team privately (not in a public issue) so it can be fixed first.
