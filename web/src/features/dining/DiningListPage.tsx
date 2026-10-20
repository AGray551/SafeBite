import { useMemo, useState } from 'react';
import { useHalls } from '@/api/queries';
import type { DiningHall, LocationCategory } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { FilterGroup, FilterMenu, FilterOption } from '@/components/ui/FilterMenu';
import { getOpenStatus } from '@/lib/time';
import { DiningHeader } from './DiningHeader';
import { HallCard, type HallMenuSummary } from './HallCard';
import { groupByCategory, LOCATION_CATEGORY_META } from './locationCategories';
import { useHallSummaries } from './useHallSummaries';

type SortKey = 'name' | 'most-safe';

function sortHalls(halls: DiningHall[], sort: SortKey, summaries: Map<string, HallMenuSummary>) {
  return [...halls].sort((a, b) => {
    if (sort === 'most-safe') {
      const diff = (summaries.get(b.id)?.safeCount ?? 0) - (summaries.get(a.id)?.safeCount ?? 0);
      if (diff) return diff;
    }
    return a.name.localeCompare(b.name);
  });
}

export function DiningListPage() {
  const hallsQuery = useHalls();
  const { summaries, menusQuery } = useHallSummaries();
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('most-safe');
  const [category, setCategory] = useState<LocationCategory | 'all'>('all');

  const halls = useMemo(() => hallsQuery.data ?? [], [hallsQuery.data]);
  const openCount = halls.filter((h) => getOpenStatus(h.todayHours).isOpen).length;

  // Every category that has locations, for the menu (counts ignore "Open now").
  const allSections = useMemo(() => groupByCategory(halls), [halls]);

  const sections = useMemo(() => {
    const filtered = halls.filter((h) => !openOnly || getOpenStatus(h.todayHours).isOpen);
    return groupByCategory(
      sortHalls(filtered, sort, summaries),
      category === 'all' ? undefined : category,
    );
  }, [halls, openOnly, category, sort, summaries]);

  // Sort order isn't a filter, so it doesn't count toward "Filters · n".
  const activeCount = Number(category !== 'all') + Number(openOnly);
  const resetFilters = () => {
    setCategory('all');
    setOpenOnly(false);
  };

  // Locations shown, counted once even if they're in several sections.
  const shownCount = new Set(sections.flatMap((s) => s.halls.map((h) => h.id))).size;

  return (
    <>
      <DiningHeader view="list" />
      <Page width="wide">
        {hallsQuery.isLoading && <LoadingState />}
        {hallsQuery.isError && <ErrorState onRetry={() => void hallsQuery.refetch()} />}

        {hallsQuery.isSuccess && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-sm text-ink-2" aria-live="polite">
                <b>
                  {shownCount} location{shownCount === 1 ? '' : 's'}
                </b>
                {category !== 'all' && ` in ${LOCATION_CATEGORY_META[category].title}`} ·{' '}
                {openCount} open now
                {activeCount > 0 && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="font-bold text-brand hover:text-brand-hover"
                    >
                      Clear
                    </button>
                  </>
                )}
              </p>
              <FilterMenu activeCount={activeCount} onReset={resetFilters}>
                <FilterGroup legend="Category">
                  <FilterOption
                    type="radio"
                    name="category"
                    checked={category === 'all'}
                    onChange={() => setCategory('all')}
                    detail={halls.length}
                  >
                    All locations
                  </FilterOption>
                  {allSections.map(({ category: c, halls: inCategory }) => (
                    <FilterOption
                      key={c}
                      type="radio"
                      name="category"
                      checked={category === c}
                      onChange={() => setCategory(c)}
                      detail={inCategory.length}
                    >
                      {LOCATION_CATEGORY_META[c].title}
                    </FilterOption>
                  ))}
                </FilterGroup>
                <FilterGroup legend="Show">
                  <FilterOption
                    type="checkbox"
                    checked={openOnly}
                    onChange={() => setOpenOnly((v) => !v)}
                  >
                    Open now
                  </FilterOption>
                </FilterGroup>
                <FilterGroup legend="Sort by">
                  <FilterOption
                    type="radio"
                    name="sort"
                    checked={sort === 'most-safe'}
                    onChange={() => setSort('most-safe')}
                  >
                    Most safe items
                  </FilterOption>
                  <FilterOption
                    type="radio"
                    name="sort"
                    checked={sort === 'name'}
                    onChange={() => setSort('name')}
                  >
                    Name (A–Z)
                  </FilterOption>
                </FilterGroup>
              </FilterMenu>
            </div>
            {sections.length === 0 ? (
              <EmptyState title="No matching locations are open right now">
                Turn off "Open now" to see hours and menus for later today.
              </EmptyState>
            ) : (
              sections.map(({ category: c, halls: inSection }) => {
                const meta = LOCATION_CATEGORY_META[c];
                const Icon = meta.icon;
                return (
                  <section
                    key={c}
                    aria-labelledby={`category-${c}`}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface text-ink-2"
                      >
                        <Icon size={20} />
                      </span>
                      <div>
                        <h2 id={`category-${c}`} className="text-xl">
                          {meta.title}{' '}
                          <span className="text-base font-semibold text-ink-3">
                            · {inSection.length}
                          </span>
                        </h2>
                        <p className="m-0 text-sm text-ink-3">{meta.description}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {inSection.map((hall) => (
                        <HallCard
                          key={hall.id}
                          hall={hall}
                          category={c}
                          summary={menusQuery.isSuccess ? summaries.get(hall.id) : undefined}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </>
        )}
      </Page>
    </>
  );
}
