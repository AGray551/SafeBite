import { Heart } from 'lucide-react';
import { useFavorites, useToggleFavorite } from '@/api/queries';
import { cn } from '@/lib/cn';

interface FavoriteButtonProps {
  kind: 'item' | 'hall';
  id: string;
  /** Used for the accessible label: "Save Grilled Chicken Bowl to favorites". */
  name: string;
  className?: string;
}

/** Heart toggle. Filled + brand color when saved, outline when not. */
export function FavoriteButton({ kind, id, name, className }: FavoriteButtonProps) {
  const { data: favorites } = useFavorites();
  const toggle = useToggleFavorite(kind);
  const saved = (kind === 'item' ? favorites?.itemIds : favorites?.hallIds)?.includes(id) ?? false;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      onClick={() => toggle.mutate({ id, saved: !saved })}
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
