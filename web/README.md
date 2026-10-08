# SafeBite web app

The student-facing SafeBite frontend: a responsive React app for finding UC dining locations, browsing menus and checking every item against your allergies and dietary preferences.

It runs **without a backend** today: an in-browser mock API serves sample data. As soon as the real API exists, set one environment variable and the same screens talk to it instead.

## Getting started

Requires Node 20.9+ (Node 22 LTS recommended, see `.nvmrc`).

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. To try the full flow, choose **Get Started**, create an account (any email works against the mock API), and set up a dietary profile.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Typecheck and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (including accessibility rules) |
| `npm run format` / `format:check` | Prettier (with Tailwind class sorting) |
| `npm run typecheck` | TypeScript only |
| `npm test` / `test:run` | Vitest in watch mode / once |

CI (`.github/workflows/web.yml`) runs lint, format check, typecheck, tests and build on every PR that touches `web/`.

## Tech stack and why

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool | **Vite** | Fast dev server, simple config, static output that can be hosted anywhere. We don't need server rendering since the backend will be a separate API. |
| UI | **React 19 + TypeScript (strict)** | The team knows React; strict types catch data-shape bugs early. |
| Routing | **React Router 7** | Standard for SPAs; every page is lazy-loaded into its own chunk. |
| Server data | **TanStack Query** | Caching, loading/error states and refetching for API data; optimistic updates for favorites. |
| Validation / API contract | **zod** | Domain types are inferred from schemas, and API responses are validated against them. |
| Styling | **Tailwind CSS v4** | Design tokens from the wireframes live in one CSS file as variables. |
| Icons | **lucide-react** | Consistent, tree-shakeable icon set. |
| Tests | **Vitest + Testing Library** | Same config as Vite, fast, and tests behaviour the way users see it. |

## Project structure

```
src/
  api/            Everything that talks to the backend
    schemas.ts      zod schemas = domain types = API contract
    client.ts       SafeBiteApi interface every screen depends on
    http/           Real REST client (used when VITE_API_BASE_URL is set)
    mock/           In-browser mock client + sample data
    queries.ts      React Query hooks (one per endpoint)
  app/            App root, providers and route table
  components/
    layout/         App shell, nav, page header
    ui/             Reusable building blocks (Button, Chip, Switch, ...)
  features/       One folder per area of the app
    auth/ onboarding/ home/ dining/ menu/ search/
    favorites/ alerts/ profile/ settings/ safety/ errors/
  lib/            Small framework-free helpers (time, labels, cn)
  styles/         Tailwind entry + design tokens, fonts
```

Conventions:

- Import with the `@/` alias (`@/features/safety/assess`) instead of long relative paths.
- Screens never call `fetch` directly; they use hooks from `api/queries.ts`.
- Keep business rules in plain functions with tests (see `features/safety/assess.ts`).

## Connecting the backend

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` (e.g. `http://localhost:8000/api`).
3. Restart `npm run dev`.

`src/api/index.ts` switches from the mock to `http/httpClient.ts` automatically. Set `VITE_USE_MOCK_API=true` to force the mock again.

### Proposed REST endpoints

All responses are JSON and must match the schemas in `src/api/schemas.ts`. Authenticated requests send `Authorization: Bearer <token>`.

| Method | Path | Returns |
| --- | --- | --- |
| POST | `/auth/sign-in` | `Session` (body: `email`, `password`) |
| POST | `/auth/sign-up` | `Session` (body: `name`, `email`, `password`) |
| POST | `/auth/sign-out` | 204 |
| GET | `/halls` | `DiningHall[]` |
| GET | `/halls/:hallId` | `DiningHall` |
| GET | `/menus?date=YYYY-MM-DD&mealPeriod=lunch` | `Menu[]` (one per location) |
| GET | `/halls/:hallId/menu?date=&mealPeriod=` | `Menu` |
| GET | `/items/:itemId` | `MenuItem` |
| GET | `/items?ids=a,b,c` | `MenuItem[]` |
| GET | `/items/search?q=&date=&mealPeriod=&hallId=` | `MenuItem[]` |
| GET / PUT / DELETE | `/me/profile` | `DietaryProfile \| null` / `DietaryProfile` / 204 |
| GET | `/me/favorites` | `Favorites` |
| PUT / DELETE | `/me/favorites/items/:itemId` | `Favorites` |
| PUT / DELETE | `/me/favorites/halls/:hallId` | `Favorites` |
| GET | `/me/alerts` | `SafetyAlert[]` |
| POST | `/me/alerts/:alertId/read` | `SafetyAlert` |
| POST | `/reports` | `Report` (body: `NewReport`) |

Notes for the backend/scraper:

- `MenuItem.allergens` must be `null` when the scraper couldn't find allergen data. The UI then shows **Not checked**, never **Safe**.
- `Menu.updatedAt` and `MenuItem.updatedAt` drive the "last updated" text; data older than 24 hours (`STALE_AFTER_HOURS` in `lib/time.ts`) shows an out-of-date warning.
- Set `MenuItem.ingredientsChangedAt` when a scrape changes an item's ingredients, and create a `SafetyAlert` for students who avoid the added allergen or saved the item. `mock/mockClient.ts → computeAlerts()` shows the intended rule.
- Safety status (Safe / Caution / Avoid) is computed on the client in `features/safety/assess.ts`, so it updates instantly when a student edits their profile. If the backend ever needs it too (e.g. for push notifications), port the same rules.

## Safety rules

| Profile setting | Item contains it | Item may contain it |
| --- | --- | --- |
| Allergy | **Avoid** | Caution |
| Intolerance | Caution | Caution |
| Preference | not flagged (hidden by Safe for Me) | not flagged |

Status is always shown with an icon, a word **and** a border style (solid, dashed, filled, dotted), never color alone. "Safe for Me" hides items marked Avoid or that don't meet the student's dietary preferences, and screens always say how many items were hidden.

## What's placeholder for now

- **Sample data:** dishes, hours and building names in `mock/fixtures.ts` are for demo only and need to be replaced by scraped data.
- **Map:** the map view is a placeholder grid; swap in MapLibre/Leaflet once locations have coordinates.
- **Photos:** food images are placeholders until the scraper collects them.
- **Password reset** isn't wired up (needs backend support).
- **Notification toggles** are saved per device; delivering notifications needs the backend.
- Out of scope for v1 (per the project README): the staff admin dashboard, crowd levels / wait times, and pre-ordering.
