import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useHalls } from '@/api/queries';
import { Page } from '@/components/layout/Page';
import { ErrorState, LoadingState } from '@/components/ui/QueryState';
import { cn } from '@/lib/cn';
import { getOpenStatus } from '@/lib/time';
import { DiningHeader } from './DiningHeader';
import { HallCard } from './HallCard';
import { useHallSummaries } from './useHallSummaries';

/**
 * Map view (nice-to-have). This is a placeholder campus map with pins placed
 * by percentage; swap it for a real map library (e.g. MapLibre or Leaflet)
 * once halls have lat/lng coordinates.
 */
export function DiningMapPage() {
  const hallsQuery = useHalls();
  const { summaries } = useHallSummaries();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const halls = hallsQuery.data ?? [];
  const selected = halls.find((h) => h.id === selectedId) ?? halls[0];

  return (
    <>
      <DiningHeader view="map" />
      <Page>
        {hallsQuery.isLoading && <LoadingState />}
        {hallsQuery.isError && <ErrorState onRetry={() => void hallsQuery.refetch()} />}

        {hallsQuery.isSuccess && (
          <>
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-dashed border-line-dashed bg-placeholder md:aspect-video"
              style={{
                backgroundImage:
                  'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            >
              <span className="absolute top-3 left-3 rounded-md bg-surface/90 px-2 py-1 text-xs text-ink-3">
                Campus map placeholder
              </span>

              {halls.map((hall) => {
                const isSelected = hall.id === selected?.id;
                const open = getOpenStatus(hall.todayHours).isOpen;
                return (
                  <button
                    key={hall.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(hall.id)}
                    style={{ left: `${hall.mapPosition.x}%`, top: `${hall.mapPosition.y}%` }}
                    className={cn(
                      'absolute flex min-h-11 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 px-3 text-sm font-bold whitespace-nowrap shadow-sm',
                      isSelected
                        ? 'border-brand bg-brand text-white'
                        : 'border-brand bg-surface text-brand',
                      !open && !isSelected && 'border-dashed text-ink-2',
                    )}
                  >
                    <MapPin aria-hidden size={16} />
                    {hall.name}
                    <span className="sr-only">{open ? ', open' : ', closed'}</span>
                  </button>
                );
              })}
            </div>

            {selected && <HallCard hall={selected} summary={summaries.get(selected.id)} />}
          </>
        )}
      </Page>
    </>
  );
}
