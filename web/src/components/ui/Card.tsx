import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** White surface with the standard border and radius. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-surface', className)} {...props} />;
}
