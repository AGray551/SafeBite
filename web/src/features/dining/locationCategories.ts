import { Coffee, ShoppingBasket, Store, Ticket, Utensils, type LucideIcon } from 'lucide-react';
import {
  LOCATION_CATEGORIES,
  type DiningHall,
  type LocationCategory,
  type LocationTag,
} from '@/api/schemas';

export const LOCATION_CATEGORY_META: Record<
  LocationCategory,
  { title: string; short: string; description: string; icon: LucideIcon }
> = {
  'dining-hall': {
    title: 'Dining halls',
    short: 'Dining hall',
    description: 'Residential, all-you-care-to-eat dining centers',
    icon: Utensils,
  },
  'meal-exchange': {
    title: 'Meal exchange',
    short: 'Meal exchange',
    description: 'Eligible meals through the meal exchange program',
    icon: Ticket,
  },
  retail: {
    title: 'Food court & restaurants',
    short: 'Food court',
    description: 'Restaurants in TUC and around campus',
    icon: Store,
  },
  coffee: {
    title: 'Coffee & cafés',
    short: 'Café',
    description: 'Coffee shops and cafés across campus',
    icon: Coffee,
  },
  convenience: {
    title: 'Convenience & grab-and-go',
    short: 'Grab & go',
    description: 'Snacks, drinks and grab-and-go meals',
    icon: ShoppingBasket,
  },
};

/** The location's main category (shown as its icon). */
export function primaryTag(hall: DiningHall): LocationTag {
  return hall.categories[0]!;
}

/** The location's tag in a given category, if it's in it. */
export function tagFor(hall: DiningHall, category: LocationCategory): LocationTag | undefined {
  return hall.categories.find((t) => t.category === category);
}

export interface CategorySection {
  category: LocationCategory;
  halls: DiningHall[];
}

/**
 * Splits locations into category sections in a fixed order. A location in
 * several categories appears in each of them. Empty sections are left out.
 */
export function groupByCategory(halls: DiningHall[], only?: LocationCategory): CategorySection[] {
  return LOCATION_CATEGORIES.filter((category) => !only || category === only)
    .map((category) => ({
      category,
      halls: halls.filter((hall) => tagFor(hall, category)),
    }))
    .filter((section) => section.halls.length > 0);
}
