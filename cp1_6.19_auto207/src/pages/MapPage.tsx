import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { STATUS_COLORS, STATUS_LABELS, ChargingStation } from '../types';

function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">⚡</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function FitBounds({ stations }: { stations: ChargingStation[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (stations.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(stations.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [stations, map]);

  return null;
}

function PopupContent({ station }: { station: ChargingStation }) {
  const navigate = useNavigate();

  const now = Date.now();
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 4,
        minWidth: 220,
      }}
    >
      <div style={{ padding: 8 }}>
        <h4
          style={{
            color: '#121212',
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {station.name}
        </h4>
        <p style={{ color: '#666666', fontSize: 12, marginBottom: 8 }}>
          {station.address}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
              backgroundColor: `${STATUS_COLORS[station.overallStatus]}15`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: STATUS_COLORS[station.overallStatus],
              }}
            />
            <span style={{ color: STATUS_COLORS[station.overallStatus], fontSize: 12, fontWeight: 500 }}>
              {STATUS_LABELS[station.overallStatus]}
            </span>
          </div>
          <div style={{ color: '#666666', fontSize: 12, padding: '4px 0' }}>
            {station.availableGuns}/{station.totalGuns} 空闲枪
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#121212', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
            充电枪状态：
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {station.guns.map((gun, idx) => (
              <div
                key={gun.id}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: `${STATUS_COLORS[gun.status]}20`,
                  border: `2px solid ${STATUS_COLORS[gun.status]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: STATUS_COLORS[gun.status],
                  fontWeight: 600,
                }}
                title={`${gun.power}kW - ${STATUS_LABELS[gun.status]}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/booking/${station.id}`)}
          style={{
            width: '100%',
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          立即预约
        </motion.button>
      </div>
    </div>
  );
}

export default function MapPage() {
  const stations = useStore((s) => s.stations);

  const center: [number, number] = useMemo(() => {
    if (stations.length > 0) {
      const avgLat = stations.reduce((s, st) => s + st.lat, 0) / stations.length;
      const avgLng = stations.reduce((s, st) => s + st.lng, 0) / stations.length;
      return [avgLat, avgLng];
    }
    return [31.2304, 121.4737];
  }, [stations]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds stations={stations} />
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={createColoredIcon(STATUS_COLORS[station.overallStatus])}
          >
            <Popup
              closeButton={false}
              maxWidth={300}
              minWidth={240}
              className="custom-popup"
            >
              <PopupContent station={station} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 16px;
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
          border-radius: 16px;
        }
        .custom-popup .leaflet-popup-tip {
          background: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-container {
          background: #121212;
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          backgroundColor: '#1E1E2EE6',
          backdropFilter: 'blur(8px)',
          borderRadius: 12,
          padding: 12,
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          图例
        </div>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
              }}
            />
            <span style={{ color: '#CCCCCC', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
