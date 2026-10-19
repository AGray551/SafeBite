# Supabase setup

How to connect SafeBite to Supabase, on your own machine and later on a hosted site. The code and database schema are already in the repo.

## Status of the team project

The team's project is **SafeBite** (ref `taljrvrqbfkqzbibaqba`, URL `https://taljrvrqbfkqzbibaqba.supabase.co`).

| Step                      | Status                                                           |
| ------------------------- | ---------------------------------------------------------------- |
| 1. Create the tables      | Done on 2026-10-19 (migration `20261019215226_student_accounts`) |
| 2. Configure sign-in      | **To do** in the dashboard                                       |
| 3. Connect your local app | Each teammate, on their own machine                              |
| Hosting the app           | Later; see [the last section](#hosting-the-app-later)            |

For a brand-new Supabase project (for example a separate one for the final demo), do every step.

## 1. Create the tables

The schema lives in [`supabase/migrations/`](../supabase/migrations/). Apply it with either option.

**Option A: Supabase CLI.** From the repo root:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # the id in your dashboard URL: supabase.com/dashboard/project/<project-ref>
npx supabase db push                            # runs every file in supabase/migrations that hasn't run yet
```

**Option B: SQL Editor.** In the dashboard, open **SQL Editor**, paste the contents of each file in `supabase/migrations/` (oldest first), and click **Run**.

Then check it: **Table Editor** should list `dietary_profiles`, `favorites` and `reports` with RLS enabled, **Advisors → Security Advisor** should show no findings, and [`supabase/tests/rls_check.sql`](../supabase/tests/rls_check.sql) should report **RLS CHECK PASSED** when run in the SQL Editor (see [rls.md](rls.md#checking-it)).

## 2. Configure sign-in

In **Authentication → URL Configuration**:

| Setting       | Value                                 |
| ------------- | ------------------------------------- |
| Site URL      | `http://localhost:5173`               |
| Redirect URLs | `http://localhost:5173/auth/callback` |

These tell Supabase where the link in the confirmation email may send students. Add the hosted address once there is one ([below](#hosting-the-app-later)).

In **Authentication → Sign In / Providers → Email**:

- Keep **Confirm email** on. New students get an email with a link that opens `/auth/callback` and signs them in.
- Set **Minimum password length** to **8** to match the sign-up form.

Supabase's built-in email sender only sends a few emails per hour and is meant for testing. Before a demo with many sign-ups, either add your own SMTP server (**Authentication → Emails → SMTP Settings**) or turn **Confirm email** off.

## 3. Connect your local app

Copy `web/.env.example` to `web/.env.local` and fill in the two Supabase values from **Project Settings → API Keys**:

```bash
VITE_SUPABASE_URL=https://taljrvrqbfkqzbibaqba.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # the "publishable" key, not the secret one
```

Restart `npm run dev`. `.env.local` is gitignored, so each teammate does this once on their own machine.

The publishable key is designed to be public: it ships to every browser. Never use the **secret** key (or the legacy `service_role` key) in the web app or commit it, because it bypasses row level security.

## 4. Try it

1. Choose **Get Started** and create an account with your email.
2. Open the confirmation email **in the same browser** and click the link. You land on dietary profile setup.
3. Save a profile, then check **Table Editor → dietary_profiles** in the dashboard: there's a row with your user id.
4. Sign out and sign back in. Your profile and favorites load from Supabase.

## Troubleshooting

| Problem                                          | Fix                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| The app still behaves like the mock              | Check both variables are in `web/.env.local`, `VITE_USE_MOCK_API` isn't `true`, and you restarted `npm run dev`.               |
| "That email and password don't match"            | Wrong password, or the account doesn't exist yet in this Supabase project.                                                     |
| "Confirm your email first"                       | Open the link in the confirmation email. Signing up again with the same email resends it.                                      |
| Confirmation link says "We couldn't sign you in" | The link was opened in a different browser, or it expired. The email is still confirmed: sign in with your email and password. |
| Link goes to the wrong site or `localhost:3000`  | Fix **Site URL** and **Redirect URLs** (step 2).                                                                               |
| No confirmation email arrives                    | Check spam. The built-in sender is rate-limited; use custom SMTP or turn off **Confirm email** for testing.                    |
| Saving the profile fails with a permission error | The migrations didn't run, or ran only partly. Re-run step 1.                                                                  |

## Hosting the app (later)

The app is a static site, so it can go on any static host. A test build currently runs on Vercel at `https://safe-bite-ochre.vercel.app`, but the team may move. Wherever it ends up:

1. **Set the two variables** in the host's environment settings (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), then **rebuild**. Vite bakes them into the build, so an existing deployment won't pick them up.
2. **Add the address to Supabase.** In **Authentication → URL Configuration**, set **Site URL** to the hosted address and add `https://<hosted address>/auth/callback` to **Redirect URLs**. Keep the localhost entry so local development still works.
3. **Serve `index.html` for every path.** The confirmation link opens `/auth/callback` directly, and the host must return the app there, not a 404. [`web/vercel.json`](../web/vercel.json) does this on Vercel (with `web` as the project's root directory). Other hosts have their own setting, such as a `_redirects` file on Netlify or a "single-page app" option.

## Running Supabase on your own machine (optional)

If you have Docker, `npx supabase start` from the repo root runs the whole Supabase stack locally with the same schema ([`supabase/config.toml`](../supabase/config.toml) holds its settings). Put the URL and publishable key it prints into `web/.env.local`. Confirmation emails go to the local Mailpit inbox whose address it also prints. `npx supabase stop` shuts it down.
