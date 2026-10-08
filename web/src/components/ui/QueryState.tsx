import { CircleAlert, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

/** Centered spinner with a screen-reader label. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-ink-3">
      <LoaderCircle aria-hidden className="animate-spin" size={22} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong loading this page.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <CircleAlert aria-hidden size={28} className="text-avoid" />
      <p className="m-0 font-bold">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" block={false} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-dashed bg-surface-muted px-6 py-10 text-center">
      {icon && <div className="text-ink-3">{icon}</div>}
      <p className="m-0 font-heading text-lg font-extrabold">{title}</p>
      {children && <div className="text-sm text-ink-2">{children}</div>}
    </div>
  );
}
