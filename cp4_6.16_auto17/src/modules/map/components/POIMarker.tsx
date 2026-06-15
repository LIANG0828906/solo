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

type DragState = 'idle' | 'longPressing' | 'dragging';

const createPinIcon = () => {
  const width = 32;
  const height = 40;
  return L.divIcon({
    className: 'poi-pin-icon',
    html: `
      <div class="poi-pin">
        <div class="poi-pin-head"></div>
        <div class="poi-pin-body"></div>
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });
};

const baseIcon = createPinIcon();

export const POIMarker = memo(function POIMarker({
  poi,
  isSelected = false,
  onClick,
  onDragEnd,
  draggable = true,
}: POIMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();
  const [dragState, setDragState] = useState<DragState>('idle');
  const dragStateRef = useRef<DragState>('idle');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragEnabledRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchRef = useRef(false);
  const isBouncingRef = useRef(false);

  const setDragStateSync = useCallback((state: DragState) => {
    dragStateRef.current = state;
    setDragState(state);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const addMarkerClass = useCallback((className: string) => {
    const marker = markerRef.current;
    if (!marker) return;
    const el = marker.getElement();
    if (!el) return;
    el.classList.add(className);
  }, []);

  const removeMarkerClass = useCallback((className: string) => {
    const marker = markerRef.current;
    if (!marker) return;
    const el = marker.getElement();
    if (!el) return;
    el.classList.remove(className);
  }, []);

  const handlePressStart = useCallback((clientX: number, clientY: number, isTouch: boolean) => {
    if (!draggable || dragStateRef.current !== 'idle' || isBouncingRef.current) return;

    clearLongPressTimer();
    startPosRef.current = { x: clientX, y: clientY };
    isTouchRef.current = isTouch;
    setDragStateSync('longPressing');
    addMarkerClass('poi-pin-long-pressing');

    const delay = isTouch ? 600 : 500;
    longPressTimerRef.current = setTimeout(() => {
      dragEnabledRef.current = true;
      setDragStateSync('dragging');
      removeMarkerClass('poi-pin-long-pressing');
      addMarkerClass('poi-pin-dragging');
      if (map) {
        map.dragging.disable();
      }
    }, delay);
  }, [draggable, clearLongPressTimer, setDragStateSync, addMarkerClass, removeMarkerClass, map]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (dragStateRef.current !== 'longPressing' || !startPosRef.current) return;

    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const threshold = isTouchRef.current ? 10 : 5;

    if (distance > threshold) {
      clearLongPressTimer();
      setDragStateSync('idle');
      removeMarkerClass('poi-pin-long-pressing');
      startPosRef.current = null;
    }
  }, [clearLongPressTimer, setDragStateSync, removeMarkerClass]);

  const handlePressEnd = useCallback(() => {
    const currentState = dragStateRef.current;
    if (currentState === 'idle') return;

    clearLongPressTimer();
    dragEnabledRef.current = false;
    startPosRef.current = null;

    if (currentState === 'longPressing') {
      removeMarkerClass('poi-pin-long-pressing');
    } else if (currentState === 'dragging') {
      if (!isBouncingRef.current) {
        isBouncingRef.current = true;
        removeMarkerClass('poi-pin-dragging');
        addMarkerClass('poi-pin-bounce');

        setTimeout(() => {
          removeMarkerClass('poi-pin-bounce');
          isBouncingRef.current = false;
        }, 400);
      }
    }

    setDragStateSync('idle');

    if (currentState === 'dragging' && map) {
      map.dragging.enable();
    }
  }, [clearLongPressTimer, setDragStateSync, addMarkerClass, removeMarkerClass, map]);

  const handleClick = useCallback(() => {
    if (dragEnabledRef.current || dragStateRef.current !== 'idle' || isBouncingRef.current) return;
    clearLongPressTimer();
    if (onClick) {
      onClick();
    }
  }, [onClick, clearLongPressTimer]);

  const handleDragEnd = useCallback(() => {
    handlePressEnd();

    if (markerRef.current && onDragEnd) {
      const pos = markerRef.current.getLatLng();
      onDragEnd(pos.lat, pos.lng);
    }
  }, [onDragEnd, handlePressEnd]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      handlePressStart(e.originalEvent.clientX, e.originalEvent.clientY, false);
    };

    const onMouseUp = () => {
      handlePressEnd();
    };

    const onMouseOut = () => {
      if (dragStateRef.current === 'longPressing') {
        handlePressEnd();
      }
    };

    const onTouchStart = (e: L.LeafletEvent) => {
      const touch = (e.originalEvent as TouchEvent).touches[0];
      if (touch) {
        handlePressStart(touch.clientX, touch.clientY, true);
      }
    };

    const onTouchEnd = () => {
      handlePressEnd();
    };

    const onTouchCancel = () => {
      handlePressEnd();
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    };

    marker.on('mousedown', onMouseDown);
    marker.on('mouseup', onMouseUp);
    marker.on('mouseout', onMouseOut);
    marker.on('touchstart', onTouchStart);
    marker.on('touchend', onTouchEnd);
    marker.on('touchcancel', onTouchCancel);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      marker.off('mousedown', onMouseDown);
      marker.off('mouseup', onMouseUp);
      marker.off('mouseout', onMouseOut);
      marker.off('touchstart', onTouchStart);
      marker.off('touchend', onTouchEnd);
      marker.off('touchcancel', onTouchCancel);

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);

      clearLongPressTimer();
      if (map && dragEnabledRef.current) {
        map.dragging.enable();
      }
    };
  }, [handlePressStart, handlePressEnd, handleMove, clearLongPressTimer, map]);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const zIndexOffset = dragState === 'dragging' ? 1000 : isSelected ? 100 : 0;

  return (
    <Marker
      ref={markerRef}
      position={[poi.lat, poi.lng]}
      icon={baseIcon}
      draggable={draggable && dragEnabledRef.current && dragState === 'dragging'}
      zIndexOffset={zIndexOffset}
      eventHandlers={{
        click: handleClick,
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
