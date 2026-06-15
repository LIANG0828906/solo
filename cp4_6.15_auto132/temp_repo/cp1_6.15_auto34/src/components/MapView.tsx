import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
  CircleMarker,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import type { Location, Diary } from '@/types';
import { useDiaryStore } from '@/data/DiaryStore';
import { formatShortDate } from '@/utils/dateUtils';

interface MapViewProps {
  onLocationClick: (locationId: string) => void;
  onDiaryClick: (diary: Diary) => void;
}

const MAP_COLORS = [
  { color: '#E07A5F', min: 1 },
  { color: '#C4A574', min: 3 },
  { color: '#81B29A', min: 5 },
  { color: '#3D405B', min: 8 },
];

function getMarkerColor(count: number): string {
  for (let i = MAP_COLORS.length - 1; i >= 0; i--) {
    if (count >= MAP_COLORS[i].min) {
      return MAP_COLORS[i].color;
    }
  }
  return MAP_COLORS[0].color;
}

function getMarkerRadius(count: number, zoom: number): number {
  const baseRadius = Math.min(8 + count * 1.5, 24);
  const zoomFactor = Math.max(0.6, Math.min(1.4, zoom / 6));
  return baseRadius * zoomFactor;
}

function MapController({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoom', handleZoom);
    return () => {
      map.off('zoom', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

function LocationMarker({
  location,
  zoom,
  onClick,
}: {
  location: Location;
  zoom: number;
  onClick: (locationId: string) => void;
}) {
  const getFirstDiaryByLocation = useDiaryStore((s) => s.getFirstDiaryByLocation);
  const firstDiary = getFirstDiaryByLocation(location.id);

  const markerRef = useRef<L.CircleMarker | null>(null);

  const targetRadius = getMarkerRadius(location.diaryCount, zoom);
  const targetColor = getMarkerColor(location.diaryCount);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const el = marker.getElement();
    if (el) {
      (el as SVGCircleElement).style.setProperty(
        'transition',
        'r 0.35s cubic-bezier(0.33, 1, 0.68, 1)'
      );
    }
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.setRadius(targetRadius);
    }
  }, [targetRadius]);

  return (
    <CircleMarker
      ref={(r) => {
        markerRef.current = r;
      }}
      center={[location.lat, location.lng]}
      radius={targetRadius}
      pathOptions={{
        color: 'white',
        weight: 2,
        fillColor: targetColor,
        fillOpacity: 0.85,
      }}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onClick(location.id);
        },
        mouseover: (e) => {
          const el = e.target.getElement();
          if (el) el.style.cursor = 'pointer';
        },
      }}
    >
      <Popup closeButton={false} className="custom-popup">
        {firstDiary && (
          <div className="min-w-[200px] p-1">
            <div className="text-sm font-display font-semibold text-sand-800 mb-1">
              {location.name}
            </div>
            <div className="text-xs text-sand-500 mb-2">
              {location.diaryCount} 篇日记
            </div>
            {firstDiary.images[0] && (
              <img
                src={firstDiary.images[0]}
                alt={firstDiary.title}
                className="w-full h-24 object-cover rounded-lg mb-2"
              />
            )}
            <div className="text-sm font-medium text-sand-700 truncate">
              {firstDiary.title}
            </div>
            <div className="text-xs text-sand-500 mt-1">
              {formatShortDate(firstDiary.createdAt)} · {firstDiary.mood}
            </div>
          </div>
        )}
      </Popup>
    </CircleMarker>
  );
}

export const MapView: React.FC<MapViewProps> = ({ onLocationClick, onDiaryClick }) => {
  const locations = useDiaryStore((s) => s.locations);
  const getFirstDiaryByLocation = useDiaryStore((s) => s.getFirstDiaryByLocation);
  const [mapZoom, setMapZoom] = useState(3);
  const [userPosition, setUserPosition] = useState<[number, number]>([30, 105]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setUserPosition([30, 105]);
        }
      );
    }
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
  }, []);

  const handleMarkerClick = useCallback((locationId: string) => {
    const firstDiary = getFirstDiaryByLocation(locationId);
    if (firstDiary) {
      onLocationClick(locationId);
    }
  }, [getFirstDiaryByLocation, onLocationClick]);

  const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileLayerAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-full">
      <MapContainer
        center={userPosition}
        zoom={3}
        minZoom={2}
        maxZoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
        preferCanvas={true}
        zoomControl={false}
      >
        <TileLayer
          attribution={tileLayerAttribution}
          url={tileLayerUrl}
          maxZoom={19}
        />

        <MapController onZoomChange={handleZoomChange} />

        {locations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            zoom={mapZoom}
            onClick={handleMarkerClick}
          />
        ))}

        <div className="leaflet-bottom leaflet-right">
          <div className="leaflet-control">
            <div className="glass-card rounded-lg px-3 py-2 text-xs text-sand-600">
              共 {locations.length} 个地点 · 点击圆点查看
            </div>
          </div>
        </div>
      </MapContainer>
    </div>
  );
};
