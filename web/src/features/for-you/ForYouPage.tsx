import { Check, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useHalls } from '@/api/queries';
import type { DiningHall, MenuItem } from '@/api/schemas';
import { Page, PageIntro } from '@/components/layout/Page';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useHallSummaries } from '@/features/dining/useHallSummaries';
import { menuItemKind } from '@/features/menu/itemKind';
import { MenuItemCard, MenuItemRow } from '@/features/menu/MenuItemCard';
import { isSafeForMe, type SafetyAssessment } from '@/features/safety/assess';
import { useSafety } from '@/features/safety/useSafety';
import { MEAL_PERIOD_LABELS } from '@/lib/labels';
import { currentMealPeriod, getOpenStatus } from '@/lib/time';

type Scope = 'open-now' | 'all-locations';

interface SafeEntry {
  item: MenuItem;
  assessment: SafetyAssessment;
  hall: DiningHall;
}

export function ForYouPage() {
  const mealPeriod = currentMealPeriod();
  const [scope, setScope] = useState<Scope>('open-now');
  const hallsQuery = useHalls();
  const { menus, menusQuery } = useHallSummaries(mealPeriod);
  const { profile, assess, isLoading: profileLoading } = useSafety();
  const halls = hallsQuery.data ?? [];

  const safeByHall = useMemo(() => {
    if (!profile) return [];
    const hallById = new Map(halls.map((hall) => [hall.id, hall]));
    const groups = new Map<string, SafeEntry[]>();
    for (const menu of menus) {
      const hall = hallById.get(menu.hallId);
      if (!hall || (scope === 'open-now' && !getOpenStatus(hall.todayHours).isOpen)) continue;
      for (const item of menu.items) {
        const assessment = assess(item);
        // This view makes a stronger promise than the hall filter: only show
        // items with reported allergen data that are confirmed compatible.
        if (assessment.status !== 'safe' || !isSafeForMe(assessment)) continue;
        const entries = groups.get(hall.id) ?? [];
        entries.push({ item, assessment, hall });
        groups.set(hall.id, entries);
      }
    }
    return [...groups.values()].sort((a, b) => a[0]!.hall.name.localeCompare(b[0]!.hall.name));
  }, [profile, halls, menus, scope, assess]);

  const isLoading = profileLoading || hallsQuery.isLoading || menusQuery.isLoading;
  const isError = hallsQuery.isError || menusQuery.isError;

  return (
    <>
      <PageIntro width="wide">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-safe-tint text-safe">
            <ShieldCheck aria-hidden size={23} />
          </span>
          <div>
            <h1 className="text-2xl">All safe food</h1>
            <p className="m-0 text-ink-2">
              Confirmed-compatible items for {MEAL_PERIOD_LABELS[mealPeriod].toLowerCase()}.
            </p>
          </div>
        </div>
        <SegmentedControl<Scope>
          as="tabs"
          label="Safe items scope"
          className="md:max-w-md"
          value={scope}
          onChange={setScope}
          segments={[
            { value: 'open-now', label: 'Open now' },
            { value: 'all-locations', label: 'All locations' },
          ]}
        />
      </PageIntro>

      <Page width="wide">
        {isLoading && <LoadingState />}
        {isError && (
          <ErrorState
            onRetry={() => {
              void hallsQuery.refetch();
              void menusQuery.refetch();
            }}
          />
        )}
        {!isLoading && !isError && !profile && (
          <EmptyState icon={<ShieldCheck size={28} />} title="Set up your dietary profile">
            Add allergies and preferences, then SafeBite can show every compatible item here.
            <ButtonLink to="/onboarding/allergies" className="mt-3" block={false}>
              Set up profile
            </ButtonLink>
          </EmptyState>
        )}
        {!isLoading && !isError && profile && safeByHall.length === 0 && (
          <EmptyState title="No matching items right now">
            Try the all-locations view or check another meal period later.
          </EmptyState>
        )}
        {!isLoading && !isError && profile && safeByHall.length > 0 && (
          <div className="flex flex-col gap-8">
            {safeByHall.map((entries) => (
              <SafeHallGroup key={entries[0]!.hall.id} entries={entries} />
            ))}
          </div>
        )}
      </Page>
    </>
  );
}

function SafeHallGroup({ entries }: { entries: SafeEntry[] }) {
  const hall = entries[0]!.hall;
  const meals = entries.filter(({ item }) => menuItemKind(item) === 'meal');
  const extras = entries.filter(({ item }) => menuItemKind(item) === 'extra');

  return (
    <section aria-labelledby={`safe-hall-${hall.id}`} className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id={`safe-hall-${hall.id}`} className="text-xl">
            <Link to={`/dining/${hall.id}`} className="text-ink hover:text-brand">
              {hall.name}
            </Link>
          </h2>
          <p className="m-0 flex items-center gap-1.5 text-sm text-safe">
            <Check aria-hidden size={16} strokeWidth={3} /> {meals.length} meal
            {meals.length === 1 ? '' : 's'} match your profile
          </p>
        </div>
        <Link to={`/dining/${hall.id}`} className="text-sm font-bold text-brand">
          View menu
        </Link>
      </div>

      {meals.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {meals.map(({ item, assessment }) => (
            <MenuItemCard key={item.id} item={item} assessment={assessment} />
          ))}
        </div>
      )}
      {extras.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 list-none items-center justify-between rounded-control border border-line bg-surface px-3.5 font-bold [&::-webkit-details-marker]:hidden">
            Extras & sauces · {extras.length}
            <span className="text-sm font-normal text-ink-3">Show</span>
          </summary>
          <Card className="mt-2 overflow-hidden">
            {extras.map(({ item, assessment }) => (
              <MenuItemRow key={item.id} item={item} assessment={assessment} />
            ))}
          </Card>
        </details>
      )}
    </section>
  );
}
