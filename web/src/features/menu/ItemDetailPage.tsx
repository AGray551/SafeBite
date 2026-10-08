import { Check, ChevronDown, Flag, RefreshCw, Store, X, Repeat } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useHall, useItem, useMenu } from '@/api/queries';
import { DIETARY_TAGS, type MenuItem } from '@/api/schemas';
import { Page } from '@/components/layout/Page';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { ErrorState, LoadingState } from '@/components/ui/QueryState';
import { FavoriteButton, SaveFavoriteButton } from '@/features/favorites/FavoriteButton';
import { AllergenChip } from '@/features/safety/AllergenChip';
import { DIETARY_TAG_ICONS } from '@/features/safety/allergenIcons';
import { isSafeForMe, type SafetyAssessment } from '@/features/safety/assess';
import { FreshnessNote } from '@/features/safety/FreshnessNote';
import { SafetyBanner } from '@/features/safety/SafetyBanner';
import { useSafety } from '@/features/safety/useSafety';
import { cn } from '@/lib/cn';
import { allergenNoun, DIETARY_TAG_LABELS, joinList } from '@/lib/labels';
import { currentMealPeriod, formatUpdatedAt, toDateKey } from '@/lib/time';
import { MenuItemRow } from './MenuItemCard';

export function ItemDetailPage() {
  const { itemId = '' } = useParams();
  const itemQuery = useItem(itemId);
  const item = itemQuery.data;

  return (
    <>
      <PageHeader
        title={item?.name}
        fallbackTo="/"
        actions={item && <FavoriteButton kind="item" id={item.id} name={item.name} />}
      />
      {itemQuery.isLoading && <LoadingState />}
      {itemQuery.isError && (
        <ErrorState
          message="We couldn't load this menu item."
          onRetry={() => void itemQuery.refetch()}
        />
      )}
      {item && <ItemDetail item={item} />}
    </>
  );
}

