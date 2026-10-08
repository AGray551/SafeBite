import { useMemo, useState } from 'react';
import { useHalls } from '@/api/queries';
import type { DiningHall } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { getOpenStatus } from '@/lib/time';
import { DiningHeader } from './DiningHeader';
import { HallCard, type HallMenuSummary } from './HallCard';
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

  const halls = useMemo(() => hallsQuery.data ?? [], [hallsQuery.data]);
  const openCount = halls.filter((h) => getOpenStatus(h.todayHours).isOpen).length;

  const visible = useMemo(() => {
    const filtered = openOnly ? halls.filter((h) => getOpenStatus(h.todayHours).isOpen) : halls;
    return sortHalls(filtered, sort, summaries);
  }, [halls, openOnly, sort, summaries]);

  return (
    <>
      <DiningHeader view="list" />
      <Page>
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
                {visible.length} location{visible.length === 1 ? '' : 's'}
              </b>{' '}
              · {openCount} open now
            </p>
            {visible.length === 0 ? (
              <EmptyState title="No dining halls are open right now">
                Turn off "Open now" to see hours and menus for later today.
              </EmptyState>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visible.map((hall) => (
                  <HallCard
                    key={hall.id}
                    hall={hall}
                    summary={menusQuery.isSuccess ? summaries.get(hall.id) : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Page>
    </>
  );
}
