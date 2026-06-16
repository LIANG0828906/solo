import React, { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { GeoPoint, Restaurant, City } from '@/types';
import { FoodMarker } from './FoodMarker';
import { RoutePolyline } from './RoutePolyline';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  path: GeoPoint[];
  restaurants: Restaurant[];
  cities?: City[];
  onMarkerDrag?: (type: 'origin' | 'destination', point: GeoPoint) => void;
}

const defaultCenter: [number, number] = [35.8617, 104.1954];
const defaultZoom = 5;

const createCustomIcon = (color: string, label: string, key: number) => {
  return L.divIcon({
    className: `custom-marker-icon marker-key-${key}`,
    html: `
      <div class="marker-wrapper">
        <div class="marker-ripple ripple-1" style="background: ${color};"></div>
        <div class="marker-ripple ripple-2" style="background: ${color}; animation-delay: 0.3s;"></div>
        <div class="marker-content" style="background: ${color}; border-color: ${color};">
          <span style="color: white; font-weight: bold; font-size: 12px;">${label}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

export const MapContainer: React.FC<MapContainerProps> = ({
  origin,
  destination,
  path,
  restaurants,
  cities = [],
  onMarkerDrag,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [markerKey, setMarkerKey] = useState(0);
  const [originIconKey, setOriginIconKey] = useState(0);
  const [destIconKey, setDestIconKey] = useState(0);

  useEffect(() => {
    const points: [number, number][] = [];
    if (origin) points.push([origin.lat, origin.lng]);
    if (destination) points.push([destination.lat, destination.lng]);
    path.forEach(p => points.push([p.lat, p.lng]));

    if (points.length >= 2 && mapRef.current) {
      const bounds = L.latLngBounds(points);
      mapRef.current.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [origin, destination, path]);

  useEffect(() => {
    if (origin) {
      setOriginIconKey(prev => prev + 1);
    }
  }, [origin?.lat, origin?.lng]);

  useEffect(() => {
    if (destination) {
      setDestIconKey(prev => prev + 1);
    }
  }, [destination?.lat, destination?.lng]);

  const handleDragEnd = (type: 'origin' | 'destination', e: L.LeafletEvent) => {
    if (!onMarkerDrag) return;
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    onMarkerDrag(type, { lat: pos.lat, lng: pos.lng });
  };

  const originIcon = origin ? createCustomIcon('#4a9eff', '起', originIconKey) : null;
  const destIcon = destination ? createCustomIcon('#ef4444', '终', destIconKey) : null;

  return (
    <div className="map-wrapper">
      <LeafletMap
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        className="leaflet-map"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={18}
        />

        {cities.map((city) => (
          path.some(p => p.name === city.name) && (
            <CircleMarker
              key={`city-${city.id}`}
              center={[city.lat, city.lng]}
              radius={0}
              pathOptions={{ stroke: false }}
            >
              <Tooltip
                permanent
                direction="top"
                offset={[0, -5]}
                className="city-label-tooltip"
              >
                <span className="city-label">{city.name}</span>
              </Tooltip>
            </CircleMarker>
          )
        ))}

        {origin && originIcon && (
          <Marker
            key={`origin-${originIconKey}`}
            position={[origin.lat, origin.lng]}
            icon={originIcon}
            draggable={!!onMarkerDrag}
            eventHandlers={{
              dragend: (e) => handleDragEnd('origin', e),
            }}
          >
            <Popup className="endpoint-popup">
              <div className="endpoint-popup-content">
                <h4 style={{ color: '#4a9eff', margin: 0 }}>起点</h4>
                <p style={{ margin: '4px 0 0', color: '#a0a0b0' }}>
                  {origin.name || `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {destination && destIcon && (
          <Marker
            key={`dest-${destIconKey}`}
            position={[destination.lat, destination.lng]}
            icon={destIcon}
            draggable={!!onMarkerDrag}
            eventHandlers={{
              dragend: (e) => handleDragEnd('destination', e),
            }}
          >
            <Popup className="endpoint-popup">
              <div className="endpoint-popup-content">
                <h4 style={{ color: '#ef4444', margin: 0 }}>终点</h4>
                <p style={{ margin: '4px 0 0', color: '#a0a0b0' }}>
                  {destination.name || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {path.length > 0 && <RoutePolyline path={path} />}

        {restaurants.map((restaurant, index) => (
          <FoodMarker key={restaurant.id} restaurant={restaurant} delay={index * 100} />
        ))}
      </LeafletMap>
    </div>
  );
};
