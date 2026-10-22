# UC Dining seed export

Place the combined export here as `uc-dining-expanded-export.json` before running the first import.

The current seed came from the user-provided `uc-dining-expanded-export.zip` (exported 2026-10-19). It contains public UC Dining observations, not a live feed. The archive has duplicate per-day snapshots and reference scripts; the importer uses **only** the combined JSON file at the ZIP root.

The checked-in combined file has SHA-256 `5b2ffba686378ef748bda2f4a51e6c68f0d22d9efc890e57cb8d99bd9a77b51c` and should contain 21 locations, 56 snapshots, and 3,022 items.

The import must preserve the following distinctions:

- `allergens: null` means no source allergen array was available; never turn it into `[]`.
- `allergens: []` with `allergen_data_status: "reported_empty_not_safety_verified"` is not an allergen-free guarantee.
- A nutrition `null` is missing, not zero.
- `structured_menu_status` and an empty snapshot are data-quality states, not proof that a location is closed.
- Source `id` values identify a snapshot entry, not a durable recipe. Do not make them a permanent cross-day favorite identity.

See [the backend handoff](../../docs/dining-data-import.md) for the validated table mapping and import acceptance checks.

## Frontend mock fixture

For the browser-only frontend, regenerate `web/src/api/mock/realFixtures.ts` with:

```sh
node scripts/generate-mock-fixtures.mjs
```

The generated fixture is intentionally a presentation adapter, not an importer. In particular, it renders unverified empty allergen arrays as unavailable so the UI does not imply an item is allergen-free.
