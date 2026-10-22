import {
  createClient,
  type Session as SupabaseSession,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { Session } from '@/api/schemas';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Optional for fixture-only local development. Never expose a service-role key here. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, { auth: { detectSessionInUrl: true, flowType: 'pkce' } })
    : null;

const BACKEND_SESSION_KEY = 'safebite.session';

function fallbackName(email: string) {
  const local = email.split('@')[0] || 'Student';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Maps a Supabase session to the app's existing REST API session contract. */
export function toSafeBiteSession(session: SupabaseSession): Session {
  const email = session.user.email ?? '';
  const metadata = session.user.user_metadata;
  const name =
    (typeof metadata.name === 'string' && metadata.name) ||
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    fallbackName(email);
  return { user: { id: session.user.id, name, email }, token: session.access_token };
}

/** Lets the existing REST client forward Supabase's access token. */
export function storeBackendSession(session: Session | null) {
  if (session) localStorage.setItem(BACKEND_SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(BACKEND_SESSION_KEY);
}
