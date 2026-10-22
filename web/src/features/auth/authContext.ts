import { createContext, useContext } from 'react';
import type { Session, User } from '@/api/schemas';

/** Which flow an email code belongs to. */
export type AuthMode = 'sign-in' | 'sign-up';

export interface SendEmailCodeOptions {
  /** "sign-in" refuses unknown emails; "sign-up" creates the account. */
  mode: AuthMode;
  /** Saved on a new account. */
  firstName?: string;
  lastName?: string;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True when the student chose "Continue without an account". */
  isGuest: boolean;
  /** Signed in or browsing as a guest, i.e. past the welcome screen. */
  hasEntered: boolean;
  isLoading: boolean;
  continueAsGuest: () => void;
  sendEmailCode: (email: string, options?: SendEmailCodeOptions) => Promise<void>;
  verifyEmailCode: (
    email: string,
    code: string,
    options?: SendEmailCodeOptions,
  ) => Promise<Session>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
