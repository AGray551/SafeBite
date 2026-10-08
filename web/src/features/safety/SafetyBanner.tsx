import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { SafetyStatus } from './assess';
import { STATUS_STYLES } from './statusStyles';

interface SafetyBannerProps {
  status: SafetyStatus;
  title: string;
  children?: ReactNode;
}

/** Large status banner at the top of the item detail screen. */
export function SafetyBanner({ status, title, children }: SafetyBannerProps) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <div role="status" className={cn('flex gap-3 rounded-card border-2 p-4', style.tone)}>
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          status === 'avoid' ? 'bg-white/20' : 'bg-surface',
        )}
      >
        <Icon aria-hidden size={22} strokeWidth={2.5} />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="font-heading text-xs font-extrabold tracking-[0.08em]">{style.label}</div>
        <div className="font-heading text-lg leading-tight font-extrabold">{title}</div>
        {children && <div className="text-label">{children}</div>}
      </div>
    </div>
  );
}
