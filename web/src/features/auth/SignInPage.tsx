import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { api } from '@/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from './authContext';

type Mode = 'sign-in' | 'create';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate(mode: Mode, name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (mode === 'create' && !name.trim()) errors.name = 'Enter your name.';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  else if (mode === 'create' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}

export function SignInPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: Mode = searchParams.get('mode') === 'create' ? 'create' : 'sign-in';
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setMode = (next: Mode) => {
    setErrors({});
    setSearchParams(next === 'create' ? { mode: 'create' } : {}, { replace: true });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(mode, name, email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'create') {
        await signUp({ name: name.trim(), email, password });
        navigate('/onboarding/allergies', { replace: true });
        return;
      }
      await signIn({ email, password });
      // Returning students go where they were headed; new ones set up a profile.
      const profile = await api.profile.get();
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(profile ? (from ?? '/') : '/onboarding/allergies', { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Sign in failed. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = mode === 'create';

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader fallbackTo="/welcome" className="md:top-0" />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 pt-5 pb-7">
        <SegmentedControl<Mode>
          label="Account"
          value={mode}
          onChange={setMode}
          segments={[
            { value: 'sign-in', label: 'Sign In' },
            { value: 'create', label: 'Create Account' },
          ]}
        />

        <div>
          <h2 className="mb-1.5 text-title">{isCreate ? 'Create your account' : 'Welcome back'}</h2>
          <p className="m-0 text-ink-2">
            {isCreate
              ? 'Save your dietary profile and favorites across devices.'
              : 'Sign in with your university email to load your dietary profile.'}
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isCreate && (
            <TextField
              label="Name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          )}
          <TextField
            label="University email"
            type="email"
            autoComplete="email"
            placeholder="yourname@mail.uc.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isCreate ? 'new-password' : 'current-password'}
            placeholder={isCreate ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Enter password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            trailing={
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
              </IconButton>
            }
          />

          {!isCreate && (
            // TODO: wire up once the backend supports password reset.
            <button
              type="button"
              className="min-h-11 self-start text-label font-bold text-brand"
              onClick={() => setErrors({ form: 'Password reset is not available yet.' })}
            >
              Forgot password?
            </button>
          )}

          {errors.form && (
            <p role="alert" className="m-0 font-bold text-avoid">
              {errors.form}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isCreate ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-auto mb-0 text-center text-caption text-ink-3">
          Your SafeBite account is separate from your UC login.
        </p>
      </main>
    </div>
  );
}
