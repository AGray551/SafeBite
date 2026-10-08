import { clsx, type ClassValue } from 'clsx';

/** Joins conditional class names. Thin wrapper so components import one helper. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
