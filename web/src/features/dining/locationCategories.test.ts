import { describe, expect, it } from 'vitest';
import { HALLS } from '@/api/mock/fixtures';
import { groupByCategory, primaryTag, tagFor } from './locationCategories';

const names = (category: Parameters<typeof groupByCategory>[1]) =>
  groupByCategory(HALLS, category)[0]!
    .halls.map((h) => h.name)
    .sort();

describe('groupByCategory', () => {
  it('returns sections in a fixed order and skips empty ones', () => {
    const sections = groupByCategory(HALLS.filter((h) => h.id === 'centercourt'));
    expect(sections.map((s) => s.category)).toEqual(['dining-hall']);
  });

  it('lists a location in every category it belongs to', () => {
    const sections = groupByCategory(HALLS);
    const withHalal = sections.filter((s) => s.halls.some((h) => h.id === 'halal-shack'));
    expect(withHalal.map((s) => s.category)).toEqual(['meal-exchange', 'retail']);
  });

  it('can limit to one category', () => {
    expect(groupByCategory(HALLS, 'coffee').map((s) => s.category)).toEqual(['coffee']);
  });
});

describe('location tags', () => {
  it('uses the first category as the main one', () => {
    const daap = HALLS.find((h) => h.id === 'daap-cafe')!;
    expect(primaryTag(daap).category).toBe('coffee');
    expect(tagFor(daap, 'meal-exchange')?.label).toBe('Classic Meal Exchange');
    expect(tagFor(daap, 'retail')).toBeUndefined();
  });
});

// Sample data follows UC Dining's published groupings.
describe('sample locations', () => {
  it('has the three residential dining halls', () => {
    expect(names('dining-hall')).toEqual(['CenterCourt', 'MarketPointe', 'On the Green (OTG)']);
  });

  it('has every meal exchange location', () => {
    expect(names('meal-exchange')).toEqual([
      'Bearcats Social / Bearcats Cafe',
      'Blue Ash Café',
      'Campus View Café',
      'Cincy Grill',
      'DAAP Café',
      'Halal Shack',
      'Pei Wei',
      'Shake Smart',
      'Stadium View Café',
      'Teachers Café',
    ]);
  });

  it('has the food court and restaurants', () => {
    expect(names('retail')).toEqual([
      'Chick-fil-A',
      'Cincy Grill',
      'Halal Shack',
      'Pei Wei',
      'Subway',
    ]);
  });

  it('has the convenience and grab-and-go stops', () => {
    expect(names('convenience')).toEqual(['Blue Ash Café', 'DAAP Café', 'MainStreet ExpressMart']);
  });
});
