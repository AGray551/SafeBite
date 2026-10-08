import type { DietaryTag } from '@/api/schemas';
import { DIETARY_TAG_LABELS } from '@/lib/labels';

export function DietaryBadge({ tag }: { tag: DietaryTag }) {
  return (
    <span className="inline-flex h-6.5 items-center rounded-md border border-line-strong bg-surface px-2 text-xs font-bold whitespace-nowrap text-ink-2">
      {DIETARY_TAG_LABELS[tag]}
    </span>
  );
}
