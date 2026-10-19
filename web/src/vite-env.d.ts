/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the SafeBite REST API, e.g. http://localhost:8000/api. */
  readonly VITE_API_BASE_URL?: string;
  /** "true" forces the in-browser mock for everything, even if a URL or Supabase is set. */
  readonly VITE_USE_MOCK_API?: string;
  /** Supabase project URL, e.g. https://abcdefghijklmnop.supabase.co. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable key (sb_publishable_…) or legacy anon key. Safe to ship to browsers. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** App version from package.json, injected by Vite at build time. */
declare const __APP_VERSION__: string;
