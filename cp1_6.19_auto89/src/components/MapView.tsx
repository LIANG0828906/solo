import React, { memo, useCallback, useRef, useState } from 'react';
import { TileLayer, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location, MoodType } from '../types';
import { MOOD_CONFIGS } from '../types';
import { motion } from 'framer-motion';

interface MapViewProps {
  locations: Location[];
  selectedLocationId: string | null;
  expandedLocation: Location | null;
  onMapClick: (lat: number, lng: number) => void;
  onSelectLocation: (id: string | null) => void;
  onExpandLocation: (id: string | null) => void;
}

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😄',
  touched: '🥹',
  surprised: '🎉',
  calm: '🌿',
  tired: '😮‍💨',
};

function createPinIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 48 : 38;
  const pinHeight = size + 8;
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${pinHeight}px;
        position: relative;
        transform-origin: bottom center;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: ${isSelected ? '20px' : '16px'};
          ">📌</span>
        </div>
      </div>
    `,
    iconSize: [size, pinHeight],
    iconAnchor: [size / 2, pinHeight],
    popupAnchor: [0, -pinHeight + 4],
  });
}

function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBoundsController({ locations }: { locations: Location[] }) {
  const map = useMap();
  const processedRef = useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const newLocations = locations.filter(l => !processedRef.current.has(l.id));
    if (newLocations.length > 0) {
      newLocations.forEach(l => processedRef.current.add(l.id));
      const latest = newLocations[newLocations.length - 1];
      map.flyTo([latest.lat, latest.lng], Math.max(map.getZoom(), 6), {
        duration: 0.6,
      });
    }
  }, [locations, map]);

  return null;
}

interface PinMarkerProps {
  location: Location;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
}

const PinMarker: React.FC<PinMarkerProps> = memo(({ location, isSelected, onSelect, onExpand }) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const prevSelectedRef = useRef(isSelected);

  React.useEffect(() => {
    if (isSelected && !prevSelectedRef.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 250);
      return () => clearTimeout(timer);
    }
    prevSelectedRef.current = isSelected;
  }, [isSelected]);

  const color = MOOD_CONFIGS[location.mood].color;
  const icon = createPinIcon(color, isSelected);

  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    onSelect(location.id);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 250);
  }, [location.id, onSelect]);

  const bounceStyle: React.CSSProperties = isBouncing
    ? {
        animation: 'pinBounce 0.25s ease-out',
      }
    : {};

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
      zIndexOffset={isSelected ? 1000 : 100}
      keyboard
    >
      <div style={bounceStyle} />
      <Popup
        closeButton
        closeOnClick={false}
        autoPan
        maxWidth={260}
        minWidth={220}
      >
        <div
          onClick={() => onExpand(location.id)}
          style={{
            cursor: 'pointer',
            padding: '0',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            width: '220px',
          }}
        >
          {location.photos.length > 0 && (
            <img
              src={location.photos[0].url}
              alt={location.title}
              style={{
                width: '100%',
                height: '110px',
                objectFit: 'cover',
                display: 'block',
              }}
              draggable={false}
            />
          )}
          <div style={{ padding: '12px 14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {location.title}
              </h3>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: `${color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {MOOD_EMOJI[location.mood]}
              </span>
            </div>
            {location.note && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                {location.note}
              </p>
            )}
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              点击查看详情 →
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

PinMarker.displayName = 'PinMarker';

const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocationId,
  onMapClick,
  onSelectLocation,
  onExpandLocation,
}) => {
  return (
    <>
      <style>{`
        @keyframes pinBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.25) translateY(-4px); }
          50% { transform: scale(1.15) translateY(-2px); }
          70% { transform: scale(1.2) translateY(-3px); }
          100% { transform: scale(1); }
        }
        .custom-pin-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />

      <MapEvents onClick={onMapClick} />
      <FitBoundsController locations={locations} />

      {locations.map((loc) => (
        <PinMarker
          key={loc.id}
          location={loc}
          isSelected={selectedLocationId === loc.id}
          onSelect={onSelectLocation}
          onExpand={onExpandLocation}
        />
      ))}
    </>
  );
};

export default memo(MapView);
