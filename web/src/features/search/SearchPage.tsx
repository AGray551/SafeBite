import { Search, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useHalls, useItemSearch } from '@/api/queries';
import { MEAL_PERIODS, type MealPeriod } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { Switch } from '@/components/ui/Switch';
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
    const visible = applySafe ? entries.filter((e) => isSafeForMe(e.assessment)) : entries;

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

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-5 pb-4 md:px-6">
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
        </div>
      </div>

      <Page>
        {!hasQuery && (
          <section aria-labelledby="try-heading" className="flex flex-col gap-2">
            <h2 id="try-heading" className="text-sm font-bold tracking-wide text-ink-3">
              TRY
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Chip key={s} active={false} onClick={() => setQuery(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </section>
        )}

        <ChipRow label="Search filters">
          <Chip active={openOnly} onClick={() => setOpenOnly((v) => !v)}>
            Open now
          </Chip>
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            Meal
            <select
              value={mealPeriod}
              onChange={(e) => setMealPeriod(e.target.value as MealPeriod)}
              className="h-11 rounded-control border-[1.5px] border-line-strong bg-surface px-3 text-sm font-bold"
            >
              {MEAL_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {MEAL_PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          {profile && (
            <div className="flex items-center gap-2 text-sm font-bold">
              <span aria-hidden>Safe for Me</span>
              <Switch checked={safeOnly} onChange={setSafeOnly} label="Safe for Me filter" />
            </div>
          )}
        </div>

        {hasQuery && searchQuery.isLoading && <LoadingState label="Searching…" />}
        {hasQuery && searchQuery.isError && (
          <ErrorState onRetry={() => void searchQuery.refetch()} />
        )}

        {hasQuery && searchQuery.isSuccess && (
          <>
            <p className="m-0 text-sm text-ink-2" aria-live="polite">
              <b>
                {total} result{total === 1 ? '' : 's'}
              </b>{' '}
              across {hallCount} location{hallCount === 1 ? '' : 's'}
              {hiddenAvoid > 0 && safeOnly && ` · ${hiddenAvoid} hidden by Safe for Me`}
            </p>

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
                  <div className="grid gap-3 md:grid-cols-2">
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
