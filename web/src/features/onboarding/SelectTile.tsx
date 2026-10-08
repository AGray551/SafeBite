import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SelectTileProps {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Large checkbox-style tile used in the allergen and preference grids. */
export function SelectTile({ selected, onToggle, children }: SelectTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'flex h-14 items-center gap-2.5 rounded-control px-3.5 text-left text-base text-ink transition-colors',
        selected
          ? 'border-2 border-brand bg-brand-tint font-extrabold'
          : 'border-[1.5px] border-line-strong bg-surface font-semibold hover:bg-canvas',
      )}
    >
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md',
          selected ? 'bg-brand text-white' : 'border-2 border-line-strong bg-surface',
        )}
      >
        {selected && <Check aria-hidden size={16} strokeWidth={3} />}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

export function TileGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {children}
    </div>
  );
}
