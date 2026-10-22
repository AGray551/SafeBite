# Local setup

How to run SafeBite on your own computer, connected to the team's Supabase project. Takes about 10 minutes.

You need: [Node](https://nodejs.org) 20.9 or newer (22 recommended; check with `node -v`), git, and an invite to the Supabase project from Conner.

## 1. Join the Supabase project

1. Accept the invite email from Supabase **within 24 hours** (it expires after that). Sign in or create a Supabase account with the same email.
2. Open the **SafeBite** project in the [Supabase dashboard](https://supabase.com/dashboard).

You'll be an **Owner**, with full access to the project: its data (**Table Editor**), queries (**SQL Editor**), API keys and settings, plus billing and the ability to delete the project. Settings such as sign-in options affect everyone, so check with the team before changing them.

## 2. Run the app

```bash
git clone https://github.com/AGray551/SafeBite.git   # skip if you already have it
cd SafeBite/web
npm install
```

## 3. Connect it to Supabase

1. Create `web/.env.local` from the example file. Run this **inside `web/`**:

   ```bash
   cp .env.example .env.local      # Mac, Linux, Git Bash, PowerShell
   copy .env.example .env.local    # Windows Command Prompt
   ```

   Or just create a new file named `.env.local` in the `web` folder (VS Code is easiest) and paste in the lines from step 2. File browsers often hide names starting with a dot, so don't worry if you can't see `.env.example` there.

2. In the dashboard, open **Project Settings → API Keys** and fill in `web/.env.local`:

   ```bash
   VITE_SUPABASE_URL=https://taljrvrqbfkqzbibaqba.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # the "publishable" key
   ```

3. Start the app, still inside `web/`:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173. If the app was already running, stop it (Ctrl+C) and start it again so it picks up `.env.local`.

**Only ever use the publishable key.** The dashboard also shows a **secret** key (and a legacy `service_role` key). Those bypass all of the database's access rules, so never put them in the web app, in `.env.local`, in chat messages or in git.

`.env.local` is ignored by git, so your settings stay on your machine.

## 4. Check it works

1. Choose **Get Started** and enter your real email.
2. Enter the six-digit code from the email. You land on dietary profile setup.
3. Save a profile. In the dashboard's **Table Editor → dietary_profiles**, there's now a row with your user id.

For sign-in problems, see [Troubleshooting](supabase-setup.md#troubleshooting).

## If `npm run dev` doesn't work

| Message                                                  | Fix                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Missing script: "dev"` or `Could not read package.json` | You're not in the `web` folder. `cd` into `SafeBite/web` and try again.                                |
| `vite: command not found` or `'vite' is not recognized`  | Dependencies aren't installed. Run `npm install` in `web/`.                                            |
| `npm: command not found` or `'npm' is not recognized`    | Node isn't installed. Install Node 22 from [nodejs.org](https://nodejs.org), then open a new terminal. |
| Syntax errors, or `Unsupported engine`                   | Node is too old. Check `node -v`; you need 20.9 or newer.                                              |
| `Port 5173 is in use, trying another one...`             | Another copy is already running. Stop it (Ctrl+C in its terminal), or use the address this one prints. |
| App runs but uses sample data / fake accounts            | `.env.local` is missing, misnamed or not in `web/`, or the app wasn't restarted after you created it.  |

## Sign-in settings

Supabase's OTP flow works locally after you enable Email and configure its Magic Link email template to include `{{ .Token }}`. An optional magic-link fallback still needs an allowed redirect URL.

It's still worth pointing the Site URL at the app, because Supabase falls back to it whenever a link has no valid return address. In **Authentication → URL Configuration** (once, for everyone):

| Setting       | Value                                 |
| ------------- | ------------------------------------- |
| Site URL      | `http://localhost:5173`               |
| Redirect URLs | `http://localhost:5173/auth/callback` |

Once the app is hosted, its address **must** be added, because a different host name isn't allowed automatically; see [supabase-setup.md](supabase-setup.md#hosting-the-app-later). The project's other settings are in [supabase-setup.md](supabase-setup.md#2-configure-sign-in).

## Working with the shared project

Everyone on the team uses the same Supabase project, so:

- **Accounts and data you create are real and visible to the team** in the dashboard. Use your own email, and don't edit or delete other people's rows.
- **Clean up test accounts** under **Authentication → Users**. Deleting a user also deletes their dietary profile and favorites.
- **Confirmation emails are rate-limited** (Supabase's built-in sender only sends a few per hour for the whole project). If yours doesn't arrive, wait, or reuse an account you already confirmed.
- **Don't change tables by hand** in the Table Editor or SQL Editor. Schema changes go through a migration file in a pull request (see [database.md](database.md#changing-the-schema)), so everyone's database and the repo stay in sync. After it's merged, one person applies it to the shared project; agree who, so it isn't applied twice.

You can still run the app with no Supabase at all: leave the two Supabase lines in `.env.local` empty (or set `VITE_USE_MOCK_API=true`), and accounts use the built-in mock instead.

## Optional: your own private Supabase

To try database changes without touching the shared project, you can run Supabase on your own machine. This needs [Docker](https://www.docker.com/products/docker-desktop/).

From the repo root (not `web/`):

```bash
npx supabase start    # first run downloads several Docker images; it takes a few minutes
```

This starts a private Supabase with the same tables and access rules, built from `supabase/migrations/`. When it's done it prints its details (run `npx supabase status` to see them again):

1. Put its **API URL** (`http://127.0.0.1:54321`) and **publishable key** into `web/.env.local` instead of the shared project's, then restart `npm run dev`.
2. Sign up as usual. Locally, email confirmation is off (`supabase/config.toml`), so you're signed in straight away.
3. Its **Studio URL** opens a local dashboard, like the hosted one.

To test a new migration, add it with `npx supabase migration new <name>`, then run `npx supabase db reset` to rebuild the local database from all migrations.

`npx supabase stop` shuts it down. Switch `web/.env.local` back to the shared project's values when you're done.
