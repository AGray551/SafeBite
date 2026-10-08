import { BellOff, ChevronRight, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { useAlerts, useHalls, useItems } from '@/api/queries';
import { Page } from '@/components/layout/Page';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { cn } from '@/lib/cn';
import { allergenNoun } from '@/lib/labels';
import { formatUpdatedAt } from '@/lib/time';

/** List of safety alerts (ingredient changes that affect this student). */
export function AlertsPage() {
  const alertsQuery = useAlerts();
  const alerts = alertsQuery.data ?? [];
  const { data: items = [] } = useItems(alerts.map((a) => a.itemId));
  const { data: halls = [] } = useHalls();

  return (
    <>
      <PageHeader title="Notifications" />
      <Page>
        {alertsQuery.isLoading && <LoadingState />}
        {alertsQuery.isError && <ErrorState onRetry={() => void alertsQuery.refetch()} />}
        {alertsQuery.isSuccess && alerts.length === 0 && (
          <EmptyState icon={<BellOff size={28} />} title="You're all caught up">
            We'll alert you here if an ingredient change affects your profile or favorites.
          </EmptyState>
        )}
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {alerts.map((alert) => {
            const item = items.find((i) => i.id === alert.itemId);
            const hall = halls.find((h) => h.id === alert.hallId);
            const unread = !alert.readAt;
            return (
              <li key={alert.id}>
                <Link
                  to={`/alerts/${alert.id}`}
                  className={cn(
                    'flex items-center gap-3 rounded-control border p-3.5 text-ink hover:text-ink',
                    unread ? 'border-[3px] border-avoid bg-surface' : 'border-line bg-surface',
                  )}
                >
                  <TriangleAlert
                    aria-hidden
                    size={22}
                    className={cn('shrink-0', unread ? 'text-avoid' : 'text-ink-3')}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-extrabold tracking-[0.08em] text-ink-3">
                      SAFETY ALERT{unread && <span className="text-avoid"> · NEW</span>}
                    </div>
                    <div className="font-bold">
                      {item?.name ?? 'A saved item'} may now contain {allergenNoun(alert.allergen)}
                    </div>
                    <div className="text-caption text-ink-3">
                      {hall?.name} · {formatUpdatedAt(alert.createdAt)}
                    </div>
                  </div>
                  <ChevronRight aria-hidden size={20} className="text-ink-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Page>
    </>
  );
}
