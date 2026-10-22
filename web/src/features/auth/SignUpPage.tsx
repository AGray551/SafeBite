import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AuthShell } from './AuthShell';
import { useAuth } from './authContext';
import { EMAIL_PATTERN, returnPath, verifyEmailPath } from './authRoutes';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  form?: string;
}

export function SignUpPage() {
  const { sendEmailCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const names = { firstName: firstName.trim(), lastName: lastName.trim() };
    const normalizedEmail = email.trim();
    const nextErrors: FieldErrors = {};
    if (!names.firstName) nextErrors.firstName = 'Enter your first name.';
    if (!names.lastName) nextErrors.lastName = 'Enter your last name.';
    if (!EMAIL_PATTERN.test(normalizedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await sendEmailCode(normalizedEmail, { mode: 'sign-up', ...names });
      // Names ride in navigation state rather than the URL.
      navigate(verifyEmailPath(normalizedEmail, 'sign-up', returnPath(location.state)), {
        state: names,
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
      eyebrow="Get started"
      title="Create your SafeBite account"
      description="Save your allergies and preferences, sync favorites across devices and get alerts when a recipe changes."
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="First name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={errors.firstName}
          />
          <TextField
            label="Last name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={errors.lastName}
          />
        </div>
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
          {submitting ? 'Sending code…' : 'Create account'}
        </Button>
      </form>
      <div className="mt-6 rounded-control bg-brand-tint px-4 py-3 text-sm leading-relaxed text-ink-2">
        <strong className="text-ink">Private by design.</strong> We use your email only to sign you
        in and sync your SafeBite profile.
      </div>
      <p className="mt-6 mb-0 text-center text-ink-2">
        Already have an account?{' '}
        <Link
          to="/sign-in"
          state={location.state}
          className="font-bold text-brand hover:text-brand-hover"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
