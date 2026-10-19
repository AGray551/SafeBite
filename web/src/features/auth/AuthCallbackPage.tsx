import { CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '@/api';
import { ButtonLink } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/QueryState';
import { useAuth } from './authContext';

/** Supabase reports a failed or expired link as ?error_description=… (or in the #hash). */
function readLinkError(): string | null {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return query.get('error_description') ?? hash.get('error_description');
}

/**
 * Where the link in the sign-up confirmation email lands. The Supabase client
 * signs the student in from the link before this renders; this page only
 * sends them on to profile setup (new students) or Home.
 */
export function AuthCallbackPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [linkError] = useState(readLinkError);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    api.profile
      .get()
      .catch(() => null)
      .then((profile) => {
        if (!cancelled) navigate(profile ? '/' : '/onboarding/allergies', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [session, navigate]);

  if (isLoading || session) return <LoadingState label="Signing you in…" />;

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <CircleAlert aria-hidden size={40} className="text-avoid" />
      <h1 className="text-title">We couldn't sign you in</h1>
      <p role="alert" className="m-0 text-ink-2">
        {linkError ??
          'If you just confirmed your email, your account is ready. Sign in with your email and password.'}
      </p>
      <ButtonLink to="/sign-in" replace block={false} className="mt-2">
        Go to sign in
      </ButtonLink>
    </main>
  );
}
