import { useEffect, useRef } from 'react';

type Preference = 'food' | 'history' | 'nature' | 'shopping';

interface Spot {
  id: string;
  name: string;
  category: Preference;
  description: string;
  fullDescription: string;
  duration: number;
  lat: number;
  lng: number;
}

interface DayPlan {
  day: number;
  spots: Spot[];
}

interface MapViewProps {
  plans: DayPlan[];
  center: [number, number];
}

const DAY_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#F4511E'];

function createCurvedArrow(map: any, start: [number, number], end: [number, number], color: string) {
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist * 0.2;
  const perpLat = -dx / (dist || 1) * offset;
  const perpLng = dy / (dist || 1) * offset;
  const ctrlLat = midLat + perpLat;
  const ctrlLng = midLng + perpLng;

  const pathPoints: [number, number][] = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * ctrlLat + t * t * end[0];
    const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * ctrlLng + t * t * end[1];
    pathPoints.push([lat, lng]);
  }

  const polyline = L.polyline(pathPoints, {
    color,
    weight: 2.5,
    opacity: 0.7,
    dashArray: '6, 4',
  }).addTo(map);

  const arrowT = 0.85;
  const arrowLat = (1 - arrowT) * (1 - arrowT) * start[0] + 2 * (1 - arrowT) * arrowT * ctrlLat + arrowT * arrowT * end[0];
  const arrowLng = (1 - arrowT) * (1 - arrowT) * start[1] + 2 * (1 - arrowT) * arrowT * ctrlLng + arrowT * arrowT * end[1];
  const dt = 0.01;
  const prevLat = (1 - (arrowT - dt)) * (1 - (arrowT - dt)) * start[0] + 2 * (1 - (arrowT - dt)) * (arrowT - dt) * ctrlLat + (arrowT - dt) * (arrowT - dt) * end[0];
  const prevLng = (1 - (arrowT - dt)) * (1 - (arrowT - dt)) * start[1] + 2 * (1 - (arrowT - dt)) * (arrowT - dt) * ctrlLng + (arrowT - dt) * (arrowT - dt) * end[1];
  const angle = Math.atan2(arrowLng - prevLng, arrowLat - prevLat) * (180 / Math.PI);

  const arrowIcon = L.divIcon({
    html: `<div style="
      transform: rotate(${angle}deg);
      color: ${color};
      font-size: 14px;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    ">➤</div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const arrowMarker = L.marker([arrowLat, arrowLng], { icon: arrowIcon, interactive: false }).addTo(map);

  return { polyline, arrowMarker };
}

export default function MapView({ plans, center }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: center,
        zoom: 13,
        zoomControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {};
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach(layer => {
      map.removeLayer(layer);
    });
    layersRef.current = [];

    const allPoints: [number, number][] = [];

    plans.forEach(plan => {
      const color = DAY_COLORS[(plan.day - 1) % DAY_COLORS.length];

      plan.spots.forEach((spot, index) => {
        const marker = L.circleMarker([spot.lat, spot.lng], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindTooltip(
          `<div style="font-weight:600;font-size:13px;">${spot.name}</div>
           <div style="font-size:11px;color:#666;">第${plan.day}天 · 第${index + 1}站</div>`,
          { direction: 'top', offset: [0, -8] }
        );

        allPoints.push([spot.lat, spot.lng]);
        layersRef.current.push(marker);

        if (index > 0) {
          const prevSpot = plan.spots[index - 1];
          const curved = createCurvedArrow(
            map,
            [prevSpot.lat, prevSpot.lng],
            [spot.lat, spot.lng],
            color
          );
          layersRef.current.push(curved.polyline, curved.arrowMarker);
        }
      });
    });

    if (allPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch { /* ignore */ }
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [plans]);

  return (
    <div
      ref={containerRef}
      className="map-container"
    />
  );
}
