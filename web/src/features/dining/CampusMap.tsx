import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import type { DiningHall } from '@/api/schemas';
import type { BuildingGroup } from './buildings';
import { groupByBuilding } from './buildings';
import { getOpenStatus } from '@/lib/time';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Pin drawn with HTML/CSS (Leaflet's default image icons don't bundle well
 * with Vite). Shows a count when several locations share the building, and
 * a dashed outline when everything there is closed.
 */
function pinIcon(count: number, selected: boolean, anyOpen: boolean) {
  const fill = selected ? 'var(--color-brand)' : '#ffffff';
  const stroke = anyOpen ? 'var(--color-brand)' : 'var(--color-ink-3)';
  const text = selected ? '#ffffff' : anyOpen ? 'var(--color-brand)' : 'var(--color-ink-3)';
  const size = selected ? 44 : 36;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};
      border:3px ${anyOpen ? 'solid' : 'dashed'} ${stroke};color:${text};display:flex;
      align-items:center;justify-content:center;font:800 14px var(--font-heading);
      box-shadow:0 2px 6px rgba(0,0,0,.25)">
      ${
        count > 1
          ? count
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
      }
    </div>`,
  });
}

interface CampusMapProps {
  halls: DiningHall[];
  selectedKey: string | null;
  onSelect: (group: BuildingGroup) => void;
}

/** OpenStreetMap view of campus with one marker per building. */
export function CampusMap({ halls, selectedKey, onSelect }: CampusMapProps) {
  const groups = useMemo(() => groupByBuilding(halls), [halls]);
  const bounds = useMemo(
    () => L.latLngBounds(groups.map((g) => [g.coordinates.lat, g.coordinates.lng])),
    [groups],
  );

  if (groups.length === 0) return null;

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [32, 32] }}
      scrollWheelZoom={false}
      className="z-0 aspect-[4/5] w-full rounded-card border border-line md:aspect-video"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {groups.map((group) => {
        const anyOpen = group.halls.some((h) => getOpenStatus(h.todayHours).isOpen);
        const label =
          group.halls.length > 1
            ? `${group.halls[0]!.location.split(',')[0]}: ${group.halls.length} locations`
            : group.halls[0]!.name;
        return (
          <Marker
            key={group.key}
            position={[group.coordinates.lat, group.coordinates.lng]}
            icon={pinIcon(group.halls.length, group.key === selectedKey, anyOpen)}
            title={label}
            alt={label}
            keyboard
            eventHandlers={{ click: () => onSelect(group) }}
          >
            <Tooltip direction="top" offset={[0, -20]}>
              {label}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
