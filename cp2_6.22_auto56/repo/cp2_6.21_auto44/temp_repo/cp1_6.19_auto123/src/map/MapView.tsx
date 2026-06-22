import { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiClock, FiUser } from 'react-icons/fi';
import {
  LocationPoint,
  stageColors,
  stageNames,
  calculateRouteDuration,
} from '../data/batchData';

interface MapViewProps {
  locations: LocationPoint[];
  selectedLocation: LocationPoint | null;
  onMarkerClick: (location: LocationPoint) => void;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function MapView({ locations, selectedLocation, onMarkerClick }: MapViewProps) {
  const [routeBubble, setRouteBubble] = useState<{
    position: [number, number];
    duration: string;
  } | null>(null);

  useEffect(() => {
    if (routeBubble) {
      const timer = setTimeout(() => {
        setRouteBubble(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [routeBubble]);

  const mapCenter = useMemo((): [number, number] => {
    if (selectedLocation) {
      return [selectedLocation.lat, selectedLocation.lng];
    }
    if (locations.length > 0) {
      const lats = locations.map((l) => l.lat);
      const lngs = locations.map((l) => l.lng);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
      ];
    }
    return [35.8617, 104.1954];
  }, [selectedLocation, locations]);

  const zoom = selectedLocation ? 8 : 5;

  const polylinePositions: [number, number][] = locations.map((l) => [l.lat, l.lng]);

  const createCustomIcon = (color: string, isSelected: boolean) => {
    const size = isSelected ? 28 : 20;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        ${isSelected ? 'transform: scale(1.1);' : ''}
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const handlePolylineClick = (index: number) => {
    if (index >= locations.length - 1) return;
    const start = locations[index];
    const end = locations[index + 1];
    const duration = calculateRouteDuration(start.departureTime, end.arrivalTime);
    const midPoint: [number, number] = [
      (start.lat + end.lat) / 2,
      (start.lng + end.lng) / 2,
    ];
    setRouteBubble({ position: midPoint, duration });
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        key={locations.length > 0 ? 'has-data' : 'empty'}
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ChangeView center={mapCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((location, index) => {
          const isSelected =
            selectedLocation?.lat === location.lat &&
            selectedLocation?.lng === location.lng;

          return (
            <Marker
              key={`${location.lat}-${location.lng}-${index}`}
              position={[location.lat, location.lng]}
              icon={createCustomIcon(stageColors[location.stage], isSelected)}
              eventHandlers={{
                click: () => onMarkerClick(location),
              }}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="popup-content">
                  <div
                    className="popup-stage-badge"
                    style={{ background: stageColors[location.stage] }}
                  >
                    {stageNames[location.stage]}
                  </div>
                  <h4 className="popup-title">{location.name}</h4>
                  <div className="popup-row">
                    <FiClock size={12} />
                    <span>
                      停留：{calculateRouteDuration(location.arrivalTime, location.departureTime)}
                    </span>
                  </div>
                  <div className="popup-row">
                    <FiUser size={12} />
                    <span>负责人：{location.personInCharge}</span>
                  </div>
                  <div className="popup-coords">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {polylinePositions.length >= 2 &&
          polylinePositions.slice(0, -1).map((_, index) => (
            <Polyline
              key={`route-${index}`}
              positions={[polylinePositions[index], polylinePositions[index + 1]]}
              color="#636E72"
              weight={2}
              dashArray="5,5"
              eventHandlers={{
                click: () => handlePolylineClick(index),
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    color: '#00B894',
                    weight: 4,
                    dashArray: '5,5',
                  });
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.setStyle({
                    color: '#636E72',
                    weight: 2,
                    dashArray: '5,5',
                  });
                },
              }}
            />
          ))}

        {routeBubble && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              className="route-bubble"
            >
              <FiClock size={12} style={{ marginRight: 4 }} />
              运输耗时：{routeBubble.duration}
            </motion.div>
          </div>
        )}
      </MapContainer>

      {locations.length === 0 && (
        <div className="map-empty">
          <FiMapPin size={48} color="#B2BEC3" />
          <p>请输入批次号查看供应链地图</p>
        </div>
      )}

      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            className="map-legend"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h4>当前选中</h4>
            <div
              className="legend-stage-badge"
              style={{ background: stageColors[selectedLocation.stage] }}
            >
              {stageNames[selectedLocation.stage]}
            </div>
            <p className="legend-name">{selectedLocation.name}</p>
            <p className="legend-coords">
              {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="map-color-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--color-stage-origin)' }} />
          <span>原料产地</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--color-stage-processing)' }} />
          <span>加工阶段</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--color-stage-logistics)' }} />
          <span>物流阶段</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--color-stage-sales)' }} />
          <span>销售阶段</span>
        </div>
      </div>

      <style>{`
        .map-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .map-empty {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: var(--color-text-body);
          pointer-events: none;
        }

        .map-empty p {
          margin-top: 12px;
          font-size: 14px;
        }

        .custom-popup .leaflet-popup-content-wrapper {
          width: 240px;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          padding: 0;
        }

        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }

        .popup-content {
          padding: 12px 14px;
        }

        .popup-stage-badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          color: #fff;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .popup-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-title);
          margin-bottom: 8px;
        }

        .popup-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-text-body);
          margin-bottom: 4px;
        }

        .popup-coords {
          font-size: 11px;
          color: var(--color-border);
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--color-border-light);
        }

        .route-bubble {
          display: flex;
          align-items: center;
          background: var(--color-text-title);
          color: var(--color-text-white);
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .route-bubble::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid var(--color-text-title);
        }

        .map-legend {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--color-bg-white);
          padding: 14px 16px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          min-width: 180px;
          z-index: 500;
        }

        .map-legend h4 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--color-text-title);
        }

        .legend-stage-badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          color: #fff;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .legend-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-title);
          margin-bottom: 4px;
        }

        .legend-coords {
          font-size: 11px;
          color: var(--color-border);
        }

        .map-color-legend {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: var(--color-bg-white);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 500;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-body);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .custom-marker {
          background: transparent !important;
          border: none !important;
        }

        .leaflet-container {
          font-family: var(--font-family);
        }

        .leaflet-popup-tip {
          background: var(--color-bg-white);
        }

        @media (max-width: 768px) {
          .map-legend {
            top: 10px;
            right: 10px;
            padding: 10px 12px;
            min-width: 140px;
          }

          .map-color-legend {
            bottom: 10px;
            left: 10px;
            padding: 8px 10px;
          }

          .custom-popup .leaflet-popup-content-wrapper {
            width: 200px;
          }
        }
      `}</style>
    </div>
  );
}

export default MapView;
