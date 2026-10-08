import { cn } from '@/lib/cn';
import type { SafetyStatus } from './assess';
import { STATUS_STYLES } from './statusStyles';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { pill: string; icon: number }> = {
  sm: { pill: 'px-2 py-0.5 text-xs', icon: 14 },
  md: { pill: 'px-2.5 py-1 text-caption', icon: 16 },
  lg: { pill: 'px-3.5 py-[7px] text-label', icon: 18 },
};

interface SafetyBadgeProps {
  status: SafetyStatus;
  size?: Size;
  /** Use the short label ("SAFE") instead of the long one ("SAFE FOR YOU"). */
  short?: boolean;
  className?: string;
}

/** Pill showing an item's safety status: icon + word + border style. */
export function SafetyBadge({ status, size = 'md', short, className }: SafetyBadgeProps) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;
  const dims = SIZES[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 font-heading leading-tight font-extrabold tracking-[0.04em] whitespace-nowrap',
        style.tone,
        dims.pill,
        className,
      )}
    >
      <Icon aria-hidden size={dims.icon} strokeWidth={2.5} />
      {short ? style.shortLabel : style.label}
    </span>
  );
}
