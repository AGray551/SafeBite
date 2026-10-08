/**
 * React Query hooks for every API call.
 *
 * Components use these hooks instead of calling `api` directly, which gives
 * us caching, loading/error states, and refetching for free. Query keys live
 * in one place so mutations know exactly what to invalidate.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ItemSearchQuery, type MenuQuery } from './index';
import type { DietaryProfile, Favorites, NewReport } from './schemas';

export const queryKeys = {
  session: ['session'] as const,
  halls: ['halls'] as const,
  hall: (hallId: string) => ['halls', hallId] as const,
  menus: (query: MenuQuery) => ['menus', query] as const,
  menu: (hallId: string, query: MenuQuery) => ['menus', hallId, query] as const,
  item: (itemId: string) => ['items', itemId] as const,
  items: (itemIds: string[]) => ['items', 'many', [...itemIds].sort()] as const,
  search: (query: ItemSearchQuery) => ['items', 'search', query] as const,
  profile: ['profile'] as const,
  favorites: ['favorites'] as const,
  alerts: ['alerts'] as const,
};

// ---------------------------------------------------------------------------
// Dining data (read-only, scraped)
// ---------------------------------------------------------------------------

export function useHalls() {
  return useQuery({ queryKey: queryKeys.halls, queryFn: api.halls.list });
}

export function useHall(hallId: string) {
  return useQuery({ queryKey: queryKeys.hall(hallId), queryFn: () => api.halls.get(hallId) });
}

export function useMenus(query: MenuQuery) {
  return useQuery({ queryKey: queryKeys.menus(query), queryFn: () => api.menus.list(query) });
}

export function useMenu(hallId: string, query: MenuQuery) {
  return useQuery({
    queryKey: queryKeys.menu(hallId, query),
    queryFn: () => api.menus.get(hallId, query),
  });
}

export function useItem(itemId: string) {
  return useQuery({ queryKey: queryKeys.item(itemId), queryFn: () => api.items.get(itemId) });
}

export function useItems(itemIds: string[]) {
  return useQuery({
    queryKey: queryKeys.items(itemIds),
    queryFn: () => api.items.getMany(itemIds),
    enabled: itemIds.length > 0,
  });
}

export function useItemSearch(query: ItemSearchQuery) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.items.search(query),
    enabled: query.q.trim().length > 0,
    // Keep the previous results on screen while the next search loads.
    placeholderData: (previous) => previous,
  });
}

// ---------------------------------------------------------------------------
// Dietary profile
// ---------------------------------------------------------------------------

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: api.profile.get });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Omit<DietaryProfile, 'updatedAt'>) => api.profile.save(profile),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.profile, saved);
      // Alerts depend on which allergens the student avoids.
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.profile.delete,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile, null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

// ---------------------------------------------------------------------------
// Favorites (optimistic, so the heart toggles instantly)
// ---------------------------------------------------------------------------

export function useFavorites() {
  return useQuery({ queryKey: queryKeys.favorites, queryFn: api.favorites.get });
}

type FavoriteKind = 'item' | 'hall';

export function useToggleFavorite(kind: FavoriteKind) {
  const queryClient = useQueryClient();
  const listKey = kind === 'item' ? 'itemIds' : 'hallIds';

  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      kind === 'item' ? api.favorites.setItem(id, saved) : api.favorites.setHall(id, saved),

    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites });
      const previous = queryClient.getQueryData<Favorites>(queryKeys.favorites);
      if (previous) {
        const list = previous[listKey].filter((x) => x !== id);
        queryClient.setQueryData<Favorites>(queryKeys.favorites, {
          ...previous,
          [listKey]: saved ? [...list, id] : list,
        });
      }
      return { previous };
    },

    // Roll back if the server rejects the change.
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.favorites, context.previous);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
  });
}

// ---------------------------------------------------------------------------
// Safety alerts and reports
// ---------------------------------------------------------------------------

export function useAlerts() {
  return useQuery({ queryKey: queryKeys.alerts, queryFn: api.alerts.list });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => api.alerts.markRead(alertId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  });
}

export function useSubmitReport() {
  return useMutation({ mutationFn: (report: NewReport) => api.reports.submit(report) });
}
