/**
 * In-browser implementation of SafeBiteApi used until the backend exists.
 *
 * Reads come from fixtures.ts; anything a student changes (profile,
 * favorites, alerts read, reports) is kept in localStorage so it survives a
 * reload. A small artificial delay keeps loading states honest during
 * development.
 */
import { ApiError, type SafeBiteApi } from '../client';
import type {
  DietaryProfile,
  Favorites,
  Menu,
  MenuItem,
  Report,
  SafetyAlert,
  Session,
} from '../schemas';
import { HALLS, ITEM_FIXTURES, STALE_HALL_IDS } from './fixtures';

const LATENCY_MS = 250;

const KEYS = {
  session: 'safebite.mock.session',
  profile: 'safebite.mock.profile',
  favorites: 'safebite.mock.favorites',
  readAlerts: 'safebite.mock.readAlerts',
  reports: 'safebite.mock.reports',
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

/** Fixtures → API items, with timestamps generated relative to now. */
function toMenuItem({
  periods: _periods,
  changedToday,
  ...fixture
}: (typeof ITEM_FIXTURES)[number]): MenuItem {
  const stale = STALE_HALL_IDS.has(fixture.hallId);
  return {
    ...fixture,
    updatedAt: stale ? hoursAgo(72) : hoursAgo(2),
    ...(changedToday && { ingredientsChangedAt: hoursAgo(1) }),
  };
}

function findItem(itemId: string): MenuItem {
  const fixture = ITEM_FIXTURES.find((item) => item.id === itemId);
  if (!fixture) throw new ApiError('Menu item not found', 404);
  return toMenuItem(fixture);
}

function buildMenu(hallId: string, date: string, mealPeriod: Menu['mealPeriod']): Menu {
  return {
    hallId,
    date,
    mealPeriod,
    updatedAt: STALE_HALL_IDS.has(hallId) ? hoursAgo(72) : hoursAgo(2),
    items: ITEM_FIXTURES.filter(
      (item) => item.hallId === hallId && item.periods.includes(mealPeriod),
    ).map(toMenuItem),
  };
}

/** Case-insensitive match against name, station, category and dietary tags. */
function matchesQuery(item: MenuItem, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [
    item.name,
    item.station,
    item.category,
    ...item.dietaryTags.map((t) => t.replace('-', ' ')),
  ]
    .join(' ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function emailToName(email: string): string {
  const local = email.split('@')[0] ?? 'Student';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function getFavorites(): Favorites {
  return read<Favorites>(KEYS.favorites, { itemIds: [], hallIds: [] });
}

function toggle(list: string[], id: string, on: boolean): string[] {
  const without = list.filter((x) => x !== id);
  return on ? [...without, id] : without;
}

/**
 * Mimics the backend's alert job: when a scrape adds an allergen to an item,
 * alert students who avoid that allergen or have the item saved.
 */
function computeAlerts(): SafetyAlert[] {
  const profile = read<DietaryProfile | null>(KEYS.profile, null);
  const favorites = getFavorites();
  const readIds = read<Record<string, string>>(KEYS.readAlerts, {});

  return ITEM_FIXTURES.filter((item) => item.changedToday && item.allergens).flatMap((item) => {
    // In the fixtures, the first "contains" allergen is the one that was added.
    const added = item.allergens!.contains[0];
    if (!added) return [];
    const avoids = profile?.avoid.some((a) => a.allergen === added) ?? false;
    if (!avoids && !favorites.itemIds.includes(item.id)) return [];
    const id = `alert-${item.id}`;
    return [
      {
        id,
        itemId: item.id,
        hallId: item.hallId,
        allergen: added,
        createdAt: hoursAgo(1),
        readAt: readIds[id] ?? null,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export function createMockClient(): SafeBiteApi {
  return {
    auth: {
      async signIn({ email, password }) {
        if (!email || !password) throw new ApiError('Enter your email and password.', 400);
        const session: Session = {
          user: { id: email, name: emailToName(email), email },
          token: 'mock-token',
        };
        write(KEYS.session, session);
        return delay(session);
      },
      async signUp({ name, email, password }) {
        if (password.length < 8) throw new ApiError('Password must be at least 8 characters.', 400);
        const session: Session = { user: { id: email, name, email }, token: 'mock-token' };
        write(KEYS.session, session);
        return delay(session);
      },
      async signOut() {
        localStorage.removeItem(KEYS.session);
        return delay(undefined);
      },
      async getSession() {
        return delay(read<Session | null>(KEYS.session, null));
      },
    },

    halls: {
      list: () => delay(HALLS),
      async get(hallId) {
        const hall = HALLS.find((h) => h.id === hallId);
        if (!hall) throw new ApiError('Dining hall not found', 404);
        return delay(hall);
      },
    },

    menus: {
      list: ({ date, mealPeriod }) =>
        delay(
          HALLS.filter((hall) => hall.mealPeriods.includes(mealPeriod)).map((hall) =>
            buildMenu(hall.id, date, mealPeriod),
          ),
        ),
      async get(hallId, { date, mealPeriod }) {
        if (!HALLS.some((h) => h.id === hallId)) throw new ApiError('Dining hall not found', 404);
        return delay(buildMenu(hallId, date, mealPeriod));
      },
    },

    items: {
      get: async (itemId) => delay(findItem(itemId)),
      getMany: async (itemIds) =>
        delay(ITEM_FIXTURES.filter((item) => itemIds.includes(item.id)).map(toMenuItem)),
      async search({ q, mealPeriod, hallId }) {
        const results = ITEM_FIXTURES.filter(
          (item) =>
            item.periods.length > 0 &&
            (!mealPeriod || item.periods.includes(mealPeriod)) &&
            (!hallId || item.hallId === hallId),
        )
          .map(toMenuItem)
          .filter((item) => matchesQuery(item, q));
        return delay(results);
      },
    },

    profile: {
      get: async () => delay(read<DietaryProfile | null>(KEYS.profile, null)),
      async save(input) {
        const profile: DietaryProfile = { ...input, updatedAt: new Date().toISOString() };
        write(KEYS.profile, profile);
        return delay(profile);
      },
      async delete() {
        localStorage.removeItem(KEYS.profile);
        return delay(undefined);
      },
    },

    favorites: {
      get: async () => delay(getFavorites()),
      async setItem(itemId, saved) {
        const current = getFavorites();
        const next = { ...current, itemIds: toggle(current.itemIds, itemId, saved) };
        write(KEYS.favorites, next);
        return delay(next);
      },
      async setHall(hallId, saved) {
        const current = getFavorites();
        const next = { ...current, hallIds: toggle(current.hallIds, hallId, saved) };
        write(KEYS.favorites, next);
        return delay(next);
      },
    },

    alerts: {
      list: async () => delay(computeAlerts()),
      async markRead(alertId) {
        const readIds = read<Record<string, string>>(KEYS.readAlerts, {});
        readIds[alertId] = new Date().toISOString();
        write(KEYS.readAlerts, readIds);
        const alert = computeAlerts().find((a) => a.id === alertId);
        if (!alert) throw new ApiError('Alert not found', 404);
        return delay(alert);
      },
    },

    reports: {
      async submit(input) {
        const report: Report = {
          ...input,
          id: `report-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        write(KEYS.reports, [...read<Report[]>(KEYS.reports, []), report]);
        return delay(report);
      },
    },
  };
}
