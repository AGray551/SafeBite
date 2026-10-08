import { describe, expect, it } from 'vitest';
import { currentMealPeriod, formatTimeOfDay, getOpenStatus, isStale } from './time';

const at = (h: number, m = 0) => new Date(2026, 9, 8, h, m);

describe('currentMealPeriod', () => {
  it.each([
    [8, 'breakfast'],
    [12, 'lunch'],
    [18, 'dinner'],
  ] as const)('at %i:00 is %s', (hour, expected) => {
    expect(currentMealPeriod(at(hour))).toBe(expected);
  });
});

describe('getOpenStatus', () => {
  const hours = { opensAt: '07:00', closesAt: '20:00' };

  it('is open during hours', () => {
    expect(getOpenStatus(hours, at(12))).toEqual({ isOpen: true, label: 'until 8:00 PM' });
  });

  it('shows the opening time before opening', () => {
    expect(getOpenStatus(hours, at(6))).toEqual({ isOpen: false, label: 'Opens 7:00 AM' });
  });

  it('is closed when there are no hours today', () => {
    expect(getOpenStatus(null, at(12)).isOpen).toBe(false);
  });
});

describe('formatTimeOfDay', () => {
  it('formats noon and midnight', () => {
    expect(formatTimeOfDay('12:00')).toBe('12:00 PM');
    expect(formatTimeOfDay('00:15')).toBe('12:15 AM');
  });
});

describe('isStale', () => {
  it('flags data older than a day', () => {
    const now = new Date('2026-10-08T12:00:00Z');
    expect(isStale('2026-10-08T06:00:00Z', now)).toBe(false);
    expect(isStale('2026-10-06T12:00:00Z', now)).toBe(true);
  });
});
