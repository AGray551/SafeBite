import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ApiError } from '@/api';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { PreferencesProvider } from '@/features/settings/PreferencesProvider';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Scraped menus change a few times a day at most, so a minute is plenty.
      staleTime: 60_000,
      // Don't retry "not found" style errors; they won't fix themselves.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
