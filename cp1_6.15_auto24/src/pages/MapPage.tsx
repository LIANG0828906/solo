import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePlant } from '../context/PlantContext';

const PulseIcon = L.divIcon({
  className: 'pulse-marker-wrapper',
  html: `
    <div class="pulse-marker">
      <div class="marker-pulse"></div>
      <div class="marker-dot"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const MapController: React.FC = () => {
  const map = useMap();
  React.useEffect(() => {
    map.invalidateSize();
    map.flyTo([39.9200, 116.4074], 12, { duration: 1.5 });
  }, [map]);
  return null;
};

const MapPage: React.FC = () => {
  const { adoptionPoints } = usePlant();

  return (
    <div>
      <h2 className="page-title">📍 领养地图</h2>
      <div className="map-container">
        <MapContainer
          center={[39.9200, 116.4074]}
          zoom={12}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController />
          {adoptionPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={PulseIcon}
            >
              <Popup>
                <div className="popup-content">
                  <div className="popup-title">{point.name}</div>
                  <div className="popup-address">📍 {point.address}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-medium)', marginBottom: '8px' }}>可领养绿植：</div>
                  <div className="popup-plants">
                    {point.plants.map((plant, idx) => (
                      <span key={idx} className="popup-plant-tag">
                        🌱 {plant}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
