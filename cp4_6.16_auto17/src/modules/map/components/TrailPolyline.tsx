import { Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { TrackPoint } from '@/shared/types';
import { formatDistance } from '@/shared/utils';

interface TrailPolylineProps {
  points: TrackPoint[];
  color?: string;
  isActive?: boolean;
  isCompare?: boolean;
  trailName?: string;
  distance?: number;
}

export function TrailPolyline({
  points,
  color = '#1976D2',
  isActive = false,
  isCompare = false,
  trailName,
  distance,
}: TrailPolylineProps) {
  if (points.length < 2) return null;

  const positions = points.map(p => [p.lat, p.lng] as [number, number]);

  const polylineOptions: L.PolylineOptions = {
    color,
    weight: isActive ? 5 : 3,
    opacity: isActive ? 1 : 0.8,
    lineJoin: 'round',
    lineCap: 'round',
  };

  const glowOptions: L.PolylineOptions = {
    color,
    weight: 12,
    opacity: 0.3,
    lineJoin: 'round',
    lineCap: 'round',
    className: isActive ? 'trail-glow-active' : '',
  };

  return (
    <>
      {isActive && (
        <Polyline positions={positions} pathOptions={glowOptions} />
      )}
      <Polyline positions={positions} pathOptions={polylineOptions}>
        {trailName && (
          <Tooltip sticky direction="top">
            <div className="trail-tooltip">
              <strong>{trailName}</strong>
              {distance !== undefined && (
                <div>{formatDistance(distance)}</div>
              )}
            </div>
          </Tooltip>
        )}
      </Polyline>
    </>
  );
}
