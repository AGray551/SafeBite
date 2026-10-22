import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useProfile } from '@/api/queries';
import { LoadingState } from '@/components/ui/QueryState';
import { useAuth } from './authContext';

function requestedDestination(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('/auth/') ? value : '/';
}

/** Resolves a Supabase magic-link redirect, then chooses the right first screen. */
export function AuthCallbackPage() {
  const { session, isLoading } = useAuth();
  const profileQuery = useProfile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const next = requestedDestination(searchParams.get('next'));

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/auth/error', { replace: true });
    } else if (session && profileQuery.isSuccess) {
      navigate(profileQuery.data ? next : '/onboarding/allergies', { replace: true });
    }
  }, [isLoading, navigate, next, profileQuery.data, profileQuery.isSuccess, session]);

  return <LoadingState />;
}
