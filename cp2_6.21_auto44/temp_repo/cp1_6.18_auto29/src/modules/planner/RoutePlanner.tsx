import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapStore } from '../../stores/useMapStore';
import type { Marker } from '../../stores/useMapStore';

interface RoutePlannerProps {
  map: L.Map | null;
}

export function RoutePlanner({ map }: RoutePlannerProps) {
  const markers = useMapStore((state) => state.markers);
  const routeOrder = useMapStore((state) => state.routeOrder);
  const selectMarker = useMapStore((state) => state.selectMarker);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    if (!polylineRef.current) {
      polylineRef.current = L.polyline([], {
        color: '#6C63FF',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 8',
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
    }

    return () => {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
        markersLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map || !polylineRef.current || markers.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([]);
      }
      return;
    }

    const orderedMarkers = routeOrder
      .map((id) => markers.find((m) => m.id === id))
      .filter(Boolean) as Marker[];

    if (orderedMarkers.length >= 2) {
      const latlngs = orderedMarkers.map((m) => [m.lat, m.lng] as [number, number]);
      polylineRef.current.setLatLngs(latlngs);
    }
  }, [map, markers, routeOrder]);

  useEffect(() => {
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const orderedMarkers = routeOrder
      .map((id) => markers.find((m) => m.id === id))
      .filter(Boolean) as Marker[];

    orderedMarkers.forEach((marker, index) => {
      const numberIcon = L.divIcon({
        className: 'route-number-bubble',
        html: `<div style="
          width: 20px;
          height: 20px;
          background: #6C63FF;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">${index + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const numberMarker = L.marker([marker.lat, marker.lng], {
        icon: numberIcon,
        interactive: true,
        zIndexOffset: 1000,
      });

      numberMarker.on('click', () => {
        selectMarker(marker.id);
      });

      numberMarker.on('mouseover', function () {
        const el = this.getElement();
        if (el) {
          el.style.transform = 'scale(1.2)';
          el.style.transition = 'transform 0.2s';
        }
      });

      numberMarker.on('mouseout', function () {
        const el = this.getElement();
        if (el) {
          el.style.transform = 'scale(1)';
        }
      });

      numberMarker.addTo(markersLayerRef.current);
    });
  }, [map, markers, routeOrder, selectMarker]);

  return null;
}
