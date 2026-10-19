import { ArrowLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/cn';
import { PAGE_WIDTH, type PageWidth } from './pageWidth';

interface PageHeaderProps {
  title?: string;
  /** Where "back" goes if there's no history (e.g. opened from a shared link). */
  fallbackTo?: string;
  /** "close" shows an X instead of an arrow (for modal-style screens). */
  backIcon?: 'back' | 'close';
  actions?: ReactNode;
  /** Match the page's content width so the back button lines up with it. */
  width?: PageWidth;
  className?: string;
}

/**
 * Sticky header with a back button, used on secondary screens. It sticks
 * below the desktop nav when there is one (AppShell sets --app-bar-height).
 */
export function PageHeader({
  title,
  fallbackTo = '/',
  backIcon = 'back',
  actions,
  width = 'default',
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const goBack = () => {
    // history.state.idx is set by React Router; 0 means this is the first page.
    const canGoBack = (window.history.state as { idx?: number } | null)?.idx;
    if (canGoBack) navigate(-1);
    else navigate(fallbackTo, { replace: true });
  };

  const Icon = backIcon === 'close' ? X : ArrowLeft;

  return (
    <header
      className={cn(
        'sticky top-[var(--app-bar-height,0px)] z-20 shrink-0 border-b border-line bg-surface',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-15 w-full items-center gap-1 px-2 md:px-3.5',
          PAGE_WIDTH[width],
        )}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label={backIcon === 'close' ? 'Close' : 'Back'}
          className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-canvas"
        >
          <Icon aria-hidden size={24} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg">{title}</h1>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}
