import { Heart, House, Search, User, Utensils, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Main tabs. "Orders" from the wireframe was replaced with Search, since
 * pre-ordering is out of scope for v1.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/dining', label: 'Dining', icon: Utensils },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
];
