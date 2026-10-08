/**
 * Picks which API implementation the app uses.
 *
 * If VITE_API_BASE_URL is set the app talks to the real backend; otherwise it
 * falls back to the in-browser mock so the frontend works on its own.
 * Set VITE_USE_MOCK_API=true to force the mock even when a URL is configured.
 */
import type { SafeBiteApi } from './client';
import { createHttpClient } from './http/httpClient';
import { createMockClient } from './mock/mockClient';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const forceMock = import.meta.env.VITE_USE_MOCK_API === 'true';

export const usingMockApi = forceMock || !baseUrl;

export const api: SafeBiteApi = usingMockApi ? createMockClient() : createHttpClient(baseUrl!);

export { ApiError } from './client';
export type * from './client';
