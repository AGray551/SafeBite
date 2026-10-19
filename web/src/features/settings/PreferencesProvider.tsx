import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_PREFERENCES,
  PreferencesContext,
  type Preferences,
  type PreferencesContextValue,
  type ThemePreference,
} from './preferencesContext';

const STORAGE_KEY = 'safebite.preferences';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Browser UI color per theme: UC red in light, the dark canvas in dark. */
const THEME_COLOR = { light: '#e00122', dark: '#121212' } as const;

/** Older builds stored themes that no longer exist ("bearcat-red" was dark). */
function normalizeTheme(theme: unknown): ThemePreference {
  if (theme === 'light' || theme === 'dark' || theme === 'system') return theme;
  if (theme === 'bearcat-red') return 'dark';
  return DEFAULT_PREFERENCES.theme;
}

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const stored = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...stored, theme: normalizeTheme(stored.theme) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function prefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

/** Tracks the device's light/dark setting so "system" can follow it live. */
function useSystemDark(): boolean {
  const [dark, setDark] = useState(prefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => setDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return dark;
}

/**
 * Device-level settings (accessibility + notification toggles).
 *
 * Accessibility settings are applied as data attributes on <html>; the CSS in
 * styles/index.css reacts to them. These are per-device on purpose, since a
 * student may want larger text on their phone but not their laptop.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(load);
  const systemDark = useSystemDark();
  const resolvedTheme =
    preferences.theme === 'system' ? (systemDark ? 'dark' : 'light') : preferences.theme;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

    const root = document.documentElement;
    root.dataset.textSize = preferences.largeText ? 'large' : 'default';
    root.dataset.motion = preferences.reducedMotion ? 'reduced' : 'default';
    root.dataset.contrast = preferences.highContrast ? 'high' : 'default';
    root.dataset.theme = resolvedTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[resolvedTheme]);
  }, [preferences, resolvedTheme]);

  const setPreference = useCallback<PreferencesContextValue['setPreference']>((key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const value = useMemo(() => ({ preferences, setPreference }), [preferences, setPreference]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
