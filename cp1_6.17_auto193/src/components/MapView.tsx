import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Star } from 'lucide-react';
import { useMarkerStore, Marker as MarkerType } from '@/stores/markerStore';
import AudioRecorder from './AudioRecorder';

interface MapViewProps {
  sharedMarkerIds: string[];
  onMapReady: (map: L.Map) => void;
}

function MapEvents() {
  const { isCreatingMode, setPendingLatLng, setActiveMarker } = useMarkerStore();
  useMapEvents({
    click: (e) => {
      if (isCreatingMode) {
        setPendingLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else {
        setActiveMarker(null);
      }
    },
  });
  return null;
}

function MapController({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

const createSoundIcon = (marker: MarkerType, isPlaying: boolean, isShared: boolean) => {
  const classes = [
    'sound-marker-icon',
    isPlaying ? 'playing' : '',
    isShared ? 'shared-highlight' : '',
  ].filter(Boolean).join(' ');

  return L.divIcon({
    className: '',
    html: `
      <div class="${classes}">
        <div class="sound-wave-icon"></div>
        ${marker.isFavorited ? `
          <div class="favorite-star">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

function PendingMarker() {
  const { pendingLatLng } = useMarkerStore();
  if (!pendingLatLng) return null;

  const icon = L.divIcon({
    className: '',
    html: `
      <div class="sound-marker-icon" style="opacity: 0.8;">
        <div class="sound-wave-icon" style="background: linear-gradient(135deg, #FFD700, #FFA500);"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={[pendingLatLng.lat, pendingLatLng.lng]} icon={icon} interactive={false} />
  );
}

export default function MapView({ sharedMarkerIds, onMapReady }: MapViewProps) {
  const { markers, activeMarkerId, playingMarkerId, isCreatingMode, setActiveMarker } = useMarkerStore();
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className={`w-full h-full ${isCreatingMode ? 'map-creating-mode' : ''}`}>
      <MapContainer
        center={[39.9042, 116.4074]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#1A1A2E' }}
        ref={(m) => { mapRef.current = m || null; }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapController onMapReady={onMapReady} />
        <MapEvents />

        {markers.map((marker) => {
          const isPlaying = playingMarkerId === marker.id;
          const isShared = sharedMarkerIds.some((id) =>
            marker.id === id || marker.id.startsWith(id)
          );
          const icon = createSoundIcon(marker, isPlaying, isShared);

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  setActiveMarker(marker.id);
                },
              }}
            >
              <Popup
                closeButton={true}
                closeOnClick={false}
                autoClose={false}
                maxWidth={300}
                minWidth={260}
              >
                <AudioRecorder
                  mode="play"
                  markerId={marker.id}
                  onClose={() => setActiveMarker(null)}
                />
              </Popup>
            </Marker>
          );
        })}

        <PendingMarker />
      </MapContainer>
    </div>
  );
}
