import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface SectionHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Optional "See all" style link on the right. */
  action?: { label: string; to: string };
  id?: string;
}

export function SectionHeader({ title, subtitle, action, id }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-xl">
          {title}
        </h2>
        {subtitle && <p className="m-0 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex min-h-11 items-center gap-0.5 text-label font-bold"
        >
          {action.label}
          <ChevronRight aria-hidden size={18} />
        </Link>
      )}
    </div>
  );
}
