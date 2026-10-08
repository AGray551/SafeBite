/**
 * Domain schemas shared by the whole app.
 *
 * These double as the API contract: the HTTP client validates every response
 * against them, so if the backend ships a shape the UI doesn't expect we get
 * a clear error at the boundary instead of a broken screen. TypeScript types
 * are inferred from the schemas so the two can never drift apart.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Allergens and dietary tags
// ---------------------------------------------------------------------------

/** The nine major allergens recognised by the FDA. */
export const MAJOR_ALLERGENS = [
  'peanuts',
  'tree-nuts',
  'milk',
  'eggs',
  'wheat',
  'soy',
  'fish',
  'shellfish',
  'sesame',
] as const;

export const majorAllergenSchema = z.enum(MAJOR_ALLERGENS);
export type MajorAllergen = z.infer<typeof majorAllergenSchema>;

/**
 * Allergen ids are usually one of the majors, but students can also add
 * custom ingredients ("mustard", "corn"), so the schema accepts any
 * lowercase string.
 */
export const allergenIdSchema = z.string().min(1);
export type AllergenId = z.infer<typeof allergenIdSchema>;

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'halal',
  'kosher',
  'high-protein',
] as const;

export const dietaryTagSchema = z.enum(DIETARY_TAGS);
export type DietaryTag = z.infer<typeof dietaryTagSchema>;

export const MEAL_PERIODS = ['breakfast', 'lunch', 'dinner'] as const;
export const mealPeriodSchema = z.enum(MEAL_PERIODS);
export type MealPeriod = z.infer<typeof mealPeriodSchema>;

// ---------------------------------------------------------------------------
// Dining halls
// ---------------------------------------------------------------------------

/** "HH:mm" in 24-hour campus local time. */
const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm');

export const hoursSchema = z.object({
  opensAt: timeOfDaySchema,
  closesAt: timeOfDaySchema,
});
export type Hours = z.infer<typeof hoursSchema>;

/**
 * What kind of place it is. "dining-hall" means all-you-care-to-eat; the
 * others are retail spots that take dining dollars or card.
 */
export const LOCATION_KINDS = ['dining-hall', 'restaurant', 'cafe', 'market'] as const;
export const locationKindSchema = z.enum(LOCATION_KINDS);
export type LocationKind = z.infer<typeof locationKindSchema>;

export const diningHallSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: locationKindSchema,
  /** Brands or stations inside the location, e.g. "Bowl Lab". */
  concepts: z.array(z.string()).optional(),
  /** Building or area, e.g. "Center Village". */
  location: z.string(),
  address: z.string().optional(),
  /** Today's hours, or null when the hall is closed all day. */
  todayHours: hoursSchema.nullable(),
  mealPeriods: z.array(mealPeriodSchema),
  /**
   * Position on the campus map placeholder, as percentages of its width and
   * height. Will become lat/lng once a real map is wired up.
   */
  mapPosition: z.object({ x: z.number(), y: z.number() }),
});
export type DiningHall = z.infer<typeof diningHallSchema>;

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

export const nutritionSchema = z.object({
  calories: z.number(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
  sodiumMg: z.number().optional(),
  sugarG: z.number().optional(),
});
export type Nutrition = z.infer<typeof nutritionSchema>;

export const allergenInfoSchema = z.object({
  contains: z.array(allergenIdSchema),
  mayContain: z.array(allergenIdSchema),
  /** Free-text note about shared equipment, e.g. "Cooked on a shared grill". */
  crossContactNote: z.string().optional(),
});
export type AllergenInfo = z.infer<typeof allergenInfoSchema>;

export const menuItemSchema = z.object({
  id: z.string(),
  hallId: z.string(),
  name: z.string(),
  station: z.string(),
  /** Menu section the item is listed under, e.g. "Entrées" or "Sides". */
  category: z.string(),
  description: z.string().optional(),
  servingSize: z.string().optional(),
  nutrition: nutritionSchema,
  ingredients: z.string().optional(),
  /**
   * Null means the scraper could not find allergen data for this item. The
   * UI must treat that as "unknown", never as "safe".
   */
  allergens: allergenInfoSchema.nullable(),
  dietaryTags: z.array(dietaryTagSchema),
  /** When this item's data was last scraped (ISO 8601). */
  updatedAt: z.string(),
  /** Set when the most recent scrape changed this item's ingredients. */
  ingredientsChangedAt: z.string().optional(),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuSchema = z.object({
  hallId: z.string(),
  /** Calendar date, YYYY-MM-DD. */
  date: z.string(),
  mealPeriod: mealPeriodSchema,
  /** When this menu was last scraped (ISO 8601). Drives the freshness warning. */
  updatedAt: z.string(),
  items: z.array(menuItemSchema),
});
export type Menu = z.infer<typeof menuSchema>;

// ---------------------------------------------------------------------------
// Dietary profile
// ---------------------------------------------------------------------------

/**
 * How strictly SafeBite should treat an allergen:
 * - allergy: must avoid (contains → Avoid, may contain → Caution)
 * - intolerance: limit (contains or may contain → Caution)
 * - preference: filter only, never flagged as unsafe
 */
export const SEVERITIES = ['allergy', 'intolerance', 'preference'] as const;
export const severitySchema = z.enum(SEVERITIES);
export type Severity = z.infer<typeof severitySchema>;

export const avoidanceSchema = z.object({
  allergen: allergenIdSchema,
  severity: severitySchema,
});
export type Avoidance = z.infer<typeof avoidanceSchema>;

export const dietaryProfileSchema = z.object({
  avoid: z.array(avoidanceSchema),
  preferences: z.array(dietaryTagSchema),
  /** Free-text preference the student typed in ("low sodium"). Display only for now. */
  otherPreference: z.string().optional(),
  acknowledgedSafetyNotice: z.boolean(),
  updatedAt: z.string(),
});
export type DietaryProfile = z.infer<typeof dietaryProfileSchema>;

// ---------------------------------------------------------------------------
// Account, favorites, alerts, reports
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});
export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  user: userSchema,
  token: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;

export const favoritesSchema = z.object({
  itemIds: z.array(z.string()),
  hallIds: z.array(z.string()),
});
export type Favorites = z.infer<typeof favoritesSchema>;

export const safetyAlertSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  hallId: z.string(),
  /** The allergen that was added to the item. */
  allergen: allergenIdSchema,
  createdAt: z.string(),
  readAt: z.string().nullable(),
});
export type SafetyAlert = z.infer<typeof safetyAlertSchema>;

export const REPORT_REASONS = [
  'incorrect-allergen',
  'incorrect-ingredient',
  'item-unavailable',
  'wrong-nutrition',
  'other',
] as const;
export const reportReasonSchema = z.enum(REPORT_REASONS);
export type ReportReason = z.infer<typeof reportReasonSchema>;

export const newReportSchema = z.object({
  itemId: z.string(),
  reason: reportReasonSchema,
  notes: z.string().max(1000).optional(),
  allowContact: z.boolean(),
});
export type NewReport = z.infer<typeof newReportSchema>;

export const reportSchema = newReportSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
export type Report = z.infer<typeof reportSchema>;
