import { useRef, useEffect, useState, useCallback, memo } from 'react';
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

const createPinIcon = (size: number = 40, opacity: number = 1) => {
  const width = Math.round(size * 0.8);
  const height = size;
  const anchorX = Math.round(width / 2);
  const anchorY = height;
  const popupY = -height;

  return L.divIcon({
    className: 'poi-pin-icon',
    html: `
      <div class="poi-pin" style="width:${width}px;height:${height}px;opacity:${opacity};transition:all 0.2s ease-in-out;">
        <div class="poi-pin-head"></div>
        <div class="poi-pin-body"></div>
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, popupY],
  });
};

const baseIcon = createPinIcon();
const draggingIcon = createPinIcon(52, 0.85);
const dragStartIcon = createPinIcon(48, 0.9);
const dragEndIcon = createPinIcon(44, 1);

export const POIMarker = memo(function POIMarker({
  poi,
  isSelected = false,
  onClick,
  onDragEnd,
  draggable = true,
}: POIMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragEnabledRef = useRef(false);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleLongPressStart = useCallback(() => {
    if (!draggable) return;
    clearLongPressTimer();
    setIsLongPressing(true);
    longPressTimerRef.current = setTimeout(() => {
      dragEnabledRef.current = true;
      setIsLongPressing(false);
      if (markerRef.current) {
        markerRef.current.setIcon(dragStartIcon);
      }
    }, 500);
  }, [draggable, clearLongPressTimer]);

  const handleLongPressCancel = useCallback(() => {
    clearLongPressTimer();
    setIsLongPressing(false);
  }, [clearLongPressTimer]);

  const handleDragStart = useCallback(() => {
    if (!dragEnabledRef.current) return;
    setIsDragging(true);
    if (markerRef.current) {
      markerRef.current.setIcon(draggingIcon);
    }
    if (map) {
      map.dragging.disable();
    }
  }, [map]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsLongPressing(false);
    dragEnabledRef.current = false;
    clearLongPressTimer();

    if (markerRef.current) {
      markerRef.current.setIcon(dragEndIcon);
      const pos = markerRef.current.getLatLng();
      if (onDragEnd) {
        onDragEnd(pos.lat, pos.lng);
      }
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.setIcon(baseIcon);
        }
      }, 200);
    }

    if (map) {
      map.dragging.enable();
    }
  }, [onDragEnd, map, clearLongPressTimer]);

  const handleClick = useCallback(() => {
    if (dragEnabledRef.current || isDragging) return;
    clearLongPressTimer();
    if (onClick) {
      onClick();
    }
  }, [onClick, isDragging, clearLongPressTimer]);

  const handleMouseDown = useCallback(() => {
    handleLongPressStart();
  }, [handleLongPressStart]);

  const handleMouseUp = useCallback(() => {
    handleLongPressCancel();
  }, [handleLongPressCancel]);

  const handleMouseOut = useCallback(() => {
    handleLongPressCancel();
  }, [handleLongPressCancel]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    marker.on('mousedown', handleMouseDown);
    marker.on('mouseup', handleMouseUp);
    marker.on('mouseout', handleMouseOut);
    marker.on('touchstart', handleMouseDown);
    marker.on('touchend', handleMouseUp);
    marker.on('touchcancel', handleMouseOut);

    return () => {
      marker.off('mousedown', handleMouseDown);
      marker.off('mouseup', handleMouseUp);
      marker.off('mouseout', handleMouseOut);
      marker.off('touchstart', handleMouseDown);
      marker.off('touchend', handleMouseUp);
      marker.off('touchcancel', handleMouseOut);
      clearLongPressTimer();
    };
  }, [handleMouseDown, handleMouseUp, handleMouseOut, clearLongPressTimer]);

  return (
    <Marker
      ref={markerRef}
      position={[poi.lat, poi.lng]}
      icon={isDragging ? draggingIcon : isLongPressing ? createPinIcon(44, 0.92) : baseIcon}
      draggable={draggable && dragEnabledRef.current}
      zIndexOffset={isDragging ? 1000 : isSelected ? 100 : 0}
      eventHandlers={{
        click: handleClick,
        dragstart: handleDragStart,
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
}, (prevProps, nextProps) => {
  if (prevProps.poi.id !== nextProps.poi.id) return false;
  if (prevProps.poi.lat !== nextProps.poi.lat) return false;
  if (prevProps.poi.lng !== nextProps.poi.lng) return false;
  if (prevProps.poi.name !== nextProps.poi.name) return false;
  if (prevProps.poi.description !== nextProps.poi.description) return false;
  if (prevProps.poi.createdAt !== nextProps.poi.createdAt) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.draggable !== nextProps.draggable) return false;
  return true;
});

POIMarker.displayName = 'POIMarker';
