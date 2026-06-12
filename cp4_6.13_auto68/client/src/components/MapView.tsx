import React, { useMemo, useEffect, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { City } from '@/types';
import { findNearestCity } from '@/constants/cities';

interface MapViewProps {
  tourId: string;
  cities: City[];
  routeColor: string;
  onCityClick: (city: City) => void;
  onMapClick?: (city: Omit<City, 'id' | 'order'>) => void;
  interactive?: boolean;
  height?: string;
}

const MapEvents: React.FC<{
  onMapClick?: (city: Omit<City, 'id' | 'order'>) => void;
  enabled: boolean;
}> = ({ onMapClick, enabled }) => {
  useMapEvents({
    click: (e) => {
      if (!enabled || !onMapClick) return;
      const nearest = findNearestCity(e.latlng.lat, e.latlng.lng);
      if (nearest) {
        onMapClick({
          name: nearest.name,
          lat: nearest.lat,
          lng: nearest.lng,
        });
      }
    },
  });
  return null;
};

const FitBounds: React.FC<{ cities: City[] }> = ({ cities }) => {
  const map = useMap();

  useEffect(() => {
    if (cities.length === 0) return;

    if (cities.length === 1) {
      map.setView([cities[0].lat, cities[0].lng], 6);
      return;
    }

    const bounds = L.latLngBounds(
      cities.map((c) => [c.lat, c.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
  }, [cities, map]);

  return null;
};

const MapView: React.FC<MapViewProps> = ({
  cities,
  routeColor,
  onCityClick,
  onMapClick,
  interactive = true,
  height = '100%',
}) => {
  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => a.order - b.order),
    [cities]
  );

  const positions = useMemo(
    () => sortedCities.map((c) => [c.lat, c.lng] as [number, number]),
    [sortedCities]
  );

  const center: [number, number] = useMemo(() => {
    if (sortedCities.length === 0) return [35.8617, 104.1954];
    if (sortedCities.length === 1) return [sortedCities[0].lat, sortedCities[0].lng];
    const avgLat = sortedCities.reduce((s, c) => s + c.lat, 0) / sortedCities.length;
    const avgLng = sortedCities.reduce((s, c) => s + c.lng, 0) / sortedCities.length;
    return [avgLat, avgLng];
  }, [sortedCities]);

  const handleCityClick = useCallback(
    (city: City, e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      onCityClick(city);
    },
    [onCityClick]
  );

  return (
    <div style={{ width: '100%', height, borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        attributionControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={onMapClick} enabled={!!onMapClick} />
        <FitBounds cities={sortedCities} />

        {positions.length >= 2 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: routeColor,
              weight: 4,
              opacity: 0.85,
              lineJoin: 'round',
              lineCap: 'round',
              dashArray: '1, 0',
            }}
          />
        )}

        {sortedCities.map((city) => (
          <CircleMarker
            key={city.id}
            center={[city.lat, city.lng]}
            radius={12}
            pathOptions={{
              fillColor: routeColor,
              fillOpacity: 0.95,
              color: '#f1c40f',
              weight: 2,
              opacity: 1,
            }}
            eventHandlers={{
              click: (e) => handleCityClick(city, e),
            }}
          >
            <Tooltip
              permanent
              direction="center"
              className="map-tooltip"
              offset={[0, 0]}
            >
              <span
                style={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '12px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontSize: '14px' }}>{city.order + 1}</span>
                <span style={{ fontSize: '10px', opacity: 0.95, marginTop: '2px' }}>
                  {city.name}
                </span>
              </span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
