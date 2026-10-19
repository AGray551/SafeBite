import { ArrowLeft, ArrowRight, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import diningHallPhoto from '@/assets/welcome-dining-hall.webp';
import { Button, ButtonLink } from '@/components/ui/Button';
import { LogoMark, Wordmark } from '@/components/ui/Logo';
import { AllergenChip } from '@/features/safety/AllergenChip';
import { SafetyBadge } from '@/features/safety/SafetyBadge';
import type { SafetyStatus } from '@/features/safety/assess';
import { cn } from '@/lib/cn';
import { useAuth } from './authContext';

interface Slide {
  eyebrow: string;
  title: string;
  body: ReactNode;
  /** Example UI shown above the text. The first slide uses the photo instead. */
  visual?: ReactNode;
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'For UC students with food allergies and dietary needs',
    title: 'Eat with everyone. Skip the guesswork.',
    body: "A dining hall trip can mean reading labels, asking staff and hoping the recipe didn't change since last week. SafeBite does the checking for you.",
  },
  {
    eyebrow: 'Step 1 · Your profile',
    title: 'Tell us what you avoid, once.',
    body: 'Add allergies, intolerances and preferences like vegan or halal, and say how strict each one is. You can change it any time.',
    visual: <ProfileExample />,
  },
  {
    eyebrow: 'Step 2 · Every menu',
    title: "See what's safe before you get in line.",
    body: (
      <>
        Menu items at each campus dining location are checked against your profile. Every result has
        a word and an icon, never just a color. If you're unsure, always confirm with dining staff.
      </>
    ),
    visual: <MenuExample />,
  },
  {
    eyebrow: 'Step 3 · Alerts',
    title: 'Know when a recipe changes.',
    body: 'If a dish you saved picks up an ingredient you avoid, SafeBite tells you, so a favorite never surprises you.',
    visual: <AlertExample />,
  },
];

/**
 * First screen for new visitors: a short story about what SafeBite does,
 * ending with the sign-up choices. "Sign in" stays in the corner throughout
 * for returning students.
 */
export function WelcomePage() {
  const { continueAsGuest, hasEntered } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  // Already signed in (or browsing as a guest), so skip the intro.
  if (hasEntered) return <Navigate to="/" replace />;

  const slide = SLIDES[index]!;
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  const handleGuest = () => {
    continueAsGuest();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      {/* The photo leads the story on phones and stays alongside it on wider screens. */}
      <div
        className={cn(
          'relative h-60 overflow-hidden md:sticky md:top-0 md:block md:h-dvh',
          !isFirst && 'hidden',
        )}
      >
        <img
          src={diningHallPhoto}
          alt="Students eating together at tables in a busy, sunlit campus dining hall"
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      <main
        id="main"
        className={cn(
          'mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-6 pb-6 md:min-h-dvh md:justify-center md:py-12',
          isFirst ? 'min-h-[calc(100dvh-15rem)]' : 'min-h-dvh',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-[1.625rem] leading-none">
            <LogoMark className="size-10 shrink-0 text-ink" />
            <Wordmark />
          </h1>
          <Link to="/sign-in" className="flex min-h-11 items-center px-1 text-label font-bold">
            Sign in
          </Link>
        </div>

        <section
          aria-roledescription="carousel"
          aria-label="About SafeBite"
          className="flex flex-col gap-5"
        >
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}`}
            className="flex animate-story-in flex-col gap-5"
          >
            {slide.visual && <div aria-hidden>{slide.visual}</div>}
            <div className="flex flex-col gap-2.5">
              <p className="m-0 text-sm font-bold text-brand">{slide.eyebrow}</p>
              <h2 className="text-[1.75rem] leading-tight">{slide.title}</h2>
              <p className="m-0 text-ink-2">{slide.body}</p>
            </div>
          </div>

          {/* Announces slide changes; the slide itself is re-mounted to replay its animation. */}
          <p className="sr-only" aria-live="polite">
            Slide {index + 1} of {SLIDES.length}: {slide.title}
          </p>

          <div className="flex items-center gap-1" role="group" aria-label="Choose a slide">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                aria-current={i === index ? 'step' : undefined}
                className="flex size-6 items-center justify-center rounded-full"
              >
                <span
                  className={cn(
                    'block h-2 rounded-full transition-all',
                    i === index ? 'w-5 bg-brand' : 'w-2 bg-line-strong',
                  )}
                />
              </button>
            ))}
          </div>
        </section>

        <div className="mt-auto flex flex-col gap-2.5 md:mt-2">
          {isLast ? (
            <>
              <ButtonLink to="/sign-in?mode=create">Get started</ButtonLink>
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
            </>
          ) : (
            <>
              <div className="flex gap-2.5">
                {!isFirst && (
                  <Button
                    variant="secondary"
                    block={false}
                    aria-label="Previous"
                    onClick={() => setIndex(index - 1)}
                  >
                    <ArrowLeft aria-hidden size={20} />
                  </Button>
                )}
                <Button className="flex-1" onClick={() => setIndex(index + 1)}>
                  Next
                  <ArrowRight aria-hidden size={20} />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setIndex(SLIDES.length - 1)}
                className="min-h-11 text-label font-bold text-ink-2 hover:text-ink"
              >
                Skip intro
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/** Small framed card used for the example UI on each slide. */
function ExampleCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <p className="m-0 font-heading text-xs font-extrabold tracking-[0.08em] text-ink-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function ProfileExample() {
  return (
    <ExampleCard title="YOUR PROFILE">
      <div className="flex flex-wrap gap-2">
        <AllergenChip allergen="peanuts" tone="avoid" note="allergy" />
        <AllergenChip allergen="milk" tone="caution" note="intolerance" />
        <span className="inline-flex min-h-8 items-center rounded-full border-2 border-line-strong bg-surface px-2.5 text-sm font-bold text-ink-2">
          Halal
        </span>
      </div>
    </ExampleCard>
  );
}

const EXAMPLE_MENU: { name: string; station: string; status: SafetyStatus }[] = [
  { name: 'Grilled Chicken Bowl', station: 'Grill', status: 'safe' },
  { name: 'Mac & Cheese', station: 'Home Style', status: 'caution' },
  { name: 'Peanut Noodles', station: 'Wok', status: 'avoid' },
];

function MenuExample() {
  return (
    <ExampleCard title="CENTERCOURT · LUNCH">
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {EXAMPLE_MENU.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-bold">{item.name}</span>
              <span className="block text-caption text-ink-3">{item.station}</span>
            </span>
            <SafetyBadge status={item.status} size="sm" short />
          </li>
        ))}
      </ul>
    </ExampleCard>
  );
}

function AlertExample() {
  return (
    <ExampleCard title="SAFETY ALERT">
      <div className="flex items-center gap-3 rounded-control border-[3px] border-avoid bg-avoid-fill p-3 text-sm text-on-avoid">
        <TriangleAlert size={20} className="shrink-0" />
        <span>
          <b>Ingredient update:</b> Veggie Stir-Fry may now contain peanuts.
        </span>
      </div>
    </ExampleCard>
  );
}
