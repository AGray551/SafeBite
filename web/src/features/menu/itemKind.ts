import type { MenuItem } from '@/api/schemas';

export type MenuItemKind = 'meal' | 'extra';

// UC's feed describes a station but not whether a line is a full dish, a
// topping, or a condiment. These conservative terms keep obvious extras out
// of the main meal browse; the backend should eventually supply item_kind.
const EXTRA_PATTERN =
  /\b(dressing|sauce|seasoning|spice|topping|butter|syrup|ketchup|mustard|mayonnaise|mayo|relish|salsa|gravy|vinaigrette|creamer|spread|garnish|crouton|sour cream|bacon bits|scallion|green onion|pickle|cheddar cheese)\b/i;

const SALAD_BAR_INGREDIENT_PATTERN =
  /\b(lettuce|romaine|spinach|cucumber|tomato|onion|pepper|olive|carrot|mushroom|bean|chickpea|broccoli|beet|fruit|cheese)\b/i;

const PREPARED_INGREDIENT_PATTERN = /^(sliced|diced|shredded|chopped|julienne|grated)\s/i;

export function menuItemKind(item: MenuItem): MenuItemKind {
  if (EXTRA_PATTERN.test(item.name)) return 'extra';
  if (PREPARED_INGREDIENT_PATTERN.test(item.name)) return 'extra';
  if (item.station.toLowerCase() === 'architect' && SALAD_BAR_INGREDIENT_PATTERN.test(item.name)) {
    return 'extra';
  }
  return 'meal';
}
