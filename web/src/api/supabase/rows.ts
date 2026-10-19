/**
 * Converts between Supabase (database rows, auth sessions) and the app's
 * domain types.
 *
 * Rows are validated with zod on the way in, like every other API response,
 * so a mismatch between the database and the UI fails clearly here. The
 * tables are defined in supabase/migrations/*_student_accounts.sql.
 */
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  avoidanceSchema,
  dietaryTagSchema,
  type DietaryProfile,
  type Favorites,
  type NewReport,
  type Session,
} from '../schemas';

/** Columns of public.dietary_profiles the app reads. */
export const DIETARY_PROFILE_COLUMNS =
  'avoid, preferences, other_preference, acknowledged_safety_notice, updated_at';

const dietaryProfileRowSchema = z
  .object({
    avoid: z.array(avoidanceSchema),
    preferences: z.array(dietaryTagSchema),
    other_preference: z.string().nullable(),
    acknowledged_safety_notice: z.boolean(),
    updated_at: z.string(),
  })
  .transform((row): DietaryProfile => ({
    avoid: row.avoid,
    preferences: row.preferences,
    ...(row.other_preference && { otherPreference: row.other_preference }),
    acknowledgedSafetyNotice: row.acknowledged_safety_notice,
    updatedAt: row.updated_at,
  }));

export function toDietaryProfile(row: unknown): DietaryProfile {
  return dietaryProfileRowSchema.parse(row);
}

export function toDietaryProfileRow(userId: string, profile: Omit<DietaryProfile, 'updatedAt'>) {
  return {
    user_id: userId,
    avoid: profile.avoid,
    preferences: profile.preferences,
    other_preference: profile.otherPreference ?? null,
    acknowledged_safety_notice: profile.acknowledgedSafetyNotice,
  };
}

const favoriteRowsSchema = z.array(
  z.object({ kind: z.enum(['item', 'hall']), target_id: z.string() }),
);

export function toFavorites(rows: unknown): Favorites {
  const favorites: Favorites = { itemIds: [], hallIds: [] };
  for (const { kind, target_id } of favoriteRowsSchema.parse(rows)) {
    (kind === 'item' ? favorites.itemIds : favorites.hallIds).push(target_id);
  }
  return favorites;
}

export function toReportRow(id: string, report: NewReport) {
  return {
    id,
    item_id: report.itemId,
    reason: report.reason,
    notes: report.notes ?? null,
    allow_contact: report.allowContact,
  };
}

/**
 * Supabase's session → the app's Session, with the name typed at sign-up.
 */
export function toSession({ user, access_token }: SupabaseSession): Session {
  const email = user.email ?? '';
  const name: unknown = user.user_metadata?.name;
  return {
    user: {
      id: user.id,
      name: typeof name === 'string' && name.trim() ? name.trim() : nameFromEmail(email),
      email,
    },
    token: access_token,
  };
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'Student';
  return local.charAt(0).toUpperCase() + local.slice(1);
}
