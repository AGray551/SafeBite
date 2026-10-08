import { Image } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Stand-in for food photos. The scraper doesn't collect images yet, so this
 * keeps layouts stable until it does.
 */
export function ImagePlaceholder({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-line-dashed bg-placeholder text-ink-4',
        className,
      )}
    >
      <Image size={24} />
      {label && <span className="text-xs text-ink-3">{label}</span>}
    </div>
  );
}
