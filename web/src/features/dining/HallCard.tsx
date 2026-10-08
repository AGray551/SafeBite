import { Check, Clock, MapPin, Moon, ShieldCheck, Utensils } from 'lucide-react';
import type { DiningHall, MealPeriod } from '@/api/schemas';
import { ButtonLink } from '@/components/ui/Button';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { cn } from '@/lib/cn';
import { MEAL_PERIOD_LABELS } from '@/lib/labels';
import { formatHours, getOpenStatus } from '@/lib/time';

export interface HallMenuSummary {
  mealPeriod: MealPeriod;
  itemCount: number;
  /** Null when the student has no profile, so "safe" can't be computed. */
  safeCount: number | null;
}

interface HallCardProps {
  hall: DiningHall;
  summary?: HallMenuSummary;
  /** Compact cards (Home) skip hours and menu counts. */
  compact?: boolean;
}

/**
 * Dining hall card. Crowd level and wait time from the wireframe are left out
 * until there's a real data source for them (see README → "Later").
 */
export function HallCard({ hall, summary, compact }: HallCardProps) {
  const status = getOpenStatus(hall.todayHours);

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-card border border-line p-4',
        status.isOpen ? 'bg-surface' : 'border-dashed bg-surface-muted',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className={cn('text-lg', !status.isOpen && 'text-ink-2')}>{hall.name}</h3>
          <p className="m-0 flex flex-wrap items-center gap-1.5 text-sm">
            {status.isOpen ? (
              <span className="inline-flex items-center gap-1 font-extrabold text-safe">
                <Check aria-hidden size={16} strokeWidth={3} />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-extrabold text-ink-2">
                <Moon aria-hidden size={16} />
                Closed
              </span>
            )}
            <span className="text-ink-2">· {status.label}</span>
          </p>
        </div>
        <FavoriteButton kind="hall" id={hall.id} name={hall.name} className="-mt-2 -mr-2" />
      </div>

      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm text-ink-2">
        <li className="flex items-center gap-1.5">
          <MapPin aria-hidden size={16} className="shrink-0" />
          {hall.location}
        </li>
        {!compact && hall.todayHours && (
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden size={16} className="shrink-0" />
            {formatHours(hall.todayHours)}
          </li>
        )}
        {!compact && summary && (
          <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Utensils aria-hidden size={16} />
              {MEAL_PERIOD_LABELS[summary.mealPeriod]} · {summary.itemCount} items
            </span>
            {summary.safeCount !== null && (
              <span className="inline-flex items-center gap-1.5 font-bold text-safe">
                <ShieldCheck aria-hidden size={16} />
                {summary.safeCount} safe for you
              </span>
            )}
          </li>
        )}
      </ul>

      <ButtonLink to={`/dining/${hall.id}`} variant="secondary" size="md">
        View menu
      </ButtonLink>
    </article>
  );
}
