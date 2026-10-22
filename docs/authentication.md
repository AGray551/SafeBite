# Authentication

SafeBite uses Supabase email OTP authentication. Students enter their university email, receive a six-digit code, and verify it in the app—there are no SafeBite passwords to create, reset, or store.

## Ways to use SafeBite

| Mode | How | Where dietary profile and favorites live |
| --- | --- | --- |
| Account | Email code through Supabase Auth | The backend/Supabase database, tied to the student's user ID |
| Guest | “Continue without an account” | This browser only |

When Supabase is not configured and the mock API is active, enter any valid email and `123456` to exercise the UI. A real REST API without Supabase configuration intentionally rejects code sign-in.

## Email-code flow

1. `/sign-in` validates an email address and calls `supabase.auth.signInWithOtp` with `shouldCreateUser: true`.
2. Supabase sends an email using the Magic Link template configured with `{{ .Token }}`. This makes the message contain a code, not a clickable link.
3. `/verify-email` accepts the six-digit code, supports resend after 60 seconds, and calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
4. `AuthProvider` receives the session, caches the user's app-shaped session, and stores the access token for the REST client to forward as `Authorization: Bearer <token>`.
5. `/auth/callback` remains as a safe magic-link fallback. It resolves an incoming session, then takes a student with no saved profile to onboarding; `/auth/error` handles an expired or invalid link.

Do not use the user-editable `user_metadata` for authorization. The display name is only a UI fallback; database access is always based on `auth.uid()` / the verified JWT subject.

## Session behavior

The Supabase client restores and refreshes its browser session. `AuthProvider` subscribes to every auth-state change, clears user-specific caches on sign-out, and invalidates profile, favorites, and alerts when the signed-in student changes.

## Where the code is

| File | Responsibility |
| --- | --- |
| `web/src/lib/supabase.ts` | Creates the browser client, maps sessions, and makes the access token available to the REST client. |
| `web/src/features/auth/AuthProvider.tsx` | Session lifecycle, guest state, sending/verifying email codes. |
| `web/src/features/auth/SignInPage.tsx` | Request a code. |
| `web/src/features/auth/VerifyEmailPage.tsx` | Verify a code and resend it. |
| `web/src/features/auth/AuthCallbackPage.tsx` | Optional magic-link callback and post-auth routing. |
| `web/src/features/auth/AuthErrorPage.tsx` | Expired/invalid link recovery. |

## Backend responsibility

The browser never gets a secret/service-role key. Each authenticated API request includes the Supabase access token. The backend must verify that JWT against the project's current signing keys/JWKS and use its `sub` claim as the user ID; it must not accept a user ID supplied in a JSON body.

## Not built yet

- Migration of guest-local data into a newly signed-in account.
- Admin/staff roles.
- A university-domain allowlist. If required, enforce it server-side or with Supabase Auth hooks; client-side email validation is not access control.
