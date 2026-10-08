import type { DiningHall } from '@/api/schemas';

/** Locations that share a building (and therefore a map point). */
export interface BuildingGroup {
  key: string;
  coordinates: DiningHall['coordinates'];
  halls: DiningHall[];
}

/** Groups locations by coordinates so e.g. all TUC spots get one marker. */
export function groupByBuilding(halls: DiningHall[]): BuildingGroup[] {
  const groups = new Map<string, BuildingGroup>();
  for (const hall of halls) {
    const key = `${hall.coordinates.lat},${hall.coordinates.lng}`;
    const group = groups.get(key) ?? { key, coordinates: hall.coordinates, halls: [] };
    group.halls.push(hall);
    groups.set(key, group);
  }
  return [...groups.values()];
}
