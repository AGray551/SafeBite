import { describe, expect, it } from 'vitest';
import type { DietaryProfile, MenuItem } from '@/api/schemas';
import { assessItem, describeProfile, isSafeForMe } from './assess';

function makeItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-1',
    hallId: 'hall-1',
    name: 'Test Item',
    station: 'Grill',
    category: 'Entrées',
    nutrition: { calories: 500 },
    allergens: { contains: [], mayContain: [] },
    dietaryTags: [],
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

function makeProfile(overrides: Partial<DietaryProfile> = {}): DietaryProfile {
  return {
    avoid: [
      { allergen: 'peanuts', severity: 'allergy' },
      { allergen: 'milk', severity: 'intolerance' },
    ],
    preferences: [],
    acknowledgedSafetyNotice: true,
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('assessItem', () => {
  it('marks an item with no conflicts as safe', () => {
    const result = assessItem(
      makeItem({ allergens: { contains: ['soy'], mayContain: [] } }),
      makeProfile(),
    );
    expect(result.status).toBe('safe');
    expect(result.summary).toBe('No conflicts found');
  });

  it('marks an item containing an allergy as avoid', () => {
    const result = assessItem(
      makeItem({ allergens: { contains: ['peanuts', 'soy'], mayContain: [] } }),
      makeProfile(),
    );
    expect(result.status).toBe('avoid');
    expect(result.summary).toBe('Contains peanuts');
  });

  it('marks "may contain" an allergy as caution', () => {
    const result = assessItem(
      makeItem({ allergens: { contains: [], mayContain: ['peanuts'] } }),
      makeProfile(),
    );
    expect(result.status).toBe('caution');
    expect(result.summary).toBe('May contain peanuts');
  });

  it('marks an intolerance as caution, not avoid', () => {
    const result = assessItem(
      makeItem({ allergens: { contains: ['milk'], mayContain: [] } }),
      makeProfile(),
    );
    expect(result.status).toBe('caution');
    expect(result.summary).toBe('Contains milk (intolerance)');
  });

  it('lets avoid win over caution when both apply', () => {
    const result = assessItem(
      makeItem({ allergens: { contains: ['milk', 'peanuts'], mayContain: [] } }),
      makeProfile(),
    );
    expect(result.status).toBe('avoid');
  });

  it('never flags a preference as unsafe', () => {
    const profile = makeProfile({ avoid: [{ allergen: 'eggs', severity: 'preference' }] });
    const result = assessItem(
      makeItem({ allergens: { contains: ['eggs'], mayContain: [] } }),
      profile,
    );
    expect(result.status).toBe('safe');
    expect(isSafeForMe(result)).toBe(false);
  });

  it('returns unknown when allergen data is missing', () => {
    const result = assessItem(makeItem({ allergens: null }), makeProfile());
    expect(result.status).toBe('unknown');
  });

  it('returns unknown when there is no profile', () => {
    expect(assessItem(makeItem(), null).status).toBe('unknown');
  });

  it('finds custom allergens in the ingredient text', () => {
    const profile = makeProfile({ avoid: [{ allergen: 'mustard', severity: 'allergy' }] });
    const item = makeItem({ ingredients: 'Chicken, honey mustard glaze, salt' });
    expect(assessItem(item, profile).status).toBe('avoid');
  });

  it('records unmet dietary preferences', () => {
    const profile = makeProfile({ preferences: ['vegan'] });
    const result = assessItem(makeItem({ dietaryTags: ['vegetarian'] }), profile);
    expect(result.unmetPreferences).toEqual(['vegan']);
    expect(isSafeForMe(result)).toBe(false);
  });
});

describe('isSafeForMe', () => {
  it('keeps caution items but hides avoid items', () => {
    const profile = makeProfile();
    const caution = assessItem(
      makeItem({ allergens: { contains: ['milk'], mayContain: [] } }),
      profile,
    );
    const avoid = assessItem(
      makeItem({ allergens: { contains: ['peanuts'], mayContain: [] } }),
      profile,
    );
    expect(isSafeForMe(caution)).toBe(true);
    expect(isSafeForMe(avoid)).toBe(false);
  });
});

describe('describeProfile', () => {
  it('summarises allergies and intolerances', () => {
    expect(describeProfile(makeProfile())).toBe('peanuts allergy · milk intolerance');
  });

  it('returns null for an empty profile', () => {
    expect(describeProfile(makeProfile({ avoid: [] }))).toBeNull();
  });
});
