import { Bell, ChevronRight, Clock, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAlerts, useFavorites, useHalls, useItems } from '@/api/queries';
import { Page } from '@/components/layout/Page';
import { ButtonLink } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/features/auth/authContext';
import { HallCard } from '@/features/dining/HallCard';
import { useHallSummaries } from '@/features/dining/useHallSummaries';
import {
  matchesQuickFilters,
  QUICK_FILTERS,
  toggleInSet,
  type QuickFilter,
} from '@/features/menu/filters';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import { describeProfile, isSafeForMe } from '@/features/safety/assess';
import { useSafety } from '@/features/safety/useSafety';
import { allergenNoun, MEAL_PERIOD_LABELS } from '@/lib/labels';
import { currentMealPeriod, getOpenStatus, greeting, mealPeriodEndLabel } from '@/lib/time';

const MAX_RECOMMENDATIONS = 3;

export function HomePage() {
  const { user } = useAuth();
  const mealPeriod = currentMealPeriod();
  const hallsQuery = useHalls();
  const { menus, summaries, menusQuery } = useHallSummaries(mealPeriod);
  const { profile, assess } = useSafety();
  const [safeOnly, setSafeOnly] = useState(true);
  const [filters, setFilters] = useState<ReadonlySet<QuickFilter>>(new Set());

  const halls = useMemo(() => hallsQuery.data ?? [], [hallsQuery.data]);
  const hallName = (hallId: string) => halls.find((h) => h.id === hallId)?.name;

  // Open halls first, then the one with the most safe items.
  const rankedHalls = useMemo(
    () =>
      [...halls].sort((a, b) => {
        const openDiff =
          Number(getOpenStatus(b.todayHours).isOpen) - Number(getOpenStatus(a.todayHours).isOpen);
        if (openDiff) return openDiff;
        return (summaries.get(b.id)?.safeCount ?? 0) - (summaries.get(a.id)?.safeCount ?? 0);
      }),
    [halls, summaries],
  );
  const bestBet = rankedHalls.find((h) => getOpenStatus(h.todayHours).isOpen);

  const recommendations = useMemo(() => {
    const openHallIds = new Set(
      halls.filter((h) => getOpenStatus(h.todayHours).isOpen).map((h) => h.id),
    );
    return menus
      .filter((menu) => openHallIds.has(menu.hallId))
      .flatMap((menu) => menu.items)
      .map((item) => ({ item, assessment: assess(item) }))
      .filter(
        ({ item, assessment }) =>
          (!safeOnly || (assessment.status === 'safe' && isSafeForMe(assessment))) &&
          matchesQuickFilters(item, filters),
      )
      .slice(0, MAX_RECOMMENDATIONS);
  }, [menus, halls, assess, safeOnly, filters]);

  const isLoading = hallsQuery.isLoading || menusQuery.isLoading;
  const isError = hallsQuery.isError || menusQuery.isError;

  return (
    <>
      <HomeHeader
        name={user?.name}
        mealPeriodLabel={MEAL_PERIOD_LABELS[mealPeriod]}
        endsAt={mealPeriodEndLabel(mealPeriod)}
      />

      <Page>
        <ProfileSummary summary={describeProfile(profile)} />
        <AlertBanner />

        <ChipRow label="Quick filters">
          <Chip
            active={safeOnly}
            icon={<ShieldCheck aria-hidden size={16} />}
            onClick={() => setSafeOnly((v) => !v)}
          >
            Safe for Me
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

        {isLoading && <LoadingState />}
        {isError && (
          <ErrorState
            onRetry={() => {
              void hallsQuery.refetch();
              void menusQuery.refetch();
            }}
          />
        )}

        {!isLoading && !isError && (
          <>
            <section aria-labelledby="halls-heading" className="flex flex-col gap-3">
              <SectionHeader
                id="halls-heading"
                title="Dining halls"
                action={{ label: 'See all', to: '/dining' }}
              />
              {bestBet && (
                <Link
                  to={`/dining/${bestBet.id}`}
                  className="flex items-center gap-3 rounded-card bg-brand p-4 text-white hover:bg-brand-hover hover:text-white"
                >
                  <div className="flex-1">
                    <div className="font-heading text-xs font-extrabold tracking-[0.08em] opacity-85">
                      BEST BET RIGHT NOW
                    </div>
                    <div className="font-heading text-xl font-extrabold">{bestBet.name}</div>
                    <div className="text-sm opacity-90">
                      {summaries.get(bestBet.id)?.safeCount != null
                        ? `${summaries.get(bestBet.id)?.safeCount} safe items · `
                        : ''}
                      Open {getOpenStatus(bestBet.todayHours).label}
                    </div>
                  </div>
                  <ChevronRight aria-hidden size={24} />
                </Link>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {rankedHalls
                  .filter((h) => h.id !== bestBet?.id)
                  .slice(0, 2)
                  .map((hall) => (
                    <HallCard key={hall.id} hall={hall} summary={summaries.get(hall.id)} compact />
                  ))}
              </div>
            </section>

            <section aria-labelledby="recs-heading" className="flex flex-col gap-3">
              <SectionHeader
                id="recs-heading"
                title="Recommended for you"
                subtitle="Available now and match your profile"
                action={{ label: 'More', to: '/search' }}
              />
              {recommendations.length === 0 ? (
                <EmptyState title="Nothing matches right now">
                  Try removing a filter, or check back when more dining halls are open.
                </EmptyState>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {recommendations.map(({ item, assessment }) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      assessment={assessment}
                      hallName={hallName(item.hallId)}
                    />
                  ))}
                </div>
              )}
            </section>

            <FavoritesPreview hallName={hallName} />
          </>
        )}
      </Page>
    </>
  );
}

function HomeHeader({
  name,
  mealPeriodLabel,
  endsAt,
}: {
  name?: string;
  mealPeriodLabel: string;
  endsAt: string;
}) {
  const { data: alerts = [] } = useAlerts();
  const unread = alerts.filter((a) => !a.readAt).length;

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-5 pb-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl">
              {greeting()}
              {name ? `, ${name.split(' ')[0]}` : ''}
            </h1>
            <p className="m-0 flex items-center gap-1.5 text-sm text-ink-2">
              <Clock aria-hidden size={15} />
              <b>{mealPeriodLabel}</b> · served until {endsAt}
            </p>
          </div>
          <Link
            to="/alerts"
            aria-label={
              unread
                ? `Notifications, ${unread} unread safety alert${unread > 1 ? 's' : ''}`
                : 'Notifications'
            }
            className="relative flex size-11 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <Bell aria-hidden size={22} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full bg-avoid text-2xs font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        </div>
        <Link
          to="/search"
          className="flex h-12 items-center gap-2.5 rounded-control border-[1.5px] border-line-input bg-surface px-3.5 text-ink-3 hover:text-ink-2"
        >
          <Search aria-hidden size={20} />
          Search food, e.g. pizza or gluten free
        </Link>
      </div>
    </div>
  );
}

