import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'destructive';
type Size = 'lg' | 'md';

export interface StyleProps {
  variant?: Variant;
  size?: Size;
  /** Stretch to the full width of the container (the default on mobile forms). */
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-white border-brand hover:bg-brand-hover hover:border-brand-hover hover:text-white',
  secondary: 'bg-surface text-brand border-brand hover:bg-brand-tint',
  destructive: 'bg-surface text-avoid border-avoid hover:bg-avoid/5 hover:text-avoid',
};

const SIZES: Record<Size, string> = {
  lg: 'h-13 text-base',
  md: 'h-11 text-label',
};

/** Shared classes so <Button> and <ButtonLink> look identical. */
export function buttonClasses({ variant = 'primary', size = 'lg', block = true }: StyleProps = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control border-2 px-[18px]',
    'font-heading font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
  );
}
