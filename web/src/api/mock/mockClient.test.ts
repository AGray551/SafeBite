import { describe, expect, it } from 'vitest';
import { createMockClient } from './mockClient';

const api = createMockClient();

describe('mock API', () => {
  it('lists every dining location', async () => {
    const halls = await api.halls.list();
    expect(halls.length).toBeGreaterThan(10);
    expect(halls.map((h) => h.id)).toContain('centercourt');
  });

  it('only returns items served in the requested meal period', async () => {
    const menu = await api.menus.get('centercourt', {
      date: '2026-10-08',
      mealPeriod: 'breakfast',
    });
    expect(menu.items.map((i) => i.name)).toContain('Scrambled Eggs');
    expect(menu.items.map((i) => i.name)).not.toContain('Thai Peanut Noodles');
  });

  it('searches by name and dietary tag', async () => {
    const results = await api.items.search({ q: 'gluten free', date: '2026-10-08' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.dietaryTags.includes('gluten-free'))).toBe(true);
  });

  it('persists favorites', async () => {
    await api.favorites.setItem('cc-brown-rice', true);
    expect((await api.favorites.get()).itemIds).toContain('cc-brown-rice');
    await api.favorites.setItem('cc-brown-rice', false);
    expect((await api.favorites.get()).itemIds).not.toContain('cc-brown-rice');
  });

  it('only raises ingredient alerts for students they affect', async () => {
    expect(await api.alerts.list()).toHaveLength(0);

    await api.profile.save({
      avoid: [{ allergen: 'milk', severity: 'intolerance' }],
      preferences: [],
      acknowledgedSafetyNotice: true,
    });
    const alerts = await api.alerts.list();
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      itemId: 'cc-chicken-alfredo',
      allergen: 'milk',
      readAt: null,
    });

    await api.alerts.markRead(alerts[0]!.id);
    expect((await api.alerts.list())[0]!.readAt).not.toBeNull();
  });
});
