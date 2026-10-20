import { useMemo, useState, type ReactNode } from 'react';
import { useHalls } from '@/api/queries';
import type { DiningHall, LocationCategory } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';
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
        <div className="-mx-4 border-b border-line md:mx-0">
          <div
            role="group"
            aria-label="Category"
            className="no-scrollbar flex gap-1 overflow-x-auto px-2 md:px-0"
          >
            <CategoryTab active={category === 'all'} onClick={() => setCategory('all')}>
              All
            </CategoryTab>
            {allSections.map(({ category: c, halls: inCategory }) => (
              <CategoryTab key={c} active={category === c} onClick={() => setCategory(c)}>
                {LOCATION_CATEGORY_META[c].title}
                <span className="font-semibold text-ink-3">{inCategory.length}</span>
              </CategoryTab>
            ))}
          </div>
        </div>

        {hallsQuery.isLoading && <LoadingState />}
        {hallsQuery.isError && <ErrorState onRetry={() => void hallsQuery.refetch()} />}

        {hallsQuery.isSuccess && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
              <p className="m-0 text-sm text-ink-2" aria-live="polite">
                <b>
                  {shownCount} location{shownCount === 1 ? '' : 's'}
                </b>{' '}
                · {openCount} open now
              </p>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-sm font-bold text-ink-2">
                    Open now
                  </span>
                  <Switch label="Open now" checked={openOnly} onChange={setOpenOnly} />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold text-ink-2">
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-11 rounded-control border-[1.5px] border-line-strong bg-surface px-3 text-sm font-bold text-ink"
                  >
                    <option value="most-safe">Most safe items</option>
                    <option value="name">A–Z</option>
                  </select>
                </label>
              </div>
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

/**
 * Text tab for picking a category. The active tab is bold with an underline
 * bar (not color alone) and is exposed with aria-pressed.
 */
function CategoryTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative flex h-12 shrink-0 items-center gap-1.5 px-3 text-label whitespace-nowrap',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full',
        active
          ? 'font-extrabold text-ink after:bg-brand'
          : 'font-semibold text-ink-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
