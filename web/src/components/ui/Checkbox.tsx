import type { InputHTMLAttributes, ReactNode } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode;
}

export function Checkbox({ children, ...props }: CheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-label font-bold">
      <input type="checkbox" className="m-0 size-6 shrink-0 accent-brand" {...props} />
      {children}
    </label>
  );
}
