import { createContext, useContext } from 'react';

export interface Preferences {
  largeText: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  notifyFavoriteAvailable: boolean;
  notifyMenuChanges: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  largeText: false,
  reducedMotion: false,
  highContrast: false,
  notifyFavoriteAvailable: true,
  // Safety alerts are always on. This only controls non-safety menu changes.
  notifyMenuChanges: true,
};

export interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}
