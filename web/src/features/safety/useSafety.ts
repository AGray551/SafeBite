import { useCallback } from 'react';
import type { MenuItem } from '@/api/schemas';
import { useProfile } from '@/api/queries';
import { assessItem } from './assess';

/**
 * Returns the student's profile plus an `assess(item)` function bound to it,
 * so list screens don't each have to wire the two together.
 */
export function useSafety() {
  const { data: profile = null, isLoading } = useProfile();
  const assess = useCallback((item: MenuItem) => assessItem(item, profile), [profile]);
  return { profile, assess, isLoading };
}
