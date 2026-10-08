import { Coffee, ShoppingBasket, Store, Utensils, type LucideIcon } from 'lucide-react';
import type { LocationKind } from '@/api/schemas';

export const LOCATION_KIND_META: Record<
  LocationKind,
  { label: string; plural: string; icon: LucideIcon }
> = {
  'dining-hall': { label: 'Dining hall', plural: 'Dining halls', icon: Utensils },
  restaurant: { label: 'Restaurant', plural: 'Restaurants', icon: Store },
  cafe: { label: 'Café', plural: 'Cafés', icon: Coffee },
  market: { label: 'Market', plural: 'Markets', icon: ShoppingBasket },
};
