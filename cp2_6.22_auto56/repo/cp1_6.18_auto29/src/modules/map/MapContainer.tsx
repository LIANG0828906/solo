import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useMapStore } from '../../stores/useMapStore';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../stores/useMapStore';
import { RoutePlanner } from '../planner/RoutePlanner';
import type { Marker } from '../../stores/useMapStore';
import './MapContainer.css';

interface MapContainerProps {
  onMapClick: (lat: number, lng: number) => void;
}

export function MapContainer({ onMapClick }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const rippleRef = useRef<L.CircleMarker | null>(null);
  const isProgrammaticMove = useRef(false);
  const lastCenterRef = useRef<[number, number]>(mapCenter);
  const lastZoomRef = useRef<number>(mapZoom);

  const markers = useMapStore((state) => state.markers);
  const selectedMarkerId = useMapStore((state) => state.selectedMarkerId);
  const mapCenter = useMapStore((state) => state.mapCenter);
  const mapZoom = useMapStore((state) => state.mapZoom);
  const selectMarker = useMapStore((state) => state.selectMarker);
  const updateMarker = useMapStore((state) => state.updateMarker);
  const reorderMarkers = useMapStore((state) => state.reorderMarkers);
  const routeOrder = useMapStore((state) => state.routeOrder);
  const setMapView = useMapStore((state) => state.setMapView);
  const deleteMarker = useMapStore((state) => state.deleteMarker);

  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const createCustomIcon = useCallback((marker: Marker, isSelected: boolean) => {
    const color = CATEGORY_COLORS[marker.category];
    const icon = CATEGORY_ICONS[marker.category];
    const size = isSelected ? 32 : 24;

    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div class="custom-marker" style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${size * 0.5}px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        ">
          ${icon}
        </div>
        ${isSelected ? `
          <div class="marker-label" style="
            position: absolute;
            bottom: calc(100% + 6px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26, 26, 46, 0.95);
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            pointer-events: none;
          ">
            ${marker.name}
          </div>
        ` : ''}
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  const playRippleEffect = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    if (rippleRef.current) {
      mapInstanceRef.current.removeLayer(rippleRef.current);
    }

    const ripple = L.circleMarker([lat, lng], {
      radius: 12,
      color: '#6C63FF',
      weight: 2,
      fillColor: '#6C63FF',
      fillOpacity: 0.5,
      interactive: false,
    }).addTo(mapInstanceRef.current);

    rippleRef.current = ripple;

    const startTime = performance.now();
    const duration = 400;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentRadius = 12 + easeOut * 18;
      const currentOpacity = 0.5 * (1 - progress);

      ripple.setRadius(currentRadius);
      ripple.setStyle({ fillOpacity: currentOpacity, opacity: currentOpacity * 0.8 });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (rippleRef.current === ripple && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(ripple);
          rippleRef.current = null;
        }
      }
    };

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      if (draggingMarkerId) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    const handleViewChange = () => {
      if (isProgrammaticMove.current) {
        isProgrammaticMove.current = false;
        return;
      }
      const center = map.getCenter();
      const newZoom = map.getZoom();
      const newCenter: [number, number] = [center.lat, center.lng];
      
      const lastCenter = lastCenterRef.current;
      const lastZoom = lastZoomRef.current;
      
      if (
        Math.abs(newCenter[0] - lastCenter[0]) > 0.0001 ||
        Math.abs(newCenter[1] - lastCenter[1]) > 0.0001 ||
        Math.abs(newZoom - lastZoom) > 0.01
      ) {
        lastCenterRef.current = newCenter;
        lastZoomRef.current = newZoom;
        setMapView(newCenter, newZoom);
      }
    };

    map.on('moveend', handleViewChange);
    map.on('zoomend', handleViewChange);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }
    markersRef.current.clear();

    markers.forEach((marker) => {
      const isSelected = marker.id === selectedMarkerId;
      const icon = createCustomIcon(marker, isSelected);

      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon,
        draggable: true,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      leafletMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectMarker(marker.id);
        setShowDetail(true);
        playRippleEffect(marker.lat, marker.lng);
      });

      leafletMarker.on('mouseover', function () {
        if (marker.id !== selectedMarkerId) {
          const hoverIcon = createCustomIcon(marker, true);
          this.setIcon(hoverIcon);
        }
      });

      leafletMarker.on('mouseout', function () {
        if (marker.id !== selectedMarkerId) {
          const normalIcon = createCustomIcon(marker, false);
          this.setIcon(normalIcon);
        }
      });

      leafletMarker.on('dragstart', () => {
        setDraggingMarkerId(marker.id);
        selectMarker(marker.id);
      });

      leafletMarker.on('drag', function () {
        const pos = this.getLatLng();
        updateMarker(marker.id, { lat: pos.lat, lng: pos.lng });
      });

      leafletMarker.on('dragend', function () {
        const pos = this.getLatLng();
        updateMarker(marker.id, { lat: pos.lat, lng: pos.lng });
        setDraggingMarkerId(null);
      });

      if (markersLayerRef.current) {
        leafletMarker.addTo(markersLayerRef.current);
      }
      markersRef.current.set(marker.id, leafletMarker);
    });
  }, [markers, selectedMarkerId, createCustomIcon, selectMarker, updateMarker, playRippleEffect, draggingMarkerId]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    if (
      Math.abs(currentCenter.lat - mapCenter[0]) > 0.0001 ||
      Math.abs(currentCenter.lng - mapCenter[1]) > 0.0001 ||
      Math.abs(currentZoom - mapZoom) > 0.01
    ) {
      isProgrammaticMove.current = true;
      map.setView(mapCenter, mapZoom);
    }
  }, [mapCenter, mapZoom]);

  const handleCloseDetail = () => {
    setShowDetail(false);
    selectMarker(null);
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  const handleMoveUp = () => {
    if (!selectedMarkerId) return;
    const currentIndex = routeOrder.indexOf(selectedMarkerId);
    if (currentIndex <= 0) return;

    const newOrder = [...routeOrder];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    reorderMarkers(newOrder);
  };

  const handleMoveDown = () => {
    if (!selectedMarkerId) return;
    const currentIndex = routeOrder.indexOf(selectedMarkerId);
    if (currentIndex === -1 || currentIndex >= routeOrder.length - 1) return;

    const newOrder = [...routeOrder];
    [newOrder[currentIndex + 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex + 1]];
    reorderMarkers(newOrder);
  };

  const handleDelete = () => {
    if (!selectedMarkerId) return;
    deleteMarker(selectedMarkerId);
    setShowDetail(false);
  };

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />

      <RoutePlanner map={mapInstanceRef.current} />

      {showDetail && selectedMarker && (
        <div className="marker-detail-panel">
          <div className="detail-header">
            <div className="detail-category" style={{ backgroundColor: CATEGORY_COLORS[selectedMarker.category] }}>
              {CATEGORY_ICONS[selectedMarker.category]}
            </div>
            <div className="detail-title-section">
              <h3 className="detail-title">{selectedMarker.name}</h3>
              <span className="detail-category-label" style={{ color: CATEGORY_COLORS[selectedMarker.category] }}>
                {CATEGORY_LABELS[selectedMarker.category]}
              </span>
            </div>
            <button className="detail-close" onClick={handleCloseDetail}>✕</button>
          </div>

          {selectedMarker.note && (
            <div className="detail-note">
              <h4>备注</h4>
              <p>{selectedMarker.note}</p>
            </div>
          )}

          <div className="detail-order">
            <span>游览顺序: 第 {routeOrder.indexOf(selectedMarker.id) + 1} 站</span>
          </div>

          <div className="detail-actions">
            <button className="detail-btn move-btn" onClick={handleMoveUp} disabled={routeOrder.indexOf(selectedMarker.id) <= 0}>
              ↑ 上移
            </button>
            <button className="detail-btn move-btn" onClick={handleMoveDown} disabled={routeOrder.indexOf(selectedMarker.id) >= routeOrder.length - 1}>
              ↓ 下移
            </button>
            <button className="detail-btn delete-btn" onClick={handleDelete}>
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
