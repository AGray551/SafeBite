import { Heart } from 'lucide-react';
import { useFavorites, useToggleFavorite } from '@/api/queries';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/lib/cn';

type Kind = 'item' | 'hall';

/** Saved state + toggle for one item or hall. */
function useFavoriteState(kind: Kind, id: string) {
  const { data: favorites } = useFavorites();
  const toggle = useToggleFavorite(kind);
  const saved = (kind === 'item' ? favorites?.itemIds : favorites?.hallIds)?.includes(id) ?? false;
  return { saved, toggle: () => toggle.mutate({ id, saved: !saved }) };
}

interface FavoriteButtonProps {
  kind: Kind;
  id: string;
  /** Used for the accessible label: "Save Grilled Chicken Bowl to favorites". */
  name: string;
  className?: string;
}

/** Heart toggle. Filled + brand color when saved, outline when not. */
export function FavoriteButton({ kind, id, name, className }: FavoriteButtonProps) {
  const { saved, toggle } = useFavoriteState(kind, id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      onClick={toggle}
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-canvas',
        saved ? 'text-brand' : 'text-ink-2',
        className,
      )}
    >
      <Heart aria-hidden size={22} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

/**
 * Full-width "Save to favorites" button for detail screens. `compact` uses
 * shorter text when it shares the row with another button.
 */
export function SaveFavoriteButton({
  kind,
  id,
  compact,
}: {
  kind: Kind;
  id: string;
  compact?: boolean;
}) {
  const { saved, toggle } = useFavoriteState(kind, id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={toggle}
      className={buttonClasses({ variant: saved ? 'secondary' : 'primary' })}
    >
      <Heart aria-hidden size={20} fill={saved ? 'currentColor' : 'none'} />
      {compact ? (saved ? 'Saved' : 'Save') : saved ? 'Saved to favorites' : 'Save to favorites'}
    </button>
  );
}
