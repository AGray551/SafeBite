import { useMemo, useState } from 'react';
import { useHalls } from '@/api/queries';
import type { DiningHall, LocationCategory } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
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

  // Every category that has locations, for the chips (counts ignore "Open now").
  const allSections = useMemo(() => groupByCategory(halls), [halls]);

  const sections = useMemo(() => {
    const filtered = halls.filter((h) => !openOnly || getOpenStatus(h.todayHours).isOpen);
    return groupByCategory(
      sortHalls(filtered, sort, summaries),
      category === 'all' ? undefined : category,
    );
  }, [halls, openOnly, category, sort, summaries]);

  // Locations shown, counted once even if they're in several sections.
  const shownCount = new Set(sections.flatMap((s) => s.halls.map((h) => h.id))).size;

  return (
    <>
      <DiningHeader view="list" />
      <Page width="wide">
        <ChipRow label="Category">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            All
          </Chip>
          {allSections.map(({ category: c, halls: inCategory }) => {
            const Icon = LOCATION_CATEGORY_META[c].icon;
            return (
              <Chip
                key={c}
                active={category === c}
                icon={<Icon aria-hidden size={16} />}
                onClick={() => setCategory(c)}
              >
                {category !== c && <Icon aria-hidden size={16} />}
                {LOCATION_CATEGORY_META[c].title} · {inCategory.length}
              </Chip>
            );
          })}
        </ChipRow>

        <ChipRow label="Filter and sort dining halls">
          <Chip active={openOnly} onClick={() => setOpenOnly((v) => !v)}>
            Open now
          </Chip>
          <Chip active={sort === 'most-safe'} onClick={() => setSort('most-safe')}>
            Most safe items
          </Chip>
          <Chip active={sort === 'name'} onClick={() => setSort('name')}>
            A–Z
          </Chip>
        </ChipRow>

        {hallsQuery.isLoading && <LoadingState />}
        {hallsQuery.isError && <ErrorState onRetry={() => void hallsQuery.refetch()} />}

        {hallsQuery.isSuccess && (
          <>
            <p className="m-0 text-sm text-ink-2" aria-live="polite">
              <b>
                {shownCount} location{shownCount === 1 ? '' : 's'}
              </b>{' '}
              · {openCount} open now
            </p>
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
