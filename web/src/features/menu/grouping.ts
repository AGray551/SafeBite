import type { MenuItem } from '@/api/schemas';

/** Preferred order for menu sections; unknown categories go at the end. */
const CATEGORY_ORDER = ['Entrées', 'Grill', 'Pizza', 'Sides', 'Salads', 'Desserts', 'Drinks'];

/** Sections shown as compact rows instead of full cards. */
export const COMPACT_CATEGORIES = new Set(['Sides', 'Desserts', 'Drinks']);

export interface MenuSection<T> {
  category: string;
  entries: T[];
}

/** Groups menu entries by category, in a consistent order. */
export function groupByCategory<T extends { item: MenuItem }>(entries: T[]): MenuSection<T>[] {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const list = groups.get(entry.item.category) ?? [];
    list.push(entry);
    groups.set(entry.item.category, list);
  }

  const rank = (category: string) => {
    const index = CATEGORY_ORDER.indexOf(category);
    return index === -1 ? CATEGORY_ORDER.length : index;
  };

  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([category, list]) => ({ category, entries: list }));
}

/** "Entrées" → "entrees", for use in element ids / anchors. */
export function categoryAnchor(category: string): string {
  return `section-${category
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;
}
