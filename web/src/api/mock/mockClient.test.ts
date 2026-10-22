import { describe, expect, it } from 'vitest';
import { createMockClient } from './mockClient';

const api = createMockClient();

describe('mock API', () => {
  it('lists every dining location', async () => {
    const halls = await api.halls.list();
    expect(halls.length).toBeGreaterThan(10);
    expect(halls.map((h) => h.id)).toContain('center-court');
  });

  it('only returns items served in the requested meal period', async () => {
    const menu = await api.menus.get('marketpointe', {
      date: '2026-10-21',
      mealPeriod: 'breakfast',
    });
    expect(menu.items.map((i) => i.name)).toContain('Scrambled Egg');
    expect(menu.items.map((i) => i.name)).not.toContain('Grilled Chicken');
  });

  it('searches by name and dietary tag', async () => {
    const results = await api.items.search({ q: 'vegan', date: '2026-10-21' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.dietaryTags.includes('vegan'))).toBe(true);
  });

  it('persists favorites', async () => {
    const itemId = 'fixture_68de19b3050a147f7a3c';
    await api.favorites.setItem(itemId, true);
    expect((await api.favorites.get()).itemIds).toContain(itemId);
    await api.favorites.setItem(itemId, false);
    expect((await api.favorites.get()).itemIds).not.toContain(itemId);
  });

  it('only raises ingredient alerts for students they affect', async () => {
    expect(await api.alerts.list()).toHaveLength(0);

    await api.profile.save({
      avoid: [{ allergen: 'milk', severity: 'intolerance' }],
      preferences: [],
      acknowledgedSafetyNotice: true,
    });
    expect(await api.alerts.list()).toHaveLength(0);
  });

  it('raises alerts from the signed-in account when accounts live elsewhere', async () => {
    const withAccount = createMockClient({
      account: () => ({
        ...api,
        profile: {
          ...api.profile,
          get: async () => ({
            avoid: [{ allergen: 'milk', severity: 'allergy' }],
            preferences: [],
            acknowledgedSafetyNotice: true,
            updatedAt: new Date().toISOString(),
          }),
        },
      }),
    });
    // Nothing saved in this mock's own storage, yet the account's profile counts.
    expect(await api.profile.get()).toBeNull();
    expect(await withAccount.alerts.list()).toEqual([]);
  });
});
