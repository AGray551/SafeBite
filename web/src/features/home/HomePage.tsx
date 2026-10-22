import { Bell, ChevronRight, Clock, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useAlerts, useHalls, useItems } from '@/api/queries';
import type { DiningHall } from '@/api/schemas';
import { Page, PageIntro } from '@/components/layout/Page';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { HallMenuSummary } from '@/features/dining/HallCard';
import { SafeCount } from '@/features/dining/HallCard';
import { HallBrandMark } from '@/features/dining/hallBranding';
import { hasHallBrandMark } from '@/features/dining/hallLogos';
import { useHallSummaries } from '@/features/dining/useHallSummaries';
import { describeProfile } from '@/features/safety/assess';
import { useSafety } from '@/features/safety/useSafety';
import { allergenNoun, MEAL_PERIOD_LABELS } from '@/lib/labels';
import { currentMealPeriod, getOpenStatus } from '@/lib/time';

export function HomePage() {
  const mealPeriod = currentMealPeriod();
  const hallsQuery = useHalls();
  const { summaries, menusQuery } = useHallSummaries(mealPeriod);
  const { profile, isLoading: profileLoading } = useSafety();
  const halls = useMemo(() => hallsQuery.data ?? [], [hallsQuery.data]);

  // Open halls first, then the one with the most safe items.
  const rankedHalls = useMemo(
    () =>
      [...halls].sort((a, b) => {
        const openDiff =
          Number(getOpenStatus(b.todayHours).isOpen) - Number(getOpenStatus(a.todayHours).isOpen);
        if (openDiff) return openDiff;

        const aSummary = summaries.get(a.id);
        const bSummary = summaries.get(b.id);
        const safeDiff = (bSummary?.safeCount ?? -1) - (aSummary?.safeCount ?? -1);
        if (safeDiff) return safeDiff;

        // Without a dietary profile, prefer a location with a posted menu and
        // a scoreable meal over an arbitrary location with no menu data.
        const menuDiff = Number(Boolean(bSummary)) - Number(Boolean(aSummary));
        if (menuDiff) return menuDiff;
        return (bSummary?.averageHealthScore ?? -1) - (aSummary?.averageHealthScore ?? -1);
      }),
    [halls, summaries],
  );
  const bestBet = rankedHalls.find((h) => getOpenStatus(h.todayHours).isOpen);

  const isLoading = hallsQuery.isLoading || menusQuery.isLoading;
  const isError = hallsQuery.isError || menusQuery.isError;

  return (
    <>
      <HomeHeader mealPeriodLabel={MEAL_PERIOD_LABELS[mealPeriod]} />

      <Page width="wide">
        {/* Wait for the profile so we don't flash the setup prompt. */}
        {!profileLoading && <ProfileSummary summary={describeProfile(profile)} />}
        <AlertBanner />

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
            <section aria-labelledby="best-place-heading" className="flex flex-col gap-3">
              <SectionHeader
                id="best-place-heading"
                title="Best place for you right now"
                subtitle="Ranked by what is open and has confirmed matching options."
              />
              {bestBet ? (
                <BestMatchCard
                  hallId={bestBet.id}
                  name={bestBet.name}
                  summary={summaries.get(bestBet.id)}
                  openLabel={getOpenStatus(bestBet.todayHours).label}
                />
              ) : (
                <EmptyState title="No dining locations are open right now">
                  Browse today's hours or see all confirmed-safe food for later.
                </EmptyState>
              )}
            </section>

            <section aria-labelledby="open-places-heading" className="flex flex-col gap-3">
              <SectionHeader
                id="open-places-heading"
                title="Compare open places"
                subtitle="Safe for you: share of the menu that fits your profile. Nutrition: average score out of 100 for meal items."
                action={{ label: 'All places', to: '/dining' }}
              />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {rankedHalls
                  .filter((hall) => getOpenStatus(hall.todayHours).isOpen)
                  .slice(0, 4)
                  .map((hall) => (
                    <PlaceComparisonCard
                      key={hall.id}
                      hall={hall}
                      summary={summaries.get(hall.id)}
                      isBest={hall.id === bestBet?.id}
                    />
                  ))}
              </div>
            </section>

            <Link
              to="/for-you"
              className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 text-ink hover:border-line-strong hover:text-ink"
            >
              <span>
                <b className="block">Browse all confirmed-safe food</b>
                <span className="text-sm text-ink-2">
                  Meals first, with toppings and sauces kept separate.
                </span>
              </span>
              <ChevronRight aria-hidden size={24} className="shrink-0 text-brand" />
            </Link>
          </>
        )}
      </Page>
    </>
  );
}

function HomeHeader({ mealPeriodLabel }: { mealPeriodLabel: string }) {
  const { data: alerts = [] } = useAlerts();
  const unread = alerts.filter((a) => !a.readAt).length;

  return (
    <PageIntro width="wide">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">Where should you eat?</h1>
          <p className="m-0 flex items-center gap-1.5 text-sm text-ink-2">
            <Clock aria-hidden size={15} /> <b>{mealPeriodLabel}</b> · see the best open match
          </p>
        </div>
        <Link
          to="/alerts"
          aria-label={
            unread
              ? `Notifications, ${unread} unread safety alert${unread > 1 ? 's' : ''}`
              : 'Notifications'
          }
          className="relative flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface"
        >
          <Bell aria-hidden size={22} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full bg-avoid-fill text-2xs font-bold text-on-avoid">
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
    </PageIntro>
  );
}

/**
 * The open hall with the most safe items. A neutral card with a red accent:
 * big red fills are kept for Avoid warnings and primary buttons.
 */
