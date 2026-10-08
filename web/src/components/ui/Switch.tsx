import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** On/off switch. The "on" thumb shows a check so state isn't color-only. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-8 w-13 shrink-0 items-center rounded-full border-2 p-0.5 transition-colors disabled:opacity-60',
        checked
          ? 'justify-end border-brand bg-brand'
          : 'justify-start border-line-strong bg-surface',
      )}
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-brand',
          checked ? 'bg-surface' : 'bg-line-strong',
        )}
      >
        {checked && <Check aria-hidden size={14} strokeWidth={3} />}
      </span>
    </button>
  );
}
