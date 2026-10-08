import { Check, Heart, Moon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFavorites, useHalls, useItems } from '@/api/queries';
import type { DiningHall, MenuItem } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { HallCard } from '@/features/dining/HallCard';
import { useHallSummaries } from '@/features/dining/useHallSummaries';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import type { SafetyAssessment } from '@/features/safety/assess';
import { useSafety } from '@/features/safety/useSafety';
import { getOpenStatus } from '@/lib/time';

type Tab = 'meals' | 'halls';

interface FavoriteEntry {
  item: MenuItem;
  assessment: SafetyAssessment;
  hall?: DiningHall;
  /** On the current meal period's menu at a location that's open now. */
  availableNow: boolean;
}

export function FavoritesPage() {
  const [tab, setTab] = useState<Tab>('meals');
  const favoritesQuery = useFavorites();
  const itemIds = favoritesQuery.data?.itemIds ?? [];
  const hallIds = favoritesQuery.data?.hallIds ?? [];

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-5 pb-4 md:px-6">
          <h1 className="text-2xl">Favorites</h1>
          <SegmentedControl<Tab>
            as="tabs"
            label="Favorites"
            value={tab}
            onChange={setTab}
            segments={[
              { value: 'meals', label: `Meals · ${itemIds.length}` },
              { value: 'halls', label: `Places · ${hallIds.length}` },
            ]}
          />
        </div>
      </div>

      <Page>
        {favoritesQuery.isLoading && <LoadingState />}
        {favoritesQuery.isError && <ErrorState onRetry={() => void favoritesQuery.refetch()} />}
        {favoritesQuery.isSuccess &&
          (tab === 'meals' ? (
            <FavoriteMeals itemIds={itemIds} />
          ) : (
            <FavoriteHalls hallIds={hallIds} />
          ))}
      </Page>
    </>
  );
}

function FavoriteMeals({ itemIds }: { itemIds: string[] }) {
  const itemsQuery = useItems(itemIds);
  const { data: halls = [] } = useHalls();
  const { menus } = useHallSummaries();
  const { assess } = useSafety();

  const entries = useMemo<FavoriteEntry[]>(() => {
    const onMenuNow = new Set(menus.flatMap((menu) => menu.items.map((item) => item.id)));
    return (itemsQuery.data ?? []).map((item) => {
      const hall = halls.find((h) => h.id === item.hallId);
      return {
        item,
        assessment: assess(item),
        hall,
        availableNow: onMenuNow.has(item.id) && getOpenStatus(hall?.todayHours ?? null).isOpen,
      };
    });
  }, [itemsQuery.data, halls, menus, assess]);

  if (itemIds.length === 0) {
    return (
      <EmptyState icon={<Heart size={28} />} title="No saved meals yet">
        Tap the heart on any menu item to save it. We'll let you know when it's being served.
      </EmptyState>
    );
  }
  if (itemsQuery.isLoading) return <LoadingState />;

  // Anything that isn't plainly safe, or changed recently, needs a second look.
  const needsAttention = (e: FavoriteEntry) =>
    e.assessment.status !== 'safe' || Boolean(e.item.ingredientsChangedAt);

  const available = entries.filter((e) => e.availableNow && !needsAttention(e));
  const attention = entries.filter((e) => needsAttention(e));
  const notToday = entries.filter((e) => !e.availableNow && !needsAttention(e));
  const highlight = available[0];

  return (
    <>
      {highlight && (
        <div className="flex items-center gap-3 rounded-control bg-brand-tint p-3.5 text-sm">
          <Heart aria-hidden size={20} className="shrink-0 text-brand" fill="currentColor" />
          <span>
            Your favorite <b>{highlight.item.name}</b> is available at {highlight.hall?.name}{' '}
            {highlight.hall && getOpenStatus(highlight.hall.todayHours).label}.
          </span>
        </div>
      )}

      <Group title="Available now" entries={available} />
      <Group title="Needs attention" entries={attention} />
      <Group title="Not on the menu right now" entries={notToday} dimmed />
    </>
  );
}

function Group({
  title,
  entries,
  dimmed,
}: {
  title: string;
  entries: FavoriteEntry[];
  dimmed?: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-sm font-bold tracking-wide text-ink-3 uppercase">
        {title} · {entries.length}
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(({ item, assessment, hall, availableNow }) => (
          <MenuItemCard
            key={item.id}
            item={item}
            assessment={
              item.ingredientsChangedAt && assessment.status !== 'avoid'
                ? { ...assessment, summary: 'Ingredients changed today' }
                : assessment
            }
            hallName={hall?.name}
            hideStatus={dimmed}
            footer={
              <span
                className={
                  availableNow
                    ? 'flex items-center gap-1.5 text-caption font-bold text-safe'
                    : 'flex items-center gap-1.5 text-caption text-ink-3'
                }
              >
                {availableNow ? (
                  <>
                    <Check aria-hidden size={15} strokeWidth={3} /> Available now
                    {hall && ` · ${getOpenStatus(hall.todayHours).label}`}
                  </>
                ) : (
                  <>
                    <Moon aria-hidden size={15} /> Not being served right now
                  </>
                )}
              </span>
            }
          />
        ))}
      </div>
    </section>
  );
}

function FavoriteHalls({ hallIds }: { hallIds: string[] }) {
  const { data: halls = [], isLoading } = useHalls();
  const { summaries } = useHallSummaries();
  const saved = halls.filter((h) => hallIds.includes(h.id));

  if (hallIds.length === 0) {
    return (
      <EmptyState icon={<Heart size={28} />} title="No saved places yet">
        <p className="mt-0">Save the dining halls and cafés you visit most for quick access.</p>
        <ButtonLink to="/dining" variant="secondary" size="md" block={false}>
          Browse dining
        </ButtonLink>
      </EmptyState>
    );
  }
  if (isLoading) return <LoadingState />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {saved.map((hall) => (
        <HallCard key={hall.id} hall={hall} summary={summaries.get(hall.id)} />
      ))}
    </div>
  );
}
