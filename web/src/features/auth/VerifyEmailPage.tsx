import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AuthShell } from './AuthShell';
import { useAuth, type AuthMode, type SendEmailCodeOptions } from './authContext';

const RESEND_DELAY_SECONDS = 60;

function requestedDestination(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('/auth/') ? value : '/';
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const next = requestedDestination(searchParams.get('next'));
  const mode: AuthMode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in';
  const names = useLocation().state as Pick<SendEmailCodeOptions, 'firstName' | 'lastName'> | null;
  const codeOptions: SendEmailCodeOptions = { mode, ...names };
  const startPath = mode === 'sign-up' ? '/sign-up' : '/sign-in';
  const { sendEmailCode, verifyEmailCode } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [secondsUntilResend, setSecondsUntilResend] = useState(RESEND_DELAY_SECONDS);

  useEffect(() => {
    if (!email) navigate(startPath, { replace: true });
  }, [email, navigate, startPath]);

  useEffect(() => {
    if (!secondsUntilResend) return;
    const timeout = window.setTimeout(() => setSecondsUntilResend((value) => value - 1), 1_000);
    return () => window.clearTimeout(timeout);
  }, [secondsUntilResend]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError('Enter the six-digit code from your email.');
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await verifyEmailCode(email, code, codeOptions);
      navigate(`/auth/callback?next=${encodeURIComponent(next)}`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That code could not be verified.');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await sendEmailCode(email, codeOptions);
      setSecondsUntilResend(RESEND_DELAY_SECONDS);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not send another code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) return null;
  return (
    <AuthShell
      eyebrow="Check your inbox"
      title={
        mode === 'sign-up'
          ? 'Confirm your email to finish signing up.'
          : 'Your sign-in code is on its way.'
      }
      description={
        <>
          Enter the six-digit code we sent to <strong className="text-ink">{email}</strong>.
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label="Six-digit code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          error={error}
        />
        <Button type="submit" disabled={submitting}>
          {submitting
            ? 'Verifying…'
            : mode === 'sign-up'
              ? 'Verify and create account'
              : 'Verify and sign in'}
        </Button>
      </form>
      <div className="mt-6 flex flex-col items-start gap-2 text-sm text-ink-2">
        {secondsUntilResend ? (
          <span>You can request another code in {secondsUntilResend}s.</span>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void resend()}
            className="min-h-11 font-bold text-brand hover:text-brand-hover disabled:text-ink-3"
          >
            Send a new code
          </button>
        )}
        <Link to={startPath} className="min-h-11 pt-2 font-bold text-brand hover:text-brand-hover">
          Use a different email
        </Link>
      </div>
    </AuthShell>
  );
}
