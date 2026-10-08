import { ArrowLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title?: string;
  /** Where "back" goes if there's no history (e.g. opened from a shared link). */
  fallbackTo?: string;
  /** "close" shows an X instead of an arrow (for modal-style screens). */
  backIcon?: 'back' | 'close';
  actions?: ReactNode;
  className?: string;
}

/** Sticky white header with a back button, used on secondary screens. */
export function PageHeader({
  title,
  fallbackTo = '/',
  backIcon = 'back',
  actions,
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
        'sticky top-0 z-20 flex h-15 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 md:top-16',
        className,
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
    </header>
  );
}
