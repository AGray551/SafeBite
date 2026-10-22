import type { DietaryTag, MenuItem } from '@/api/schemas';
import { getBalancedChoice } from '@/features/nutrition/balancedChoice';

/** Quick filters shown as chips on Home, hall menus and search. */
export type QuickFilter =
  | Extract<DietaryTag, 'vegan' | 'vegetarian' | 'gluten-free' | 'high-protein'>
  | 'under-600'
  | 'nutrition-picks';

export const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'under-600', label: 'Under 600 cal' },
  { value: 'nutrition-picks', label: 'Nutrition picks' },
];

export function matchesQuickFilters(item: MenuItem, filters: ReadonlySet<QuickFilter>): boolean {
  for (const filter of filters) {
    if (filter === 'under-600') {
      if (item.nutrition.calories >= 600) return false;
    } else if (filter === 'nutrition-picks') {
      if (getBalancedChoice(item.nutrition)?.tone !== 'strong') return false;
    } else if (!item.dietaryTags.includes(filter)) {
      return false;
    }
  }
  return true;
}

/** Returns a new set with `value` added or removed. Handy for chip state. */
export function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
