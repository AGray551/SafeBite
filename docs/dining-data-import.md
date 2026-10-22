# UC Dining data backend handoff

This is the implementation contract for loading the supplied UC Dining seed export and replacing it with a scheduled collector later. It complements the browser response contract in [`web/README.md`](../web/README.md); it does not ask the web app to understand the collector's raw JSON.

## What to import

Use the combined export at `data/uc-dining/uc-dining-expanded-export.json`. The supplied 2026-10-19 export has SHA-256 `5b2ffba686378ef748bda2f4a51e6c68f0d22d9efc890e57cb8d99bd9a77b51c`, 21 locations, 56 snapshots, 22 populated snapshots, and 3,022 menu entries. Only Center Court, MarketPointe, and On The Green have observed entries; the other catalog locations must remain visible, but their menu state must not be fabricated.

The schema is created by `supabase/migrations/20261021234529_dining_data_pipeline.sql`. Apply it with the existing migrations before an import. The importer uses a server-only credential; browsers receive no database write policy and never receive a service-role key.

## Import sequence

1. Validate the root fields (`schema_version`, locations, menus) and verify that every menu's `location_id` exists.
2. Upsert `dining_locations` by export `locations[].id`. Preserve category, address, hours, source URL, discovery status and timestamps; map coordinates from `latitude` / `longitude`.
3. Insert `menu_snapshots` by the supplied menu `id`. Treat each as immutable. Set `source_item_count` from the export, `import_hash` to the SHA-256 of the canonical source menu object, and do not replace a row with changed upstream content.
4. Insert every flattened source item into `menu_items` with its supplied item `id` and zero-based array position. Set `content_hash` to a canonical SHA-256 of the normalized item object.
5. Compare the new snapshot with the prior successful snapshot for the same location and service date. Write `menu_item_changes` only for a repeatable match and an actual content change. For absent `usable_item_id`s, matching is heuristic; never claim a change is an official recipe revision.
6. For each confirmed positive (`contains === true`) added allergen, find affected users and create a deduplicated `safety_alerts` row. A missing/empty allergen array cannot create an “added allergen” alert.
7. Run the acceptance checks below before publishing the import.

## Field mapping

| Export | Database | Notes |
| --- | --- | --- |
| `locations[].id` | `dining_locations.id` | Local catalog key, not a Sodexo ID. |
| `locations[].coordinates.latitude/longitude` | `latitude` / `longitude` | Do not swap them. |
| `menus[].id` | `menu_snapshots.id` | Snapshot ID, immutable. |
| `menus[].date` | `service_date` | Parse as a date, not a timestamp. |
| `menus[].items[].id` | `menu_items.id` | Snapshot-entry ID only. |
| `meal_period`, `station` | `source_meal_period`, `station` | Preserve the raw meal label; map to the app's breakfast/lunch/dinner vocabulary in the API layer. |
| `allergens` + status | `allergens` + `allergen_data_status` | Keep `null` versus `[]` exactly. |
| `diets`, `nutrition` | `diets`, `nutrition` | Keep source fields and null quantities intact. |

## API adapter responsibility

The current React app consumes the Zod contracts in [`web/src/api/schemas.ts`](../web/src/api/schemas.ts), not these storage rows. The backend adapter must:

- map a location and its current hours into `DiningHall`;
- select the latest snapshot for the requested location/date, then map raw meal labels explicitly to `breakfast`, `lunch`, or `dinner`;
- map positive allergen declarations to `allergens.contains`; do not place a missing source array in `contains: []`—return `allergens: null` instead;
- copy the snapshot `retrieved_at` to `Menu.updatedAt` and `MenuItem.updatedAt`;
- return an empty menu with its real freshness timestamp when a snapshot was empty;
- implement `/items` lookups against a known snapshot entry, not a guessed durable recipe;
- keep any service-role SQL, collector secrets, and import routes server-side.

## Acceptance checks

The initial import must report exactly the seed's own totals: 21 locations, 56 snapshots, 22 populated snapshots, and 3,022 items. Additionally:

- every item references an existing snapshot and every snapshot references an existing location;
- `source_item_count` equals the number of stored items for each snapshot;
- the only initial populated locations are Center Court, MarketPointe, and On The Green;
- rows with `allergen_data_status = 'missing'` keep `allergens IS NULL`;
- rows with `allergen_data_status = 'reported_empty_not_safety_verified'` keep an empty JSON array;
- anonymous and authenticated users can only read dining data; neither can insert, update, or delete it;
- each student can read and mark read only their own safety alerts.

## Live collector replacement

Keep the import interface stable: validate/normalize upstream responses into the same combined-export shape, write a new immutable snapshot, compare it, then publish alerts. Schedule a conservative polling interval and retain the source URL and retrieval time on each snapshot. A failure to collect is an operational failure, not an empty menu; leave the prior snapshot available and surface its age in the API.
