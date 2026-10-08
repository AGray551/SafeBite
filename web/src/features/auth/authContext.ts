import { createContext, useContext } from 'react';
import type { SignInInput, SignUpInput } from '@/api';
import type { Session, User } from '@/api/schemas';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True when the student chose "Continue without an account". */
  isGuest: boolean;
  /** Signed in or browsing as a guest, i.e. past the welcome screen. */
  hasEntered: boolean;
  isLoading: boolean;
  continueAsGuest: () => void;
  signIn: (input: SignInInput) => Promise<Session>;
  signUp: (input: SignUpInput) => Promise<Session>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
