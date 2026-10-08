import { Bell, ShieldCheck, Utensils, type LucideIcon } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { useAuth } from './authContext';

const FEATURES: { icon: LucideIcon; text: string }[] = [
  { icon: ShieldCheck, text: "See what's safe for your diet" },
  { icon: Utensils, text: "Browse every dining hall's menu" },
  { icon: Bell, text: 'Get alerts when ingredients change' },
];

export function WelcomePage() {
  const { continueAsGuest, hasEntered } = useAuth();
  const navigate = useNavigate();

  // Already signed in (or browsing as a guest), so skip the intro.
  if (hasEntered) return <Navigate to="/" replace />;

  const handleGuest = () => {
    continueAsGuest();
    navigate('/', { replace: true });
  };

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-9 pb-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand text-white">
          <ShieldCheck aria-hidden size={32} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-[2rem] leading-none tracking-tight">SafeBite</h1>
          <p className="mt-1 mb-0 text-sm text-ink-3">University of Cincinnati campus dining</p>
        </div>
      </div>

      <ImagePlaceholder
        className="h-48 w-full rounded-2xl"
        label="Illustration: students at a dining hall"
      />

      <div className="flex flex-col gap-2.5">
        <h2 className="text-[1.75rem] leading-tight">Campus dining made safer and easier.</h2>
        <p className="m-0 text-ink-2">
          Personalize SafeBite with your allergies, intolerances and dietary preferences to see
          what's safe for you at every dining hall.
        </p>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
              <Icon aria-hidden size={20} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2.5">
        <ButtonLink to="/sign-in?mode=create">Get Started</ButtonLink>
        <ButtonLink to="/sign-in" variant="secondary">
          Sign In
        </ButtonLink>
        <button
          type="button"
          onClick={handleGuest}
          className="min-h-11 text-label font-bold text-brand hover:text-brand-hover"
        >
          Continue without an account
        </button>
        <p className="m-0 text-center text-caption text-ink-3">
          Without an account, your profile is saved on this device only.{' '}
          <Link to="/sign-in" className="font-bold">
            Sign in
          </Link>{' '}
          to sync it.
        </p>
      </div>
    </main>
  );
}
