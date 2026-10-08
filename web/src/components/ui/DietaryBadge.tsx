import type { DietaryTag } from '@/api/schemas';
import { DIETARY_TAG_ICONS } from '@/features/safety/allergenIcons';
import { DIETARY_TAG_LABELS, DIETARY_TAG_SHORT_LABELS } from '@/lib/labels';

interface DietaryBadgeProps {
  tag: DietaryTag;
  /**
   * "short" (default) shows a code like "GF" to keep cards compact; hovering
   * shows the full name and screen readers always hear it. "full" spells it out.
   */
  variant?: 'short' | 'full';
}

export function DietaryBadge({ tag, variant = 'short' }: DietaryBadgeProps) {
  const Icon = DIETARY_TAG_ICONS[tag];
  const full = DIETARY_TAG_LABELS[tag];

  return (
    <span
      title={variant === 'short' ? full : undefined}
      className="inline-flex h-6 items-center gap-1 rounded-md border border-line-strong bg-surface px-1.5 text-xs font-bold whitespace-nowrap text-ink-2"
    >
      <Icon aria-hidden size={13} />
      {variant === 'short' ? (
        <>
          <span aria-hidden>{DIETARY_TAG_SHORT_LABELS[tag]}</span>
          <span className="sr-only">{full}</span>
        </>
      ) : (
        full
      )}
    </span>
  );
}
