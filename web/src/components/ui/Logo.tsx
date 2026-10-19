import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Exact UC red from the brand kit. The logo keeps it in both themes;
 * logotypes are exempt from WCAG text contrast, and it still clears the 3:1
 * large-text minimum on the dark canvas.
 */
const LOGO_RED = '#e00122';

/**
 * The SafeBite mark: a bitten red seal with a check, inside scan brackets.
 * The brackets use currentColor, so they follow the text color (black in
 * light, white in dark) like the brand kit's light/dark variants.
 */
export function LogoMark({ className }: { className?: string }) {
  const maskId = useId();

  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" className={className}>
      <defs>
        <mask id={maskId}>
          <rect x="-50" y="-50" width="200" height="200" fill="#fff" />
          <circle cx="73" cy="27" r="8" fill="#000" />
          <circle cx="79" cy="38" r="7" fill="#000" />
          <circle cx="63" cy="21" r="7" fill="#000" />
        </mask>
      </defs>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 26 V8 H26" />
        <path d="M74 8 H92 V26" />
        <path d="M92 74 V92 H74" />
        <path d="M26 92 H8 V74" />
      </g>
      <g mask={`url(#${maskId})`}>
        <circle cx="50" cy="50" r="30" fill={LOGO_RED} />
        <circle cx="50" cy="50" r="20.5" fill="none" stroke="#fff" strokeWidth="2.5" />
      </g>
      <path
        d="M41 51 L48 58 L60 44"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** "SafeBite" in the brand wordmark font, with "Bite" in UC red. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-logo font-extrabold tracking-tight text-ink', className)}>
      Safe<span style={{ color: LOGO_RED }}>Bite</span>
    </span>
  );
}
