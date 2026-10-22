import { describe, expect, it } from 'vitest';
import { HALLS } from '@/api/mock/realFixtures';
import { categoryLine, groupByCategory, primaryTag, tagFor } from './locationCategories';

const names = (category: Parameters<typeof groupByCategory>[1]) =>
  groupByCategory(HALLS, category)[0]!
    .halls.map((h) => h.name)
    .sort();

describe('groupByCategory', () => {
  it('returns sections in a fixed order and skips empty ones', () => {
    const sections = groupByCategory(HALLS.filter((h) => h.id === 'center-court'));
    expect(sections.map((s) => s.category)).toEqual(['dining-hall']);
  });

  it('lists a location in every category it belongs to', () => {
    const sections = groupByCategory(HALLS);
    expect(sections.map((section) => section.category)).toContain('dining-hall');
  });

  it('can limit to one category', () => {
    expect(groupByCategory(HALLS, 'coffee').every((section) => section.category === 'coffee')).toBe(
      true,
    );
  });
});

describe('location tags', () => {
  it('uses the first category as the main one', () => {
    const marketpointe = HALLS.find((h) => h.id === 'marketpointe')!;
    expect(primaryTag(marketpointe).category).toBe('dining-hall');
    expect(tagFor(marketpointe, 'dining-hall')?.label).toBe('Resident Dining Halls');
    expect(tagFor(marketpointe, 'retail')).toBeUndefined();
  });
});

// Sample data follows UC Dining's published groupings.
describe('sample locations', () => {
  it('has the three residential dining halls', () => {
    expect(names('dining-hall')).toEqual([
      'Center Court',
      'MarketPointe',
      'On The Green',
      'Stadium View Café',
    ]);
  });

  it('retains source-based retail locations', () => {
    expect(names('retail')).toContain('Pei Wei');
  });
});

describe('categoryLine', () => {
  const hall = (id: string) => HALLS.find((h) => h.id === id)!;

  it("leads with the section's classification and lists the other categories", () => {
    expect(categoryLine(hall('marketpointe'), 'dining-hall')).toBe('');
  });

  it('leaves out a classification that only repeats the section', () => {
    expect(categoryLine(hall('center-court'), 'dining-hall')).toBe('');
  });

  it('uses the main category when no section is given', () => {
    expect(categoryLine(hall('marketpointe'))).toBe('');
  });
});
