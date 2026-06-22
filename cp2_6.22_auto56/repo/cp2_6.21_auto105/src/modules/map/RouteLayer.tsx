import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Attraction, TransportMode } from '@/types';

interface RouteLayerProps {
  attractions: Attraction[];
  transportMode?: TransportMode;
  animated?: boolean;
}

const transportColors: Record<TransportMode, string> = {
  walk: '#4caf50',
  car: '#ff9800',
  bus: '#2196f3',
  plane: '#e91e63',
};

export function RouteLayer({ attractions, transportMode, animated = true }: RouteLayerProps) {
  const positions = useMemo<LatLngExpression[]>(() => {
    return attractions
      .sort((a, b) => a.order - b.order)
      .map((attr) => [attr.lat, attr.lng] as LatLngExpression);
  }, [attractions]);

  const color = transportMode ? transportColors[transportMode] : '#1a73e8';

  if (positions.length < 2) {
    return null;
  }

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color,
          weight: 3,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <Polyline
        positions={positions}
        pathOptions={{
          color,
          weight: 3,
          dashArray: '10, 10',
          lineCap: 'round',
          lineJoin: 'round',
          className: animated ? 'route-dash-animated' : '',
        }}
      />
      <style>{`
        .route-dash-animated {
          animation: dash 20s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </>
  );
}

export default RouteLayer;
