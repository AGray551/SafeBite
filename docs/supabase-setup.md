# Supabase setup

One-time steps to connect a Supabase project to SafeBite. The code and the database schema are already in the repo.

## Status of the team project

The team's project is **SafeBite** (ref `taljrvrqbfkqzbibaqba`, URL `https://taljrvrqbfkqzbibaqba.supabase.co`). The deployed app is **https://safe-bite-ochre.vercel.app** (Vercel).

| Step                   | Status                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| 1. Create the tables   | Done on 2026-10-19 (migration `20261019215226_student_accounts`) |
| 2. Configure sign-in   | **To do** in the dashboard                                       |
| 3. Connect the web app | Each teammate on their own machine, plus the Vercel project      |

Redo all of the steps only for a new Supabase project (for example a separate one for the final demo).

## 1. Create the tables

The schema lives in [`supabase/migrations/`](../supabase/migrations/). Apply it with either option.

**Option A: Supabase CLI.** From the repo root:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # the id in your dashboard URL: supabase.com/dashboard/project/<project-ref>
npx supabase db push                            # runs every file in supabase/migrations that hasn't run yet
```

**Option B: SQL editor.** In the dashboard, open **SQL Editor**, paste the contents of each file in `supabase/migrations/` (oldest first), and click **Run**.

To check it worked, open **Table Editor**. It should list `dietary_profiles`, `favorites` and `reports`, each marked as having RLS enabled. **Advisors → Security Advisor** should show no RLS warnings for them.

## 2. Configure sign-in

In **Authentication → URL Configuration**:

| Setting       | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Site URL      | Where the app is deployed: `https://safe-bite-ochre.vercel.app` for the team project         |
| Redirect URLs | `https://safe-bite-ochre.vercel.app/auth/callback` and `http://localhost:5173/auth/callback` |

In **Authentication → Sign In / Providers → Email**:

- Keep **Confirm email** on. New students get an email with a link that opens `/auth/callback` and signs them in.
- Set **Minimum password length** to **8** to match the sign-up form.

Supabase's built-in email sender only sends a few emails per hour and is meant for testing. Before a demo with many sign-ups, either add your own SMTP server (**Authentication → Emails → SMTP Settings**) or turn **Confirm email** off.

## 3. Connect the web app

In **Project Settings → API Keys**, copy the project URL and the **publishable** key into `web/.env.local` (copy `web/.env.example` if you don't have one):

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

For the team project, the URL is `https://taljrvrqbfkqzbibaqba.supabase.co`. Get the publishable key from the dashboard, or ask Conner.

Restart `npm run dev`. Each teammate does this on their own machine; `.env.local` is gitignored.

**Vercel (the deployed app).** Someone with access to the Vercel project adds the same two variables under **Settings → Environment Variables** (for Production and Preview), then redeploys. Vite bakes these into the build, so they only take effect after a new deployment. [`web/vercel.json`](../web/vercel.json) sends every path to the app, so links like `/auth/callback` from the confirmation email load instead of returning 404; it assumes the Vercel project's root directory is `web`.

The publishable key is designed to be public (it ships to every browser). Never use the **secret** key (or the legacy `service_role` key) in the web app or commit it: it bypasses row level security.

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
| "Confirm your email first"                       | Open the link in the confirmation email. Resend by signing up again with the same email.                                       |
| Confirmation link says "We couldn't sign you in" | The link was opened in a different browser, or it expired. The email is still confirmed: sign in with your email and password. |
| Link goes to the wrong site or `localhost:3000`  | Fix **Site URL** and **Redirect URLs** (step 2).                                                                               |
| No confirmation email arrives                    | Check spam. The built-in sender is rate-limited; use custom SMTP or turn off **Confirm email** for testing.                    |
| Saving the profile fails with a permission error | The migrations didn't run, or ran only partly. Re-run step 1.                                                                  |

## Running Supabase on your own machine (optional)

If you have Docker, `npx supabase start` from the repo root runs the whole Supabase stack locally with the same schema ([`supabase/config.toml`](../supabase/config.toml) holds its settings). Put the URL and publishable key it prints into `web/.env.local`. Confirmation emails go to the local Mailpit inbox whose address it also prints. `npx supabase stop` shuts it down.
