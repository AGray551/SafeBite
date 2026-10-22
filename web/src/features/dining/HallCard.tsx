import { Check, ChevronRight, Clock, MapPin, Moon, ShieldCheck, Utensils } from 'lucide-react';
import { Link } from 'react-router';
import type { DiningHall, LocationCategory, MealPeriod } from '@/api/schemas';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { cn } from '@/lib/cn';
import { MEAL_PERIOD_LABELS, safeItemsLabel } from '@/lib/labels';
import { formatHours, getOpenStatus } from '@/lib/time';
import { categoryLine, LOCATION_CATEGORY_META, primaryTag, tagFor } from './locationCategories';
import { HallBrandMark } from './hallBranding';
import { hasHallBrandMark } from './hallLogos';

export interface HallMenuSummary {
  mealPeriod: MealPeriod;
  itemCount: number;
  /** Null when the student has no profile, so "safe" can't be computed. */
  safeCount: number | null;
  /** Average SafeBite nutrition estimate across scoreable meal items. */
  averageHealthScore: number | null;
  scoredItemCount: number;
}

interface HallCardProps {
  hall: DiningHall;
  summary?: HallMenuSummary;
  /** Compact cards (Home) skip hours and the item count. */
  compact?: boolean;
  /**
   * The category section the card is shown in. Its classification leads the
   * tags (e.g. "Signature Meal Exchange"); defaults to the main category.
   */
  category?: LocationCategory;
}

/**
 * Dining hall card. The whole card links to the menu: the name's link
 * stretches over the card, and the favorite button sits above it.
 * Crowd level and wait time from the wireframe are left out until there's a
 * real data source for them (see README → "Later").
 */
export function HallCard({ hall, summary, compact, category }: HallCardProps) {
  const status = getOpenStatus(hall.todayHours);
  const lead = (category && tagFor(hall, category)) ?? primaryTag(hall);
  const KindIcon = LOCATION_CATEGORY_META[lead.category].icon;
  const line = categoryLine(hall, category);
  const hasBrandMark = hasHallBrandMark(hall);

  return (
    <article
      className={cn(
        'relative flex flex-col gap-3 rounded-card border border-line p-4 transition-colors hover:border-line-strong',
        status.isOpen ? 'bg-surface' : 'border-dashed bg-surface-muted',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1" aria-hidden>
          {hasBrandMark ? (
            <HallBrandMark hall={hall} size="featured" />
          ) : (
            <span
              className={cn(
                'flex size-16 items-center justify-center rounded-control',
                status.isOpen ? 'bg-canvas text-ink-2' : 'bg-placeholder text-ink-3',
              )}
            >
              <KindIcon size={28} />
            </span>
          )}
        </span>
        <FavoriteButton
          kind="hall"
          id={hall.id}
          name={hall.name}
          className="relative z-10 -mt-2 -mr-2"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-lg leading-tight">
          <Link
            to={`/dining/${hall.id}`}
            className={cn(
              'after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand',
              status.isOpen ? 'text-ink hover:text-ink' : 'text-ink-2 hover:text-ink-2',
            )}
          >
            {hall.name}
          </Link>
        </h3>
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
        {line && <p className="m-0 text-sm text-ink-3">{line}</p>}
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
          <li className="flex items-center gap-1.5">
            <Utensils aria-hidden size={16} className="shrink-0" />
            {MEAL_PERIOD_LABELS[summary.mealPeriod]} · {summary.itemCount} items
          </li>
        )}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
        {summary?.safeCount != null ? <SafeCount count={summary.safeCount} /> : <span />}
        <span aria-hidden className="inline-flex items-center gap-0.5 font-bold text-brand">
          View menu
          <ChevronRight size={16} />
        </span>
      </div>
    </article>
  );
}

/**
 * "3 safe items for you" in green, or a neutral note when there are none, so
 * a zero never reads as good news.
 */
export function SafeCount({ count }: { count: number }) {
  if (count === 0) return <span className="text-ink-3">No safe items right now</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-bold text-safe">
      <ShieldCheck aria-hidden size={16} />
      {safeItemsLabel(count)} for you
    </span>
  );
}
