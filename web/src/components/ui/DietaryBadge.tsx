import type { DietaryTag } from '@/api/schemas';
import { DIETARY_TAG_ICONS } from '@/features/safety/allergenIcons';
import { DIETARY_TAG_LABELS } from '@/lib/labels';

export function DietaryBadge({ tag }: { tag: DietaryTag }) {
  const Icon = DIETARY_TAG_ICONS[tag];
  return (
    <span className="inline-flex h-6.5 items-center gap-1 rounded-md border border-line-strong bg-surface px-2 text-xs font-bold whitespace-nowrap text-ink-2">
      <Icon aria-hidden size={13} />
      {DIETARY_TAG_LABELS[tag]}
    </span>
  );
}