function ProfileSummary({ summary }: { summary: string | null }) {
  if (!summary) {
    return (
      <div className="flex flex-col gap-3 rounded-card border-2 border-dashed border-brand bg-brand-tint p-4">
        <p className="m-0 flex items-center gap-2 font-bold">
          <ShieldCheck aria-hidden size={20} className="text-brand" />
          Add your allergies to see what's safe for you.
        </p>
        <ButtonLink to="/onboarding/allergies" size="md">
          Set up dietary profile
        </ButtonLink>
      </div>
    );
  }

  return (
    <Link
      to="/onboarding/allergies?from=profile"
      className="flex items-center gap-2.5 rounded-control bg-brand-tint px-3.5 py-3 text-sm text-ink hover:text-ink"
    >
      <ShieldCheck aria-hidden size={20} className="shrink-0 text-brand" />
      <span className="flex-1">
        <b>Filtering for:</b> {summary}
      </span>
      <span className="font-bold text-brand">Edit</span>
    </Link>
  );
}

/** Red banner for the most recent unread safety alert. */
function AlertBanner() {
  const { data: alerts = [] } = useAlerts();
  const latest = alerts.find((a) => !a.readAt);
  const { data: items = [] } = useItems(latest ? [latest.itemId] : []);
  const item = items[0];
  if (!latest || !item) return null;

  return (
    <Link
      to={`/alerts/${latest.id}`}
      className="flex items-center gap-3 rounded-control border-[3px] border-avoid bg-avoid p-3.5 text-label text-white hover:text-white"
    >
      <TriangleAlert aria-hidden size={22} className="shrink-0" />
      <span className="flex-1">
        <b>Ingredient update:</b> {item.name} may now contain {allergenNoun(latest.allergen)}.
      </span>
      <ChevronRight aria-hidden size={20} />
    </Link>
  );
}

function FavoritesPreview({ hallName }: { hallName: (hallId: string) => string | undefined }) {
  const { data: favorites } = useFavorites();
  const itemIds = favorites?.itemIds.slice(0, 4) ?? [];
  const { data: items = [] } = useItems(itemIds);
  if (itemIds.length === 0) return null;

  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-3">
      <SectionHeader
        id="favorites-heading"
        title="Favorites"
        action={{ label: 'All', to: '/favorites' }}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/items/${item.id}`}
            className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3 text-ink hover:text-ink"
          >
            <ImagePlaceholder className="h-16 w-full" />
            <span className="font-heading leading-tight font-extrabold">{item.name}</span>
            <span className="text-caption text-ink-3">{hallName(item.hallId)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
