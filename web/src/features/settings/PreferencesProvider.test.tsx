import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreferencesProvider } from './PreferencesProvider';

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query === '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function storeTheme(theme: string) {
  localStorage.setItem('safebite.preferences', JSON.stringify({ theme }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe('PreferencesProvider theme', () => {
  it('follows the device setting by default', () => {
    mockSystemDark(true);
    render(<PreferencesProvider>app</PreferencesProvider>);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('uses light when the device prefers light', () => {
    mockSystemDark(false);
    render(<PreferencesProvider>app</PreferencesProvider>);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('lets an explicit choice override the device', () => {
    mockSystemDark(true);
    storeTheme('light');
    render(<PreferencesProvider>app</PreferencesProvider>);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('moves the retired Bearcat Red theme to dark', () => {
    mockSystemDark(false);
    storeTheme('bearcat-red');
    render(<PreferencesProvider>app</PreferencesProvider>);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
