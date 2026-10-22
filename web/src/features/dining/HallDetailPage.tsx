import { ChevronDown, Clock, EyeOff, MapPin, Moon, Navigation, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useHall, useMenu } from '@/api/queries';
import type { DiningHall, MealPeriod } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { FilterGroup, FilterMenu, FilterOption } from '@/components/ui/FilterMenu';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import {
  matchesQuickFilters,
  QUICK_FILTERS,
  toggleInSet,
  type QuickFilter,
} from '@/features/menu/filters';
import { COMPACT_CATEGORIES, groupByCategory } from '@/features/menu/grouping';
import { menuItemKind } from '@/features/menu/itemKind';
import { MenuItemCard, MenuItemRow } from '@/features/menu/MenuItemCard';
import { isSafeForMe } from '@/features/safety/assess';
import { FreshnessNote } from '@/features/safety/FreshnessNote';
import { useSafety } from '@/features/safety/useSafety';
import { MEAL_PERIOD_LABELS } from '@/lib/labels';
import { currentMealPeriod, formatHours, getOpenStatus, toDateKey } from '@/lib/time';
import { HallBrandMark } from './hallBranding';

/** Sections after this many start collapsed to keep the page scannable. */
const EXPANDED_SECTIONS = 3;

export function HallDetailPage() {
  const { hallId = '' } = useParams();
  const hallQuery = useHall(hallId);
  const hall = hallQuery.data;

  return (
    <>
      <PageHeader
        width="wide"
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
    const shown = applySafeFilter
      ? entries.filter(
          (entry) => entry.assessment.status === 'safe' && isSafeForMe(entry.assessment),
        )
      : entries;
    return { visible: shown, hiddenCount: entries.length - shown.length, total: entries.length };
  }, [menuQuery.data, assess, filters, safeOnly, profile, showHidden]);

  const mealEntries = visible.filter(({ item }) => menuItemKind(item) === 'meal');
  const extraEntries = visible.filter(({ item }) => menuItemKind(item) === 'extra');
  const sections = groupByCategory(mealEntries);

  // Use coordinates so directions land on the right building, not just the street.
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${hall.coordinates.lat},${hall.coordinates.lng}`;

  return (
    <Page width="wide">
      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="text-title">{hall.name}</h2>
          <p className="m-0 text-label text-ink-2">
            {hall.categories
              .map((t) => (t.category === 'dining-hall' ? 'Residential dining hall' : t.label))
              .join(' · ')}
          </p>
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
            <li className="flex items-start gap-1.5">
              <MapPin aria-hidden size={16} className="mt-0.5 shrink-0" />
              <span>
                {hall.location}
                {hall.address && <span className="block text-sm text-ink-3">{hall.address}</span>}
              </span>
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
        </div>
        <aside className="flex min-h-40 items-center justify-center rounded-card border border-line bg-surface-muted p-6 md:min-h-full">
          <HallBrandMark hall={hall} size="hero" />
        </aside>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <FilterMenu
                activeCount={filters.size + Number(Boolean(profile && safeOnly))}
                onReset={() => {
                  setFilters(new Set());
                  setSafeOnly(false);
                  setShowHidden(false);
                }}
              >
                {profile && (
                  <FilterGroup legend="Safety">
                    <FilterOption
                      type="checkbox"
                      checked={safeOnly}
                      onChange={() => {
                        setSafeOnly((value) => !value);
                        setShowHidden(false);
                      }}
                    >
                      Safe for me
                    </FilterOption>
                  </FilterGroup>
                )}
                <FilterGroup legend="Menu preferences">
                  {QUICK_FILTERS.map((filter) => (
                    <FilterOption
                      key={filter.value}
                      type="checkbox"
                      checked={filters.has(filter.value)}
                      onChange={() => setFilters((current) => toggleInSet(current, filter.value))}
                    >
                      {filter.label}
                    </FilterOption>
                  ))}
                </FilterGroup>
              </FilterMenu>

              {profile && safeOnly && (hiddenCount > 0 || showHidden) && (
                <button
                  type="button"
                  onClick={() => setShowHidden((value) => !value)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-surface px-3 text-sm text-ink-2 hover:border-line-strong"
                  aria-label={
                    showHidden
                      ? `Showing all ${total} items, including ${hiddenCount} that do not match your profile`
                      : `${hiddenCount} items hidden because they do not match your profile or have unreported allergen data`
                  }
                >
                  <EyeOff aria-hidden size={17} className="text-ink-3" />
                  <span>
                    {showHidden ? (
                      <>Showing all {total}</>
                    ) : (
                      <>
                        <b>{hiddenCount} hidden</b> by your profile
                      </>
                    )}
                  </span>
                  <span className="font-bold text-brand">{showHidden ? 'Hide' : 'Show all'}</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-ink-3">
              <FreshnessNote updatedAt={menuQuery.data.updatedAt} variant="inline" />
              <span aria-live="polite">
                {visible.length} item{visible.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No matching items">
              {total === 0
                ? `${hall.name} hasn't posted a ${MEAL_PERIOD_LABELS[mealPeriod].toLowerCase()} menu.`
                : 'Try removing a filter.'}
            </EmptyState>
          ) : (
            sections.map(({ category, entries }, index) => (
              <details key={category} open={index < EXPANDED_SECTIONS} className="group">
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
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {entries.map(({ item, assessment }) => (
                        <MenuItemCard key={item.id} item={item} assessment={assessment} />
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))
          )}

          {extraEntries.length > 0 && (
            <details className="group">
              <summary className="flex min-h-11 list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                <div>
                  <h3 className="text-lg">Extras & sauces</h3>
                  <p className="m-0 text-sm text-ink-3">
                    Toppings, condiments, and salad-bar ingredients
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm text-ink-3">
                  {extraEntries.length} item{extraEntries.length === 1 ? '' : 's'}
                  <ChevronDown
                    aria-hidden
                    size={18}
                    className="transition-transform group-open:rotate-180"
                  />
                </span>
              </summary>
              <Card className="mt-2 overflow-hidden">
                {extraEntries.map(({ item, assessment }) => (
                  <MenuItemRow key={item.id} item={item} assessment={assessment} />
                ))}
              </Card>
            </details>
          )}
        </>
      )}
    </Page>
  );
}
