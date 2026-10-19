import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WCAG 2.2 AA color contrast for the design tokens in index.css.
 *
 * Text pairs need 4.5:1 (1.4.3). Control borders, focus rings and other
 * meaningful non-text UI need 3:1 (1.4.11). Each pair below is a combination
 * the components actually render, so a token change that breaks one fails CI.
 */

const css = readFileSync(resolve(__dirname, 'index.css'), 'utf8');

function tokensIn(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No CSS block for ${selector}`);
  const body = css.slice(start, css.indexOf('\n}', start));
  return Object.fromEntries(
    [...body.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [
      name!,
      hex!.toLowerCase(),
    ]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 4.5;
const UI = 3;

/** [foreground, background, minimum ratio] */
const PAIRS: [string, string, number][] = [
  // Body and secondary text on every surface.
  ...['ink', 'ink-2', 'ink-3'].flatMap((fg) =>
    ['canvas', 'surface', 'surface-muted', 'brand-tint'].map(
      (bg) => [fg, bg, TEXT] as [string, string, number],
    ),
  ),
  ['ink-3', 'placeholder', TEXT],
  ['ink-4', 'placeholder', TEXT],
  ['ink-4', 'surface', TEXT],

  // Brand: links and secondary buttons, filled buttons/chips, tinted rows.
  ['brand', 'surface', TEXT],
  ['brand', 'canvas', TEXT],
  ['brand', 'brand-tint', TEXT],
  ['on-brand', 'brand', TEXT],
  ['on-brand', 'brand-hover', TEXT],
  ['brand-hover', 'surface', TEXT],
  ['brand', 'surface', UI], // focus ring
  ['brand', 'canvas', UI],

  // Safety statuses (pills, banners, inline allergen lines).
  ['safe', 'safe-tint', TEXT],
  ['safe', 'surface', TEXT],
  ['caution-ink', 'caution-tint', TEXT],
  ['caution-ink', 'surface', TEXT],
  ['caution', 'surface', UI],
  ['caution', 'caution-tint', UI],
  ['avoid', 'surface', TEXT],
  ['on-avoid', 'avoid-fill', TEXT],
  ['avoid', 'surface', UI], // border around filled Avoid pills

  // Control boundaries: inputs, chips, tiles, switches.
  ['line-input', 'surface', UI],
  ['line-strong', 'surface', UI],
  ['line-strong', 'canvas', UI],
];

const light = tokensIn('@theme');
const dark = { ...light, ...tokensIn("html[data-theme='dark']") };
const THEMES: Record<string, Record<string, string>> = {
  light,
  'light + high contrast': { ...light, ...tokensIn("html[data-contrast='high']") },
  dark,
  'dark + high contrast': {
    ...dark,
    ...tokensIn("html[data-theme='dark'][data-contrast='high']"),
  },
};

describe.each(Object.entries(THEMES))('%s theme', (_name, tokens) => {
  it.each(PAIRS)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(tokens[fg], `missing --color-${fg}`).toBeDefined();
    expect(tokens[bg], `missing --color-${bg}`).toBeDefined();
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min);
  });
});
