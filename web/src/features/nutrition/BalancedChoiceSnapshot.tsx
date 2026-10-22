import { Info, Sparkles } from 'lucide-react';
import type { Nutrition } from '@/api/schemas';
import { cn } from '@/lib/cn';
import { getBalancedChoice } from './balancedChoice';

const TONE_STYLES = {
  strong: 'border-safe/25 bg-safe-tint text-safe',
  balanced: 'border-brand/20 bg-brand-tint text-brand-hover',
  consider: 'border-caution/30 bg-caution-tint text-caution-ink',
} as const;

export function BalancedChoiceSnapshot({ nutrition }: { nutrition: Nutrition }) {
  const choice = getBalancedChoice(nutrition);

  if (!choice) {
    return (
      <div className="rounded-control border border-line bg-surface-muted p-3 text-sm text-ink-2">
        <b className="text-ink">Nutrition snapshot unavailable.</b> This item is missing one or more
        values needed for a fair comparison.
      </div>
    );
  }

  return (
    <section
      className="rounded-card border border-line bg-surface-muted p-4"
      aria-labelledby="balanced-choice-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-caption font-extrabold tracking-[0.06em] text-ink-3 uppercase">
            <Sparkles aria-hidden size={15} /> Nutrition snapshot
          </div>
          <h3 id="balanced-choice-title" className="mt-1 text-lg">
            {choice.label}
          </h3>
        </div>
        <div
          className={cn('rounded-control border px-2.5 py-1 text-right', TONE_STYLES[choice.tone])}
        >
          <div className="font-heading text-xl leading-none font-extrabold">{choice.score}</div>
          <div className="mt-0.5 text-2xs font-bold">out of 100</div>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Balanced choice estimate"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={choice.score}
      >
        <div
          className={cn(
            'h-full rounded-full',
            choice.tone === 'strong'
              ? 'bg-safe'
              : choice.tone === 'balanced'
                ? 'bg-brand'
                : 'bg-caution',
          )}
          style={{ width: `${choice.score}%` }}
        />
      </div>

      {choice.highlights.length > 0 && (
        <p className="mt-3 mb-0 text-sm text-ink-2">Based on: {choice.highlights.join(' · ')}</p>
      )}
      <p className="mt-3 mb-0 flex items-start gap-1.5 text-caption text-ink-3">
        <Info aria-hidden size={15} className="mt-px shrink-0" />A SafeBite estimate using the
        listed serving’s calories, protein, fiber, saturated fat, sodium, and sugar. It is not
        medical advice or an official nutrition rating.
      </p>
    </section>
  );
}
