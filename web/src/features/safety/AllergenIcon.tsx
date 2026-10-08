import { CircleDot, type LucideProps } from 'lucide-react';
import { ALLERGEN_ICON_MAP } from './allergenIcons';

/** Renders the icon for an allergen (generic dot for custom ones). */
export function AllergenIcon({ allergen, ...props }: LucideProps & { allergen: string }) {
  const Icon = ALLERGEN_ICON_MAP[allergen] ?? CircleDot;
  return <Icon aria-hidden {...props} />;
}
