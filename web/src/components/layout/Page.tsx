import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Centered content column used by every screen. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      id="main"
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-8',
        className,
      )}
    >
      {children}
    </main>
  );
}
