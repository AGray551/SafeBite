import { Clock, Heart, TriangleAlert, User } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  useAlerts,
  useFavorites,
  useHall,
  useItem,
  useMarkAlertRead,
  useToggleFavorite,
} from '@/api/queries';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SafetyBadge } from '@/features/safety/SafetyBadge';
import { useSafety } from '@/features/safety/useSafety';
import { allergenNoun } from '@/lib/labels';
import { formatUpdatedAt } from '@/lib/time';

/**
 * Full-screen safety alert for an ingredient change. Opening it marks the
 * alert as read.
 */
export function SafetyAlertPage() {
  const { alertId = '' } = useParams();
  const navigate = useNavigate();
  const alertsQuery = useAlerts();
  const alert = alertsQuery.data?.find((a) => a.id === alertId);

  const { data: item } = useItem(alert?.itemId ?? '');
  const { data: hall } = useHall(alert?.hallId ?? '');
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite('item');
  const { profile, assess } = useSafety();
  const markRead = useMarkAlertRead();
  const { mutate: markAsRead } = markRead;

  // Mark as read once, the first time an unread alert is shown.
  useEffect(() => {
    if (alert && !alert.readAt) markAsRead(alert.id);
  }, [alert, markAsRead]);

  if (alertsQuery.isLoading) return <LoadingState />;
  if (!alert) return <ErrorState message="This alert is no longer available." />;

  const severity = profile?.avoid.find((a) => a.allergen === alert.allergen)?.severity;
  const isFavorite = favorites?.itemIds.includes(alert.itemId) ?? false;
  const allergen = allergenNoun(alert.allergen);
  const status = item ? assess(item).status : 'unknown';

  return (
    <div className="flex min-h-dvh items-end justify-center bg-ink/50 md:items-center md:p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-desc"
        className="flex w-full max-w-lg flex-col gap-4 rounded-t-3xl bg-surface p-6 md:rounded-3xl"
      >
        <div className="flex items-center gap-2 text-avoid">
          <span className="flex size-10 items-center justify-center rounded-full bg-avoid text-white">
            <TriangleAlert aria-hidden size={22} />
          </span>
          <span className="font-heading text-xs font-extrabold tracking-[0.08em]">
            SAFETY ALERT
          </span>
        </div>

        <h1 id="alert-title" className="text-title">
          Ingredient update
        </h1>
        <p id="alert-desc" className="m-0 text-ink-2">
          The ingredients for <b className="text-ink">{item?.name ?? 'this item'}</b>
          {hall && (
            <>
              {' '}
              at <b className="text-ink">{hall.name}</b>
            </>
          )}{' '}
          have changed. It may now contain <b className="text-ink">{allergen}</b>.
        </p>

        <ul className="m-0 flex list-none flex-col gap-2.5 rounded-card bg-canvas p-4 text-sm">
          {severity && (
            <Impact icon={<User aria-hidden size={18} />}>
              You marked {allergen} as {/^[aeiou]/.test(severity) ? 'an' : 'a'} {severity} · now{' '}
              <SafetyBadge status={status} size="sm" short />
            </Impact>
          )}
          {isFavorite && (
            <Impact icon={<Heart aria-hidden size={18} />}>Saved in your favorites</Impact>
          )}
          <Impact icon={<Clock aria-hidden size={18} />}>
            Menu data updated {formatUpdatedAt(alert.createdAt)}
          </Impact>
        </ul>

        <div className="flex flex-col gap-2.5">
          <ButtonLink to={`/items/${alert.itemId}`}>View updated ingredients</ButtonLink>
          {isFavorite && (
            <Button
              variant="destructive"
              onClick={() => toggleFavorite.mutate({ id: alert.itemId, saved: false })}
            >
              Remove from favorites
            </Button>
          )}
          <button
            type="button"
            onClick={() =>
              // Go back if we came from inside the app, otherwise to Home.
              (window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/')
            }
            className="min-h-11 font-bold text-brand hover:text-brand-hover"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function Impact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="shrink-0 text-ink-3">{icon}</span>
      <span className="flex flex-wrap items-center gap-1">{children}</span>
    </li>
  );
}
