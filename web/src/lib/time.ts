/**
 * Date and time helpers: meal periods, open/closed status and data freshness.
 *
 * All "now"-dependent functions accept an optional `now` argument so they can
 * be tested deterministically.
 */
import type { Hours, MealPeriod } from '@/api/schemas';

/** Menus older than this get an "out of date" warning. */
export const STALE_AFTER_HOURS = 24;

/** When each meal period ends, in minutes after midnight. */
const MEAL_PERIOD_ENDS: Record<MealPeriod, number> = {
  breakfast: 10 * 60 + 30, // 10:30 AM
  lunch: 16 * 60, // 4:00 PM
  dinner: 24 * 60,
};

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTimeOfDay(value: string): number {
  const [h = 0, m = 0] = value.split(':').map(Number);
  return h * 60 + m;
}

/** Meal period currently being served on campus. */
export function currentMealPeriod(now: Date = new Date()): MealPeriod {
  const minutes = minutesSinceMidnight(now);
  if (minutes < MEAL_PERIOD_ENDS.breakfast) return 'breakfast';
  if (minutes < MEAL_PERIOD_ENDS.lunch) return 'lunch';
  return 'dinner';
}

/** "Lunch · served until 4:00 PM" style end time for the current period. */
export function mealPeriodEndLabel(period: MealPeriod): string {
  const end = MEAL_PERIOD_ENDS[period];
  if (end >= 24 * 60) return 'close';
  return formatTimeOfDay(
    `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
  );
}

/** "07:30" → "7:30 AM". */
export function formatTimeOfDay(value: string): string {
  const minutes = parseTimeOfDay(value);
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatHours(hours: Hours): string {
  return `${formatTimeOfDay(hours.opensAt)} – ${formatTimeOfDay(hours.closesAt)}`;
}

export type OpenStatus =
  | { isOpen: true; label: string } // "until 8:00 PM"
  | { isOpen: false; label: string }; // "Opens 5:00 PM" / "Closed today"

export function getOpenStatus(hours: Hours | null, now: Date = new Date()): OpenStatus {
  if (!hours) return { isOpen: false, label: 'Closed today' };
  const minutes = minutesSinceMidnight(now);
  const opens = parseTimeOfDay(hours.opensAt);
  const closes = parseTimeOfDay(hours.closesAt);

  if (minutes >= opens && minutes < closes) {
    return { isOpen: true, label: `until ${formatTimeOfDay(hours.closesAt)}` };
  }
  if (minutes < opens) return { isOpen: false, label: `Opens ${formatTimeOfDay(hours.opensAt)}` };
  return { isOpen: false, label: 'Closed for today' };
}

/** Local calendar date as YYYY-MM-DD (not UTC, so late-night dates stay correct). */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isStale(updatedAt: string, now: Date = new Date()): boolean {
  const ageMs = now.getTime() - new Date(updatedAt).getTime();
  return ageMs > STALE_AFTER_HOURS * 60 * 60 * 1000;
}

/** "Updated 2 hours ago" / "Updated Sep 12". */
export function formatUpdatedAt(updatedAt: string, now: Date = new Date()): string {
  const date = new Date(updatedAt);
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
