/**
 * REST implementation of SafeBiteApi.
 *
 * The endpoint paths below are the proposed API for the backend team. They
 * are documented in web/README.md; change them in both places together.
 * Every response is validated with the zod schemas in ../schemas.ts.
 */
import { z } from 'zod';
import { ApiError, type SafeBiteApi } from '../client';
import {
  dietaryProfileSchema,
  diningHallSchema,
  favoritesSchema,
  menuItemSchema,
  menuSchema,
  reportSchema,
  safetyAlertSchema,
  sessionSchema,
  type Session,
} from '../schemas';

const SESSION_KEY = 'safebite.session';

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? sessionSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function storeSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function createHttpClient(baseUrl: string): SafeBiteApi {
  const root = baseUrl.replace(/\/$/, '');

  /** fetch wrapper: adds auth + JSON headers, checks status, validates the body. */
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: RequestInit & { json?: unknown } = {},
  ): Promise<T> {
    const { json, headers, ...rest } = init;
    const token = loadSession()?.token;

    const response = await fetch(`${root}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(json !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new ApiError(message || response.statusText, response.status);
    }

    if (response.status === 204) return schema.parse(undefined);
    return schema.parse(await response.json());
  }

  const noContent = z.undefined();
  const qs = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    return search.toString();
  };

  return {
    auth: {
      async signIn(input) {
        const session = await request('/auth/sign-in', sessionSchema, {
          method: 'POST',
          json: input,
        });
        storeSession(session);
        return session;
      },
      async signUp(input) {
        const session = await request('/auth/sign-up', sessionSchema, {
          method: 'POST',
          json: input,
        });
        storeSession(session);
        return session;
      },
      async signOut() {
        await request('/auth/sign-out', noContent, { method: 'POST' }).catch(() => undefined);
        storeSession(null);
      },
      async getSession() {
        return loadSession();
      },
    },
    halls: {
      list: () => request('/halls', z.array(diningHallSchema)),
      get: (hallId) => request(`/halls/${encodeURIComponent(hallId)}`, diningHallSchema),
    },
    menus: {
      list: ({ date, mealPeriod }) =>
        request(`/menus?${qs({ date, mealPeriod })}`, z.array(menuSchema)),
      get: (hallId, { date, mealPeriod }) =>
        request(
          `/halls/${encodeURIComponent(hallId)}/menu?${qs({ date, mealPeriod })}`,
          menuSchema,
        ),
    },
    items: {
      get: (itemId) => request(`/items/${encodeURIComponent(itemId)}`, menuItemSchema),
      getMany: (itemIds) =>
        itemIds.length
          ? request(`/items?${qs({ ids: itemIds.join(',') })}`, z.array(menuItemSchema))
          : Promise.resolve([]),
      search: ({ q, date, mealPeriod, hallId }) =>
        request(`/items/search?${qs({ q, date, mealPeriod, hallId })}`, z.array(menuItemSchema)),
    },
    profile: {
      get: () => request('/me/profile', dietaryProfileSchema.nullable()),
      save: (profile) =>
        request('/me/profile', dietaryProfileSchema, { method: 'PUT', json: profile }),
      delete: () => request('/me/profile', noContent, { method: 'DELETE' }),
    },
    favorites: {
      get: () => request('/me/favorites', favoritesSchema),
      setItem: (itemId, saved) =>
        request(`/me/favorites/items/${encodeURIComponent(itemId)}`, favoritesSchema, {
          method: saved ? 'PUT' : 'DELETE',
        }),
      setHall: (hallId, saved) =>
        request(`/me/favorites/halls/${encodeURIComponent(hallId)}`, favoritesSchema, {
          method: saved ? 'PUT' : 'DELETE',
        }),
    },
    alerts: {
      list: () => request('/me/alerts', z.array(safetyAlertSchema)),
      markRead: (alertId) =>
        request(`/me/alerts/${encodeURIComponent(alertId)}/read`, safetyAlertSchema, {
          method: 'POST',
        }),
    },
    reports: {
      submit: (report) => request('/reports', reportSchema, { method: 'POST', json: report }),
    },
  };
}
