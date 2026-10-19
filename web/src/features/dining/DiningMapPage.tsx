import { useMemo, useState } from 'react';
import { useHalls } from '@/api/queries';
import { Page } from '@/components/layout/Page';
import { ErrorState, LoadingState } from '@/components/ui/QueryState';
import { groupByBuilding } from './buildings';
import { CampusMap } from './CampusMap';
import { DiningHeader } from './DiningHeader';
import { HallCard } from './HallCard';
import { useHallSummaries } from './useHallSummaries';

/**
 * Map view. Each marker is a building; selecting it lists every dining
 * location inside below the map, so the same info is available without
 * using the map at all.
 */
export function DiningMapPage() {
  const hallsQuery = useHalls();
  const { summaries } = useHallSummaries();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // The map covers Uptown; other campuses are listed below it instead.
  const halls = useMemo(
    () => (hallsQuery.data ?? []).filter((h) => h.campus === 'uptown'),
    [hallsQuery.data],
  );
  const offMap = useMemo(
    () => (hallsQuery.data ?? []).filter((h) => h.campus !== 'uptown'),
    [hallsQuery.data],
  );
  const groups = useMemo(() => groupByBuilding(halls), [halls]);
  const selected = groups.find((g) => g.key === selectedKey) ?? groups[0];

  return (
    <>
      <DiningHeader view="map" />
      <Page width="wide">
        {hallsQuery.isLoading && <LoadingState />}
        {hallsQuery.isError && <ErrorState onRetry={() => void hallsQuery.refetch()} />}

        {hallsQuery.isSuccess && (
          <>
            <CampusMap
              halls={halls}
              selectedKey={selected?.key ?? null}
              onSelect={(group) => setSelectedKey(group.key)}
            />

            {selected && (
              <section
                aria-live="polite"
                aria-label="Selected building"
                className="flex flex-col gap-3"
              >
                <div>
                  <h2 className="text-lg">{selected.halls[0]!.location.split(',')[0]}</h2>
                  <p className="m-0 text-sm text-ink-3">
                    {selected.halls[0]!.address && `${selected.halls[0]!.address} · `}
                    {selected.halls.length} location
                    {selected.halls.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {selected.halls.map((hall) => (
                    <HallCard key={hall.id} hall={hall} summary={summaries.get(hall.id)} />
                  ))}
                </div>
              </section>
            )}

            {offMap.length > 0 && (
              <section aria-labelledby="off-map-heading" className="flex flex-col gap-3">
                <div>
                  <h2 id="off-map-heading" className="text-lg">
                    UC Blue Ash
                  </h2>
                  <p className="m-0 text-sm text-ink-3">Not shown on the Uptown campus map</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {offMap.map((hall) => (
                    <HallCard key={hall.id} hall={hall} summary={summaries.get(hall.id)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Page>
    </>
  );
}
