/**
 * In-browser implementation of SafeBiteApi used until the backend exists.
 *
 * Reads come from a generated UC Dining fixture; anything a student changes (profile,
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
import { HALLS, ITEM_FIXTURES, MENU_FIXTURES } from './realFixtures';

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

function findItem(itemId: string): MenuItem {
  const fixture = ITEM_FIXTURES.find((item) => item.id === itemId);
  if (!fixture) throw new ApiError('Menu item not found', 404);
  return fixture;
}

function buildMenu(hallId: string, date: string, mealPeriod: Menu['mealPeriod']): Menu {
  return (
    MENU_FIXTURES.find(
      (menu) => menu.hallId === hallId && menu.date === date && menu.mealPeriod === mealPeriod,
    ) ?? {
      hallId,
      date,
      mealPeriod,
      updatedAt: new Date(`${date}T00:00:00.000Z`).toISOString(),
      items: [],
    }
  );
}

/** Case-insensitive match against name, station, category and dietary tags. */
function matchesQuery(item: MenuItem, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const dietaryTagQuery = terms.join('-');
  if (
    [
      'vegetarian',
      'vegan',
      'gluten-free',
      'dairy-free',
      'halal',
      'kosher',
      'high-protein',
    ].includes(dietaryTagQuery)
  ) {
    return item.dietaryTags.includes(dietaryTagQuery as (typeof item.dietaryTags)[number]);
  }
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
 * Historical seed data has no change history, so it intentionally produces no
 * alerts. The backend can replace this with its scrape-diff job later.
 */
function computeAlerts(_profile: DietaryProfile | null, _favorites: Favorites): SafetyAlert[] {
  return [];
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface MockClientOptions {
  /**
   * Where alerts read the student's profile and favorites from. Defaults to
   * this mock's own localStorage; pass the full API when accounts live
   * elsewhere (Supabase), so alerts still match the signed-in student.
   */
  account?: () => Pick<SafeBiteApi, 'profile' | 'favorites'>;
}

export function createMockClient({ account }: MockClientOptions = {}): SafeBiteApi {
  async function currentAlerts(): Promise<SafetyAlert[]> {
    if (!account) {
      return computeAlerts(read<DietaryProfile | null>(KEYS.profile, null), getFavorites());
    }
    const [profile, favorites] = await Promise.all([
      account().profile.get(),
      account().favorites.get(),
    ]);
    return computeAlerts(profile, favorites);
  }

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
      onSessionChange: () => () => {},
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
      getMany: async (itemIds) => delay(ITEM_FIXTURES.filter((item) => itemIds.includes(item.id))),
      async search({ q, date, mealPeriod, hallId }) {
        const results = MENU_FIXTURES.filter(
          (menu) =>
            menu.date === date &&
            (!mealPeriod || menu.mealPeriod === mealPeriod) &&
            (!hallId || menu.hallId === hallId),
        )
          .flatMap((menu) => menu.items)
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
      list: async () => delay(await currentAlerts()),
      async markRead(alertId) {
        const readIds = read<Record<string, string>>(KEYS.readAlerts, {});
        readIds[alertId] = new Date().toISOString();
        write(KEYS.readAlerts, readIds);
        const alert = (await currentAlerts()).find((a) => a.id === alertId);
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
