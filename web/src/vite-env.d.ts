/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the SafeBite REST API, e.g. http://localhost:8000/api. */
  readonly VITE_API_BASE_URL?: string;
  /** "true" forces the in-browser mock API even if a base URL is set. */
  readonly VITE_USE_MOCK_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
