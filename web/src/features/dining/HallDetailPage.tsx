import {
  ChevronDown,
  Clock,
  EyeOff,
  MapPin,
  Moon,
  Navigation,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useHall, useMenu } from '@/api/queries';
import type { DiningHall, MealPeriod } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import {
  matchesQuickFilters,
  QUICK_FILTERS,
  toggleInSet,
  type QuickFilter,
} from '@/features/menu/filters';
import { categoryAnchor, COMPACT_CATEGORIES, groupByCategory } from '@/features/menu/grouping';
import { MenuItemCard, MenuItemRow } from '@/features/menu/MenuItemCard';
import { isSafeForMe } from '@/features/safety/assess';
import { FreshnessNote } from '@/features/safety/FreshnessNote';
import { useSafety } from '@/features/safety/useSafety';
import { MEAL_PERIOD_LABELS } from '@/lib/labels';
import { currentMealPeriod, formatHours, getOpenStatus, toDateKey } from '@/lib/time';

/** Sections after this many start collapsed to keep the page scannable. */
const EXPANDED_SECTIONS = 3;

export function HallDetailPage() {
  const { hallId = '' } = useParams();
  const hallQuery = useHall(hallId);
  const hall = hallQuery.data;

  return (
    <>
      <PageHeader
        title={hall?.name}
        fallbackTo="/dining"
        actions={hall && <FavoriteButton kind="hall" id={hall.id} name={hall.name} />}
      />
      {hallQuery.isLoading && <LoadingState />}
      {hallQuery.isError && (
        <ErrorState
          message="We couldn't find that dining hall."
          onRetry={() => void hallQuery.refetch()}
        />
      )}
      {hall && <HallMenu hall={hall} />}
    </>
  );
}

