import { Info } from 'lucide-react';
import type { AllergenInfo } from '@/api/schemas';
import { cn } from '@/lib/cn';
import { allergenNoun } from '@/lib/labels';
import type { SafetyStatus } from './assess';
import { STATUS_STYLES } from './statusStyles';

/**
 * One-line allergen summary under a menu item ("Contains: peanuts, soy").
 * Colored and iconed by the item's status for this student.
 */
export function AllergenLine({
  allergens,
  status,
}: {
  allergens: AllergenInfo | null;
  status: SafetyStatus;
}) {
  const text = describeAllergens(allergens);
  const flagged = status === 'avoid' || status === 'caution';
  const Icon = flagged ? STATUS_STYLES[status].icon : Info;

  return (
    <div
      className={cn(
        'flex items-start gap-1.5 text-caption',
        flagged ? cn('font-bold', STATUS_STYLES[status].text) : 'text-ink-3',
      )}
    >
      <Icon aria-hidden size={15} className="mt-px shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function describeAllergens(allergens: AllergenInfo | null): string {
  if (!allergens) return 'Allergen information unavailable';
  const contains = allergens.contains.map(allergenNoun);
  const mayContain = allergens.mayContain.map(allergenNoun);

  const parts: string[] = [];
  parts.push(contains.length ? `Contains: ${contains.join(', ')}` : 'No major allergens');
  if (mayContain.length) parts.push(`may contain ${mayContain.join(', ')}`);
  return parts.join(' · ');
}
