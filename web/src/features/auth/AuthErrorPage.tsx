import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';

export function AuthErrorPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="Sign-in link expired" fallbackTo="/sign-in" className="md:top-0" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 pt-8 pb-7">
        <div>
          <h2 className="mb-1.5 text-title">We couldn’t sign you in</h2>
          <p className="m-0 text-ink-2">
            This link or code may have expired, already been used, or opened in a different browser.
            Request a new code to continue.
          </p>
        </div>
        <ButtonLink to="/sign-in">Request a new code</ButtonLink>
      </main>
    </div>
  );
}
