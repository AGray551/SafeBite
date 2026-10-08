import {
  BadgeCheck,
  Bean,
  CircleDot,
  Dumbbell,
  Egg,
  Fish,
  Leaf,
  Milk,
  MilkOff,
  Nut,
  Shrimp,
  Sprout,
  TreeDeciduous,
  Vegan,
  Wheat,
  WheatOff,
  type LucideIcon,
} from 'lucide-react';
import type { DietaryTag } from '@/api/schemas';

/**
 * Icons for the nine major allergens. Icons are always shown with a text
 * label next to them; they help scanning but never carry meaning alone.
 */
export const ALLERGEN_ICON_MAP: Partial<Record<string, LucideIcon>> = {
  peanuts: Nut,
  'tree-nuts': TreeDeciduous,
  milk: Milk,
  eggs: Egg,
  wheat: Wheat,
  soy: Bean,
  fish: Fish,
  shellfish: Shrimp,
  sesame: Sprout,
};

/** Custom allergens ("mustard") fall back to a generic dot. */
export function allergenIcon(allergen: string): LucideIcon {
  return ALLERGEN_ICON_MAP[allergen] ?? CircleDot;
}

export const DIETARY_TAG_ICONS: Record<DietaryTag, LucideIcon> = {
  vegan: Vegan,
  vegetarian: Leaf,
  'gluten-free': WheatOff,
  'dairy-free': MilkOff,
  halal: BadgeCheck,
  kosher: BadgeCheck,
  'high-protein': Dumbbell,
};
