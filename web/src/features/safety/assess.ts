/**
 * Personalized safety assessment.
 *
 * Given a menu item and a student's dietary profile, decide whether the item
 * is Safe, Caution or Avoid for them, and explain why. This is the heart of
 * SafeBite, so it's a pure function with no React or API dependencies and is
 * covered by unit tests (assess.test.ts).
 *
 * Rules (from the dietary profile screens):
 *   allergy      contains → AVOID     may contain → CAUTION
 *   intolerance  contains → CAUTION   may contain → CAUTION
 *   preference   never changes status; only used to filter ("Safe for Me")
 *
 * Missing allergen data, or no profile at all, gives UNKNOWN. We never call
 * an item safe without having checked it.
 */
import {
  MAJOR_ALLERGENS,
  type AllergenId,
  type DietaryProfile,
  type DietaryTag,
  type MenuItem,
  type Severity,
} from '@/api/schemas';
import { allergenNoun, DIETARY_TAG_LABELS, joinList } from '@/lib/labels';

export type SafetyStatus = 'safe' | 'caution' | 'avoid' | 'unknown';

export interface Conflict {
  allergen: AllergenId;
  severity: Severity;
  /** Whether the item definitely contains it or only may contain it. */
  kind: 'contains' | 'may-contain';
}

export interface SafetyAssessment {
  status: SafetyStatus;
  /** Short reason shown next to the badge, e.g. "Contains peanuts". */
  summary: string;
  /** Every profile allergen found on the item (including preferences). */
  conflicts: Conflict[];
  /** Dietary preferences from the profile that this item doesn't meet. */
  unmetPreferences: DietaryTag[];
}

/** Lower number = more severe. Used to pick the overall status. */
const STATUS_RANK: Record<SafetyStatus, number> = { avoid: 0, caution: 1, unknown: 2, safe: 3 };

export function worstStatus(a: SafetyStatus, b: SafetyStatus): SafetyStatus {
  return STATUS_RANK[a] <= STATUS_RANK[b] ? a : b;
}

/** Status a single conflict produces on its own. */
function statusForConflict({ severity, kind }: Conflict): SafetyStatus {
  if (severity === 'preference') return 'safe';
  if (severity === 'allergy' && kind === 'contains') return 'avoid';
  return 'caution';
}

/**
 * Custom allergens (anything outside the nine majors) aren't always tagged by
 * dining services, so we also look for them in the ingredient text. Majors
 * are always tagged, and text-matching them gives false positives
 * ("coconut milk" is not dairy), so they're skipped here.
 */
function ingredientsMention(item: MenuItem, allergen: AllergenId): boolean {
  if (!item.ingredients) return false;
  if ((MAJOR_ALLERGENS as readonly string[]).includes(allergen)) return false;
  const word = allergen.replace(/-/g, ' ');
  return new RegExp(`\\b${word}`, 'i').test(item.ingredients);
}

export function findConflicts(item: MenuItem, profile: DietaryProfile): Conflict[] {
  if (!item.allergens) return [];
  const { contains, mayContain } = item.allergens;
  const conflicts: Conflict[] = [];

  for (const { allergen, severity } of profile.avoid) {
    if (contains.includes(allergen) || ingredientsMention(item, allergen)) {
      conflicts.push({ allergen, severity, kind: 'contains' });
    } else if (mayContain.includes(allergen)) {
      conflicts.push({ allergen, severity, kind: 'may-contain' });
    }
  }
  return conflicts;
}

function summarize(status: SafetyStatus, conflicts: Conflict[]): string {
  const flagged = conflicts.filter((c) => c.severity !== 'preference');
  const contains = flagged
    .filter((c) => c.kind === 'contains')
    .map((c) => allergenNoun(c.allergen));
  const mayContain = flagged
    .filter((c) => c.kind === 'may-contain')
    .map((c) => allergenNoun(c.allergen));

  switch (status) {
    case 'safe':
      return 'No conflicts found';
    case 'avoid':
      return `Contains ${joinList(contains)}`;
    case 'caution': {
      // Prefer the definite reason: "Contains milk" beats "May contain soy".
      const intolerance = flagged.find((c) => c.kind === 'contains');
      if (intolerance) return `Contains ${joinList(contains)} (intolerance)`;
      return `May contain ${joinList(mayContain)}`;
    }
    case 'unknown':
      return 'Allergen info unavailable';
  }
}

export function assessItem(item: MenuItem, profile: DietaryProfile | null): SafetyAssessment {
  if (!profile || (profile.avoid.length === 0 && profile.preferences.length === 0)) {
    return {
      status: 'unknown',
      summary: 'Set up your dietary profile',
      conflicts: [],
      unmetPreferences: [],
    };
  }

  const unmetPreferences = profile.preferences.filter((tag) => !item.dietaryTags.includes(tag));

  if (!item.allergens) {
    return {
      status: 'unknown',
      summary: 'Allergen info unavailable',
      conflicts: [],
      unmetPreferences,
    };
  }

  const conflicts = findConflicts(item, profile);
  const status = conflicts.map(statusForConflict).reduce(worstStatus, 'safe' as SafetyStatus);

  return { status, summary: summarize(status, conflicts), conflicts, unmetPreferences };
}

/**
 * Whether an item passes the "Safe for Me" filter. Hides anything marked
 * Avoid, anything that contains a filter-only ingredient, and anything that
 * doesn't meet the student's dietary preferences (e.g. not vegan).
 */
export function isSafeForMe(assessment: SafetyAssessment): boolean {
  if (assessment.status === 'avoid') return false;
  if (assessment.unmetPreferences.length > 0) return false;
  return !assessment.conflicts.some((c) => c.severity === 'preference' && c.kind === 'contains');
}

/** Short description of what the profile filters for, used on Home. */
export function describeProfile(profile: DietaryProfile | null): string | null {
  if (!profile) return null;
  const by = (severity: Severity) =>
    profile.avoid.filter((a) => a.severity === severity).map((a) => allergenNoun(a.allergen));

  const parts: string[] = [];
  const allergies = by('allergy');
  const intolerances = by('intolerance');
  if (allergies.length) parts.push(`${joinList(allergies)} allergy`);
  if (intolerances.length) parts.push(`${joinList(intolerances)} intolerance`);
  if (profile.preferences.length) {
    parts.push(profile.preferences.map((tag) => DIETARY_TAG_LABELS[tag].toLowerCase()).join(', '));
  }
  return parts.length ? parts.join(' · ') : null;
}
