import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import type { DayItineraryItem } from '../types';
import { CATEGORY_COLORS } from '../types';

interface MarkerDragTrackerProps {
  onMarkerDragEnd: (attrId: string, dayIndex: number, insertIdx: number) => void;
  items: (DayItineraryItem & { dayNumber: number })[];
}

function MapAutoFit({ items }: { items: (DayItineraryItem & { dayNumber: number })[] }) {
  const map = useMap();
  useEffect(() => {
    if (!items.length) return;
    const bounds = L.latLngBounds(items.map((i) => [i.attraction.lat, i.attraction.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.25), { animate: true, duration: 0.8 });
    }
  }, [items, map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({
    click: () => onClick(),
  });
  return null;
}

function MarkerDragTracker({ onMarkerDragEnd, items }: MarkerDragTrackerProps) {
  const map = useMap();
  const dragInfo = useRef<{ id: string; startLat: number; startLng: number } | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    const onMapMouseUp = (e: MouseEvent) => {
      if (!dragInfo.current) return;
      const point = L.point(e.clientX, e.clientY);
      const latlng = map.containerPointToLatLng(L.point(
        point.x - container.getBoundingClientRect().left,
        point.y - container.getBoundingClientRect().top
      ));
      if (!latlng) {
        dragInfo.current = null;
        return;
      }
      let nearestIdx = -1;
      let nearestDay = -1;
      let minDist = Infinity;
      items.forEach((item, idx) => {
        const d = map.distance(
          [item.attraction.lat, item.attraction.lng],
          [latlng.lat, latlng.lng]
        );
        if (d < minDist && item.attractionId !== dragInfo.current?.id) {
          minDist = d;
          nearestIdx = idx;
          nearestDay = item.dayNumber - 1;
        }
      });
      const draggedId = dragInfo.current.id;
      const srcIdx = items.findIndex((i) => i.attractionId === draggedId);
      if (srcIdx >= 0 && nearestIdx >= 0) {
        onMarkerDragEnd(draggedId, nearestDay, nearestIdx);
      }
      dragInfo.current = null;
    };
    window.addEventListener('mouseup', onMapMouseUp);
    return () => window.removeEventListener('mouseup', onMapMouseUp);
  }, [map, items, onMarkerDragEnd]);

  return null;
}

export default function MapView() {
  const {
    state,
    handleSelectAttraction,
    handleHighlight,
    handleOpenModal,
    handleMoveItem,
    getAllItems,
    findItemIndex,
  } = useApp();

  const allItems = useMemo(() => getAllItems(), [getAllItems]);

  const center: [number, number] = useMemo(() => {
    if (allItems.length) {
      const avgLat = allItems.reduce((s, i) => s + i.attraction.lat, 0) / allItems.length;
      const avgLng = allItems.reduce((s, i) => s + i.attraction.lng, 0) / allItems.length;
      return [avgLat, avgLng];
    }
    return [35.8617, 104.1954];
  }, [allItems]);

  const polylinePositions = useMemo(() => {
    const positions: [number, number][] = [];
    allItems.forEach((item) => {
      positions.push([item.attraction.lat, item.attraction.lng]);
    });
    return positions;
  }, [allItems]);

  const handleMarkerDragEnd = (
    attrId: string,
    targetDayIndex: number,
    targetItemGlobalIdx: number
  ) => {
    const src = findItemIndex(attrId);
    if (!src) return;
    const targetItem = allItems[targetItemGlobalIdx];
    if (!targetItem) return;
    handleMoveItem(src.dayIndex, src.itemIndex, targetDayIndex, targetItem.dayNumber - 1 === src.dayIndex ? 0 : allItems
      .filter(i => i.dayNumber === targetDayIndex + 1)
      .findIndex(i => i.attractionId === targetItem.attractionId) >= 0
        ? allItems
            .filter(i => i.dayNumber === targetDayIndex + 1)
            .findIndex(i => i.attractionId === targetItem.attractionId)
        : 0);
  };

  const onMapClick = () => handleSelectAttraction(null);

  const colorForCategory = (cat: string) => CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#999';

  const buildIcon = (color: string, size: number, selected: boolean, highlight: boolean) => {
    return L.divIcon({
      className: '',
      html: `
        <div class="custom-marker ${selected ? 'selected' : ''} ${highlight ? 'highlight-pulse' : ''}"
             style="width:${size}px;height:${size}px;background:${color};">
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <div className="map-container">
      {state.isGenerating && (
        <div className="map-loading">
          <div className="loading-spinner" />
        </div>
      )}

      <MapContainer
        center={center}
        zoom={allItems.length ? 12 : 5}
        scrollWheelZoom
        zoomControl
        attributionControl={false}
        preferCanvas
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapClickHandler onClick={onMapClick} />

        {allItems.length > 0 && <MapAutoFit items={allItems} />}

        {allItems.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: 'var(--color-primary)',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
              className: 'route-polyline',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {allItems.map((item) => {
          const isSelected = state.selectedAttractionId === item.attractionId;
          const isHighlight = state.highlightAttractionId === item.attractionId;
          const color = colorForCategory(item.attraction.category);
          const size = isSelected ? 24 : 16;
          return (
            <Marker
              key={item.attractionId}
              position={[item.attraction.lat, item.attraction.lng]}
              icon={buildIcon(color, size, isSelected, isHighlight)}
              eventHandlers={{
                click: () => {
                  handleSelectAttraction(item.attractionId);
                },
                dblclick: () => {
                  handleOpenModal(item.attraction);
                },
                mouseover: () => {
                  handleHighlight(item.attractionId);
                },
                dragstart: () => {
                  handleSelectAttraction(item.attractionId);
                },
              }}
              draggable
            >
              <Popup>
                <div style={{ padding: '4px 8px', minWidth: 120 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.attraction.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Day {item.dayNumber} · {item.startTime}-{item.endTime}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <span style={{ color: '#ffa000' }}>★</span> {item.attraction.rating.toFixed(1)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MarkerDragTracker
          items={allItems}
          onMarkerDragEnd={handleMarkerDragEnd}
        />
      </MapContainer>

      {!state.itinerary && !state.isGenerating && (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <div className="empty-title">开始制定您的行程</div>
          <div className="empty-text">
            选择出发城市、旅行天数和兴趣偏好，点击「生成行程」按钮，智能为您规划最优路线
          </div>
        </div>
      )}
    </div>
  );
}
