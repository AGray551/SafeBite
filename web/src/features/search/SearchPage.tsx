import { Search, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useHalls, useItemSearch } from '@/api/queries';
import { MEAL_PERIODS, type MealPeriod } from '@/api/schemas';
import { Page, PageIntro } from '@/components/layout/Page';
import { FilterGroup, FilterMenu, FilterOption } from '@/components/ui/FilterMenu';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import {
  matchesQuickFilters,
  QUICK_FILTERS,
  toggleInSet,
  type QuickFilter,
} from '@/features/menu/filters';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import { isSafeForMe, type SafetyStatus } from '@/features/safety/assess';
import { SafetyBadge } from '@/features/safety/SafetyBadge';
import { useSafety } from '@/features/safety/useSafety';
import { MEAL_PERIOD_LABELS } from '@/lib/labels';
import { currentMealPeriod, getOpenStatus, toDateKey } from '@/lib/time';

const SUGGESTIONS = ['pizza', 'chicken', 'gluten free', 'vegan', 'coffee', 'sushi'];

/** Order result groups from safest to least safe. */
const GROUP_ORDER: SafetyStatus[] = ['safe', 'caution', 'unknown', 'avoid'];
const GROUP_LABELS: Record<SafetyStatus, string> = {
  safe: 'Safe for you',
  caution: 'Caution',
  unknown: 'Not checked',
  avoid: 'Avoid',
};

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  // Typing updates the URL immediately; the query itself lags slightly behind.
  const deferredQ = useDeferredValue(q);

  const [mealPeriod, setMealPeriod] = useState<MealPeriod>(currentMealPeriod());
  const [openOnly, setOpenOnly] = useState(true);
  const [safeOnly, setSafeOnly] = useState(true);
  const [filters, setFilters] = useState<ReadonlySet<QuickFilter>>(new Set());

  const { data: halls = [] } = useHalls();
  const { profile, assess } = useSafety();
  const searchQuery = useItemSearch({ q: deferredQ, date: toDateKey(), mealPeriod });

  const setQuery = (value: string) => setSearchParams(value ? { q: value } : {}, { replace: true });

  const hallById = useMemo(() => new Map(halls.map((h) => [h.id, h])), [halls]);

  const { groups, total, hallCount, hiddenAvoid } = useMemo(() => {
    const entries = (searchQuery.data ?? [])
      .filter(
        (item) => !openOnly || getOpenStatus(hallById.get(item.hallId)?.todayHours ?? null).isOpen,
      )
      .filter((item) => matchesQuickFilters(item, filters))
      .map((item) => ({ item, assessment: assess(item) }));

    const applySafe = safeOnly && Boolean(profile);
    const visible = applySafe
      ? entries.filter(
          (entry) => entry.assessment.status === 'safe' && isSafeForMe(entry.assessment),
        )
      : entries;

    return {
      groups: GROUP_ORDER.map((status) => ({
        status,
        entries: visible.filter((e) => e.assessment.status === status),
      })).filter((g) => g.entries.length > 0),
      total: visible.length,
      hallCount: new Set(visible.map((e) => e.item.hallId)).size,
      hiddenAvoid: entries.length - visible.length,
    };
  }, [searchQuery.data, openOnly, filters, assess, safeOnly, profile, hallById]);

  const hasQuery = q.trim().length > 0;

  // "Filters · n" counts what's narrowing results: the on-by-default
  // Open now and Safe for Me included, so it's clear why things are hidden.
  const activeCount = Number(openOnly) + Number(safeOnly && Boolean(profile)) + filters.size;
  const resetFilters = () => {
    setOpenOnly(false);
    setSafeOnly(false);
    setFilters(new Set());
  };

  return (
    <>
      <PageIntro width="wide">
        <h1 className="text-2xl">Search</h1>
        <div className="relative flex items-center" role="search">
          <Search
            aria-hidden
            size={20}
            className="pointer-events-none absolute left-3.5 text-ink-3"
          />
          <label htmlFor="search-input" className="sr-only">
            Search food
          </label>
          <input
            id="search-input"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food, stations, diets"
            className="h-12 w-full rounded-control border-[1.5px] border-line-input bg-surface pr-12 pl-11 text-base placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-1 flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-canvas"
            >
              <X aria-hidden size={20} />
            </button>
          )}
        </div>
      </PageIntro>

      <Page width="wide">
        <div className="flex items-center justify-between gap-3">
          {hasQuery && searchQuery.isSuccess ? (
            <p className="m-0 text-sm text-ink-2" aria-live="polite">
              <b>
                {total} result{total === 1 ? '' : 's'}
              </b>{' '}
              across {hallCount} location{hallCount === 1 ? '' : 's'}
              {hiddenAvoid > 0 && safeOnly && ` · ${hiddenAvoid} hidden by Safe for Me`}
            </p>
          ) : (
            <p className="m-0 text-sm text-ink-3">
              Try{' '}
              {SUGGESTIONS.map((suggestion, i) => (
                <span key={suggestion}>
                  <button
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="font-bold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
                  >
                    {suggestion}
                  </button>
                  {i < SUGGESTIONS.length - 1 && ', '}
                </span>
              ))}
            </p>
          )}

          <FilterMenu activeCount={activeCount} onReset={resetFilters}>
            <FilterGroup legend="Show">
              <FilterOption
                type="checkbox"
                checked={openOnly}
                onChange={() => setOpenOnly((v) => !v)}
              >
                Open now
              </FilterOption>
              {profile && (
                <FilterOption
                  type="checkbox"
                  checked={safeOnly}
                  onChange={() => setSafeOnly((v) => !v)}
                >
                  Safe for Me
                </FilterOption>
              )}
            </FilterGroup>
            <FilterGroup legend="Meal">
              {MEAL_PERIODS.map((p) => (
                <FilterOption
                  key={p}
                  type="radio"
                  name="meal"
                  checked={mealPeriod === p}
                  onChange={() => setMealPeriod(p)}
                >
                  {MEAL_PERIOD_LABELS[p]}
                </FilterOption>
              ))}
            </FilterGroup>
            <FilterGroup legend="Diet">
              {QUICK_FILTERS.map((f) => (
                <FilterOption
                  key={f.value}
                  type="checkbox"
                  checked={filters.has(f.value)}
                  onChange={() => setFilters((current) => toggleInSet(current, f.value))}
                >
                  {f.label}
                </FilterOption>
              ))}
            </FilterGroup>
          </FilterMenu>
        </div>

        {hasQuery && searchQuery.isLoading && <LoadingState label="Searching…" />}
        {hasQuery && searchQuery.isError && (
          <ErrorState onRetry={() => void searchQuery.refetch()} />
        )}

        {hasQuery && searchQuery.isSuccess && (
          <>
            {groups.length === 0 ? (
              <EmptyState icon={<Search size={28} />} title={`No results for "${q}"`}>
                Try another word, a different meal, or turn off "Open now".
              </EmptyState>
            ) : (
              groups.map(({ status, entries }) => (
                <section
                  key={status}
                  aria-label={GROUP_LABELS[status]}
                  className="flex flex-col gap-3"
                >
                  <h2 className="flex items-center gap-2 text-base">
                    <SafetyBadge status={status} size="sm" short />
                    <span className="text-ink-3">{entries.length}</span>
                    {status === 'avoid' && (
                      <span className="text-sm font-normal text-ink-3">
                        · shown because Safe for Me is off
                      </span>
                    )}
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {entries.map(({ item, assessment }) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        assessment={assessment}
                        hallName={hallById.get(item.hallId)?.name}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </Page>
    </>
  );
}
