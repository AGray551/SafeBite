import { describe, expect, it } from 'vitest';
import type { MenuItem } from '@/api/schemas';
import { menuItemKind } from './itemKind';

const base: MenuItem = {
  id: 'example',
  hallId: 'marketpointe',
  name: 'Example',
  station: 'Ciao',
  category: 'Ciao',
  nutrition: { calories: 200 },
  allergens: null,
  dietaryTags: [],
  updatedAt: '2026-10-19T00:00:00.000Z',
};

describe('menuItemKind', () => {
  it('moves clear condiments out of meal browsing', () => {
    expect(menuItemKind({ ...base, name: 'Ranch Dressing' })).toBe('extra');
    expect(menuItemKind({ ...base, name: 'Marinara Sauce' })).toBe('extra');
    expect(menuItemKind({ ...base, name: 'Sliced Green Onions' })).toBe('extra');
  });

  it('keeps a main dish in meal browsing', () => {
    expect(menuItemKind({ ...base, name: 'Grilled Chicken Bowl' })).toBe('meal');
  });
});
