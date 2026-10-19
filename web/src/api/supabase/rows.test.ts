import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { toDietaryProfile, toDietaryProfileRow, toFavorites, toReportRow, toSession } from './rows';

function supabaseSession(user: Partial<SupabaseSession['user']>): SupabaseSession {
  return {
    access_token: 'jwt',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-10-19T00:00:00Z',
      ...user,
    },
  };
}

describe('Supabase rows', () => {
  it('round-trips a dietary profile', () => {
    const row = toDietaryProfileRow('user-1', {
      avoid: [{ allergen: 'peanuts', severity: 'allergy' }],
      preferences: ['vegan'],
      acknowledgedSafetyNotice: true,
    });
    expect(row).toEqual({
      user_id: 'user-1',
      avoid: [{ allergen: 'peanuts', severity: 'allergy' }],
      preferences: ['vegan'],
      other_preference: null,
      acknowledged_safety_notice: true,
    });

    const { user_id: _userId, ...stored } = row;
    expect(toDietaryProfile({ ...stored, updated_at: '2026-10-19T21:28:45.303817+00:00' })).toEqual(
      {
        avoid: [{ allergen: 'peanuts', severity: 'allergy' }],
        preferences: ['vegan'],
        acknowledgedSafetyNotice: true,
        updatedAt: '2026-10-19T21:28:45.303817+00:00',
      },
    );
  });

  it('rejects profile rows the UI would misread', () => {
    expect(() =>
      toDietaryProfile({
        avoid: [{ allergen: 'peanuts', severity: 'very-bad' }],
        preferences: [],
        other_preference: null,
        acknowledged_safety_notice: true,
        updated_at: '2026-10-19T00:00:00Z',
      }),
    ).toThrow();
  });

  it('splits favorites into items and halls', () => {
    expect(
      toFavorites([
        { kind: 'item', target_id: 'cc-brown-rice' },
        { kind: 'hall', target_id: 'centercourt' },
      ]),
    ).toEqual({ itemIds: ['cc-brown-rice'], hallIds: ['centercourt'] });
  });

  it('maps a report to its columns', () => {
    expect(toReportRow('r1', { itemId: 'cc-pizza', reason: 'other', allowContact: false })).toEqual(
      {
        id: 'r1',
        item_id: 'cc-pizza',
        reason: 'other',
        notes: null,
        allow_contact: false,
      },
    );
  });

  it('uses the name from sign-up, or falls back to the email', () => {
    const named = toSession(
      supabaseSession({ email: 'kingcm@mail.uc.edu', user_metadata: { name: ' Conner ' } }),
    );
    expect(named).toEqual({
      user: { id: 'user-1', name: 'Conner', email: 'kingcm@mail.uc.edu' },
      token: 'jwt',
    });
    expect(toSession(supabaseSession({ email: 'kingcm@mail.uc.edu' })).user.name).toBe('Kingcm');
  });
});
