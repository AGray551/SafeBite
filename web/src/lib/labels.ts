/**
 * Human-readable labels for the ids used in the data model. Keeping them in
 * one place means the API can stay in stable kebab-case ids while the UI
 * text can be reworded freely.
 */
import type { DietaryTag, MealPeriod, ReportReason, Severity } from '@/api/schemas';

const ALLERGEN_LABELS: Record<string, string> = {
  peanuts: 'Peanuts',
  'tree-nuts': 'Tree nuts',
  milk: 'Milk',
  eggs: 'Eggs',
  wheat: 'Wheat',
  soy: 'Soy',
  fish: 'Fish',
  shellfish: 'Shellfish',
  sesame: 'Sesame',
};

/** "tree-nuts" → "Tree nuts". Custom allergens are capitalised as typed. */
export function allergenLabel(id: string): string {
  return ALLERGEN_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

/** Lowercase version for use mid-sentence ("Contains peanuts"). */
export function allergenNoun(id: string): string {
  return allergenLabel(id).toLowerCase();
}

/** Normalises user input into an allergen id: "Tree Nuts " → "tree-nuts". */
export function toAllergenId(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-');
}

export const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
  'dairy-free': 'Dairy-free',
  halal: 'Halal',
  kosher: 'Kosher',
  'high-protein': 'High protein',
};

/** Short codes for compact badges on cards (full label stays available to screen readers). */
export const DIETARY_TAG_SHORT_LABELS: Record<DietaryTag, string> = {
  vegetarian: 'V',
  vegan: 'VG',
  'gluten-free': 'GF',
  'dairy-free': 'DF',
  halal: 'Halal',
  kosher: 'Kosher',
  'high-protein': 'HP',
};

export const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export const SEVERITY_LABELS: Record<Severity, { label: string; hint: string }> = {
  allergy: { label: 'Allergy', hint: 'Must avoid' },
  intolerance: { label: 'Intolerance', hint: 'Limit' },
  preference: { label: 'Preference', hint: 'Filter only' },
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  'incorrect-allergen': 'Incorrect allergen',
  'incorrect-ingredient': 'Incorrect ingredient',
  'item-unavailable': 'Item unavailable',
  'wrong-nutrition': 'Wrong nutrition information',
  other: 'Other',
};

/** Joins a list for prose: ["a","b","c"] → "a, b and c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
