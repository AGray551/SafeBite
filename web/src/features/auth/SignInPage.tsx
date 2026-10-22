import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AuthShell } from './AuthShell';
import { useAuth } from './authContext';
import { EMAIL_PATTERN, returnPath, verifyEmailPath } from './authRoutes';

interface FieldErrors {
  email?: string;
  form?: string;
}

export function SignInPage() {
  const { sendEmailCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await sendEmailCode(normalizedEmail, { mode: 'sign-in' });
      navigate(verifyEmailPath(normalizedEmail, 'sign-in', returnPath(location.state)), {
        state: location.state,
      });
    } catch (cause) {
      setErrors({
        form: cause instanceof Error ? cause.message : 'We could not send a code. Try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to SafeBite"
      description="Enter the email you signed up with and we’ll send a one-time code. No password to remember."
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label="University email"
          type="email"
          autoComplete="email"
          placeholder="yourname@mail.uc.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        {errors.form && (
          <p role="alert" className="m-0 font-bold text-avoid">
            {errors.form}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending code…' : 'Email me a code'}
        </Button>
      </form>
      <p className="mt-6 mb-0 text-center text-ink-2">
        New to SafeBite?{' '}
        <Link
          to="/sign-up"
          state={location.state}
          className="font-bold text-brand hover:text-brand-hover"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
