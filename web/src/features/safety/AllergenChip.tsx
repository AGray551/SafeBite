import { cn } from '@/lib/cn';
import { allergenLabel } from '@/lib/labels';
import { AllergenIcon } from './AllergenIcon';

type Tone = 'neutral' | 'avoid' | 'caution';

const TONES: Record<Tone, string> = {
  neutral: 'border-line-strong bg-surface text-ink-2',
  avoid: 'border-avoid bg-avoid text-white',
  caution: 'border-caution border-dashed bg-caution-tint text-caution-ink',
};

interface AllergenChipProps {
  allergen: string;
  /** Highlight allergens that matter to this student. */
  tone?: Tone;
  /** Extra text after the name, e.g. "your allergy". */
  note?: string;
}

/** Icon + name pill for a single allergen. */
export function AllergenChip({ allergen, tone = 'neutral', note }: AllergenChipProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full border-2 px-2.5 text-sm font-bold',
        TONES[tone],
      )}
    >
      <AllergenIcon allergen={allergen} size={16} />
      {allergenLabel(allergen)}
      {note && <span className="font-normal opacity-90">· {note}</span>}
    </span>
  );
}
