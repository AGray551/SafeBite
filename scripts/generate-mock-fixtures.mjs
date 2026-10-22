/**
 * Converts the checked-in UC Dining export into the compact API-shaped
 * fixture used by the browser-only demo. Run after replacing the export:
 *
 *   node scripts/generate-mock-fixtures.mjs
 *
 * The production importer is documented separately; this keeps the UI
 * useful without making a browser request to a private backend.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourcePath = new URL('../data/uc-dining/uc-dining-expanded-export.json', import.meta.url);
const outputPath = new URL('../web/src/api/mock/realFixtures.ts', import.meta.url);

const source = JSON.parse(await readFile(sourcePath, 'utf8'));

const ALLERGEN_IDS = {
  EGG: 'eggs',
  EGGS: 'eggs',
  FISH: 'fish',
  MILK: 'milk',
  PEANUT: 'peanuts',
  PEANUTS: 'peanuts',
  SESAME: 'sesame',
  SHELLFISH: 'shellfish',
  SO: 'soy',
  SOY: 'soy',
  TREE_NUT: 'tree-nuts',
  TREE_NUTS: 'tree-nuts',
  WHEAT: 'wheat',
};

function normalizeMealPeriod(value) {
  switch (value?.toLowerCase()) {
    case 'breakfast':
      return 'breakfast';
    case 'brunch':
    case 'lunch':
      return 'lunch';
    default:
      return 'dinner';
  }
}

function categoryFor(location) {
  const raw = location.categories ?? [];
  const lower = raw.join(' ').toLowerCase();
  if (lower.includes('resident') || lower.includes('dining hall')) return 'dining-hall';
  if (lower.includes('coffee') || lower.includes('cafe')) return 'coffee';
  if (lower.includes('market') || lower.includes('convenience')) return 'convenience';
  if (lower.includes('meal exchange')) return 'meal-exchange';
  return 'retail';
}

function addressFor(address) {
  if (!address) return undefined;
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(', ');
  return [address.street, cityLine].filter(Boolean).join(', ') || undefined;
}

function parseTime(value) {
  const readable =
    typeof value === 'string'
      ? value
      : value?.hour && value?.minute && value?.period
        ? `${value.hour}:${value.minute} ${value.period}`
        : null;
  if (!readable) return null;
  const match = readable.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2];
  if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function hoursFor(location) {
  const groups = location.opening_hours?.standardHours ?? [];
  const weekday = groups.find((group) => group.days?.includes('Wednesday')) ?? groups[0];
  const hours = weekday?.hours ?? [];
  const times = hours
    .flatMap((entry) => [parseTime(entry.open ?? entry.startTime), parseTime(entry.close ?? entry.finishTime)])
    .filter(Boolean);
  return times.length >= 2 ? { opensAt: times[0], closesAt: times[times.length - 1] } : null;
}

function allergenId(allergen) {
  const code = allergen.code?.trim().toUpperCase().replace(/[ -]/g, '_');
  return ALLERGEN_IDS[code] ?? allergen.name?.trim().toLowerCase().replace(/\s+/g, '-') ?? null;
}

function numberValue(field) {
  return typeof field?.value === 'number' ? field.value : undefined;
}

const populatedLocations = new Set(source.menus.filter((menu) => menu.items.length > 0).map((menu) => menu.location_id));
const halls = source.locations.map((location) => ({
  id: location.id,
  name: location.name,
  categories: [{ category: categoryFor(location), label: location.categories?.[0] ?? 'Campus Dining' }],
  campus: `${location.name} ${location.address?.name ?? ''}`.toLowerCase().includes('blue ash') ? 'blue-ash' : 'uptown',
  location: location.address?.name ?? location.address?.street ?? 'University of Cincinnati',
  ...(addressFor(location.address) && { address: addressFor(location.address) }),
  todayHours: hoursFor(location),
  mealPeriods: [
    ...new Set(
      source.menus
        .filter((menu) => menu.location_id === location.id && menu.items.length > 0)
        .flatMap((menu) => menu.items.map((item) => normalizeMealPeriod(item.meal_period))),
    ),
  ],
  coordinates: { lat: location.coordinates?.latitude ?? 0, lng: location.coordinates?.longitude ?? 0 },
  ...(location.description && populatedLocations.has(location.id)
    ? {
        concepts: [
          ...new Set(
            source.menus
              .filter((menu) => menu.location_id === location.id)
              .flatMap((menu) => menu.items.map((item) => item.station).filter(Boolean)),
          ),
        ].slice(0, 12),
      }
    : {}),
}));

const menusByKey = new Map();
for (const sourceMenu of source.menus) {
  for (const sourceItem of sourceMenu.items) {
    const mealPeriod = normalizeMealPeriod(sourceItem.meal_period);
    const key = `${sourceMenu.location_id}|${sourceMenu.date}|${mealPeriod}`;
    if (!menusByKey.has(key)) {
      menusByKey.set(key, {
        hallId: sourceMenu.location_id,
        date: sourceMenu.date,
        mealPeriod,
        updatedAt: sourceMenu.retrieved_at,
        items: [],
      });
    }
    const contains = (sourceItem.allergens ?? []).filter((allergen) => allergen.contains).map(allergenId).filter(Boolean);
    const nutrition = sourceItem.nutrition ?? {};
    menusByKey.get(key).items.push({
      id: sourceItem.id,
      hallId: sourceMenu.location_id,
      name: sourceItem.name || 'Unnamed menu item',
      station: sourceItem.station || 'Dining menu',
      category: sourceItem.station || sourceItem.meal_period || 'Menu item',
      ...(sourceItem.description && { description: sourceItem.description }),
      ...(sourceItem.serving_size && { servingSize: sourceItem.serving_size }),
      nutrition: {
        calories: numberValue(nutrition.calories) ?? 0,
        ...(numberValue(nutrition.protein) !== undefined && { proteinG: numberValue(nutrition.protein) }),
        ...(numberValue(nutrition.carbohydrates) !== undefined && { carbsG: numberValue(nutrition.carbohydrates) }),
        ...(numberValue(nutrition.fat) !== undefined && { fatG: numberValue(nutrition.fat) }),
        ...(numberValue(nutrition.saturatedFat) !== undefined && {
          saturatedFatG: numberValue(nutrition.saturatedFat),
        }),
        ...(numberValue(nutrition.sodium) !== undefined && { sodiumMg: numberValue(nutrition.sodium) }),
        ...(numberValue(nutrition.sugar) !== undefined && { sugarG: numberValue(nutrition.sugar) }),
        ...(numberValue(nutrition.dietaryFiber) !== undefined && {
          fiberG: numberValue(nutrition.dietaryFiber),
        }),
      },
      ...(sourceItem.ingredients && { ingredients: sourceItem.ingredients }),
      // An explicitly unverified empty array must not surface as the UI's
      // "No major allergens" message. The current API contract has no
      // separate verification state, so represent it as unavailable.
      allergens:
        sourceItem.allergens === null ||
        sourceItem.allergen_data_status === 'reported_empty_not_safety_verified'
          ? null
          : { contains, mayContain: [] },
      dietaryTags: [
        ...(sourceItem.diets?.vegan ? ['vegan'] : []),
        ...(sourceItem.diets?.vegetarian ? ['vegetarian'] : []),
      ],
      updatedAt: sourceMenu.retrieved_at,
    });
  }
}

const menuFixtures = [...menusByKey.values()];
const output = `/**\n * GENERATED FILE — run scripts/generate-mock-fixtures.mjs after updating\n * data/uc-dining/uc-dining-expanded-export.json. Do not edit by hand.\n */\nimport type { DiningHall, Menu, MenuItem } from '../schemas';\n\nexport const HALLS: DiningHall[] = ${JSON.stringify(halls, null, 2)};\n\nexport const MENU_FIXTURES: Menu[] = ${JSON.stringify(menuFixtures, null, 2)};\n\nexport const ITEM_FIXTURES: MenuItem[] = MENU_FIXTURES.flatMap((menu) => menu.items);\n`;

await writeFile(outputPath, output);
console.log(`Generated ${menuFixtures.length} menus and ${menuFixtures.reduce((total, menu) => total + menu.items.length, 0)} items from ${root}`);