function HallMenu({ hall }: { hall: DiningHall }) {
  const now = currentMealPeriod();
  const [mealPeriod, setMealPeriod] = useState<MealPeriod>(
    hall.mealPeriods.includes(now) ? now : (hall.mealPeriods[0] ?? now),
  );
  const menuQuery = useMenu(hall.id, { date: toDateKey(), mealPeriod });
  const { profile, assess } = useSafety();

  const [safeOnly, setSafeOnly] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [filters, setFilters] = useState<ReadonlySet<QuickFilter>>(new Set());

  const status = getOpenStatus(hall.todayHours);

  const { visible, hiddenCount, total } = useMemo(() => {
    const entries = (menuQuery.data?.items ?? [])
      .map((item) => ({ item, assessment: assess(item) }))
      .filter(({ item }) => matchesQuickFilters(item, filters));
    // "Safe for Me" only applies once the student has a profile.
    const applySafeFilter = safeOnly && profile && !showHidden;
    const shown = applySafeFilter ? entries.filter((e) => isSafeForMe(e.assessment)) : entries;
    return { visible: shown, hiddenCount: entries.length - shown.length, total: entries.length };
  }, [menuQuery.data, assess, filters, safeOnly, profile, showHidden]);

  const sections = groupByCategory(visible);

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    hall.address ?? `${hall.name}, University of Cincinnati`,
  )}`;

  return (
    <Page>
      <section className="flex flex-col gap-2">
        <h2 className="text-title">{hall.name}</h2>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-label text-ink-2">
          <li className="flex items-center gap-1.5">
            {status.isOpen ? (
              <span className="inline-flex items-center gap-1 font-extrabold text-safe">
                <Check aria-hidden size={16} strokeWidth={3} /> Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-extrabold">
                <Moon aria-hidden size={16} /> Closed
              </span>
            )}
            · {status.label}
          </li>
          {hall.todayHours && (
            <li className="flex items-center gap-1.5">
              <Clock aria-hidden size={16} /> Today {formatHours(hall.todayHours)}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <MapPin aria-hidden size={16} /> {hall.location}
          </li>
        </ul>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 self-start rounded-control border-2 border-brand bg-surface px-4 font-heading text-label font-bold"
        >
          <Navigation aria-hidden size={18} />
          Directions
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </section>

      {hall.mealPeriods.length > 1 && (
        <SegmentedControl<MealPeriod>
          as="tabs"
          label="Meal period"
          value={mealPeriod}
          onChange={setMealPeriod}
          segments={hall.mealPeriods.map((p) => ({ value: p, label: MEAL_PERIOD_LABELS[p] }))}
        />
      )}

      {menuQuery.isLoading && <LoadingState label="Loading menu…" />}
      {menuQuery.isError && <ErrorState onRetry={() => void menuQuery.refetch()} />}

      {menuQuery.data && (
        <>
          <FreshnessNote updatedAt={menuQuery.data.updatedAt} />

          <ChipRow label="Menu filters">
            {profile && (
              <Chip
                active={safeOnly}
                icon={<ShieldCheck aria-hidden size={16} />}
                onClick={() => {
                  setSafeOnly((v) => !v);
                  setShowHidden(false);
                }}
              >
                Safe for Me
              </Chip>
            )}
            {QUICK_FILTERS.map((f) => (
              <Chip
                key={f.value}
                active={filters.has(f.value)}
                onClick={() => setFilters((current) => toggleInSet(current, f.value))}
              >
                {f.label}
              </Chip>
            ))}
          </ChipRow>

          {/* Always say how many items are hidden and why (README requirement). */}
          {profile && safeOnly && (hiddenCount > 0 || showHidden) && (
            <div className="flex items-center gap-2.5 rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm">
              <EyeOff aria-hidden size={18} className="shrink-0 text-ink-3" />
              <span className="flex-1" aria-live="polite">
                {showHidden ? (
                  <>Showing all {total} items, including ones that don't match your profile.</>
                ) : (
                  <>
                    Showing {visible.length} of {total} · <b>{hiddenCount} hidden</b> because they
                    contain your allergens or don't match your preferences
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowHidden((v) => !v)}
                className="min-h-11 px-2 font-bold text-brand"
              >
                {showHidden ? 'Hide' : 'Show'}
              </button>
            </div>
          )}

          {sections.length > 1 && (
            <nav
              aria-label="Menu sections"
              className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
            >
              {sections.map(({ category }) => (
                <a
                  key={category}
                  href={`#${categoryAnchor(category)}`}
                  className="inline-flex h-11 shrink-0 items-center rounded-full border-[1.5px] border-line-strong bg-surface px-3.5 text-sm font-bold text-ink hover:bg-canvas hover:text-ink"
                >
                  {category}
                </a>
              ))}
            </nav>
          )}

          {sections.length === 0 ? (
            <EmptyState title="No matching items">
              {total === 0
                ? `${hall.name} hasn't posted a ${MEAL_PERIOD_LABELS[mealPeriod].toLowerCase()} menu.`
                : 'Try removing a filter.'}
            </EmptyState>
          ) : (
            sections.map(({ category, entries }, index) => (
              <details
                key={category}
                id={categoryAnchor(category)}
                open={index < EXPANDED_SECTIONS}
                className="group scroll-mt-20 md:scroll-mt-36"
              >
                <summary className="flex min-h-11 list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-lg">{category}</h3>
                  <span className="flex items-center gap-1 text-sm text-ink-3">
                    {entries.length} item{entries.length === 1 ? '' : 's'}
                    <ChevronDown
                      aria-hidden
                      size={18}
                      className="transition-transform group-open:rotate-180"
                    />
                  </span>
                </summary>
                <div className="mt-2">
                  {COMPACT_CATEGORIES.has(category) ? (
                    <Card className="overflow-hidden">
                      {entries.map(({ item, assessment }) => (
                        <MenuItemRow key={item.id} item={item} assessment={assessment} />
                      ))}
                    </Card>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {entries.map(({ item, assessment }) => (
                        <MenuItemCard key={item.id} item={item} assessment={assessment} />
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))
          )}
        </>
      )}
    </Page>
  );
}
