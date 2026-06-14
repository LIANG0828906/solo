import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { SoundClip, CATEGORY_COLORS } from '../../types';

interface MapViewProps {
  soundClips: SoundClip[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (clip: SoundClip) => void;
  showHeatmap: boolean;
}

function createPulseIcon(category: SoundClip['category']): L.DivIcon {
  const color = CATEGORY_COLORS[category];
  return L.divIcon({
    className: 'sound-marker-wrapper',
    html: `<div class="marker-pulse" style="--mc: ${color}">
             <div class="marker-ring"></div>
             <div class="marker-dot" style="background:${color};box-shadow:0 0 8px ${color}"></div>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function HeatmapLayer({ points }: { points: L.LatLngExpression[] }) {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    if (points.length > 0) {
      // @ts-expect-error leaflet.heat types
      layerRef.current = L.heatLayer(points, {
        radius: 30,
        blur: 20,
        maxZoom: 15,
        max: points.length > 50 ? 10 : 5,
        gradient: {
          0.2: '#00d2ff',
          0.4: '#00ff88',
          0.6: '#ffd43b',
          0.8: '#ff922b',
          1.0: '#ff4757',
        },
      }).addTo(map);
    }
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

function MapEventHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MemoMarker = React.memo(function MemoMarker({
  clip,
  onClick,
}: {
  clip: SoundClip;
  onClick: (c: SoundClip) => void;
}) {
  const icon = useMemo(() => createPulseIcon(clip.category), [clip.category]);
  return (
    <Marker
      position={[clip.lat, clip.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(clip),
      }}
    />
  );
});

export default function MapView({ soundClips, onMapClick, onMarkerClick, showHeatmap }: MapViewProps) {
  const heatPoints = useMemo<L.LatLngExpression[]>(
    () => soundClips.map((c) => [c.lat, c.lng] as L.LatLngExpression),
    [soundClips]
  );

  return (
    <MapContainer
      center={[30, 10]}
      zoom={3}
      className="map-container"
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapEventHandler onMapClick={onMapClick} />
      {showHeatmap && <HeatmapLayer points={heatPoints} />}
      {soundClips.map((clip) => (
        <MemoMarker key={clip.id} clip={clip} onClick={onMarkerClick} />
      ))}
    </MapContainer>
  );
}