function ItemDetail({ item }: { item: MenuItem }) {
  const { assess, profile } = useSafety();
  const { data: hall } = useHall(item.hallId);
  const assessment = assess(item);
  const flagged = assessment.status === 'avoid' || assessment.status === 'caution';
  const yourAllergens = new Map(profile?.avoid.map((a) => [a.allergen, a.severity]) ?? []);

  return (
    <>
      <Page className="pb-28">
        <ImagePlaceholder className="h-48 w-full rounded-card md:h-64" label="Food photo" />

        <StatusBanner assessment={assessment} hasProfile={Boolean(profile)} item={item} />

        <section className="flex flex-col gap-2">
          <h2 className="text-title leading-tight">{item.name}</h2>
          <p className="m-0 flex items-center gap-1.5 text-label text-ink-2">
            <Store aria-hidden size={16} />
            {hall ? (
              <Link to={`/dining/${hall.id}`} className="font-bold">
                {hall.name}
              </Link>
            ) : (
              '…'
            )}
            · {item.station}
          </p>
          {item.description && <p className="m-0 text-ink-2">{item.description}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Serving" value={item.servingSize ?? '—'} />
            <Stat label="Calories" value={`${item.nutrition.calories} cal`} />
          </div>
        </section>

        {item.ingredientsChangedAt && (
          <div
            role="note"
            className="flex items-start gap-2.5 rounded-control border-2 border-dashed border-caution bg-caution-tint p-3.5 text-sm text-caution-ink"
          >
            <RefreshCw aria-hidden size={18} className="mt-px shrink-0" />
            <span>
              <b>Ingredients changed {formatUpdatedAt(item.ingredientsChangedAt)}.</b> Review the
              allergens below even if you've had this before.
            </span>
          </div>
        )}

        <Section title="Allergens">
          {item.allergens ? (
            <div className="flex flex-col gap-4">
              <AllergenGroup label="Contains">
                {item.allergens.contains.length === 0 ? (
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <Check aria-hidden size={18} className="text-safe" /> None of the 9 major
                    allergens
                  </span>
                ) : (
                  item.allergens.contains.map((a) => {
                    const severity = yourAllergens.get(a);
                    return (
                      <AllergenChip
                        key={a}
                        allergen={a}
                        tone={
                          severity === 'allergy'
                            ? 'avoid'
                            : severity === 'intolerance'
                              ? 'caution'
                              : 'neutral'
                        }
                        note={
                          severity && severity !== 'preference' ? `your ${severity}` : undefined
                        }
                      />
                    );
                  })
                )}
              </AllergenGroup>
              {item.allergens.mayContain.length > 0 && (
                <AllergenGroup label="May contain">
                  {item.allergens.mayContain.map((a) => {
                    const severity = yourAllergens.get(a);
                    return (
                      <AllergenChip
                        key={a}
                        allergen={a}
                        tone={severity && severity !== 'preference' ? 'caution' : 'neutral'}
                        note={
                          severity && severity !== 'preference' ? `your ${severity}` : undefined
                        }
                      />
                    );
                  })}
                </AllergenGroup>
              )}
              {item.allergens.crossContactNote && (
                <div className="flex items-start gap-2 text-sm text-ink-2">
                  <Repeat aria-hidden size={18} className="mt-px shrink-0" />
                  <span>
                    <b className="text-ink">Cross-contact:</b> {item.allergens.crossContactNote}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="m-0 text-ink-2">
              Allergen information isn't available for this item. Ask dining staff before eating it.
            </p>
          )}
        </Section>

        {flagged && <SafeAlternatives item={item} />}

        <Section title="Dietary compatibility">
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
            {DIETARY_TAGS.map((tag) => {
              const matches = item.dietaryTags.includes(tag);
              const Icon = DIETARY_TAG_ICONS[tag];
              return (
                <li
                  key={tag}
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    matches ? 'font-bold' : 'text-ink-3',
                  )}
                >
                  {matches ? (
                    <Check aria-hidden size={18} className="text-safe" strokeWidth={3} />
                  ) : (
                    <X aria-hidden size={18} />
                  )}
                  <Icon aria-hidden size={16} />
                  <span>
                    {matches ? '' : 'Not '}
                    {matches ? DIETARY_TAG_LABELS[tag] : DIETARY_TAG_LABELS[tag].toLowerCase()}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Nutrition facts">
          <NutritionTable item={item} />
        </Section>

        {item.ingredients && (
          <details className="group rounded-card border border-line bg-surface px-4 py-1">
            <summary className="flex min-h-12 list-none items-center justify-between font-heading text-lg font-extrabold [&::-webkit-details-marker]:hidden">
              Ingredients
              <span className="flex items-center gap-1 font-sans text-sm font-bold text-brand">
                <span className="group-open:hidden">Show all</span>
                <span className="hidden group-open:inline">Hide</span>
                <ChevronDown
                  aria-hidden
                  size={18}
                  className="transition-transform group-open:rotate-180"
                />
              </span>
            </summary>
            <p className="mt-0 mb-3 text-ink-2">{item.ingredients}</p>
          </details>
        )}

        <FreshnessNote updatedAt={item.updatedAt} subject="Item info" />

        <Link
          to={`/items/${item.id}/report`}
          className="flex min-h-11 items-center gap-2 self-start font-bold"
        >
          <Flag aria-hidden size={18} />
          Report incorrect information
        </Link>
      </Page>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl gap-3">
          {flagged && (
            <ButtonLink to="#alternatives" variant="secondary" className="flex-1">
              Safe alternatives
            </ButtonLink>
          )}
          <div className="flex-1">
            <SaveFavoriteButton kind="item" id={item.id} compact={flagged} />
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBanner({
  assessment,
  hasProfile,
  item,
}: {
  assessment: SafetyAssessment;
  hasProfile: boolean;
  item: MenuItem;
}) {
  const real = assessment.conflicts.filter((c) => c.severity !== 'preference');
  const allergies = real
    .filter((c) => c.severity === 'allergy' && c.kind === 'contains')
    .map((c) => allergenNoun(c.allergen));

  switch (assessment.status) {
    case 'safe':
      return (
        <SafetyBanner status="safe" title="Safe based on your current dietary profile">
          No conflicts found.
          {item.allergens?.crossContactNote && ' See the cross-contact note below.'}
        </SafetyBanner>
      );
    case 'caution':
      return (
        <SafetyBanner status="caution" title={assessment.summary}>
          {real.some((c) => c.kind === 'contains')
            ? 'This contains something you marked as an intolerance.'
            : 'It may contain one of your allergens due to shared equipment. Ask staff if unsure.'}
        </SafetyBanner>
      );
    case 'avoid':
      return (
        <SafetyBanner
          status="avoid"
          title={`Contains ${joinList(allergies)}, which you marked as an allergy.`}
        >
          Not recommended based on your profile.
        </SafetyBanner>
      );
    case 'unknown':
      return hasProfile ? (
        <SafetyBanner status="unknown" title="We couldn't check this item">
          Allergen information is missing. Confirm with dining staff before eating.
        </SafetyBanner>
      ) : (
        <SafetyBanner status="unknown" title="Set up your profile to check this item">
          <Link to="/onboarding/allergies" className="font-bold">
            Add your allergies
          </Link>{' '}
          and SafeBite will flag anything you need to avoid.
        </SafetyBanner>
      );
  }
}

function SafeAlternatives({ item }: { item: MenuItem }) {
  const { assess } = useSafety();
  const { data: menu } = useMenu(item.hallId, {
    date: toDateKey(),
    mealPeriod: currentMealPeriod(),
  });

  const alternatives = (menu?.items ?? [])
    .filter((other) => other.id !== item.id)
    .map((other) => ({ item: other, assessment: assess(other) }))
    .filter(({ assessment }) => assessment.status === 'safe' && isSafeForMe(assessment))
    // Prefer dishes from the same menu section.
    .sort(
      (a, b) =>
        Number(b.item.category === item.category) - Number(a.item.category === item.category),
    )
    .slice(0, 3);

  return (
    <section
      id="alternatives"
      aria-labelledby="alternatives-heading"
      className="flex scroll-mt-20 flex-col gap-3"
    >
      <h2 id="alternatives-heading" className="text-xl">
        Safe alternatives here
      </h2>
      {alternatives.length === 0 ? (
        <p className="m-0 text-ink-2">No safe alternatives on this menu right now.</p>
      ) : (
        <Card className="overflow-hidden">
          {alternatives.map(({ item: alt, assessment }) => (
            <MenuItemRow
              key={alt.id}
              item={alt}
              assessment={assessment}
              meta={`${alt.station} · ${alt.nutrition.calories} cal`}
            />
          ))}
        </Card>
      )}
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

function AllergenGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-heading text-xs font-extrabold tracking-[0.08em] text-ink-3 uppercase">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-line bg-surface px-3.5 py-2.5">
      <div className="text-caption text-ink-3">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

function NutritionTable({ item }: { item: MenuItem }) {
  const { nutrition } = item;
  const rows: [string, string | undefined][] = [
    ['Calories', String(nutrition.calories)],
    ['Protein', nutrition.proteinG != null ? `${nutrition.proteinG} g` : undefined],
    ['Carbohydrates', nutrition.carbsG != null ? `${nutrition.carbsG} g` : undefined],
    ['Fat', nutrition.fatG != null ? `${nutrition.fatG} g` : undefined],
    ['Sodium', nutrition.sodiumMg != null ? `${nutrition.sodiumMg} mg` : undefined],
    ['Sugar', nutrition.sugarG != null ? `${nutrition.sugarG} g` : undefined],
  ];

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="pb-2 text-left text-ink-3">
        Per serving{item.servingSize ? ` (${item.servingSize})` : ''}
      </caption>
      <tbody>
        {rows
          .filter(([, value]) => value !== undefined)
          .map(([label, value]) => (
            <tr key={label} className="border-t border-line">
              <th scope="row" className="py-2 text-left font-normal text-ink-2">
                {label}
              </th>
              <td className="py-2 text-right font-bold">{value}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