function BestMatchCard({
  hallId,
  name,
  summary,
  openLabel,
}: {
  hallId: string;
  name: string;
  summary: HallMenuSummary | undefined;
  openLabel: string;
}) {
  return (
    <Link
      to={`/dining/${hallId}`}
      className="flex items-center gap-3 rounded-card border border-l-4 border-line border-l-brand bg-surface p-4 text-ink transition-colors hover:border-line-strong hover:border-l-brand hover:text-ink"
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="font-heading text-xs font-extrabold tracking-[0.08em] text-brand">
          BEST MATCH RIGHT NOW
        </div>
        <div className="font-heading text-xl leading-tight font-extrabold">{name}</div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink-2">
          {summary?.safeCount != null && <SafeCount count={summary.safeCount} />}
          Open {openLabel}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-3">
        <MetricLabel label="Safe for you">
          <SafetyRing summary={summary} size="large" />
        </MetricLabel>
        {summary?.averageHealthScore != null && (
          <MetricLabel label="Nutrition">
            <NutritionRing summary={summary} size="large" />
          </MetricLabel>
        )}
      </div>
      <span className="inline-flex items-center gap-1 font-bold text-brand">
        View menu <ChevronRight aria-hidden size={20} />
      </span>
    </Link>
  );
}

function PlaceComparisonCard({
  hall,
  summary,
  isBest,
}: {
  hall: DiningHall;
  summary: HallMenuSummary | undefined;
  isBest: boolean;
}) {
  const status = getOpenStatus(hall.todayHours);

  return (
    <Link
      to={`/dining/${hall.id}`}
      className="group flex min-h-[10.75rem] flex-col gap-3 rounded-card border border-line bg-surface p-4 text-ink transition-colors hover:border-line-strong hover:text-ink"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {hasHallBrandMark(hall) && <HallBrandMark hall={hall} size="card" />}
          <h3 className="mt-2 text-lg leading-tight">{hall.name}</h3>
          <p className="m-0 mt-1 text-sm text-ink-2">
            <b className="text-safe">Open</b> · {status.label}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <MetricLabel label="Safe for you">
            <SafetyRing summary={summary} />
          </MetricLabel>
          {summary?.averageHealthScore != null && (
            <MetricLabel label="Nutrition">
              <NutritionRing summary={summary} />
            </MetricLabel>
          )}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
        <span className="text-ink-2">
          {summary
            ? summary.safeCount != null
              ? `${summary.safeCount} of ${summary.itemCount} items safe`
              : `${summary.itemCount} ${summary.mealPeriod} items posted`
            : 'No current menu posted'}
        </span>
        {isBest && <span className="font-bold text-brand">Best match</span>}
      </div>
    </Link>
  );
}

function MetricLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <span className="text-xs font-bold whitespace-nowrap text-ink-2">{label}</span>
    </div>
  );
}

function NutritionRing({
  summary,
  size = 'default',
}: {
  summary: HallMenuSummary;
  size?: 'default' | 'large';
}) {
  if (summary.averageHealthScore == null) return null;

  const score = summary.averageHealthScore;
  const diameter = size === 'large' ? 64 : 52;
  const stroke = size === 'large' ? 6 : 5;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const tone = score >= 75 ? 'text-safe' : score >= 50 ? 'text-brand' : 'text-caution';

  return (
    <span
      className="relative shrink-0"
      style={{ width: diameter, height: diameter }}
      title={`Average SafeBite nutrition estimate across ${summary.scoredItemCount} scoreable meal item${summary.scoredItemCount === 1 ? '' : 's'}`}
      aria-label={`Average menu nutrition score: ${score} out of 100`}
    >
      <svg width={diameter} height={diameter} className="-rotate-90" aria-hidden>
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line"
        />
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={tone}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-xs font-extrabold text-ink">
        {score}
      </span>
    </span>
  );
}

function SafetyRing({
  summary,
  size = 'default',
}: {
  summary: HallMenuSummary | undefined;
  size?: 'default' | 'large';
}) {
  const diameter = size === 'large' ? 64 : 52;
  const stroke = size === 'large' ? 6 : 5;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent =
    summary?.safeCount != null && summary.itemCount > 0
      ? Math.round((summary.safeCount / summary.itemCount) * 100)
      : null;
  const dashOffset = percent == null ? circumference : circumference * (1 - percent / 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: diameter, height: diameter }}
      aria-label={
        percent == null
          ? 'No posted menu to score'
          : `${percent}% of posted items are confirmed safe for you`
      }
    >
      <svg width={diameter} height={diameter} className="-rotate-90" aria-hidden>
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line"
        />
        {percent != null && (
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="text-safe"
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-heading text-xs font-extrabold text-ink">
        {percent == null ? '—' : `${percent}%`}
      </span>
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
      className="flex items-center gap-2.5 rounded-control border border-line bg-surface px-3.5 py-3 text-sm text-ink hover:border-line-strong hover:text-ink"
    >
      <ShieldCheck aria-hidden size={20} className="shrink-0 text-safe" />
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
      className="flex items-center gap-3 rounded-control border-[3px] border-avoid bg-avoid-fill p-3.5 text-label text-on-avoid hover:text-on-avoid"
    >
      <TriangleAlert aria-hidden size={22} className="shrink-0" />
      <span className="flex-1">
        <b>Ingredient update:</b> {item.name} may now contain {allergenNoun(latest.allergen)}.
      </span>
      <ChevronRight aria-hidden size={20} />
    </Link>
  );
}
