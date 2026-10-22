# How SafeBite works

An overview of the whole system: what runs where, how data flows, and where to find each piece in the code.

## The pieces

```
 Student's browser                                 Supabase (hosted)
┌──────────────────────────────────────┐          ┌──────────────────────────────┐
│ SafeBite web app (React + Vite)      │  HTTPS   │ Auth: accounts, sessions     │
│                                      │─────────▶│ Postgres: dietary_profiles,  │
│  screens → React Query hooks → api   │          │   favorites, reports (RLS)   │
│                                │     │          └──────────────────────────────┘
│                                ▼     │
│      sample menus (mock) ◀── or ──▶ REST API (planned, VITE_API_BASE_URL)
└──────────────────────────────────────┘          ▲
                                                   │ writes menus (planned)
                                          UC Dining scraper (planned)
```

| Piece                  | Status   | What it does                                                                                   |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Web app (`web/`)       | Built    | Every screen students use. Runs entirely in the browser.                                       |
| Supabase (`supabase/`) | Built    | Student accounts (email code), profiles, favorites, reports, immutable dining snapshots and alerts. |
| Sample data            | Built    | Generated UC Dining fixture in `web/src/api/mock/realFixtures.ts`; regenerate it with `node scripts/generate-mock-fixtures.mjs` after replacing the checked-in export. |
| Menu importer/collector | Ready for implementation | Loads the supplied seed export now; later collects UC Dining menus on a schedule. |
| REST API               | Optional | The contract in [web/README.md](../web/README.md). Not needed if menus also go into Supabase.  |

## The web app

### Startup

`web/src/main.tsx` renders `App`, which wraps the router in three providers:

1. **React Query** (`QueryClientProvider`): caches everything fetched from the API and handles loading, error and refetching.
2. **`PreferencesProvider`**: per-device display settings (theme, larger text, reduced motion, high contrast) and notification toggles, saved in localStorage.
3. **`AuthProvider`**: who's signed in, or whether the student chose guest mode. See [authentication.md](authentication.md).

### Screens

Routes are in `web/src/app/router.tsx`, and each screen is lazy-loaded into its own file.

| Route                                              | Screen                                                             | Needs sign-in or guest mode |
| -------------------------------------------------- | ------------------------------------------------------------------ | --------------------------- |
| `/welcome`                                         | Welcome story and sign-up choices                                  | No                          |
| `/sign-in`                                         | Request a one-time email code                                      | No                          |
| `/verify-email`                                    | Enter the six-digit email code                                     | No                          |
| `/auth/callback`, `/auth/error`                    | Magic-link fallback and expired-link recovery                      | No                          |
| `/onboarding/allergies`, `severity`, `preferences` | Dietary profile setup                                              | Yes                         |
| `/`                                                | Home                                                               | Yes                         |
| `/dining`, `/dining/map`, `/dining/:hallId`        | Dining locations (list and map) and a hall's menu                  | Yes                         |
| `/items/:itemId`, `/items/:itemId/report`          | Menu item detail and "report incorrect information"                | Yes                         |
| `/search`, `/favorites`, `/alerts`, `/profile`     | Search, saved items and halls, safety alerts, profile and settings | Yes                         |

`RequireEntry` sends first-time visitors to `/welcome`. Signed-in students and guests pass straight through.

### Getting data: one interface, three implementations

Screens never call `fetch` or Supabase directly. They use hooks from `web/src/api/queries.ts` (`useMenu`, `useProfile`, `useToggleFavorite`, …), which call the `api` object. `api` follows the `SafeBiteApi` interface in `web/src/api/client.ts`, and `web/src/api/index.ts` decides which implementation stands behind it:

| Environment variables set                             | Accounts (sign-in, profile, favorites, reports) | Menus, halls, items, alerts |
| ----------------------------------------------------- | ----------------------------------------------- | --------------------------- |
| None                                                  | Mock (this browser only)                        | Mock sample data            |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase                                        | Mock sample data            |
| `VITE_API_BASE_URL` too                               | Supabase                                        | REST API                    |
| `VITE_USE_MOCK_API=true`                              | Mock, whatever else is set                      | Mock                        |

Every response is validated with the zod schemas in `web/src/api/schemas.ts`, which are also the app's TypeScript types. If the database or an API sends something unexpected, it fails clearly at that boundary instead of breaking a screen.

Example: a signed-in student saves a favorite.

1. The heart button calls `useToggleFavorite('item')`.
2. The hook updates the cached favorites right away (the heart fills instantly), then calls `api.favorites.setItem(id, true)`.
3. The Supabase implementation inserts a row into `favorites` for the student's user id. Row level security confirms the row belongs to them.
4. The hook refetches favorites and alerts. If the save failed, the heart goes back to how it was.

## Dietary safety

The core rule lives in one tested function, `assess()` in `web/src/features/safety/assess.ts`. It runs in the browser, so results update the moment a student edits their profile.

| Student marked an allergen as | Item contains it                 | Item may contain it |
| ----------------------------- | -------------------------------- | ------------------- |
| Allergy                       | **Avoid**                        | Caution             |
| Intolerance                   | Caution                          | Caution             |
| Preference                    | Not flagged (used for filtering) | Not flagged         |

- An item with no allergen data, or a student with no profile, gets **Not checked**. The app never calls something safe without checking it.
- Status is always shown with an icon, a word and a border style, not color alone.
- **Safe for Me** hides items marked Avoid or that don't match the student's dietary preferences, and always says how many were hidden.
- Menus and items show when they were last updated. Data older than 24 hours (`STALE_AFTER_HOURS` in `web/src/lib/time.ts`) gets an out-of-date warning.

### Safety alerts

When a scrape adds an allergen to an item, students who avoid that allergen or saved that item get an alert. Until the scraper exists, the mock produces these alerts from items flagged in the sample data (`computeAlerts` in `web/src/api/mock/mockClient.ts`), checked against the signed-in student's real profile and favorites.

## Accounts and data

| Data                                   | Signed-in student        | Guest               |
| -------------------------------------- | ------------------------ | ------------------- |
| Account                                | Supabase Auth            | None                |
| Dietary profile, favorites             | Supabase                 | This browser only   |
| Reports                                | Supabase, linked to them | Supabase, anonymous |
| Display settings, notification toggles | This browser             | This browser        |
| Which alerts were read                 | This browser             | This browser        |

Details: [authentication.md](authentication.md) for sign-in, [database.md](database.md) for tables, [rls.md](rls.md) for who can access what, and [security.md](security.md) for the overall picture.

## Tests and CI

- `npm test` runs Vitest. The safety rules, the mock API, the Supabase row conversions, the main UI components and the color contrast of every theme have tests.
- CI (`.github/workflows/web.yml`) runs lint, format check, typecheck, tests and a production build on every pull request that touches `web/`.
- Database access rules are checked with [`supabase/tests/rls_check.sql`](../supabase/tests/rls_check.sql), run in the Supabase SQL Editor; see [rls.md](rls.md#checking-it).
