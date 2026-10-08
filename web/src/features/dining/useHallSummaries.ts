import { useMemo } from 'react';
import type { MealPeriod, Menu } from '@/api/schemas';
import { useMenus } from '@/api/queries';
import { isSafeForMe } from '@/features/safety/assess';
import { useSafety } from '@/features/safety/useSafety';
import { currentMealPeriod, toDateKey } from '@/lib/time';
import type { HallMenuSummary } from './HallCard';

// Stable fallback so consumers' memo dependencies don't change every render.
const NO_MENUS: Menu[] = [];

/**
 * Today's menus for the current meal period, plus a per-hall summary of how
 * many items there are and how many are safe for this student.
 */
export function useHallSummaries(mealPeriod: MealPeriod = currentMealPeriod()) {
  const menusQuery = useMenus({ date: toDateKey(), mealPeriod });
  const { profile, assess } = useSafety();

  const summaries = useMemo(() => {
    const byHall = new Map<string, HallMenuSummary>();
    for (const menu of menusQuery.data ?? []) {
      byHall.set(menu.hallId, {
        mealPeriod,
        itemCount: menu.items.length,
        safeCount: profile ? menu.items.filter((item) => isSafeForMe(assess(item))).length : null,
      });
    }
    return byHall;
  }, [menusQuery.data, mealPeriod, profile, assess]);

  return { menus: menusQuery.data ?? NO_MENUS, summaries, menusQuery };
}
