import { useState } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import type { DietaryProfile } from '@/api/schemas';
import { useProfile } from '@/api/queries';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/QueryState';
import { cn } from '@/lib/cn';
import { EMPTY_DRAFT, type OnboardingContext, type ProfileDraft } from './draft';

const STEPS = [
  { path: 'allergies', label: 'Allergies & intolerances' },
  { path: 'severity', label: 'How strict?' },
  { path: 'preferences', label: 'Dietary preferences' },
] as const;

/**
 * Wraps the three profile steps, holds the shared draft, and renders the
 * header + progress bar. Used both for first-time setup and for editing from
 * Profile (pass ?from=profile to return there afterwards).
 */
export function OnboardingLayout() {
  const { data: profile, isLoading } = useProfile();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const exitTo = searchParams.get('from') === 'profile' ? '/profile' : '/';
  const stepIndex = Math.max(
    0,
    STEPS.findIndex((step) => pathname.endsWith(step.path)),
  );
  const step = STEPS[stepIndex]!;

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="Dietary profile"
        fallbackTo={exitTo}
        className="md:top-0"
        actions={
          <Link to={exitTo} className="flex min-h-11 items-center px-3 text-label font-bold">
            {exitTo === '/profile' ? 'Cancel' : 'Skip for now'}
          </Link>
        }
      />
      <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-5 pt-5 pb-6">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm font-bold text-ink-3">
            Step {stepIndex + 1} of {STEPS.length} · <span className="text-ink">{step.label}</span>
          </p>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-label="Profile setup progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={stepIndex + 1}
          >
            {STEPS.map((s, i) => (
              <div
                key={s.path}
                className={cn('h-1.5 flex-1 rounded-full', i <= stepIndex ? 'bg-brand' : 'bg-line')}
              />
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : (
          <OnboardingSteps initialDraft={toDraft(profile ?? null)} exitTo={exitTo} />
        )}
      </main>
    </div>
  );
}

function toDraft(profile: DietaryProfile | null): ProfileDraft {
  if (!profile) return EMPTY_DRAFT;
  return {
    avoid: profile.avoid,
    preferences: profile.preferences,
    otherPreference: profile.otherPreference ?? '',
    acknowledgedSafetyNotice: profile.acknowledgedSafetyNotice,
  };
}

/**
 * Owns the draft. Split out so the draft can be seeded from the loaded
 * profile with plain useState instead of syncing it in an effect.
 */
function OnboardingSteps({ initialDraft, exitTo }: { initialDraft: ProfileDraft; exitTo: string }) {
  const [draft, setDraft] = useState(initialDraft);
  const context: OnboardingContext = { draft, updateDraft: setDraft, exitTo };
  return <Outlet context={context} />;
}
