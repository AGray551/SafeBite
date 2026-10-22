import type { DiningHall } from '@/api/schemas';
import { logosByHallId } from './hallLogos';

export function HallBrandMark({
  hall,
  size = 'card',
}: {
  hall: DiningHall;
  size?: 'card' | 'featured' | 'hero';
}) {
  const src = logosByHallId[hall.id];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${hall.name} logo`}
      className={
        size === 'hero'
          ? 'h-24 w-44 object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]'
          : size === 'featured'
            ? 'h-16 w-40 max-w-full object-contain object-left drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]'
            : 'h-11 w-20 object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]'
      }
    />
  );
}
