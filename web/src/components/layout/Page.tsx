import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { PAGE_GUTTER, PAGE_WIDTH, type PageWidth } from './pageWidth';

interface PageProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
}

/** Centered content column used by every screen. */
export function Page({ children, width = 'default', className }: PageProps) {
  return (
    <main
      id="main"
      className={cn(
        'mx-auto flex w-full flex-1 flex-col gap-5 py-5 md:py-8',
        PAGE_GUTTER,
        PAGE_WIDTH[width],
        className,
      )}
    >
      {children}
    </main>
  );
}

/**
 * Title area above a page's content (heading, search box, view switch).
 * Sits on the page background, aligned with the content below it.
 */
export function PageIntro({
  children,
  width = 'default',
  className,
}: {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-3 pt-5 md:pt-8',
        PAGE_GUTTER,
        PAGE_WIDTH[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
