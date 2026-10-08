import { Check, CircleHelp, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { SafetyStatus } from './assess';

/**
 * Visual language for each safety status. Every status has a distinct icon,
 * word AND border style (solid / dashed / filled), so it reads correctly for
 * color-blind students and in grayscale.
 */
export const STATUS_STYLES: Record<
  SafetyStatus,
  {
    icon: LucideIcon;
    /** Long label, e.g. on cards and banners. */
    label: string;
    /** Short label for compact rows. */
    shortLabel: string;
    /** Pill/banner colors + border style. */
    tone: string;
    /** Text color for inline allergen lines. */
    text: string;
  }
> = {
  safe: {
    icon: Check,
    label: 'SAFE FOR YOU',
    shortLabel: 'SAFE',
    tone: 'bg-safe-tint text-safe border-safe border-solid',
    text: 'text-safe',
  },
  caution: {
    icon: TriangleAlert,
    label: 'CAUTION',
    shortLabel: 'CAUTION',
    tone: 'bg-caution-tint text-caution-ink border-caution border-dashed',
    text: 'text-caution-ink',
  },
  avoid: {
    icon: OctagonAlert,
    label: 'AVOID',
    shortLabel: 'AVOID',
    tone: 'bg-avoid text-white border-avoid border-solid',
    text: 'text-avoid',
  },
  unknown: {
    icon: CircleHelp,
    label: 'NOT CHECKED',
    shortLabel: 'UNKNOWN',
    tone: 'bg-surface text-ink-2 border-line-strong border-dotted',
    text: 'text-ink-3',
  },
};
