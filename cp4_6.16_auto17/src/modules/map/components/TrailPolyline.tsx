import { Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { TrackPoint } from '@/shared/types';
import { formatDistance } from '@/shared/utils';

interface TrailPolylineProps {
  points: TrackPoint[];
  color?: string;
  isActive?: boolean;
  isCompare?: boolean;
  compareIndex?: number;
  trailName?: string;
  distance?: number;
  weight?: number;
  opacity?: number;
}

export function TrailPolyline({
  points,
  color = '#1976D2',
  isActive = false,
  isCompare = false,
  compareIndex = -1,
  trailName,
  distance,
  weight,
  opacity,
}: TrailPolylineProps) {
  if (points.length < 2) return null;

  const positions = points.map(p => [p.lat, p.lng] as [number, number]);

  const lineWeight = weight ?? (isCompare ? 6 : (isActive ? 5 : 3));
  const lineOpacity = opacity ?? (isCompare ? 1 : (isActive ? 1 : 0.8));

  const polylineOptions: L.PolylineOptions = {
    color,
    weight: lineWeight,
    opacity: lineOpacity,
    lineJoin: 'round',
    lineCap: 'round',
    className: isCompare ? `trail-compare-line compare-${compareIndex === 0 ? 'blue' : 'orange'}` : (isActive ? 'trail-line-active' : ''),
  };

  const glowOptions: L.PolylineOptions = {
    color,
    weight: isCompare ? 16 : 12,
    opacity: isCompare ? 0.35 : 0.3,
    lineJoin: 'round',
    lineCap: 'round',
    className: isCompare ? 'trail-glow-compare' : 'trail-glow-active',
    interactive: false,
  };

  const outerGlowOptions: L.PolylineOptions = {
    color,
    weight: isCompare ? 24 : 18,
    opacity: isCompare ? 0.15 : 0.12,
    lineJoin: 'round',
    lineCap: 'round',
    className: 'trail-outer-glow',
    interactive: false,
  };

  const showGlow = isCompare || isActive;

  return (
    <>
      {showGlow && (
        <Polyline positions={positions} pathOptions={outerGlowOptions} />
      )}
      {showGlow && (
        <Polyline positions={positions} pathOptions={glowOptions} />
      )}
      <Polyline positions={positions} pathOptions={polylineOptions}>
        {trailName && (
          <Tooltip sticky direction="top" offset={[0, -8]}>
            <div className="trail-tooltip">
              <div className="trail-tooltip-header">
                {isCompare && compareIndex >= 0 && (
                  <span className={`trail-tooltip-badge ${compareIndex === 0 ? 'badge-blue' : 'badge-orange'}`}>
                    {compareIndex === 0 ? '①' : '②'}
                  </span>
                )}
                <strong>{trailName}</strong>
              </div>
              {distance !== undefined && (
                <div className="trail-tooltip-distance">{formatDistance(distance)}</div>
              )}
            </div>
          </Tooltip>
        )}
      </Polyline>
    </>
  );
}
