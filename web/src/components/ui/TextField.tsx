import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Validation message; also marks the input invalid for screen readers. */
  error?: string;
  /** Element rendered inside the right edge of the input (e.g. show-password). */
  trailing?: ReactNode;
}

export function TextField({ label, error, trailing, className, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-label font-bold">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-13 w-full rounded-[10px] border-[1.5px] bg-surface px-3.5 text-base text-ink placeholder:text-ink-3',
            error ? 'border-avoid' : 'border-line-input',
            trailing && 'pr-14',
            className,
          )}
          {...props}
        />
        {trailing && <div className="absolute right-1">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="m-0 text-sm font-bold text-avoid">
          {error}
        </p>
      )}
    </div>
  );
}
