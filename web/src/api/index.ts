/**
 * Picks which API implementation the app uses.
 *
 * Dining data: if VITE_API_BASE_URL is set the app talks to the real backend;
 * otherwise it falls back to the in-browser mock so the frontend works on its own.
 *
 * Accounts: if VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set,
 * sign-in and each student's profile, favorites and reports live in Supabase.
 *
 * Set VITE_USE_MOCK_API=true to use the mock for everything, even when the
 * variables above are set.
 */
import type { SafeBiteApi } from './client';
import { createHttpClient } from './http/httpClient';
import { createMockClient } from './mock/mockClient';
import { createSupabase, createSupabaseApi } from './supabase/supabaseClient';

const env = import.meta.env;
const baseUrl = env.VITE_API_BASE_URL;
const forceMock = env.VITE_USE_MOCK_API === 'true';

export const usingMockApi = forceMock || !baseUrl;

const supabase =
  !forceMock && env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createSupabase(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : null;

const dining: SafeBiteApi = usingMockApi
  ? // Mock alerts follow whichever student is signed in to Supabase.
    createMockClient(supabase ? { account: () => api } : {})
  : createHttpClient(
      baseUrl!,
      // The backend verifies the Supabase access token instead of issuing its own.
      supabase
        ? {
            getAccessToken: async () =>
              (await supabase.auth.getSession()).data.session?.access_token,
          }
        : {},
    );

export const api: SafeBiteApi = supabase ? createSupabaseApi(supabase, dining) : dining;

export { ApiError } from './client';
export type * from './client';
