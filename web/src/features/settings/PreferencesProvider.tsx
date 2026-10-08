import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_PREFERENCES,
  PreferencesContext,
  type Preferences,
  type PreferencesContextValue,
} from './preferencesContext';

const STORAGE_KEY = 'safebite.preferences';

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) }
      : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

    const root = document.documentElement;
    root.dataset.textSize = preferences.largeText ? 'large' : 'default';
    root.dataset.motion = preferences.reducedMotion ? 'reduced' : 'default';
    root.dataset.contrast = preferences.highContrast ? 'high' : 'default';
  }, [preferences]);

  const setPreference = useCallback<PreferencesContextValue['setPreference']>((key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const value = useMemo(() => ({ preferences, setPreference }), [preferences, setPreference]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
