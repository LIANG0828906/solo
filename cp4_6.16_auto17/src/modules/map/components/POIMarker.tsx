import { useRef, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { POI } from '@/shared/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface POIMarkerProps {
  poi: POI;
  isSelected?: boolean;
  onClick?: () => void;
  onDragEnd?: (lat: number, lng: number) => void;
  draggable?: boolean;
}

const pinIcon = L.divIcon({
  className: 'poi-pin-icon',
  html: `
    <div class="poi-pin">
      <div class="poi-pin-head"></div>
      <div class="poi-pin-body"></div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

export function POIMarker({ poi, isSelected = false, onClick, onDragEnd, draggable = false }: POIMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const handleDragEnd = () => {
    if (markerRef.current && onDragEnd) {
      const pos = markerRef.current.getLatLng();
      onDragEnd(pos.lat, pos.lng);
    }
  };

  return (
    <Marker
      ref={markerRef}
      position={[poi.lat, poi.lng]}
      icon={pinIcon}
      draggable={draggable}
      eventHandlers={{
        click: onClick,
        dragend: handleDragEnd,
      }}
    >
      <Popup className="poi-popup">
        <div className="poi-popup-content">
          <h3 className="poi-popup-title">{poi.name}</h3>
          <p className="poi-popup-description">{poi.description}</p>
          <p className="poi-popup-date">
            添加时间：{format(new Date(poi.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
