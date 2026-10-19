/**
 * Student accounts in Supabase: email + password sign-in, dietary profile,
 * favorites and reports.
 *
 * Dining data (halls, menus, items) and safety alerts still come from
 * `dining`, the mock or the REST API, until the scraper writes them to
 * Supabase. Guests have no Supabase session, so their profile and favorites
 * stay with `dining` too, on this device only.
 *
 * The browser talks to the database directly with the publishable key; row
 * level security (supabase/migrations) is what keeps each student's data
 * private.
 */
import {
  createClient,
  type AuthError,
  type PostgrestSingleResponse,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { ApiError, type SafeBiteApi } from '../client';
import type { Favorites } from '../schemas';
import {
  DIETARY_PROFILE_COLUMNS,
  toDietaryProfile,
  toDietaryProfileRow,
  toFavorites,
  toReportRow,
  toSession,
} from './rows';

/** Clearer wording for the auth errors students actually run into. */
const AUTH_MESSAGES: Partial<Record<string, string>> = {
  invalid_credentials: "That email and password don't match. Try again.",
  email_not_confirmed: 'Confirm your email first: open the link we sent you.',
  user_already_exists: 'An account with this email already exists. Sign in instead.',
};

export function createSupabase(url: string, publishableKey: string): SupabaseClient {
  return createClient(url, publishableKey, {
    // PKCE: the email confirmation link carries a one-time code instead of tokens.
    auth: { flowType: 'pkce' },
  });
}

function authError(error: AuthError): ApiError {
  return new ApiError(
    (error.code && AUTH_MESSAGES[error.code]) || error.message,
    error.status ?? 500,
  );
}

/** Returns the rows, or throws an ApiError the screens already know how to show. */
function unwrap<T>(response: PostgrestSingleResponse<T>): T {
  if (response.error) throw new ApiError(response.error.message, response.status);
  return response.data;
}

export function createSupabaseApi(supabase: SupabaseClient, dining: SafeBiteApi): SafeBiteApi {
  /** The signed-in student's id, or null for guests. */
  async function userId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  /** Where the link in the sign-up confirmation email sends students. */
  const callbackUrl = () => new URL('/auth/callback', window.location.origin).href;

  async function loadFavorites(id: string): Promise<Favorites> {
    return toFavorites(
      unwrap(
        await supabase
          .from('favorites')
          .select('kind, target_id')
          .eq('user_id', id)
          .order('created_at'),
      ),
    );
  }

  async function setFavorite(
    kind: 'item' | 'hall',
    targetId: string,
    saved: boolean,
  ): Promise<Favorites> {
    const id = await userId();
    if (!id) {
      return kind === 'item'
        ? dining.favorites.setItem(targetId, saved)
        : dining.favorites.setHall(targetId, saved);
    }
    const row = { user_id: id, kind, target_id: targetId };
    unwrap(
      saved
        ? await supabase.from('favorites').upsert(row, { ignoreDuplicates: true })
        : await supabase.from('favorites').delete().match(row),
    );
    return loadFavorites(id);
  }

  return {
    ...dining,

    auth: {
      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw authError(error);
        return toSession(data.session);
      },
      async signUp({ name, email, password }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: callbackUrl() },
        });
        if (error) throw authError(error);
        // No session yet when the project requires email confirmation.
        return data.session ? toSession(data.session) : null;
      },
      async signOut() {
        // Signs out this device only; the student stays signed in elsewhere.
        await supabase.auth.signOut({ scope: 'local' });
      },
      async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session ? toSession(data.session) : null;
      },
      onSessionChange(listener) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) =>
          listener(session ? toSession(session) : null),
        );
        return () => data.subscription.unsubscribe();
      },
    },

    profile: {
      async get() {
        const id = await userId();
        if (!id) return dining.profile.get();
        const row = unwrap(
          await supabase
            .from('dietary_profiles')
            .select(DIETARY_PROFILE_COLUMNS)
            .eq('user_id', id)
            .maybeSingle(),
        );
        return row ? toDietaryProfile(row) : null;
      },
      async save(profile) {
        const id = await userId();
        if (!id) return dining.profile.save(profile);
        const row = unwrap(
          await supabase
            .from('dietary_profiles')
            .upsert(toDietaryProfileRow(id, profile))
            .select(DIETARY_PROFILE_COLUMNS)
            .single(),
        );
        return toDietaryProfile(row);
      },
      async delete() {
        const id = await userId();
        if (!id) return dining.profile.delete();
        unwrap(await supabase.from('dietary_profiles').delete().eq('user_id', id));
      },
    },

    favorites: {
      async get() {
        const id = await userId();
        return id ? loadFavorites(id) : dining.favorites.get();
      },
      setItem: (itemId, saved) => setFavorite('item', itemId, saved),
      setHall: (hallId, saved) => setFavorite('hall', hallId, saved),
    },

    reports: {
      async submit(report) {
        // Guests can report too, but they may only insert, not read rows
        // back, so the id is made here and the row isn't selected.
        const id = crypto.randomUUID();
        unwrap(await supabase.from('reports').insert(toReportRow(id, report)));
        return { ...report, id, createdAt: new Date().toISOString() };
      },
    },
  };
}
