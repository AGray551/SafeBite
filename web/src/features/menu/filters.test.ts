import { describe, expect, it } from 'vitest';
import type { MenuItem } from '@/api/schemas';
import { matchesQuickFilters } from './filters';

const item: MenuItem = {
  id: 'item-1',
  hallId: 'marketpointe',
  name: 'Test item',
  station: 'Test station',
  category: 'Entrée',
  nutrition: {
    calories: 430,
    proteinG: 22,
    carbsG: 35,
    fatG: 10,
    saturatedFatG: 2,
    sodiumMg: 350,
    sugarG: 6,
    fiberG: 8,
  },
  allergens: null,
  dietaryTags: [],
  updatedAt: '2026-10-19T00:00:00.000Z',
};

describe('matchesQuickFilters', () => {
  it('keeps only more nutrient-forward items for Nutrition picks', () => {
    expect(matchesQuickFilters(item, new Set(['nutrition-picks']))).toBe(true);
    expect(
      matchesQuickFilters(
        { ...item, nutrition: { ...item.nutrition, sodiumMg: 1_100 } },
        new Set(['nutrition-picks']),
      ),
    ).toBe(false);
  });
});
