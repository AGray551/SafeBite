import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { MenuItem } from '@/api/schemas';
import { DietaryBadge } from '@/components/ui/DietaryBadge';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { AllergenLine } from '@/features/safety/AllergenLine';
import type { SafetyAssessment } from '@/features/safety/assess';
import { SafetyBadge } from '@/features/safety/SafetyBadge';
import { STATUS_STYLES } from '@/features/safety/statusStyles';
import { cn } from '@/lib/cn';

interface MenuItemCardProps {
  item: MenuItem;
  assessment: SafetyAssessment;
  /** Shown before the station ("CenterCourt · Grill · 540 cal"). */
  hallName?: string;
  /** Replaces the default allergen line, e.g. availability on Favorites. */
  footer?: ReactNode;
  /** Hides the status strip, e.g. items not served today. */
  hideStatus?: boolean;
}

/**
 * Full menu item card: status strip on top, then photo, name, details,
 * dietary badges and allergens. The whole card links to the item.
 */
export function MenuItemCard({
  item,
  assessment,
  hallName,
  footer,
  hideStatus,
}: MenuItemCardProps) {
  const style = STATUS_STYLES[assessment.status];
  const StatusIcon = style.icon;
  const meta = [hallName, item.station, `${item.nutrition.calories} cal`]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      {!hideStatus && (
        <div className={cn('flex items-center gap-2 border-0 border-b-2 px-3.5 py-2', style.tone)}>
          <StatusIcon aria-hidden size={16} strokeWidth={2.5} className="shrink-0" />
          <span className="font-heading text-caption font-extrabold tracking-[0.04em] whitespace-nowrap">
            {style.label}
          </span>
          <span className="truncate text-caption">{assessment.summary}</span>
        </div>
      )}

      <div className="flex gap-3 py-3 pr-2 pl-3.5">
        <ImagePlaceholder className="size-14" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Stretched link: the whole card is clickable, the heart stays separate. */}
          <Link
            to={`/items/${item.id}`}
            className="font-heading text-[1.0625rem] leading-tight font-extrabold text-ink after:absolute after:inset-0 hover:text-ink hover:underline"
          >
            {item.name}
          </Link>
          <div className="text-sm text-ink-3">{meta}</div>
          {item.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.dietaryTags.map((tag) => (
                <DietaryBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
          {footer ?? <AllergenLine allergens={item.allergens} status={assessment.status} />}
        </div>
        <div className="relative z-10 shrink-0">
          <FavoriteButton kind="item" id={item.id} name={item.name} />
        </div>
      </div>
    </article>
  );
}

/** Compact one-line version used for sides, drinks and alternatives. */
export function MenuItemRow({
  item,
  assessment,
  meta,
}: {
  item: MenuItem;
  assessment: SafetyAssessment;
  meta?: string;
}) {
  const details =
    meta ??
    [
      `${item.nutrition.calories} cal`,
      ...item.dietaryTags.slice(0, 2).map((t) => t.replace('-', ' ')),
    ].join(' · ');

  return (
    <Link
      to={`/items/${item.id}`}
      className="flex min-h-16 items-center gap-3 border-b border-line bg-surface px-3.5 py-2.5 text-ink last:border-b-0 hover:bg-surface-muted hover:text-ink"
    >
      <div className="min-w-0 flex-1">
        <div className="font-bold">{item.name}</div>
        <div className="text-caption text-ink-3 first-letter:uppercase">{details}</div>
      </div>
      <SafetyBadge status={assessment.status} size="sm" short />
      <ChevronRight aria-hidden size={20} className="shrink-0 text-ink-3" />
    </Link>
  );
}
