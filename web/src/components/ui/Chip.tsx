import { Check, ChevronDown } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active: boolean;
  children: ReactNode;
  /** Custom leading icon shown while active (defaults to a check mark). */
  icon?: ReactNode;
  /** Shows a chevron to signal the chip opens more options. */
  hasMenu?: boolean;
}

/**
 * Filter chip. The active state uses a check icon + fill, never color alone,
 * and is exposed to screen readers with aria-pressed.
 */
export function Chip({ active, children, icon, hasMenu, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold whitespace-nowrap transition-colors',
        active
          ? 'border-2 border-brand bg-brand text-white'
          : 'border-[1.5px] border-line-strong bg-surface text-ink hover:bg-canvas',
        className,
      )}
      {...props}
    >
      {active && (icon ?? <Check aria-hidden size={16} strokeWidth={2.5} />)}
      {children}
      {hasMenu && <ChevronDown aria-hidden size={16} />}
    </button>
  );
}

/** Horizontally scrolling row of chips (wraps on wider screens). */
export function ChipRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
    >
      {children}
    </div>
  );
}
