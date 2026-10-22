import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import marketPointePhoto from '@/assets/marketpointe-dining-hall.jpg';
import { LogoMark, WordmarkWithSlogan } from '@/components/ui/Logo';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}

/**
 * A warm, high-focus frame shared by the sign-in, sign-up and verification
 * screens, with the SafeBite logo sitting directly above the form card.
 */
export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(22rem,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative h-58 overflow-hidden bg-ink lg:sticky lg:top-0 lg:h-dvh">
        <img
          src={marketPointePhoto}
          alt="Students gathering at MarketPointe dining hall"
          className="absolute inset-0 size-full object-cover object-[center_68%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/20" />
        <div className="relative mx-auto flex h-full w-full max-w-lg flex-col justify-end px-6 pt-6 pb-5 text-white lg:max-w-none lg:p-10">
          <div className="max-w-md lg:pb-6">
            <p className="m-0 text-sm font-bold tracking-[0.08em] text-white/80 uppercase">
              Your campus menu, made personal
            </p>
            <p className="mt-2 mb-0 max-w-sm text-xl leading-snug font-bold lg:text-3xl">
              Find food that fits your day—and your dietary needs.
            </p>
          </div>
        </div>
      </aside>

      <main
        id="main"
        className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-8 pb-8 lg:min-h-dvh lg:justify-center lg:px-10 lg:py-10"
      >
        <Link
          to="/welcome"
          aria-label="SafeBite home"
          className="mb-6 inline-flex items-center gap-2.5 text-[1.875rem] leading-none text-ink"
        >
          <LogoMark className="size-12 shrink-0" />
          <WordmarkWithSlogan />
        </Link>
        <section className="w-full rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_18px_48px_rgba(26,29,33,0.14)] sm:p-8 lg:p-10">
          <Link
            to="/welcome"
            className="mb-7 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-ink-2 hover:text-brand lg:hidden"
          >
            <ArrowLeft aria-hidden size={18} />
            Back to welcome
          </Link>
          <p className="m-0 text-sm font-extrabold tracking-[0.08em] text-brand uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-xl text-[2rem] leading-[1.08] tracking-tight sm:text-[2.5rem]">
            {title}
          </h1>
          <p className="mt-4 mb-0 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </section>
      </main>
    </div>
  );
}
