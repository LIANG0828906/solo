import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Culture } from '../types';
import { useStore } from '../store';

function MapClickHandler() {
  const setSelectedCulture = useStore((s) => s.setSelectedCulture);
  useMapEvents({
    click: () => setSelectedCulture(null)
  });
  return null;
}

interface SpiceMarkerProps {
  culture: Culture;
}

function SpiceMarker({ culture }: SpiceMarkerProps) {
  const setSelectedCulture = useStore((s) => s.setSelectedCulture);
  const selectedCulture = useStore((s) => s.selectedCulture);

  const size = useMemo(() => {
    const minSize = 12;
    const maxSize = 32;
    const minSpices = 3;
    const maxSpices = 8;
    const count = culture.spices.length;
    const ratio = Math.min(1, Math.max(0, (count - minSpices) / (maxSpices - minSpices)));
    return minSize + ratio * (maxSize - minSize);
  }, [culture.spices.length]);

  const isSelected = selectedCulture?.id === culture.id;

  const icon = useMemo(() => {
    return L.divIcon({
      className: 'spice-marker-wrapper',
      html: `
        <div class="spice-marker" style="width:${size * 2}px; height:${size * 2}px;">
          <div 
            class="spice-marker-inner" 
            style="
              width:${size * 2}px; 
              height:${size * 2}px; 
              background:${culture.color}; 
              color:${culture.color};
              ${isSelected ? 'transform: translate(-50%, -50%) scale(1.5);' : ''}
            "
          ></div>
        </div>
      `,
      iconSize: [size * 2, size * 2],
      iconAnchor: [size, size]
    });
  }, [size, culture.color, isSelected]);

  return (
    <Marker
      position={[culture.lat, culture.lng]}
      icon={icon}
      eventHandlers={{
        mouseover: (e) => {
          const marker = e.target;
          const tooltipHtml = `
            <div class="tooltip-container">
              <div class="tooltip-name">${culture.name} · ${culture.nameEn}</div>
              <div class="tooltip-count">${culture.spices.length} 种香料</div>
            </div>
          `;
          marker.bindTooltip(tooltipHtml, {
            direction: 'top',
            offset: [0, -size - 8],
            className: 'custom-tooltip',
            opacity: 1
          }).openTooltip();
        },
        mouseout: (e) => {
          e.target.closeTooltip();
        },
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedCulture(isSelected ? null : culture);
        }
      }}
    />
  );
}

export default function WorldMap() {
  const cultures = useStore((s) => s.cultures);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <MapContainer
        center={[30, 90]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
        worldCopyJump={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler />
        {cultures.map((culture) => (
          <SpiceMarker key={culture.id} culture={culture} />
        ))}
      </MapContainer>
    </div>
  );
}
