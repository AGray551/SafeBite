import type { AuthMode } from './authContext';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where to send the student after signing in, from the guarded route that bounced them. */
export function returnPath(state: unknown): string {
  const from = (state as { from?: { pathname: string } } | null)?.from?.pathname;
  return from?.startsWith('/') ? from : '/';
}

/** The code-entry screen for an email code sent from the given flow. */
export function verifyEmailPath(email: string, mode: AuthMode, next: string): string {
  const params = new URLSearchParams({ email, mode, next });
  return `/verify-email?${params.toString()}`;
}
