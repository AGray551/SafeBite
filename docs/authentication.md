# Authentication

How students sign in, and how the web app keeps track of who is signed in.

## Ways to use SafeBite

| Mode    | How                              | Where the dietary profile and favorites live        |
| ------- | -------------------------------- | --------------------------------------------------- |
| Account | Email + password (Supabase Auth) | Supabase, so they follow the student across devices |
| Guest   | "Continue without an account"    | This browser only (localStorage)                    |

Without Supabase configured (no `VITE_SUPABASE_URL`), accounts also come from the in-browser mock, which accepts any email and password. That keeps the app usable for UI work with no setup.

## Flows

### Create an account

1. The student enters name, email and password (at least 8 characters) on `/sign-in?mode=create`.
2. The app calls Supabase `signUp`, storing the name in the account's metadata.
3. With **Confirm email** on (the default), Supabase emails a confirmation link and the page shows **Check your email**.
4. The link opens `/auth/callback?code=…`. The Supabase client exchanges the code for a session (PKCE flow), and the page sends the student to dietary profile setup.

The PKCE code only works in the browser where the student signed up. If they open the link somewhere else, the email still gets confirmed; the page tells them to sign in with their password instead.

With **Confirm email** off, step 3 is skipped and the student goes straight to profile setup.

### Sign in

`signInWithPassword`. A student who already has a dietary profile goes back where they were headed (or Home); one without a profile goes to profile setup.

### Sign out

Signs out this browser only (`scope: 'local'`); other devices stay signed in. Cached profile, favorites and alerts are cleared.

## Sessions

The Supabase client stores the session in localStorage and refreshes the access token before it expires. The app follows every change through `api.auth.onSessionChange`:

- a confirmation link signing the student in,
- token refreshes,
- signing in or out in another tab.

When the signed-in user changes, `AuthProvider` refetches the profile, favorites and alerts so one student never sees another's data.

## Where the code is

| File                                         | What it does                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `web/src/api/client.ts`                      | The `auth` part of the `SafeBiteApi` contract every implementation follows    |
| `web/src/api/supabase/supabaseClient.ts`     | Supabase implementation: sign-in, sign-up, sessions, and per-student data     |
| `web/src/api/supabase/rows.ts`               | Converts Supabase sessions and rows into the app's types (validated with zod) |
| `web/src/api/index.ts`                       | Picks Supabase, the mock or the REST API from environment variables           |
| `web/src/features/auth/AuthProvider.tsx`     | Holds the session for the whole app, listens for session changes, guest mode  |
| `web/src/features/auth/SignInPage.tsx`       | Sign in / create account form and the "Check your email" state                |
| `web/src/features/auth/AuthCallbackPage.tsx` | `/auth/callback`: where the confirmation link lands                           |

## Security notes

- The browser only ever holds the **publishable** key. What a student can read or change is enforced by row level security in the database ([database.md](database.md)), not by the app.
- If the REST backend is built later, it receives the student's Supabase access token as `Authorization: Bearer <token>` and verifies it with the project's JWT keys instead of running its own sign-in.

## Not built yet

- **Password reset.** Supabase supports it (`resetPasswordForEmail`), but the app needs a "set a new password" screen. "Forgot password?" still says it's unavailable.
- **Admin / staff roles.** Out of scope for v1.
- **Moving guest data into a new account.** A guest who creates an account starts with an empty profile.
