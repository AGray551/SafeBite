/**
 * Content widths shared by pages, their title areas and back headers, so
 * everything on a screen lines up.
 * - wide: grids and lists (matches the desktop nav)
 * - default: reading screens
 * - narrow: forms and step-by-step flows
 */
export type PageWidth = 'wide' | 'default' | 'narrow';

export const PAGE_WIDTH: Record<PageWidth, string> = {
  wide: 'max-w-5xl',
  default: 'max-w-3xl',
  narrow: 'max-w-xl',
};

/** Horizontal padding used by every content column. */
export const PAGE_GUTTER = 'px-4 md:px-6';
