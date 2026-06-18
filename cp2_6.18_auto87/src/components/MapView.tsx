import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLandmarkStore } from '../store/landmarkStore';

const MapController: React.FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const createCustomIcon = (isSelected: boolean): L.DivIcon => {
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${isSelected ? 'selected' : ''}" style="width: ${isSelected ? '28px' : '20px'}; height: ${isSelected ? '28px' : '20px'};"></div>`,
    iconSize: isSelected ? [28, 28] : [20, 20],
    iconAnchor: isSelected ? [14, 14] : [10, 10],
    popupAnchor: [0, -10],
  });
};

const MapView: React.FC = () => {
  const {
    currentCity,
    cityLandmarks,
    selectedLandmarkId,
    setSelectedLandmark,
  } = useLandmarkStore();

  const mapRef = useRef<L.Map | null>(null);
  const initialCenter = currentCity?.center || [39.9042, 116.4074];
  const initialZoom = currentCity?.zoom || 12;

  useEffect(() => {
    if (mapRef.current && currentCity) {
      mapRef.current.flyTo(currentCity.center, currentCity.zoom, {
        duration: 1,
      });
    }
  }, [currentCity]);

  useEffect(() => {
    if (mapRef.current && selectedLandmarkId) {
      const landmark = cityLandmarks.find((l) => l.id === selectedLandmarkId);
      if (landmark) {
        mapRef.current.flyTo(landmark.position, 15, { duration: 0.8 });
      }
    }
  }, [selectedLandmarkId, cityLandmarks]);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      zoomControl={true}
      scrollWheelZoom={true}
      preferCanvas={true}
      style={{ width: '100%', height: '100%' }}
    >
      <MapController onMapReady={handleMapReady} />
      <TileLayer
        attribution={tileAttribution}
        url={tileUrl}
      />
      {cityLandmarks.map((landmark) => (
        <Marker
          key={landmark.id}
          position={landmark.position}
          icon={createCustomIcon(landmark.id === selectedLandmarkId)}
          eventHandlers={{
            click: () => setSelectedLandmark(landmark.id),
          }}
        >
          <Popup>
            <span>{landmark.name}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
