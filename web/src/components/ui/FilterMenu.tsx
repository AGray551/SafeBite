import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FilterMenuProps {
  /** How many filters are on; shown on the button so it's clear results are narrowed. */
  activeCount: number;
  /** Resets every filter in the menu. Hidden when nothing is on. */
  onReset?: () => void;
  children: ReactNode;
}

/**
 * A "Filters" button that opens a small panel of options below it. Escape or
 * a click outside closes it and puts focus back on the button.
 */
export function FilterMenu({ activeCount, onReset, children }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('input, button, select')?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={activeCount > 0 ? `Filters, ${activeCount} on` : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-control border-[1.5px] px-3.5 text-sm font-bold transition-colors',
          open || activeCount > 0
            ? 'border-ink bg-surface text-ink'
            : 'border-line-strong bg-surface text-ink hover:bg-canvas',
        )}
      >
        <SlidersHorizontal aria-hidden size={18} />
        Filters
        {activeCount > 0 && (
          <span
            aria-hidden
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs text-surface"
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="group"
          aria-label="Filters"
          className="absolute top-full right-0 z-20 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        >
          {children}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            {onReset && activeCount > 0 ? (
              <button
                type="button"
                onClick={onReset}
                className="min-h-11 text-sm font-bold text-ink-2 hover:text-ink"
              >
                Reset
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => close()}
              className="inline-flex h-11 items-center rounded-control bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A labeled set of options inside the filter menu. */
export function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-col border-0 p-0">
      <legend className="mb-1 p-0 text-xs font-extrabold tracking-[0.08em] text-ink-3 uppercase">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

interface FilterOptionProps {
  type: 'checkbox' | 'radio';
  /** Shared by radio buttons in one group. */
  name?: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  /** Muted text on the right, e.g. a count. */
  detail?: ReactNode;
}

/** One checkbox or radio row with a large tap target. */
export function FilterOption({
  type,
  name,
  checked,
  onChange,
  children,
  detail,
}: FilterOptionProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="m-0 size-5 shrink-0 accent-brand"
      />
      <span className="flex-1">{children}</span>
      {detail != null && <span className="text-sm text-ink-3">{detail}</span>}
    </label>
  );
}
