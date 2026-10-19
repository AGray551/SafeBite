# Local setup

How to run SafeBite on your own computer, connected to the team's Supabase project. Takes about 10 minutes.

You need: Node 22 (see `web/.nvmrc`), git, and an invite to the Supabase project from Conner.

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

1. Copy the example settings file:

   ```bash
   cp .env.example .env.local
   ```

2. In the dashboard, open **Project Settings → API Keys** and fill in `web/.env.local`:

   ```bash
   VITE_SUPABASE_URL=https://taljrvrqbfkqzbibaqba.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # the "publishable" key
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173.

**Only ever use the publishable key.** The dashboard also shows a **secret** key (and a legacy `service_role` key). Those bypass all of the database's access rules, so never put them in the web app, in `.env.local`, in chat messages or in git.

`.env.local` is ignored by git, so your settings stay on your machine.

## 4. Check it works

1. Choose **Get Started** and create an account with your real email.
2. Open the confirmation email **in the same browser** and click the link. You land on dietary profile setup.
3. Save a profile. In the dashboard's **Table Editor → dietary_profiles**, there's now a row with your user id.

If something's off, see [Troubleshooting](supabase-setup.md#troubleshooting).

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
