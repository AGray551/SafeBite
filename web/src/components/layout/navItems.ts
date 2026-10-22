import { Heart, MapPin, User, Utensils, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Primary destinations, organized by the questions students actually bring
 * to campus dining. Search is a Food flow, not its own competing destination.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Food', icon: Utensils },
  { to: '/dining', label: 'Places', icon: MapPin },
  { to: '/favorites', label: 'Saved', icon: Heart },
  { to: '/profile', label: 'You', icon: User },
];
