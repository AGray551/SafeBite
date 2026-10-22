import { Clock, TriangleAlert } from 'lucide-react';
import { formatUpdatedAt, isStale } from '@/lib/time';

/**
 * "Last updated" line for scraped data. Turns into a warning once data is
 * older than STALE_AFTER_HOURS so students know to double-check.
 */
export function FreshnessNote({
  updatedAt,
  subject = 'Menu',
  variant = 'banner',
}: {
  updatedAt: string;
  subject?: string;
  variant?: 'banner' | 'inline';
}) {
  if (isStale(updatedAt)) {
    if (variant === 'inline') {
      return (
        <p className="m-0 flex items-center gap-1.5 text-sm text-caution-ink">
          <TriangleAlert aria-hidden size={16} className="shrink-0" />
          <span>
            <b>{subject} may be outdated</b> · updated {formatUpdatedAt(updatedAt)}
          </span>
        </p>
      );
    }

    return (
      <div
        role="note"
        className="flex items-start gap-2 rounded-control border-2 border-dashed border-caution bg-caution-tint p-3 text-sm text-caution-ink"
      >
        <TriangleAlert aria-hidden size={18} className="mt-px shrink-0" />
        <span>
          <b>{subject} may be out of date.</b> Last updated {formatUpdatedAt(updatedAt)}. Confirm
          with dining staff before eating.
        </span>
      </div>
    );
  }

  return (
    <p className="m-0 flex items-center gap-1.5 text-caption text-ink-3">
      <Clock aria-hidden size={14} />
      {subject} last updated {formatUpdatedAt(updatedAt)}
    </p>
  );
}
