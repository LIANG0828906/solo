import React, { useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TimelineEvent, CATEGORY_COLORS, formatYear, dateToYear } from '../types';

interface MapViewProps {
  events: TimelineEvent[];
  highlightedId: string | null;
  onHighlightClear: () => void;
}

function createIcon(category: string, importance: number, highlighted: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[category] || '#fff';
  const size = 12 + importance * 6;
  return L.divIcon({
    className: '',
    html: `<div class="marker-icon-wrapper ${highlighted ? 'highlighted' : ''}" style="
      width:${size}px;
      height:${size}px;
      background:${color};
      box-shadow: 0 0 ${highlighted ? 16 : 6}px ${color}80;
      opacity: ${highlighted ? 1 : 0.85};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToHighlight({ id, events }: { id: string | null; events: TimelineEvent[] }) {
  const map = useMap();
  useEffect(() => {
    if (!id) return;
    const ev = events.find((e) => e.id === id);
    if (ev) {
      map.flyTo([ev.lat, ev.lng], 6, { duration: 0.8 });
    }
  }, [id, events, map]);
  return null;
}

function renderStars(count: number): string {
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}

export default function MapView({ events, highlightedId, onHighlightClear }: MapViewProps) {
  const eventMap = useMemo(() => {
    const m = new Map<string, TimelineEvent>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const handlePopupClose = useCallback(() => {
    onHighlightClear();
  }, [onHighlightClear]);

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer
        center={[30, 110]}
        zoom={3}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FlyToHighlight id={highlightedId} events={events} />
        {events.map((ev) => {
          const isHighlighted = ev.id === highlightedId;
          return (
            <Marker
              key={ev.id}
              position={[ev.lat, ev.lng]}
              icon={createIcon(ev.category, ev.importance, isHighlighted)}
              eventHandlers={{
                popupclose: handlePopupClose,
              }}
            >
              <Popup>
                <div className="popup-card">
                  <h3>{ev.title}</h3>
                  <div className="popup-date">{formatYear(dateToYear(ev.date))}</div>
                  {ev.description && (
                    <div className="popup-desc">{ev.description}</div>
                  )}
                  <div className="popup-stars">{renderStars(ev.importance)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
