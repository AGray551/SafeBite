import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, usingMockApi } from '@/api';
import { queryKeys } from '@/api/queries';
import type { Session } from '@/api/schemas';
import { storeBackendSession, supabase, toSafeBiteSession } from '@/lib/supabase';
import { AuthContext, type AuthContextValue, type SendEmailCodeOptions } from './authContext';

const GUEST_KEY = 'safebite.guest';

function readGuestFlag(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === 'true';
  } catch {
    return false;
  }
}

function fullName({ firstName, lastName }: SendEmailCodeOptions): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

/** Holds the signed-in session (or device-only guest mode) for the whole app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isGuest, setIsGuest] = useState(readGuestFlag);

  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      if (!supabase) return api.auth.getSession();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session ? toSafeBiteSession(data.session) : null;
    },
    staleTime: Infinity,
  });

  const setGuest = useCallback((value: boolean) => {
    setIsGuest(value);
    if (value) localStorage.setItem(GUEST_KEY, 'true');
    else localStorage.removeItem(GUEST_KEY);
  }, []);

  const onSignedIn = useCallback(
    (session: Session) => {
      setGuest(false);
      storeBackendSession(session);
      queryClient.setQueryData(queryKeys.session, session);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
    [queryClient, setGuest],
  );

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) onSignedIn(toSafeBiteSession(nextSession));
      else {
        storeBackendSession(null);
        queryClient.setQueryData(queryKeys.session, null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [onSignedIn, queryClient]);

  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        await api.auth.signOut();
      }
    },
    onSuccess: () => {
      setGuest(false);
      storeBackendSession(null);
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
      sendEmailCode: async (email, options = { mode: 'sign-in' }) => {
        if (!supabase) {
          if (usingMockApi) return;
          throw new Error('Email sign-in requires Supabase to be configured.');
        }
        const isSignUp = options.mode === 'sign-up';
        const name = fullName(options);
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: isSignUp,
            data:
              isSignUp && name
                ? { name, first_name: options.firstName, last_name: options.lastName }
                : undefined,
          },
        });
        if (error) {
          // Supabase refuses OTP sign-in for an email with no account.
          if (!isSignUp && /signups not allowed/i.test(error.message)) {
            throw new Error('No SafeBite account uses that email yet. Sign up to create one.');
          }
          throw error;
        }
      },
      verifyEmailCode: async (email, code, options) => {
        if (!supabase) {
          if (!usingMockApi) throw new Error('Email sign-in requires Supabase to be configured.');
          if (code !== '123456') throw new Error('Use 123456 while running the mock app.');
          const name = options && fullName(options);
          const mockSession =
            options?.mode === 'sign-up' && name
              ? await api.auth.signUp({ name, email, password: 'mock-code' })
              : await api.auth.signIn({ email, password: 'mock-code' });
          if (!mockSession) throw new Error('No session was returned. Try signing in.');
          onSignedIn(mockSession);
          return mockSession;
        }
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: 'email',
        });
        if (error) throw error;
        if (!data.session)
          throw new Error('No session was returned. Request a new code and try again.');
        const nextSession = toSafeBiteSession(data.session);
        onSignedIn(nextSession);
        return nextSession;
      },
      signOut: signOutMutation.mutateAsync,
    }),
    [isGuest, onSignedIn, session, sessionQuery.isLoading, setGuest, signOutMutation.mutateAsync],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
