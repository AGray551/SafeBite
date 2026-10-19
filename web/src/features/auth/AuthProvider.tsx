import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type SignInInput, type SignUpInput } from '@/api';
import { queryKeys } from '@/api/queries';
import type { Session } from '@/api/schemas';
import { AuthContext, type AuthContextValue } from './authContext';

const GUEST_KEY = 'safebite.guest';

function readGuestFlag(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Holds the signed-in session (or guest mode) for the whole app.
 *
 * Students can use SafeBite without an account ("Continue without an
 * account"); in that case their profile and favorites live only on this
 * device.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isGuest, setIsGuest] = useState(readGuestFlag);

  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: api.auth.getSession,
    staleTime: Infinity,
  });

  const setGuest = useCallback((value: boolean) => {
    setIsGuest(value);
    if (value) localStorage.setItem(GUEST_KEY, 'true');
    else localStorage.removeItem(GUEST_KEY);
  }, []);

  const applySession = useCallback(
    (session: Session | null) => {
      const previous = queryClient.getQueryData<Session | null>(queryKeys.session);
      queryClient.setQueryData(queryKeys.session, session);
      if (session) setGuest(false);
      // Profile, favorites and alerts are per-user, so refetch them when the user changes.
      if (previous?.user.id !== session?.user.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
        void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      }
    },
    [queryClient, setGuest],
  );

  // Email confirmation links, token refreshes and other tabs change the session too.
  useEffect(() => api.auth.onSessionChange(applySession), [applySession]);

  const signInMutation = useMutation({
    mutationFn: (input: SignInInput) => api.auth.signIn(input),
    onSuccess: applySession,
  });

  const signUpMutation = useMutation({
    mutationFn: (input: SignUpInput) => api.auth.signUp(input),
    // No session yet means "check your email"; nothing changes until they confirm.
    onSuccess: (session) => session && applySession(session),
  });

  const signOutMutation = useMutation({
    mutationFn: api.auth.signOut,
    onSuccess: () => {
      setGuest(false);
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.removeQueries({ queryKey: queryKeys.profile });
      queryClient.removeQueries({ queryKey: queryKeys.favorites });
      queryClient.removeQueries({ queryKey: queryKeys.alerts });
    },
  });

  const session = sessionQuery.data ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isGuest,
      hasEntered: Boolean(session) || isGuest,
      isLoading: sessionQuery.isLoading,
      continueAsGuest: () => setGuest(true),
      signIn: signInMutation.mutateAsync,
      signUp: signUpMutation.mutateAsync,
      signOut: signOutMutation.mutateAsync,
    }),
    [
      session,
      isGuest,
      sessionQuery.isLoading,
      setGuest,
      signInMutation.mutateAsync,
      signUpMutation.mutateAsync,
      signOutMutation.mutateAsync,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
