import { useMemo } from 'react';
import type { MealPeriod, Menu } from '@/api/schemas';
import { useMenus } from '@/api/queries';
import { isSafeForMe } from '@/features/safety/assess';
import { useSafety } from '@/features/safety/useSafety';
import { getBalancedChoice } from '@/features/nutrition/balancedChoice';
import { menuItemKind } from '@/features/menu/itemKind';
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
      const nutritionScores = menu.items
        .filter((item) => menuItemKind(item) === 'meal')
        .map((item) => getBalancedChoice(item.nutrition)?.score)
        .filter((score): score is number => score != null);
      byHall.set(menu.hallId, {
        mealPeriod,
        itemCount: menu.items.length,
        safeCount: profile
          ? menu.items.filter((item) => {
              const assessment = assess(item);
              return assessment.status === 'safe' && isSafeForMe(assessment);
            }).length
          : null,
        averageHealthScore:
          nutritionScores.length > 0
            ? Math.round(
                nutritionScores.reduce((sum, score) => sum + score, 0) / nutritionScores.length,
              )
            : null,
        scoredItemCount: nutritionScores.length,
      });
    }
    return byHall;
  }, [menusQuery.data, mealPeriod, profile, assess]);

  return { menus: menusQuery.data ?? NO_MENUS, summaries, menusQuery };
}
