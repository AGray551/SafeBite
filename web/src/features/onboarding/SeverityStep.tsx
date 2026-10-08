import { Check, Info, X } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router';
import { SEVERITIES, type Severity } from '@/api/schemas';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { SafetyBadge } from '@/features/safety/SafetyBadge';
import { cn } from '@/lib/cn';
import { AllergenIcon } from '@/features/safety/AllergenIcon';
import { allergenLabel, SEVERITY_LABELS } from '@/lib/labels';
import { useOnboarding } from './draft';

/** Step 2: choose Allergy / Intolerance / Preference for each selection. */
export function SeverityStep() {
  const { draft, updateDraft, exitTo } = useOnboarding();
  const navigate = useNavigate();
  const query = exitTo === '/profile' ? '?from=profile' : '';

  if (draft.avoid.length === 0) return <Navigate to={`../allergies${query}`} replace />;

  const setSeverity = (allergen: string, severity: Severity) =>
    updateDraft((d) => ({
      ...d,
      avoid: d.avoid.map((a) => (a.allergen === allergen ? { ...a, severity } : a)),
    }));

  const remove = (allergen: string) =>
    updateDraft((d) => ({ ...d, avoid: d.avoid.filter((a) => a.allergen !== allergen) }));

  return (
    <>
      <div>
        <h2 className="mb-1.5 text-title leading-tight">How should SafeBite treat each one?</h2>
        <p className="m-0 text-ink-2">
          This decides whether an item is marked Avoid, Caution, or simply filtered.
        </p>
      </div>

      {draft.avoid.map(({ allergen, severity }) => {
        const name = allergenLabel(allergen);
        return (
          <Card key={allergen} className="flex flex-col gap-2 px-3.5 pt-3 pb-3.5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg">
                <AllergenIcon allergen={allergen} size={20} className="text-brand" />
                {name}
              </h3>
              <IconButton aria-label={`Remove ${name}`} onClick={() => remove(allergen)}>
                <X aria-hidden size={20} />
              </IconButton>
            </div>
            <div role="group" aria-label={`${name} severity`} className="flex gap-2">
              {SEVERITIES.map((option) => {
                const active = option === severity;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSeverity(allergen, option)}
                    className={cn(
                      'flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] text-ink',
                      active
                        ? 'border-2 border-brand bg-brand-tint'
                        : 'border-[1.5px] border-line-strong bg-surface hover:bg-canvas',
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center gap-1 text-label',
                        active ? 'font-extrabold' : 'font-semibold',
                      )}
                    >
                      {active && <Check aria-hidden size={16} strokeWidth={3} />}
                      {SEVERITY_LABELS[option].label}
                    </span>
                    <span className="text-xs text-ink-3">{SEVERITY_LABELS[option].hint}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      <details open className="rounded-card border border-line bg-surface px-3.5 pt-1 pb-2">
        <summary className="flex min-h-11 items-center gap-2 font-extrabold">
          <Info aria-hidden size={18} />
          What these mean
        </summary>
        <dl className="m-0">
          <Meaning term="Allergy: must avoid">
            <span>
              Items that contain it are marked <SafetyBadge status="avoid" size="sm" />
            </span>
            <span>
              "May contain" and shared equipment are marked{' '}
              <SafetyBadge status="caution" size="sm" />
            </span>
          </Meaning>
          <Meaning term="Intolerance">
            <span>
              Items that contain it are marked <SafetyBadge status="caution" size="sm" />
            </span>
          </Meaning>
          <Meaning term="Preference" last>
            <span>Used to filter menus; never flagged as unsafe.</span>
          </Meaning>
        </dl>
      </details>

      <div className="mt-auto pt-2">
        <Button onClick={() => navigate(`../preferences${query}`)}>Continue</Button>
      </div>
    </>
  );
}

function Meaning({
  term,
  children,
  last,
}: {
  term: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-1 py-2.5', !last && 'border-b border-line')}>
      <dt className="text-label font-extrabold">{term}</dt>
      <dd className="m-0 flex flex-col gap-1.5 text-sm text-ink-2">{children}</dd>
    </div>
  );
}
