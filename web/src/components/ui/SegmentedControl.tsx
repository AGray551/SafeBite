import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** Use "tabs" when each segment swaps the content below it. */
  as?: 'buttons' | 'tabs';
}

/** Pill-shaped toggle between a few options (List/Map, Breakfast/Lunch/Dinner). */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  as = 'buttons',
}: SegmentedControlProps<T>) {
  const isTabs = as === 'tabs';
  return (
    <div
      role={isTabs ? 'tablist' : 'group'}
      aria-label={label}
      className="flex gap-1 rounded-control bg-placeholder p-1"
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role={isTabs ? 'tab' : undefined}
            aria-selected={isTabs ? selected : undefined}
            aria-pressed={isTabs ? undefined : selected}
            onClick={() => onChange(segment.value)}
            className={cn(
              'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-label transition-colors',
              selected
                ? 'bg-surface font-extrabold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.18)]'
                : 'font-semibold text-ink-3 hover:text-ink',
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
